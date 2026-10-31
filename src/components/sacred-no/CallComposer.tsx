"use client";
import {
  content,
  sentence,
  type Draft,
  type Tone,
} from "@/lib/sacred-no/engine";
import s from "./SacredNo.module.css";
export const callSteps = [
  {
    label: "Position",
    question: "What are you recommending?",
    line: "G-POSITION",
    help: "Choose a clear recommendation. You can change it before the call.",
  },
  {
    label: "Because",
    question: "What supports your decision?",
    line: "G-BECAUSE",
    help: "Select up to two sources you investigated. Missing evidence stays visible.",
  },
  {
    label: "Instead",
    question: "What can Kian show instead?",
    line: "G-INSTEAD",
    help: "Offer a replacement he can explain to the board, or explicitly offer none.",
  },
  {
    label: "Your ask",
    question: "What do you need from Kian?",
    line: "G-ASK",
    help: "State the support needed to make your proposal real.",
  },
  {
    label: "Checkpoint",
    question: "When will you report back?",
    line: "G-WHEN",
    help: "Give the team a checkpoint, not an open-ended maybe.",
  },
  {
    label: "Tone & review",
    question: "How will you say it?",
    line: "G-TONE",
    help: "Choose the tone, then review your complete answer before saying it.",
  },
];
export default function CallComposer({
  draft,
  inspected,
  step,
  onChange,
  onStep,
  onReview,
  busy,
}: {
  draft: Draft;
  inspected: string[];
  step: number;
  onChange: (d: Draft) => void;
  onStep: (n: number) => void;
  onReview: () => void;
  busy: boolean;
}) {
  const current = callSteps[step];
  const choices =
    step === 0
      ? content.positions
      : step === 2
        ? content.alternatives
        : step === 3
          ? content.asks
          : content.deadlines;
  const value =
    step === 0
      ? draft.position
      : step === 2
        ? draft.alternative
        : step === 3
          ? draft.ask
          : draft.deadline;
  function choose(id: string) {
    onChange(
      step === 0
        ? { ...draft, position: id as Draft["position"] }
        : step === 2
          ? { ...draft, alternative: id as Draft["alternative"] }
          : step === 3
            ? { ...draft, ask: id }
            : { ...draft, deadline: id },
    );
  }
  return (
    <section
      className={s.callComposer}
      aria-label="Guided call composer"
      data-call-step={step}
    >
      <nav className={s.callSteps} aria-label="Parts of your answer">
        {callSteps.map((p, i) => (
          <button
            key={p.label}
            disabled={busy}
            aria-current={i === step ? "step" : undefined}
            onClick={() => onStep(i)}
          >
            <span>{i + 1}</span>
            {p.label}
          </button>
        ))}
      </nav>
      <div className={s.composerQuestion}>
        <small>PRIYA / LET’S BUILD YOUR ANSWER · {step + 1} OF 6</small>
        <h2>{current.question}</h2>
        <p>{current.help}</p>
      </div>
      {step === 1 ? (
        <fieldset className={s.composerOptions}>
          <legend>Collected evidence · two sources maximum</legend>
          {inspected.length ? (
            inspected.map((id) => {
              const e = content.evidence.find((e) => e.id === id)!;
              return (
                <label className={s.composerEvidence} key={id}>
                  <input
                    type="checkbox"
                    checked={draft.evidence.includes(id)}
                    disabled={
                      busy ||
                      (!draft.evidence.includes(id) &&
                        draft.evidence.length >= 2)
                    }
                    onChange={() =>
                      onChange({
                        ...draft,
                        evidence: draft.evidence.includes(id)
                          ? draft.evidence.filter((x) => x !== id)
                          : [...draft.evidence, id],
                      })
                    }
                  />
                  <span>
                    <b>{e.title}</b>
                    <small>{e.reading}</small>
                  </span>
                </label>
              );
            })
          ) : (
            <p>
              No sources collected. You can continue, but your answer will
              acknowledge that gap.
            </p>
          )}
        </fieldset>
      ) : step === 5 ? (
        <fieldset className={s.composerOptions}>
          <legend>Tone</legend>
          {(["direct", "warm", "hedged"] as Tone[]).map((t) => (
            <label key={t} className={s.composerEvidence}>
              <input
                type="radio"
                name="call-tone"
                checked={draft.tone === t}
                onChange={() => onChange({ ...draft, tone: t })}
              />
              <span>
                <b>{t[0].toUpperCase() + t.slice(1)}</b>
                <small>
                  {t === "direct"
                    ? content.positions.find((p) => p.id === draft.position)!
                        .text
                    : t === "warm"
                      ? "I want us to succeed. " +
                        content.positions.find((p) => p.id === draft.position)!
                          .text
                      : "I think maybe " +
                        content.positions
                          .find((p) => p.id === draft.position)!
                          .text.replace(/^We/, "we")}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div
          className={s.composerOptions}
          role="group"
          aria-label={current.label}
        >
          {choices.map((option) => (
            <button
              key={option.id}
              className={s.composerOption}
              aria-pressed={value === option.id}
              disabled={busy}
              onClick={() => choose(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      )}
      {step === 5 && (
        <div className={s.sentence}>
          <small>YOUR COMPLETE ANSWER / NOT SENT YET</small>
          <p>{sentence(draft)}</p>
        </div>
      )}
      <div className={s.actionBar}>
        <button
          className={s.button}
          disabled={busy || step === 0}
          onClick={() => onStep(step - 1)}
        >
          ← Previous part
        </button>
        {step < 5 ? (
          <button
            className={s.primary}
            disabled={busy}
            onClick={() => onStep(step + 1)}
          >
            Next: {callSteps[step + 1].label} →
          </button>
        ) : (
          <button className={s.primary} disabled={busy} onClick={onReview}>
            Review before saying it →
          </button>
        )}
      </div>
    </section>
  );
}
