"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { endings, line } from "@/lib/deadlock/content";
import { has } from "@/lib/deadlock/engine";
import { Arm, Avatar } from "./Stage";
import { useClock, type SceneProps } from "./runtime";
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
const tags = {
  ALIGNED_BURN: "RUNWAY REVIEW FRIDAY",
  ROBOTICS_WIN: "NADIA BRANDT ARRIVED EARLY",
  SOFTWARE_WIN: "DEV HAS AN OFFER",
  STALLED: "RUNWAY CUT BY TWO WEEKS",
  MIXED: "TWO LEADS, ARMS CROSSED",
};
export default function Cinematic({
  state,
  dispatch,
  paused,
  calm,
  caption,
  previewIntro,
  onIntroEnd,
  listen = false,
}: SceneProps & {
  previewIntro?: boolean;
  onIntroEnd?: () => void;
  listen?: boolean;
}) {
  const scene = previewIntro ? "intro" : state.scene;
  let duration = 12000,
    ids: string[] = [],
    title = "",
    tag = "";
  if (scene === "intro") {
    duration = 14000;
    title = "The Deadlock";
    tag = "CHAPTER 1 · BOILER ROOM";
    ids = ["CO-01", "CO-02", "CO-03", "CO-05", "CO-04"];
  } else if (scene === "consequence1") {
    ids = [roomLine[state.room]];
    title = "The room remembers.";
    tag = tags[state.room];
  } else if (scene === "opening2") {
    duration = 22000;
    ids = opening[state.room];
    title = "The Evidence Breach";
    tag = tags[state.room];
  } else if (scene === "consequence2") {
    ids = [
      has(state, "dev_absent") && !has(state, "dev_recalled")
        ? "F-ACC-INES"
        : has(state, "imposed")
          ? "C2-IMPOSED"
          : has(state, "pushed")
            ? "C2-PUSHED"
            : "C2-AGREED",
    ];
    title = "One build. One live run.";
    tag = "CHAPTER 3 · FIRST RUN";
  } else {
    duration = 28000;
    ids = endings.find((e) => e.id === state.ending)?.lines || ["EN-END"];
    if (has(state, "dev_absent") && !has(state, "dev_recalled"))
      ids = ids.filter((id) => line(id).speaker !== "Dev");
    title = state.ending || "The run is over.";
    tag = "THE ROOM REMEMBERS";
  }
  const finish = () =>
    previewIntro
      ? onIntroEnd?.()
      : dispatch({ type: "ACK_SCENE", scene: state.scene });
  const [voiceIndex, setVoiceIndex] = useState(0);
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const elapsed = useClock(listen ? 1200000 : duration, paused, finish);
  let index = listen
    ? voiceIndex
    : scene === "intro"
      ? elapsed < 4200
        ? -1
        : elapsed < 9000
          ? 0
          : elapsed < 9900
            ? 1
            : elapsed < 10800
              ? 2
              : elapsed < 12500
                ? 3
                : 4
      : Math.min(ids.length - 1, Math.floor(elapsed / (duration / ids.length)));
  const current = index >= 0 ? line(ids[index]) : undefined;
  const card = useRef<HTMLDivElement>(null),
    last = useRef("");
  useEffect(() => {
    if (paused || !current || last.current === current.id) return;
    last.current = current.id;
    let timer = 0,
      active = true;
    caption(
      current.id,
      listen
        ? () => {
            if (!active) return;
            timer = window.setTimeout(() => {
              if (voiceIndex < ids.length - 1) setVoiceIndex((i) => i + 1);
              else finishRef.current();
            }, 400);
          }
        : undefined,
    );
    const ctx = gsap.context(() => {
      gsap.fromTo(
        card.current,
        { y: calm ? 0 : 12, opacity: 0, scale: calm ? 1 : 1.025 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: calm ? 0.25 : 0.4,
          ease: "power3.out",
        },
      );
    });
    return () => {
      active = false;
      clearTimeout(timer);
      if (listen) last.current = "";
      ctx.revert();
    };
  }, [current?.id, calm, paused, listen]);
  return (
    <div
      className={s.cinema}
      data-intro-step={scene === "intro" ? index : undefined}
      data-cinematic={scene}
      data-reactor={scene !== "intro" || elapsed >= 7000 || listen}
    >
      <p className={s.kicker}>
        {scene === "intro" && elapsed < 4200
          ? "HALYARD ROBOTICS · THE BOILER ROOM · TUESDAY 06:12"
          : tag}
      </p>
      {scene === "intro" && elapsed < 4200 ? (
        <>
          <h1>06:12.</h1>
        </>
      ) : (
        <h2>
          {scene === "intro" && elapsed < 12500 ? "THE BOILER ROOM" : title}
        </h2>
      )}
      {scene === "ending" || scene === "consequence2" ? (
        <div style={{ width: "min(800px,100%)" }}>
          <Arm
            state={state}
            active={
              state.ending !== "QUIET ROOM" &&
              state.ending !== "FRACTURE" &&
              !paused
            }
            incident={state.ending === "FRACTURE"}
          />
        </div>
      ) : null}
      {current && (
        <div ref={card} className={s.speech} data-beat>
          <b>{current.speaker}</b>
          <p>{current.text}</p>
        </div>
      )}
      <div className={s.castRow}>
        {state.room === "STALLED" &&
        (scene === "opening2" || scene === "consequence1") ? (
          <>
            <EmptyChair />
            <Avatar person="Mara" />
            <EmptyChair />
          </>
        ) : scene === "ending" && state.ending === "FRACTURE" ? (
          <>
            <Avatar person="Nadia" mood="tense" />
            <EmptyChair />
            <Avatar person="Mara" mood="tense" />
          </>
        ) : (
          <>
            <Avatar
              person={
                scene === "opening2" && state.room === "ROBOTICS_WIN"
                  ? "Nadia"
                  : "Dev"
              }
              mood={
                has(state, "dev_absent") && !has(state, "dev_recalled")
                  ? "away"
                  : state.rob > 60
                    ? "tense"
                    : state.rob <= 45
                      ? "pleased"
                      : "neutral"
              }
            />
            <Avatar
              person={scene === "ending" ? "Theo" : "Ines"}
              mood={
                state.sw > 60 ? "tense" : state.sw <= 45 ? "pleased" : "neutral"
              }
            />
          </>
        )}
      </div>
      <div className={s.timeRail} aria-hidden="true">
        <i
          style={{ transform: `scaleX(${Math.min(1, elapsed / duration)})` }}
        />
      </div>
      <div className={s.cinemaControls}>
        <button className={s.button} disabled={elapsed < 1000} onClick={finish}>
          {scene === "ending"
            ? "SKIP TO THE TRACE"
            : scene === "intro"
              ? "SKIP INTRO"
              : "CONTINUE →"}
        </button>
        <span className={s.muted}>
          Skippable · Case file keeps the briefing
        </span>
      </div>
    </div>
  );
}

function EmptyChair() {
  return (
    <svg
      width="78"
      height="120"
      viewBox="0 0 78 120"
      role="img"
      aria-label="Empty chair"
    >
      <path
        d="M14 49V8H64V49M11 72H67V85H11ZM16 85V116M62 85V116"
        fill="#1b3030"
        stroke="#788c79"
        strokeWidth="5"
      />
      <path d="M18 50 12 72M61 50 67 72" stroke="#788c79" strokeWidth="5" />
    </svg>
  );
}
