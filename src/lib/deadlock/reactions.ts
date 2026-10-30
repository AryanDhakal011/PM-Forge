import { datasets } from "./content";
import { evidenceRelation, has } from "./engine";
import type { DeadlockEvent, DeadlockState } from "./types";
export function reactionFor(
  event: DeadlockEvent,
  before: DeadlockState,
  after: DeadlockState,
): { id: string; thing?: string }[] {
  const e = event;
  if (e.type === "SOCKET") {
    const nouns = {
      speed: e.res === "R" ? "The speed ramp" : "The speed cap",
      recovery: e.res === "R" ? "Self-recovery" : "The interlock",
      learning: e.res === "R" ? "Learning on the fly" : "Confirmation",
    };
    return [
      { id: `T-${e.res}-DEV`, thing: nouns[e.lane] },
      { id: `T-${e.res}-INES`, thing: nouns[e.lane] },
      ...evidenceReaction(after, e.lane),
    ];
  }
  if (e.type === "ATTACH") return evidenceReaction(after, e.lane);
  if (e.type === "INSPECT") {
    if (e.card === "E1") return [{ id: "FW-01a" }, { id: "FW-01b" }];
    if (e.card === "E2")
      return [
        { id: "FW-02a" },
        ...(before.inspected.includes("E1") ? [{ id: "FW-02b" }] : []),
      ];
    return [
      { id: e.card === "E3" ? "FW-03c" : e.card === "E4" ? "FW-04" : "FW-05b" },
    ];
  }
  if (e.type === "LOCK_PLAN") {
    if (
      !before.inspected.includes("E1") &&
      before.inspected.some((x) => x === "E2" || x === "E4") &&
      !before.inspected.some((x) => x === "E3" || x === "E5")
    )
      return [{ id: "FW-08" }, { id: "T-LOCK" }];
    if (
      before.inspected.includes("E1") &&
      !before.inspected.some((x) => x === "E2" || x === "E3" || x === "E5")
    )
      return [{ id: "FW-09" }, { id: "T-LOCK" }];
    return [{ id: "T-LOCK" }];
  }
  if (e.type === "SHOW") {
    const ids = datasets
      .find((d) => d.id === e.dataset)!
      .lines.map((id) => ({ id }));
    if (!has(before, "dev_absent") && has(after, "dev_absent"))
      ids.push({ id: "O2-16" });
    if (after.shown.length === 2 && after.room === "ROBOTICS_WIN")
      ids.push({ id: has(after, "auditor_flag") ? "S-NAD-NO" : "S-NAD-OK" });
    return ids.filter(
      (l) =>
        (!l.id.endsWith("-DEV") && l.id !== "S-D2-MARA") ||
        !has(after, "dev_absent") ||
        has(after, "dev_recalled"),
    );
  }
  if (e.type === "CALL_DEV") return [{ id: "O2-14" }];
  if (e.type === "PROPOSE") {
    if (has(after, "agreed"))
      return [
        ...(after.proposal?.robotics === true ? [{ id: "F-ACC-DEV" }] : []),
        { id: "F-ACC-INES" },
        ...(after.proposal?.robotics === true ? [{ id: "F-ACC-MARA" }] : []),
      ];
    return (after.proposal?.reasons || []).map((id) => ({ id }));
  }
  if (e.type === "PUSH")
    return [
      { id: "F-PUSH-MARA" },
      ...(after.proposal?.robotics === false ? [{ id: "F-PUSH-DEV" }] : []),
      ...(!after.proposal?.software ? [{ id: "F-PUSH-INES" }] : []),
    ];
  if (e.type === "REVISE" && has(after, "imposed")) return [{ id: "F-IMP" }];
  if (e.type === "RUN_DECISION") {
    if (e.action !== "let")
      return [
        {
          id:
            e.action === "pause"
              ? "RN-INT-PAUSE"
              : e.action === "slow"
                ? "RN-INT-SLOW"
                : "RN-INT-TAKE",
        },
      ];
    if (has(after, `incident_E${e.eventNo}`))
      return [{ id: e.eventNo === 2 ? "RN-E2-INC" : "RN-E3-INC" }];
    if (e.eventNo === 1)
      return [{ id: after.dials.s >= 1 ? "RN-E1-FAST" : "RN-E1-SLOW" }];
    if (e.eventNo === 2) return [{ id: "RN-E2-SAFE" }];
    if (e.eventNo === 3)
      return [
        {
          id:
            after.dials.r === "manual"
              ? "RN-E3-MAN"
              : after.dials.r === "assisted"
                ? "RN-E3-ASS"
                : "RN-E3-AUTO",
        },
      ];
    if (e.eventNo === 4)
      return [
        {
          id:
            after.dials.l === "always"
              ? "RN-E4-ALW"
              : after.dials.l === "uncertain"
                ? "RN-E4-UNC"
                : "RN-E4-FAIL",
        },
      ];
  }
  return [];
}
function evidenceReaction(
  s: DeadlockState,
  lane: "speed" | "recovery" | "learning",
) {
  const c = s.lanes[lane];
  if (!c.res) return [];
  if (evidenceRelation(c.evidence, lane, c.res) === "SUPPORT")
    return [
      {
        id: `T-EV-SUP-${c.res === "R" ? "INES" : c.res === "S" ? "DEV" : "MARA"}`,
      },
    ];
  return [
    {
      id: `T-EV-${{ SUPPORT: "SUP", CONTRADICT: "CON", NEUTRAL: "NEU", NONE: "NONE" }[evidenceRelation(c.evidence, lane, c.res)]}`,
    },
  ];
}
