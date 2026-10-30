"use client";
import { useState } from "react";
import { endings, experience, line } from "@/lib/deadlock/content";
import { has } from "@/lib/deadlock/engine";
import { Arm, Avatar } from "./Stage";
import { Conversation } from "./Conversation";
import type { SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
const roomLine = {
  ALIGNED_BURN: "C1-ALIGNED",
  ROBOTICS_WIN: "C1-ROBOTICS",
  SOFTWARE_WIN: "C1-SOFTWARE",
  STALLED: "C1-STALLED",
  MIXED: "C1-MIXED",
};
const opening = {
  ALIGNED_BURN: ["O2-A1", "O2-CTRL"],
  ROBOTICS_WIN: ["O2-R1", "O2-R2", "O2-R3", "O2-CTRL"],
  SOFTWARE_WIN: ["O2-S1", "O2-S2", "O2-CTRL"],
  STALLED: ["O2-T1", "O2-CTRL"],
  MIXED: ["O2-M1", "O2-CTRL"],
};
export default function Cinematic(
  props: SceneProps & { previewIntro?: boolean; onIntroEnd?: () => void },
) {
  const { state, dispatch, previewIntro, onIntroEnd } = props;
  const scene = previewIntro ? "intro" : state.scene;
  const [briefing, setBriefing] = useState(false);
  const finish = () =>
    previewIntro
      ? onIntroEnd?.()
      : dispatch({ type: "ACK_SCENE", scene: state.scene });
  let ids: string[] = [],
    title = "",
    eyebrow = "";
  if (scene === "intro") {
    ids = briefing ? experience.briefing : experience.intro;
    title = briefing
      ? "Your first day. One difficult decision."
      : "Meet the people behind the prototype.";
    eyebrow = briefing ? "THE CASE · HALYARD ROBOTICS" : "WELCOME TO THE TEAM";
  } else if (scene === "consequence1") {
    ids = [roomLine[state.room]];
    title = "A decision changes the room.";
    eyebrow = "CHAPTER 1 · THE TEAM RESPONDS";
  } else if (scene === "opening2") {
    ids = opening[state.room];
    title = "Bring the facts into the same room.";
    eyebrow = "CHAPTER 2 · THE EVIDENCE BREACH";
  } else if (scene === "consequence2") {
    ids = [
      has(state, "imposed")
        ? "C2-IMPOSED"
        : has(state, "pushed")
          ? "C2-PUSHED"
          : has(state, "dev_absent") && !has(state, "dev_recalled")
            ? "F-ACC-INES"
            : "C2-AGREED",
    ];
    title = "This is the robot you will demonstrate.";
    eyebrow = "CHAPTER 2 · THE BUILD IS SET";
  } else {
    ids = endings.find((e) => e.id === state.ending)?.lines || ["EN-END"];
    ids = ids.filter(
      (id) =>
        line(id).speaker !== "Dev" ||
        !has(state, "dev_absent") ||
        has(state, "dev_recalled"),
    );
    title = state.ending || "The demonstration is over.";
    eyebrow = "THE RESULT · EVERY DECISION LEFT A TRACE";
  }
  const done = () =>
    scene === "intro" && !briefing ? setBriefing(true) : finish();
  return (
    <div
      className={s.humanScene}
      data-cinematic={scene}
      data-briefing={briefing}
    >
      <header>
        <p className={s.kicker}>{eyebrow}</p>
        <h2>{title}</h2>
      </header>
      {scene === "intro" && !briefing && (
        <div className={s.teamStrip}>
          {["Mara", "Dev", "Ines"].map((person) => (
            <Avatar key={person} person={person} />
          ))}
        </div>
      )}
      {scene === "intro" && briefing && (
        <div className={s.caseMap} aria-label="Case overview">
          <div>
            <b>Halyard Robotics</b>
            <span>TERN-1 · warehouse sorting robot</span>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <b>12 weeks</b>
            <span>One live demonstration</span>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <b>Northgate</b>
            <span>Autonomy + documented human overrides</span>
          </div>
        </div>
      )}
      {(scene === "ending" || scene === "consequence2") && (
        <div className={s.cinematicArm}>
          <Arm
            state={state}
            active={
              !props.paused &&
              state.ending !== "QUIET ROOM" &&
              state.ending !== "FRACTURE"
            }
            incident={state.ending === "FRACTURE"}
          />
        </div>
      )}
      <Conversation
        key={scene + ":" + briefing}
        {...props}
        ids={ids}
        onDone={done}
        finishLabel={
          scene === "intro"
            ? briefing
              ? "Show me the lab →"
              : "What is the case? →"
            : scene === "ending"
              ? "Review this run →"
              : "Review and continue →"
        }
      />
    </div>
  );
}
