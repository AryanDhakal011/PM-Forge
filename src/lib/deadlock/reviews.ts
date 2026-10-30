import { evidenceRelation } from "./engine";
import type { DeadlockState } from "./types";
export function chapterReviews(s: DeadlockState) {
  const relevant = Object.entries(s.lanes).filter(
    ([lane, c]) =>
      c.res &&
      evidenceRelation(
        c.evidence,
        lane as "speed" | "recovery" | "learning",
        c.res,
      ) === "SUPPORT",
  ).length;
  return [
    {
      chapter: 1,
      title: "Evidence and the first agreement",
      verdict:
        relevant >= 2 && s.align >= 35
          ? "Strong"
          : relevant || s.inspected.length >= 2
            ? "Mixed"
            : "Weak",
      did:
        "You investigated " +
        s.inspected.length +
        " of 5 objects and supported " +
        relevant +
        " of the 3 arguments with relevant evidence.",
      happened:
        s.room === "STALLED"
          ? "The unresolved arguments stalled the team."
          : s.room === "ROBOTICS_WIN"
            ? "Dev got his direction. Ines still needs convincing."
            : s.room === "SOFTWARE_WIN"
              ? "Ines got her safeguards. Dev feels sidelined."
              : s.room === "ALIGNED_BURN"
                ? "The compromises gave both leads a place in the plan, at a cost in time."
                : "The team has a direction, but the disagreements have not disappeared.",
      try: s.inspected.includes("E4")
        ? "Try connecting each evidence card to the specific claim it supports."
        : "Try opening the sealed bench report before the table.",
    },
    {
      chapter: 2,
      title: "Shared evidence and the build",
      verdict:
        s.flags.includes("agreed") && s.shown.length >= 2
          ? "Strong"
          : s.flags.includes("imposed")
            ? "Weak"
            : "Mixed",
      did:
        "You projected " +
        s.shown.length +
        " of 4 datasets and submitted " +
        s.proposals +
        " proposal" +
        (s.proposals === 1 ? "" : "s") +
        ".",
      happened: s.flags.includes("imposed")
        ? "Mara imposed the lean build after the proposals ran out."
        : s.flags.includes("pushed")
          ? "The build moved forward over a rejection. The relationship cost carries into the demo."
          : s.flags.includes("dev_absent") && !s.flags.includes("dev_recalled")
            ? "Ines accepted the build, but Dev was absent from the agreement."
            : "The leads accepted a build they can take into the demonstration.",
      try: s.shown.includes("D2")
        ? "Try using the safety and recovery measurements to defend the remaining unknowns."
        : "Try showing the learning data: it challenges assumptions on both sides.",
    },
    {
      chapter: 3,
      title: "The demonstration",
      verdict:
        s.run.incidents || s.ending === "QUIET ROOM"
          ? "Weak"
          : s.run.wow >= 65 && s.run.supervision <= 2
            ? "Strong"
            : "Mixed",
      did:
        "You stepped in " +
        s.run.interventions +
        " time" +
        (s.run.interventions === 1 ? "" : "s") +
        " during the run.",
      happened:
        s.ending === "QUIET ROOM"
          ? "The prototype was not ready enough to demonstrate."
          : s.run.incidents
            ? "The run produced " +
              s.run.incidents +
              " incident" +
              (s.run.incidents === 1 ? "" : "s") +
              "."
            : s.run.supervision >= 3
              ? "The cell stayed out of incident territory, but relied heavily on supervision."
              : "The demo finished without an incident, with limited supervision.",
      try: s.run.incidents
        ? "Try changing the relevant build setting before relying on an intervention."
        : s.run.supervision >= 3
          ? "Try reducing the need to step in by changing the build and the evidence behind it."
          : "Try a different evidence order and compare whether the same result earns more team trust.",
    },
  ];
}
