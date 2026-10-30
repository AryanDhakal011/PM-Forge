import { getQuestion } from "./content";
import type { Run } from "./types";
export function variantConstraint(seed: number) {
  return seed === 1
    ? "Delivery capacity is reduced by 20%. Trust is the binding guardrail: no increase in errors or complaints."
    : seed === 2
      ? "Full rollback is unavailable for 48 hours. Repeat success and cohort retention must not deteriorate."
      : "Use the brief’s baseline constraints.";
}
export function variantNumber(text: string, seed: number) {
  if (!seed) return text;
  return text.replace(/(-?\d+(?:\.\d+)?)%/g, (_, value) => {
    const n = Number(value);
    const factor = seed === 1 ? (n > 80 && n <= 100 ? 0.95 : 1.2) : 0.85;
    return `${Math.round(n * factor * 10) / 10}%`;
  });
}
export function questionForRun(run: Run) {
  const q = getQuestion(run.questionId);
  if (!q || !run.seed) return q;
  // Public reference figures stay unchanged. Only simulated observations vary.
  return {
    ...q,
    evidence: q.evidence.map((e) =>
      e.tag === "SIMULATED"
        ? { ...e, text: variantNumber(e.text, run.seed) }
        : e,
    ),
    choices: [...q.choices.slice(run.seed), ...q.choices.slice(0, run.seed)],
  };
}
