"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { experience, runBeats } from "@/lib/deadlock/content";
import { has, knownFacts, stepInCost } from "@/lib/deadlock/engine";
import { Arm, Avatar } from "./Stage";
import { Conversation } from "./Conversation";
import { useClock, type SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
export default function FirstRun(props: SceneProps) {
  const { state, dispatch, busy } = props;
  const [eventNo, setEventNo] = useState(state.run.eventNo),
    [phase, setPhase] = useState<"brief" | "choose" | "watch" | "result">(
      "brief",
    );
  const event = runBeats[eventNo - 1] || runBeats[4],
    intro =
      experience.events[String(eventNo) as keyof typeof experience.events];
  const latest = state.run.log.find((l) => l.event === eventNo);
  const act = (action: "let" | "pause" | "slow" | "takeover") => {
    if (busy || phase === "result") return;
    setPhase("result");
    dispatch({ type: "RUN_DECISION", eventNo, action });
  };
  const facts =
    eventNo === 2
      ? knownFacts(state, "speed")
      : eventNo === 3
        ? knownFacts(state, "recovery")
        : knownFacts(state, "learning");
  const trust =
    eventNo === 2
      ? state.shown.includes("D3")
        ? state.dials.s === 1.2
          ? "Your 1.2 m/s stop exceeds the measured safety margin."
          : "Use your speed setting and safeguards."
        : "Trust your speed setting; the team has not seen the stopping measurements."
      : eventNo === 3
        ? state.dials.r === "manual"
          ? "A person clears the jam. The cell depends on supervision."
          : state.dials.r === "assisted"
            ? "The operator gives one confirmation, then the robot recovers."
            : state.shown.includes("D4") || has(state, "bridge_recovery")
              ? "Trust the defended automatic recovery."
              : "Automatic recovery has an unresolved safety risk."
        : state.dials.l === "never"
          ? "It guesses without asking. An unfamiliar object can expose that choice."
          : state.dials.l === "always"
            ? "The operator confirms this object, as they confirm every pick."
            : "The robot asks when uncertain; shared learning data supports the policy.";
  return (
    <>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>LIVE DEMO · EVENT {eventNo} OF 5</p>
          <h2>{event.title}</h2>
        </div>
        <p className={s.muted}>
          {phase === "watch"
            ? "Watch the build you chose in action."
            : phase === "result"
              ? "Read what happened, then move on when ready."
              : "Time is paused. Take your time."}
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
      <div className={s.demoStage}>
        <Arm
          state={state}
          crossing={eventNo === 2}
          active={phase === "watch" && !props.paused}
          incident={phase === "result" && !!latest?.incident}
        />
        <div className={s.gallery}>
          {[
            "Mara",
            "Dev",
            "Ines",
            ...(eventNo === 5 ? ["Nadia", "Theo"] : []),
          ].map((person) => (
            <Avatar
              key={person}
              person={person}
              small
              mood={
                person === "Dev" &&
                has(state, "dev_absent") &&
                !has(state, "dev_recalled")
                  ? "away"
                  : latest?.incident
                    ? "tense"
                    : "neutral"
              }
            />
          ))}
        </div>
      </div>
      <div className={s.demoReadout}>
        <span>
          Speed <b>{state.dials.s} m/s</b>
        </span>
        <span>
          Recovery <b>{state.dials.r}</b>
        </span>
        <span>
          Confirmation{" "}
          <b>
            {
              {
                always: "Every object",
                uncertain: "When uncertain",
                never: "Never",
              }[state.dials.l]
            }
          </b>
        </span>
        <span>
          Steps left <b>{state.run.tokens}</b>
        </span>
        <span>
          Impact <b>{state.run.wow}</b>
        </span>
        <span>
          Supervision <b>{state.run.supervision}</b>
        </span>
      </div>
      {phase === "watch" && (
        <RunClip paused={props.paused || busy} onDone={() => act("let")} />
      )}
      {phase === "result" && (
        <div className={s.runOutcome}>
          <h3>
            {latest?.incident
              ? "The run exposed a safety failure."
              : "The team saw the result."}
          </h3>
          <p>
            {eventNo === 1
              ? "The warm-up reflects your chosen speed."
              : latest?.action !== "let"
                ? "You stepped in. The robot avoided the event’s failure, but the demonstration relied on you."
                : trust}
          </p>
          <button
            className={s.brassButton}
            disabled={busy}
            onClick={() => {
              setEventNo(state.run.eventNo);
              setPhase("brief");
            }}
          >
            Next event →
          </button>
        </div>
      )}
      <Dialog
        open={(phase === "brief" || phase === "choose") && !props.paused}
        dismissible={false}
        onClose={() => {}}
        title={"Event " + eventNo + " · " + event.title}
        size="lg"
      >
        <div className={s.game + " " + s.eventBrief}>
          <p className={s.pausedBanner}>Time is paused. Take your time.</p>
          <p className={s.eventGoal}>{intro.goal}</p>
          <div className={s.eventIllustration}>
            <Arm state={state} crossing={eventNo === 2} />
          </div>
          {phase === "brief" && (
            <Conversation
              {...props}
              paused={false}
              ids={[intro.line]}
              onDone={() =>
                setPhase(event.allowIntervention ? "choose" : "watch")
              }
              finishLabel={
                event.allowIntervention
                  ? "Make your call →"
                  : eventNo === 1
                    ? "Watch the warm-up →"
                    : "Watch the final demo →"
              }
            />
          )}
          {event.allowIntervention ? (
            <>
              <p className={s.muted}>
                {facts.primary} · {facts.secondary}
              </p>
              <p className={s.kicker}>
                Steps left: {state.run.tokens} · each step in uses one
              </p>
              <div className={s.eventChoices}>
                <button
                  disabled={phase !== "choose" || busy}
                  onClick={() => act("let")}
                >
                  <strong>Let it run</strong>
                  <span>{trust}</span>
                  <small>No token · trust your build</small>
                </button>
                {(["slow", "pause", "takeover"] as const).map((action) => (
                  <button
                    key={action}
                    disabled={
                      phase !== "choose" || busy || state.run.tokens === 0
                    }
                    onClick={() => act(action)}
                  >
                    <strong>
                      {
                        { slow: "Slow", pause: "Pause", takeover: "Take over" }[
                          action
                        ]
                      }
                    </strong>
                    <span>
                      {
                        {
                          slow: "Step in to keep this event safe, with a smaller loss of impact.",
                          pause:
                            "Stop and clear the situation. Safe, but visibly interrupts the demo.",
                          takeover:
                            "Handle it yourself. Safe, but makes the dependence on a person obvious.",
                        }[action]
                      }
                    </span>
                    <small>
                      1 step · impact −{stepInCost(state, action)} · more
                      supervision
                    </small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className={s.muted}>
              A watch moment. No decision and no step-in token is needed.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
function RunClip({ paused, onDone }: { paused: boolean; onDone: () => void }) {
  useClock(3200, paused, onDone);
  return <p className={s.muted}>Demonstration in progress…</p>;
}
