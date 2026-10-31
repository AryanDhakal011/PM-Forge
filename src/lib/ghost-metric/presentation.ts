import { drawers, guides, type DrawerId } from "./content";
import { conversation, type Line } from "./dialogue";
import type { State } from "./engine";
export const openingSequence = () =>
  ["introElena", "introRavi", "introMarcus", "introJoyce", "caseBrief"].flatMap(
    conversation,
  );
export const guideGroups: Record<string, string> = {
  unit: "coachUnit",
  audit: "coachAudit",
  join: "coachJoin",
  estimate: "coachEstimate",
  carry: "coachCarry",
  stakeholders: "coachStakeholders",
  slides: "coachSlides",
  metric: "coachMetric",
  redteam: "coachRedteam",
  board: "coachBoard",
};
export function guideCard(scene: string) {
  if (scene === "join")
    return {
      title: "Join two descriptions of the same thing.",
      goal: "Quantify a cause you have seen in a drawer.",
      do: "Pick a source column and a target column, then confirm the one-hour attempt.",
      watch:
        "Matching names are not enough. Both columns must identify the same entity.",
    };
  const row = guides[scene];
  return row
    ? { title: row[0], goal: row[0], do: row[1], watch: row[2] }
    : undefined;
}
export function remainingActions(s: State): string {
  switch (s.scene) {
    case "cold":
      return "Meet the team, hear the brief, then inspect the bubble.";
    case "unit":
      return "Move the retry into one of the two trays, or use its buttons.";
    case "audit": {
      const costs = drawers
        .filter((d) => !s.opened.includes(d.id))
        .map((d) => d.cost)
        .sort((a, b) => a - b);
      let remaining = s.AH,
        count = 0;
      for (const cost of costs) {
        if (remaining < cost) break;
        remaining -= cost;
        count++;
      }
      return count
        ? `You can still open up to ${count} more drawer${count === 1 ? "" : "s"}, attempt a one-hour join, or start estimating.`
        : s.AH
          ? "You can still attempt a one-hour join or start estimating."
          : "Your audit hours are spent. Record your estimate and carry the uncertainty.";
    }
    case "estimate":
      return "Set a low bound, estimate, and high bound, then record your range.";
    case "carry":
      return `Raise the concern now, ${s.AH >= 2 ? "verify one more source, or " : ""}choose what to tell Elena.`;
    case "promise":
      return "Choose the exact words Elena can carry to the board.";
    case "stakeholders":
      return s.toldOrder.length
        ? "You can brief another person or choose how to bring this into the room."
        : "You still need to choose who hears this first.";
    case "slides":
      return s.slideStep === 0
        ? "Choose the opening claim for slide one."
        : s.slideStep === 1
          ? "Attach only sources you collected; their order becomes presentation order."
          : "Choose one decision you need from the room.";
    case "metric":
      return "Choose the counting rules, inspect the model, then confirm your definition.";
    case "redteam":
      return `You have ${s.fixHours} fix hour${s.fixHours === 1 ? "" : "s"} left and ${s.loopholes.length} known limitation${s.loopholes.length === 1 ? "" : "s"}.`;
    case "secondSource":
      return "Get an independent check or clearly limit the claim.";
    case "rollout":
      return "Choose whether the team gets protected migration capacity.";
    case "board":
      return "Review your original words and choose how to answer the board.";
    case "debrief":
      return "Inspect a missed tell, reflect, export, or replay a separate branch.";
  }
}
export function currentCost(s: State) {
  return s.scene === "audit"
    ? `${s.AH} audit hours · drawer 2–3h · join 1h`
    : s.scene === "carry"
      ? `${s.AH} hours left · verification 2 prep hours`
      : s.scene === "redteam"
        ? `${s.fixHours} fix hours · engineering patch 1h`
        : "No real-time countdown · decisions save automatically";
}
export type VariantHistory = Record<string, number[]>;
export function chooseVariant(group: string, history: VariantHistory) {
  const variants = [group, group + "V2", group + "V3", group + "V4"]
    .map(conversation)
    .filter((rows) => rows.length);
  if (!variants.length) return [] as Line[];
  const recent = Array.isArray(history[group]) ? history[group] : [];
  const next = variants.findIndex((_, index) => !recent.includes(index));
  const index =
    next < 0 ? ((Number(recent.at(-1)) || 0) + 1) % variants.length : next;
  history[group] = [...recent, index].slice(-2);
  return variants[index];
}
export function sourceColumns(id: DrawerId) {
  return id === "gateway"
    ? (["request_id", "customer_id"] as const)
    : id === "tags"
      ? (["account_id", "customer_id"] as const)
      : (["customer_id"] as const);
}
