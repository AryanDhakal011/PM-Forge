import {
  initialState,
  reduceEvent,
  has,
  acceptance,
  forgeCost,
} from "../src/lib/deadlock/engine";
import { lanes, datasetIds, evidenceIds } from "../src/lib/deadlock/content";
import type {
  Action,
  DeadlockEvent,
  Dial,
  Evidence,
  Resolution,
} from "../src/lib/deadlock/types";
export type Policy = "INFORMED" | "LEAN" | "BOLD" | "AVOIDANT" | "RANDOM";
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function policyRun(policy: Policy, seed = 1, fast = false) {
  const random = rng(seed),
    pick = <T>(a: readonly T[]) => a[Math.floor(random() * a.length)];
  const shuffle = <T>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let state = initialState();
  const events: DeadlockEvent[] = [];
  const send = (action: Action) => {
    const event = {
      ...action,
      seq: state.seq,
      t: "2026-10-30T00:00:00.000Z",
    } as DeadlockEvent;
    if (fast) state.trace = [];
    state = reduceEvent(state, event);
    events.push(event);
  };
  const ack = () => send({ type: "ACK_SCENE", scene: state.scene });
  send({ type: "START", mode: "silent" });
  ack();
  const inspected: Evidence[] =
    policy === "INFORMED"
      ? ["E1", "E2", "E3"]
      : policy === "BOLD"
        ? ["E1", "E2", "E4"]
        : policy === "RANDOM"
          ? shuffle([...evidenceIds]).slice(0, 3)
          : ["E1", "E2", "E5"];
  for (const card of inspected) send({ type: "INSPECT", card });
  ack();
  for (const lane of lanes) {
    let res: Resolution =
      policy === "INFORMED"
        ? lane === "learning"
          ? "S"
          : "B"
        : policy === "LEAN"
          ? "S"
          : policy === "BOLD"
            ? "R"
            : policy === "AVOIDANT"
              ? "D"
              : pick(["R", "S", "B", "D"] as const);
    if (res === "B" && state.ap < 2) res = pick(["R", "S", "D"] as const);
    const card =
      policy === "INFORMED"
        ? lane === "learning"
          ? "E2"
          : "E3"
        : policy === "RANDOM"
          ? random() < 0.75
            ? pick(inspected)
            : undefined
          : undefined;
    if (card) send({ type: "ATTACH", lane, card });
    send({ type: "SOCKET", lane, res, previewMs: 900 });
  }
  send({ type: "LOCK_PLAN" });
  ack();
  ack();
  const show =
    policy === "INFORMED"
      ? (["D2", "D3"] as const)
      : policy === "BOLD"
        ? (["D1", "D4"] as const)
        : policy === "RANDOM"
          ? shuffle([...datasetIds]).slice(0, Math.floor(random() * 5))
          : [];
  for (const dataset of show)
    if (state.ap > 0 || (state.shown.length === 0 && inspected.includes("E4")))
      send({ type: "SHOW", dataset, previewMs: 900 });
  if (
    policy === "RANDOM" &&
    has(state, "dev_absent") &&
    state.ap >= 2 &&
    random() < 0.5
  )
    send({ type: "CALL_DEV" });
  ack();
  let d: Dial =
    policy === "INFORMED"
      ? { s: 1, r: "assisted", l: "uncertain" }
      : policy === "BOLD"
        ? { s: 1.2, r: "auto", l: "uncertain" }
        : policy === "RANDOM"
          ? {
              s: pick([0.5, 0.8, 1, 1.2]),
              r: pick(["manual", "assisted", "auto"]),
              l: pick(["always", "uncertain", "never"]),
            }
          : { s: 0.5, r: "manual", l: "always" };
  if (has(state, "dev_absent") && !has(state, "dev_recalled"))
    d = { ...d, r: "manual", l: "always" };
  if (state.runway - forgeCost(d) < 2) d = { s: 0.5, r: "manual", l: "always" };
  send({ type: "DIAL", value: d });
  if (policy === "INFORMED") {
    send({ type: "ATTACH_DIAL", dial: "speed", card: "D3" });
    send({ type: "ATTACH_DIAL", dial: "learning", card: "D2" });
    send({ type: "ATTACH_DIAL", dial: "recovery", card: "E2" });
  }
  const attachRandomDefenses = () => {
    if (policy !== "RANDOM") return;
    const cards = [undefined, ...state.inspected, ...state.shown];
    for (const dial of lanes)
      send({ type: "ATTACH_DIAL", dial, card: pick(cards) });
  };
  attachRandomDefenses();
  send({ type: "PROPOSE", previewMs: 1200 });
  while (state.scene === "forge") {
    const a = acceptance(state),
      canPush =
        Number(a.robotics === false) + Number(!a.software) === 1 &&
        state.ap >= 2;
    if (canPush && (policy !== "RANDOM" || random() < 0.5)) {
      send({ type: "PUSH" });
      break;
    }
    send({ type: "REVISE" });
    if (state.scene !== "forge") break;
    let next: Dial =
      policy === "RANDOM"
        ? {
            s: pick([0.5, 0.8, 1, 1.2]),
            r: pick(["manual", "assisted", "auto"]),
            l: pick(["always", "uncertain", "never"]),
          }
        : { s: 0.5, r: "manual", l: "always" };
    if (has(state, "dev_absent") && !has(state, "dev_recalled"))
      next = { ...next, r: "manual", l: "always" };
    if (state.runway - forgeCost(next) < 2)
      next = { s: 0.5, r: "manual", l: "always" };
    send({ type: "DIAL", value: next });
    attachRandomDefenses();
    send({ type: "PROPOSE", previewMs: 900 });
  }
  ack();
  while (state.scene === "run") {
    const eventNo = state.run.eventNo;
    let action: "let" | "pause" | "slow" | "takeover" =
      policy === "BOLD" && eventNo === 2 ? "pause" : "let";
    if (
      policy === "RANDOM" &&
      [2, 3, 4].includes(eventNo) &&
      state.run.tokens > 0
    )
      action = pick(["let", "pause", "slow", "takeover"]);
    send({ type: "RUN_DECISION", eventNo, action });
  }
  return { state, events };
}
