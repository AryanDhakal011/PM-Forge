import { forgeCost, tableState } from "./engine";
import type { DeadlockState, Lane } from "./types";
const names = {
  speed: "speed",
  recovery: "jam recovery",
  learning: "confirmation",
};
export function planChoices(s: DeadlockState) {
  return (["speed", "recovery", "learning"] as Lane[]).map((l) => ({
    label: names[l],
    choice: s.lanes[l].res
      ? {
          R: "Dev’s approach",
          S: "Ines’s approach",
          B: "a compromise",
          D: "left for later",
        }[s.lanes[l].res!]
      : "not settled",
  }));
}
export function teamResponse(s: DeadlockState) {
  const plan = tableState(s.lanes);
  return ["Dev", "Ines"]
    .map((name, i) => {
      const n = i ? plan.sw : plan.rob;
      return {
        name,
        response:
          n < 48
            ? "The plan reduced his frustration."
            : n > 48
              ? "The plan increased his frustration."
              : "His frustration is unchanged.",
      };
    })
    .map((r) =>
      r.name === "Ines"
        ? {
            ...r,
            response: r.response
              .replaceAll("his", "her")
              .replaceAll("His", "Her"),
          }
        : r,
    );
}
export function chapterTakeaway(s: DeadlockState, chapter: number) {
  if (chapter === 1) {
    const choices = planChoices(s)
      .map((c) => c.label + ": " + c.choice)
      .join("; ");
    const compromises = Object.values(s.lanes).filter(
      (c) => c.res === "B",
    ).length;
    return (
      "Your plan was " +
      choices +
      ". " +
      (compromises
        ? "The " +
          (compromises === 1
            ? "compromise used one week."
            : compromises + " compromises used " + compromises + " weeks. ")
        : "") +
      " " +
      teamResponse(s)
        .map(
          (r) =>
            r.name +
            ": " +
            r.response.charAt(0).toLowerCase() +
            r.response.slice(1),
        )
        .join(" ")
    );
  }
  if (chapter === 2) {
    const agreement = s.flags.includes("imposed")
      ? "After two rejected proposals, Mara chose the conservative build."
      : s.flags.includes("pushed")
        ? "You moved ahead over a rejection, which cost team trust."
        : s.flags.includes("dev_absent") && !s.flags.includes("dev_recalled")
          ? "Ines accepted the build, but Dev was absent from that agreement."
          : "Both leads accepted this build.";
    return (
      "You chose " +
      s.dials.s +
      " m/s, " +
      s.dials.r +
      " recovery, and " +
      {
        always: "confirmation on every object",
        uncertain: "confirmation only when uncertain",
        never: "no confirmation",
      }[s.dials.l] +
      ". " +
      agreement +
      " Building it uses " +
      forgeCost(s.dials) +
      " weeks."
    );
  }
  return runConclusion(s).summary;
}
export function runConclusion(s: DeadlockState) {
  const title = {
    "QUIET ROOM": "The demo was postponed.",
    FRACTURE: "The demo exposed a safety failure.",
    "SHARED GROUND": "A strong demo, with the team behind it.",
    "STANDING GUARD": "An impressive demo that needed close supervision.",
    BABYSITTER: "The robot worked, but depended too much on help.",
    "STEADY HANDS": "A safe, measured demonstration.",
  }[s.ending || "STEADY HANDS"];
  const incident = s.run.log.find((l) => l.incident),
    stepped = s.run.log.filter((l) => l.action !== "let");
  let summary =
    s.ending === "QUIET ROOM"
      ? s.ready < 60
        ? "The build was not ready enough to demonstrate, so the team postponed it."
        : "Too little runway remained, so the team postponed the demonstration."
      : incident
        ? "You let the robot run during " +
          (incident.event === 2 ? "the technician crossing" : "the jam") +
          ". That event produced an incident, which determined the ending."
        : "The demonstration finished without an incident. " +
          (stepped.length
            ? "You stepped in " +
              stepped.length +
              " time" +
              (stepped.length === 1 ? "" : "s") +
              " to handle events yourself. Those interventions left less to the robot, but reduced the demo's impact."
            : s.run.supervision >= 3
              ? "Your selected settings still required substantial supervision."
              : "Your build needed little intervention during the run.");
  const moments: { choice: string; result: string }[] = [];
  const compromises = Object.values(s.lanes).filter(
    (l) => l.res === "B",
  ).length;
  moments.push({
    choice: compromises
      ? "You chose " +
        compromises +
        " compromise" +
        (compromises === 1 ? "" : "s") +
        "."
      : "You chose who to back on the three arguments.",
    result: compromises
      ? "That used " +
        compromises +
        " week" +
        (compromises === 1 ? "" : "s") +
        " of runway. " +
        teamResponse(s)
          .map(
            (r) =>
              r.name +
              ": " +
              r.response.charAt(0).toLowerCase() +
              r.response.slice(1),
          )
          .join(" ")
      : teamResponse(s)
          .map(
            (r) =>
              r.name +
              ": " +
              r.response.charAt(0).toLowerCase() +
              r.response.slice(1),
          )
          .join(" "),
  });
  moments.push({
    choice:
      "You showed " +
      s.shown.length +
      " datasets, then chose " +
      s.dials.s +
      " m/s and " +
      s.dials.r +
      " recovery.",
    result: s.flags.includes("imposed")
      ? "Mara imposed the conservative build after the proposals ran out."
      : s.flags.includes("pushed")
        ? "The build went ahead despite a rejection. That carried a trust penalty into the demo."
        : s.flags.includes("dev_absent") && !s.flags.includes("dev_recalled")
          ? "Ines accepted, but Dev was not part of the agreement."
          : "The leads accepted the build you proposed.",
  });
  if (s.run.log.length)
    moments.push({
      choice: incident
        ? "You trusted the build during " +
          (incident.event === 2 ? "the technician crossing." : "the jam.")
        : stepped.length
          ? "You chose to step in during " +
            stepped.length +
            " event" +
            (stepped.length === 1 ? "." : "s.")
          : "You let the build handle the demonstration.",
      result: incident
        ? "An incident occurred during that event."
        : stepped.length
          ? "No incident was recorded. Each intervention reduced demo impact and increased dependence on supervision."
          : "No incident was recorded. " +
            (s.dials.l === "always"
              ? "Your confirmation setting still required an operator check for every object."
              : s.dials.r === "manual"
                ? "Manual recovery still required someone to clear the jam."
                : "The selected recovery and confirmation rules handled the events without a step-in."),
    });
  return { title, summary, moments: moments.slice(0, 3) };
}
