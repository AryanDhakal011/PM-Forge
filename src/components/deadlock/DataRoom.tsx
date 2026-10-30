"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { board, datasets } from "@/lib/deadlock/content";
import { has } from "@/lib/deadlock/engine";
import type { Dataset } from "@/lib/deadlock/types";
import { Avatar } from "./Stage";
import type { SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
export default function DataRoom({ state, dispatch, busy, calm }: SceneProps) {
  const [selected, setSelected] = useState<Dataset | undefined>(
      state.shown.at(-1),
    ),
    [active, setActive] = useState<Dataset | undefined>(state.shown.at(-1));
  const entered = useRef(performance.now()),
    root = useRef<HTMLDivElement>(null);
  const cost =
    state.inspected.includes("E4") && state.shown.length === 0 ? 0 : 1;
  const project = (dataset: Dataset) => {
    setSelected(dataset);
    setActive(dataset);
    dispatch({
      type: "SHOW",
      dataset,
      previewMs: Math.max(0, performance.now() - entered.current),
    });
  };
  const data = datasets.find(
    (d) => d.id === active && state.shown.includes(d.id),
  );
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-chip-broken=true]",
        { y: -5, rotation: -3 },
        { y: 5, rotation: 3, duration: calm ? 0.2 : 0.65, ease: "bounce.out" },
      );
    }, root);
    return () => ctx.revert();
  }, [state.shown.length, calm]);
  return (
    <div ref={root}>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Chapter 2 · The Evidence Breach</p>
          <h2>Let them see the same thing.</h2>
        </div>
        <p className={s.muted} data-beat>
          {state.ap} persuasion points remaining.{" "}
          {cost === 0
            ? "HEADSTART · first projection is free."
            : "Each sealed folder costs 1 persuasion point."}{" "}
          Replays are free.
        </p>
      </header>
      <div className={s.dataStage}>
        {(["Dev", "Ines"] as const).map((person) => (
          <div className={s.lectern} key={person}>
            <Avatar
              person={person}
              mood={
                person === "Dev" &&
                has(state, "dev_absent") &&
                !has(state, "dev_recalled")
                  ? "away"
                  : state.shown.includes("D2")
                    ? "pleased"
                    : "tense"
              }
            />
            <div>
              {board.assumptions
                .filter((a) => a.owner === person)
                .map((a) => (
                  <div
                    className={s.assumption}
                    key={a.id}
                    data-broken={state.shown.includes(a.brokenBy as Dataset)}
                    data-chip-broken={state.shown.includes(
                      a.brokenBy as Dataset,
                    )}
                  >
                    <span>
                      {state.shown.includes(a.brokenBy as Dataset)
                        ? "BROKEN · "
                        : ""}
                    </span>
                    {a.text}
                  </div>
                ))}
            </div>
          </div>
        ))}
        <div
          className={s.projector}
          style={{ gridColumn: 2, gridRow: 1 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("deadlock-folder") as Dataset;
            if (
              datasets.some((d) => d.id === id) &&
              !busy &&
              (state.shown.includes(id) || state.ap >= cost)
            )
              project(id);
          }}
          aria-label="Shared projector. Both teams see each projected dataset."
        >
          <p className={s.kicker}>SIMULATED · SHARED PROJECTOR</p>
          {data ? (
            <>
              <h3>{data.title}</h3>
              <div className={s.chart} key={data.id}>
                {data.bars.map((b) => (
                  <div className={s.barRow} key={b.label}>
                    <span>{b.label}</span>
                    <div className={s.barTrack}>
                      <i style={{ width: `${b.value}%` }} />
                    </div>
                    <b>{b.value}</b>
                    {b.note && <small>{b.note}</small>}
                  </div>
                ))}
              </div>
              <p data-beat>{data.callout}</p>
              <small>{data.unit}</small>
            </>
          ) : (
            <div className={s.projectorEmpty}>
              <p>
                {selected
                  ? "Folder lifted. Project it for both teams."
                  : "Drag a sealed folder onto the projector."}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className={s.folders}>
        {datasets.map((d) => (
          <button
            key={d.id}
            draggable={!busy}
            className={s.folder}
            data-folder={d.id}
            data-shown={state.shown.includes(d.id)}
            aria-pressed={selected === d.id}
            disabled={busy || (!state.shown.includes(d.id) && state.ap < cost)}
            onFocus={() => {
              entered.current = performance.now();
            }}
            onPointerEnter={() => {
              entered.current = performance.now();
            }}
            onDragStart={(e) => {
              setSelected(d.id);
              e.dataTransfer.setData("deadlock-folder", d.id);
            }}
            onClick={() => {
              project(d.id);
            }}
          >
            <span className={s.folderSeal}>
              {state.shown.includes(d.id) ? "✓" : d.id}
            </span>
            <b>{d.title}</b>
            <small>
              {state.shown.includes(d.id)
                ? "OPENED · REPLAY FREE"
                : `${cost} persuasion point · click to show both teams`}
            </small>
          </button>
        ))}
      </div>
      <div className={s.planFooter}>
        <div className={s.row}>
          {has(state, "dev_absent") && !has(state, "dev_recalled") && (
            <button
              className={s.button}
              disabled={state.ap < 2 || busy}
              onClick={() => dispatch({ type: "CALL_DEV" })}
            >
              ☎ CALL DEV BACK · 2 persuasion points
            </button>
          )}
        </div>
        <button
          className={s.button}
          disabled={busy}
          onClick={() => dispatch({ type: "ACK_SCENE", scene: "data" })}
        >
          Finish · choose the build →
        </button>
      </div>
      {state.room === "ROBOTICS_WIN" && (
        <p className={s.muted} style={{ marginTop: 20 }}>
          {has(state, "auditor_flag")
            ? "NADIA’S NOTE · No override evidence in the first two slides."
            : state.shown.some((d) => d === "D3" || d === "D4")
              ? "NADIA’S NOTE · Override data noted."
              : "NADIA IS WAITING · Show override evidence in the first two slides."}
        </p>
      )}
    </div>
  );
}
