import type { Question } from "./types";

export type Warmup = {
  question: string;
  options: { id: string; label: string; consequence?: string }[];
};

const leak = /→|MCQ|\bRF\s?\d|clarify the goal/i;

export function isWarmupReady(warmup: Warmup): boolean {
  return (
    warmup.question.trim().length >= 24 &&
    warmup.question.length <= 140 &&
    warmup.question.trim().endsWith("?") &&
    !leak.test(warmup.question) &&
    warmup.options.length >= 2 &&
    warmup.options.length <= 4 &&
    warmup.options.every((option) =>
      option.label.length > 0 &&
      option.label.length <= 80 &&
      !leak.test(option.label)
    )
  );
}

export function warmupFor(question: Question): Warmup | null {
  const candidates = [question.pump, question.probes]
    .map((value) => value?.match(/[^.?]*\?/)?.[0]?.trim())
    .filter((value): value is string => Boolean(value));
  const questionText = candidates.find((value) => !leak.test(value)) || "";
  const options = (question.choices || []).slice(0, 3);
  const warmup = { question: questionText, options };
  return isWarmupReady(warmup) ? warmup : null;
}
