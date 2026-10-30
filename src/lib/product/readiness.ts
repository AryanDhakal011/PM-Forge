import type { Question } from "./types";
export const readinessBand = (value: number) =>
  value >= 85 ? "Strong" : value >= 70 ? "Solid" : "Developing";
export const RUBRIC_LIMIT =
  "Provisional band: this rubric sees recorded choices and checks. It cannot judge spoken delivery, originality, truthfulness, or the full quality of your written reasoning. Expert calibration is pending.";
export function reviewStatus(q: Question) {
  const count = new Set(q.reviewers || []).size;
  return q.status === "reviewed" && count >= 2
    ? `Reviewed by ${count} experts`
    : "Draft · expert review pending";
}
