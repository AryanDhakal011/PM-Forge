"use client";
import { Dialog } from "@/components/ui/Dialog";
import { experience } from "@/lib/deadlock/content";
import { chapterReviews } from "@/lib/deadlock/reviews";
import type { DeadlockState } from "@/lib/deadlock/types";
import type { SceneProps } from "./runtime";
import { Conversation } from "./Conversation";
import s from "./Deadlock.module.css";
export const steps = [
  { title: "Meet the team", scenes: ["intro"] },
  { title: "Walk the lab", scenes: ["floor"] },
  { title: "Settle three arguments", scenes: ["table"] },
  { title: "The room reacts", scenes: ["consequence1"] },
  { title: "Show the evidence", scenes: ["opening2", "data"] },
  { title: "Build the prototype", scenes: ["forge"] },
  { title: "Run the demo", scenes: ["consequence2", "run"] },
  { title: "Reflect and explore", scenes: ["ending", "debrief"] },
];
export function StepStrip({
  scene,
  onGuide,
}: {
  scene: string;
  onGuide: () => void;
}) {
  const index = Math.max(
    0,
    steps.findIndex((s) => s.scenes.includes(scene)),
  );
  return (
    <nav className={s.stepStrip} aria-label="Your progress">
      <div>
        <span>Step {index + 1} of 8</span>
        <strong>{steps[index].title}</strong>
      </div>
      <ol>
        {steps.map((step, i) => (
          <li
            key={step.title}
            aria-current={i === index ? "step" : undefined}
            data-done={i < index}
          >
            <span>{i < index ? "✓" : i + 1}</span>
            <span>{step.title}</span>
          </li>
        ))}
      </ol>
      <button
        className={s.button}
        onClick={onGuide}
        aria-label="Open step guide"
      >
        ? Guide
      </button>
    </nav>
  );
}
export function Guide({
  guideKey,
  onClose,
  skip,
  setSkip,
  ...props
}: SceneProps & {
  guideKey: keyof typeof experience.guides;
  onClose: () => void;
  skip: boolean;
  setSkip: (v: boolean) => void;
}) {
  const g = experience.guides[guideKey];
  return (
    <Dialog open onClose={onClose} title={g.title} size="lg">
      <div className={`${s.game} ${s.guide}`}>
        <p className={s.kicker}>A MINUTE WITH YOUR TEAM</p>
        <div className={s.guideInstructions}>
          <div>
            <b>Goal</b>
            <p>{g.goal}</p>
          </div>
          <div>
            <b>Do this</b>
            <p>{g.doThis}</p>
          </div>
          <div>
            <b>Watch for</b>
            <p>{g.watch}</p>
          </div>
        </div>
        <Conversation
          {...props}
          paused={false}
          ids={[g.line]}
          onDone={onClose}
          finishLabel="Got it →"
          title="Step guide"
        />
        <label className={s.skipGuides}>
          <input
            type="checkbox"
            checked={skip}
            onChange={(e) => setSkip(e.target.checked)}
          />
          Don’t show these again · skip all automatic guides
        </label>
        <p className={s.muted}>The ? Guide button always brings this back.</p>
      </div>
    </Dialog>
  );
}
export function ReviewCard({
  state,
  chapter,
  onContinue,
  onReplay,
  busy = false,
}: {
  state: DeadlockState;
  chapter: number;
  onContinue?: () => void;
  onReplay?: () => void;
  busy?: boolean;
}) {
  const r = chapterReviews(state)[chapter - 1];
  return (
    <article className={s.chapterReview} data-review={chapter}>
      <div className={s.reviewHead}>
        <span className={s.kicker}>CHAPTER {chapter} · REVIEW</span>
        <strong data-verdict={r.verdict}>{r.verdict}</strong>
      </div>
      <h3>{r.title}</h3>
      <dl>
        <div>
          <dt>You did</dt>
          <dd>{r.did}</dd>
        </div>
        <div>
          <dt>What happened</dt>
          <dd>{r.happened}</dd>
        </div>
        <div>
          <dt>You could try</dt>
          <dd>{r.try}</dd>
        </div>
      </dl>
      {(onContinue || onReplay) && (
        <div className={s.row}>
          {onContinue && (
            <button
              className={s.brassButton}
              disabled={busy}
              onClick={onContinue}
            >
              Continue →
            </button>
          )}
          {onReplay && (
            <button className={s.button} disabled={busy} onClick={onReplay}>
              Replay this chapter
            </button>
          )}
        </div>
      )}
      <small className={s.muted}>
        A reading of this chapter’s decisions, not a calibrated assessment of
        your ability.
      </small>
    </article>
  );
}
