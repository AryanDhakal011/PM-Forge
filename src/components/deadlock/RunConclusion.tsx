import type { DeadlockState } from "@/lib/deadlock/types";
import {
  runConclusion,
  planChoices,
  teamResponse,
} from "@/lib/deadlock/conclusion";
import s from "./Deadlock.module.css";
export function RunConclusion({ state }: { state: DeadlockState }) {
  const result = runConclusion(state);
  return (
    <section className={s.conclusion} aria-label="Your run in brief">
      <p className={s.kicker}>YOUR RUN, IN BRIEF</p>
      <h2>{result.title}</h2>
      <p className={s.conclusionLead}>{result.summary}</p>
      <h3>The choices that shaped it</h3>
      <ol>
        {result.moments.map((moment, i) => (
          <li key={i}>
            <strong>{moment.choice}</strong>
            <span aria-hidden="true">↓</span>
            <p>{moment.result}</p>
          </li>
        ))}
      </ol>
      <p className={s.muted}>
        These are the events recorded in your run. Open the decision trail if
        you want to inspect the details or try another path.
      </p>
    </section>
  );
}
export function TeamResponse({ state }: { state: DeadlockState }) {
  return (
    <section
      className={s.teamResponse}
      aria-label="Your choices and the team response"
    >
      <p className={s.kicker}>THE PLAN YOU JUST CHOSE</p>
      <ul>
        {planChoices(state).map((c) => (
          <li key={c.label}>
            <strong>{c.label}</strong>
            <span>{c.choice}</span>
          </li>
        ))}
      </ul>
      <div>
        {teamResponse(state).map((r) => (
          <p key={r.name}>
            <b>{r.name}</b> · {r.response}
          </p>
        ))}
      </div>
    </section>
  );
}
