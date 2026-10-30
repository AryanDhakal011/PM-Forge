"use client";
import { useEffect, useState } from "react";
import { runBeats } from "@/lib/deadlock/content";
import { has, knownFacts, riskAt } from "@/lib/deadlock/engine";
import { Arm, Avatar } from "./Stage";
import { useClock, type SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
export default function FirstRun(props: SceneProps) {
  const { state, dispatch, busy, caption } = props;
  const [eventNo, setEventNo] = useState(state.run.eventNo),
    [phase, setPhase] = useState<"heads-up" | "hold" | "outcome">("heads-up");
  const event = runBeats[eventNo - 1] || runBeats[4];
  const latest = state.run.log.find((l) => l.event === eventNo);
  useEffect(() => {
    caption(event.line);
  }, [eventNo]);
  const act = (action: "let" | "pause" | "slow" | "takeover") => {
    setPhase("outcome");
    dispatch({ type: "RUN_DECISION", eventNo, action });
  };
  return (
    <>
      {phase === "heads-up" && (
        <FreezeTimer
          key={`${eventNo}-head`}
          duration={2000}
          paused={props.paused}
          onDone={() => setPhase("hold")}
        />
      )}
      {phase === "outcome" && (
        <FreezeTimer
          key={`${eventNo}-outcome`}
          duration={3500}
          paused={props.paused || busy}
          onDone={() => {
            setEventNo(state.run.eventNo);
            setPhase("heads-up");
          }}
        />
      )}
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Chapter 3 · First Run</p>
          <h2>{event.title}.</h2>
        </div>
        <p className={s.muted} data-beat>
          {phase === "heads-up"
            ? "Watch the cell. The simulation will freeze before your decision."
            : phase === "hold"
              ? "HOLD · Nothing moves until you decide. Take as long as you need."
              : "The gallery saw the result. The next event waits for this clip."}
        </p>
      </header>
      <div className={s.eventTimeline} aria-label="Five run events">
        {runBeats.map((e) => (
          <span
            key={e.id}
            aria-current={e.id === eventNo ? "step" : undefined}
            data-done={e.id < eventNo}
          >
            {e.id < eventNo ? "✓" : e.id}
          </span>
        ))}
      </div>
      <div className={s.controlRoom}>
        <div className={s.feed}>
          <span className={s.feedLabel}>CAM 01 · TERN-1 · SIMULATED</span>
          <Arm
            state={state}
            active={phase !== "hold" && !props.paused}
            incident={phase === "outcome" && !!latest?.incident}
          />
          {phase === "hold" && <span className={s.hold}>HOLD · YOUR CALL</span>}
        </div>
        <div>
          <div className={s.gallery}>
            {eventNo === 5 && <Avatar small person="Theo" />}
            <Avatar small person="Mara" />
            <Avatar
              small
              person="Dev"
              mood={
                has(state, "dev_absent") && !has(state, "dev_recalled")
                  ? "away"
                  : latest?.incident
                    ? "tense"
                    : "neutral"
              }
            />
            <Avatar
              small
              person="Ines"
              mood={latest?.incident ? "tense" : "neutral"}
            />
            {eventNo === 5 || state.room === "ROBOTICS_WIN" ? (
              <Avatar small person="Nadia" />
            ) : null}
          </div>
          <div className={s.telemetry}>
            <div>
              <span>SPEED CAP</span>
              <b>{state.dials.s} m/s</b>
            </div>
            <div>
              <span>STOPPING MARGIN</span>
              <b>
                {state.shown.includes("D3")
                  ? state.dials.s === 0.5
                    ? "0.10 m"
                    : state.dials.s === 1
                      ? "0.22 m"
                      : state.dials.s === 1.2
                        ? "0.46 m · FAIL"
                        : "? — not tested"
                  : "?"}
              </b>
            </div>
            <div>
              <span>E-STOP LATENCY</span>
              <b>? · not measured</b>
            </div>
            <div>
              <span>PROMPTS / PICKS</span>
              <b>
                {state.shown.includes("D2")
                  ? `${{ always: 31, uncertain: 9, never: 0 }[state.dials.l]}%`
                  : "?"}
              </b>
            </div>
          </div>
          <div className={s.row}>
            <span className={s.muted}>
              Wow {state.run.wow} · Supervision {state.run.supervision}
            </span>
            <span className={s.muted}>Incidents {state.run.incidents}</span>
          </div>
        </div>
      </div>
      {phase === "hold" && (
        <div className={s.runResult}>
          <p data-beat>
            {eventNo === 2
              ? knownFacts(state, "speed").secondary
              : eventNo === 3
                ? knownFacts(state, "recovery").secondary
                : eventNo === 4
                  ? knownFacts(state, "learning").primary
                  : "The audience watches the arm."}
          </p>
          {riskAt(state, eventNo) && (
            <small>
              {eventNo === 2 && state.shown.includes("D3")
                ? "Visible FAIL. The stop exceeds the 0.40 m target."
                : eventNo === 3 && !state.shown.includes("D4")
                  ? "? · Recovery evidence was not shown."
                  : eventNo === 4
                    ? "NEVER CONFIRM · no operator confirmation."
                    : "? · Safety evidence was not shown."}
            </small>
          )}
        </div>
      )}
      <div className={s.console}>
        <div>
          <span className={s.kicker}>
            INTERVENTIONS · {state.run.tokens} LEFT
          </span>
          <div
            className={s.lamps}
            style={{ marginTop: 12 }}
            aria-label={`${state.run.tokens} intervention tokens`}
          >
            {[0, 1, 2].map((i) => (
              <i key={i} data-empty={i >= state.run.tokens} />
            ))}
          </div>
        </div>
        <div className={s.consoleButtons}>
          {(["pause", "slow", "takeover"] as const).map((action, i) => (
            <button
              key={action}
              disabled={
                busy ||
                phase !== "hold" ||
                !event.allowIntervention ||
                state.run.tokens === 0
              }
              onClick={() => act(action)}
            >
              {action.toUpperCase()}
              <small>1 TOKEN · WOW −{[4, 6, 10][i]}</small>
            </button>
          ))}
        </div>
        <button
          className={s.brassButton}
          disabled={busy || phase !== "hold"}
          onClick={() => act("let")}
        >
          LET IT RUN →
        </button>
      </div>
    </>
  );
}
function FreezeTimer({
  duration,
  paused,
  onDone,
}: {
  duration: number;
  paused: boolean;
  onDone: () => void;
}) {
  useClock(duration, paused, onDone);
  return null;
}
