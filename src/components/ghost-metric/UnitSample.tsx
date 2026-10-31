"use client";
import { useState } from "react";
import s from "./GhostMetric.module.css";
export default function UnitSample({
  busy,
  onClassify,
}: {
  busy: boolean;
  onClassify: (counts: boolean) => void;
}) {
  const [picked, setPicked] = useState(false);
  return (
    <>
      <div
        className={s.sampleEvent}
        draggable={!busy}
        role="button"
        tabIndex={0}
        aria-pressed={picked}
        aria-label="Select the retry event"
        onClick={() => setPicked(true)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setPicked(true);
          }
        }}
        onDragStart={(e) => {
          setPicked(true);
          e.dataTransfer.setData("text/plain", "ghost-retry");
        }}
      >
        <span className={s.eyebrow}>
          DRAG THIS EVENT · OR SELECT A TRAY BELOW
        </span>
        <h3>Request 8f2a · retry</h3>
        <p>Timeout → same request sent again → completed</p>
        <small>The customer still wants the same answer.</small>
      </div>
      <p className={s.muted}>Does this retry represent new customer demand?</p>
      <div className={s.unitTrays}>
        {[true, false].map((counts) => (
          <button
            key={String(counts)}
            className={s.unitTray}
            disabled={busy}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (
                e.dataTransfer.getData("text/plain") === "ghost-retry" &&
                !busy
              )
                onClassify(counts);
            }}
            onClick={() => onClassify(counts)}
          >
            <strong>
              {counts ? "Counts as new demand" : "Doesn’t count as new demand"}
            </strong>
            <span>
              {counts
                ? "A new unit in the growth numerator"
                : "A repeated event around the same intent"}
            </span>
            <small>Drop here, tap, or press Enter</small>
          </button>
        ))}
      </div>
      <p className={s.muted}>
        Your starting assumption becomes a receipt. It is not a pass/fail
        question.
      </p>
    </>
  );
}
