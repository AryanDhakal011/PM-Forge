"use client";
import { useEffect, useRef, useState } from "react";
import { forge, objects, datasets } from "@/lib/deadlock/content";
import { forgeCost, has, knownFacts } from "@/lib/deadlock/engine";
import type { Dial, Evidence, Dataset, Lane } from "@/lib/deadlock/types";
import { Arm, Avatar } from "./Stage";
import { GuardControl, type SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
const specs = [
  { lane: "speed", key: "s", title: "SPEED CAP", stops: forge.speed },
  { lane: "recovery", key: "r", title: "RECOVERY", stops: forge.recovery },
  { lane: "learning", key: "l", title: "LEARNING", stops: forge.learning },
] as const;
export default function Forge({
  state,
  dispatch,
  busy,
  preview,
  paused,
}: SceneProps) {
  const [ledger, setLedger] = useState(false),
    since = useRef(0),
    drag = useRef(0);
  const previewPanel = useRef<HTMLDivElement>(null);
  const absent = has(state, "dev_absent") && !has(state, "dev_recalled");
  const remaining = state.runway - forgeCost(state.dials);
  useEffect(() => {
    since.current = 0;
    if (paused || !previewPanel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        since.current = entries[0]?.isIntersecting ? performance.now() : 0;
      },
      { threshold: 0.5 },
    );
    observer.observe(previewPanel.current);
    return () => observer.disconnect();
  }, [state.dials.s, state.dials.r, state.dials.l, paused]);
  return (
    <>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Chapter 2 · The Forge</p>
          <h2>A build they can both sign.</h2>
        </div>
        <p className={s.muted} data-beat>
          Three dials. A question mark means you never opened that folder.
          Proposals used: {state.proposals} / 2.
        </p>
      </header>
      <div style={{ maxWidth: 650, margin: "-10px auto 10px" }}>
        <Arm state={state} />
      </div>
      <div className={s.forge}>
        {specs.map((spec) => {
          const key = spec.key,
            lane = spec.lane;
          const stops = spec.stops as readonly {
            value: string | number;
            label: string;
            weeks: number;
          }[];
          const index = stops.findIndex((x) => x.value === state.dials[key]);
          const facts = knownFacts(state, lane);
          const veto =
            lane === "speed" && has(state, "veto_S")
              ? "S"
              : lane === "recovery" && has(state, "veto_R")
                ? "R"
                : undefined;
          const locked =
            !!state.proposal ||
            busy ||
            !!veto ||
            (absent && (lane === "recovery" || lane === "learning"));
          const turn = (i: number) => {
            const next = {
              ...state.dials,
              [key]: stops[Math.max(0, Math.min(stops.length - 1, i))].value,
            } as Dial;
            dispatch({ type: "DIAL", value: next });
          };
          return (
            <section className={s.dial} key={key} aria-label={spec.title}>
              <div className={s.dialTop}>
                <h3>{spec.title}</h3>
                {veto && (
                  <button
                    className={s.button}
                    disabled={busy || state.ap < 1}
                    onClick={() =>
                      dispatch({ type: "REMOVE_VETO", side: veto })
                    }
                  >
                    UNLOCK · 1 AP
                  </button>
                )}
                {absent && (lane === "recovery" || lane === "learning") && (
                  <small>🔒 RECALL DEV</small>
                )}
              </div>
              <div
                className={s.rotary}
                aria-hidden="true"
                onPointerDown={(e) => {
                  if (locked) return;
                  drag.current = e.clientY;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerUp={(e) => {
                  if (locked || !e.currentTarget.hasPointerCapture(e.pointerId))
                    return;
                  const delta = drag.current - e.clientY;
                  if (Math.abs(delta) > 10) turn(index + (delta > 0 ? 1 : -1));
                }}
              >
                <i
                  style={{
                    transform: `rotate(${-100 + index * (200 / (stops.length - 1))}deg)`,
                  }}
                />
                <b>{key === "s" ? state.dials.s : index + 1}</b>
              </div>
              <div
                className={s.dialStops}
                role="radiogroup"
                aria-label={`${spec.title} stops`}
              >
                {stops.map((stop, i) => (
                  <button
                    key={stop.value}
                    role="radio"
                    aria-checked={index === i}
                    disabled={locked}
                    onKeyDown={(e) => {
                      if (
                        [
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowLeft",
                          "ArrowDown",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                        const next =
                          (i +
                            (["ArrowRight", "ArrowUp"].includes(e.key)
                              ? 1
                              : stops.length - 1)) %
                          stops.length;
                        turn(next);
                        (
                          e.currentTarget.parentElement?.children[
                            next
                          ] as HTMLElement
                        )?.focus();
                      }
                    }}
                    onClick={() => turn(i)}
                  >
                    {stop.label}
                    <small>
                      {stop.weeks > 0 ? "+" : ""}
                      {stop.weeks} WK
                    </small>
                  </button>
                ))}
              </div>
              <div className={s.facts}>
                <span>{facts.primary}</span>
                <span>{facts.secondary}</span>
              </div>
              <label className={s.defense}>
                <span>DEFENSE CLAMP</span>
                <select
                  aria-label={`${lane} dial defense`}
                  disabled={busy || !!state.proposal}
                  value={state.defenses[lane] || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "ATTACH_DIAL",
                      dial: lane as Lane,
                      card: (e.target.value as Evidence | Dataset) || undefined,
                    })
                  }
                >
                  <option value="">No defense · −2 credibility</option>
                  {datasets
                    .filter((d) => state.shown.includes(d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} · {d.title}
                      </option>
                    ))}
                  {objects
                    .filter((o) => state.inspected.includes(o.id))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} · {o.title}
                      </option>
                    ))}
                </select>
              </label>
            </section>
          );
        })}
      </div>
      <div
        className={s.forgePreview}
        ref={previewPanel}
        onPointerEnter={() => {
          preview({ ...state, runway: remaining });
          setLedger(true);
          if (!since.current) since.current = performance.now();
        }}
        onPointerLeave={() => {
          preview();
          setLedger(false);
        }}
        onFocus={() => {
          preview({ ...state, runway: remaining });
          setLedger(true);
        }}
        onBlur={() => preview()}
      >
        <div>
          <span className={s.kicker}>RESERVE TWO WEEKS FOR THE RUN</span>
          <p>
            {forgeCost(state.dials)} weeks to build · {remaining} weeks remain
          </p>
          <small>
            {ledger
              ? "GHOST RUNWAY PREVIEW"
              : "The cost is visible before you lift the guard."}
          </small>
          <p className={s.muted} data-beat>
            Auto recovery adds one ongoing supervision unit; 1.2 m/s adds one.
            Each intervention adds one now and one at the walk-in.
          </p>
        </div>
        {!state.proposal && (
          <GuardControl
            label="PROPOSE BUILD"
            disabled={busy || remaining < 2}
            onCommit={() => {
              preview();
              dispatch({
                type: "PROPOSE",
                previewMs: since.current
                  ? performance.now() - since.current
                  : 0,
              });
            }}
          />
        )}
      </div>
      {state.proposal && (
        <>
          <div className={s.stamps}>
            <span
              className={s.stamp}
              data-reject={state.proposal.robotics === false}
            >
              DEV ·{" "}
              {state.proposal.robotics === null
                ? "ABSENT"
                : state.proposal.robotics
                  ? "ACCEPT"
                  : "REJECT"}
            </span>
            <span className={s.stamp} data-reject={!state.proposal.software}>
              INES · {state.proposal.software ? "ACCEPT" : "REJECT"}
            </span>
          </div>
          <div className={s.row}>
            <button
              className={s.brassButton}
              disabled={busy}
              onClick={() => dispatch({ type: "REVISE" })}
            >
              {state.proposals >= 2
                ? "MARA CALLS IT · IMPOSED LEAN"
                : "REVISE · FREE"}
            </button>
            <button
              className={s.button}
              disabled={
                busy ||
                state.ap < 2 ||
                Number(state.proposal.robotics === false) +
                  Number(!state.proposal.software) !==
                  1
              }
              onClick={() => dispatch({ type: "PUSH" })}
            >
              PUSH THROUGH · 2 AP
            </button>
          </div>
        </>
      )}
      {absent && (
        <button
          className={s.button}
          disabled={busy || state.ap < 2}
          onClick={() => dispatch({ type: "CALL_DEV" })}
        >
          ☎ CALL DEV BACK · 2 AP
        </button>
      )}
      <div className={s.castRow}>
        <Avatar
          person="Dev"
          mood={absent ? "away" : state.rob >= 60 ? "tense" : "neutral"}
        />
        <Avatar person="Ines" mood={state.sw >= 60 ? "tense" : "neutral"} />
      </div>
    </>
  );
}
