"use client";
import { useEffect, useRef, useState } from "react";
import type { Run } from "@/lib/product/types";
import styles from "./Product.module.css";
export default function SpokenSynthesis({
  value,
  onChange,
  paused,
}: {
  value: NonNullable<Run["spoken"]>;
  onChange: (value: NonNullable<Run["spoken"]>) => void;
  paused: boolean;
}) {
  const [running, setRunning] = useState(false);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  useEffect(() => {
    if (!running || paused || value.seconds >= 90 || value.skipped) return;
    const timer = setInterval(() => {
      const { value: v, onChange: change } = latest.current;
      if (!document.hidden && v.seconds < 90)
        change({ ...v, seconds: Math.min(90, v.seconds + 1) });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, paused, value.seconds >= 90, value.skipped]);
  return (
    <section className={styles.panel} aria-label="Spoken synthesis">
      <span className={styles.eyebrow}>Say it out loud · 90 seconds</span>
      <h2>Defend your call as if the interviewer were here.</h2>
      <p className={styles.prose}>
        Lead with your recommendation. Give two pieces of evidence, one
        tradeoff, and the next check. Speak without reading a script. No
        microphone permission or recording is needed; this rep is self-assessed.
      </p>
      <p role="timer" aria-label="Spoken rep time remaining">
        {Math.floor((90 - value.seconds) / 60)}:
        {String((90 - value.seconds) % 60).padStart(2, "0")} remaining
      </p>
      {!value.skipped && value.seconds < 90 && (
        <button
          className={styles.secondary}
          onClick={() => setRunning(!running)}
        >
          {running ? "Pause spoken rep" : "Start spoken rep"}
        </button>
      )}
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={value.structure}
          onChange={(e) => onChange({ ...value, structure: e.target.checked })}
        />{" "}
        I led with a recommendation and supported it with evidence.
      </label>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={value.clarity}
          onChange={(e) => onChange({ ...value, clarity: e.target.checked })}
        />{" "}
        I kept it clear, named a tradeoff, and ended with a next step.
      </label>
      <button
        className={styles.textButton}
        onClick={() => {
          setRunning(false);
          onChange({ ...value, skipped: !value.skipped });
        }}
      >
        {value.skipped
          ? "Use the spoken rep instead"
          : "Use text / skip speaking for accessibility"}
      </button>
      <p className={styles.finePrint}>
        Speaking and self-checks never increase the rubric band.{" "}
        {value.skipped
          ? "Text path selected."
          : value.seconds >= 90
            ? "Time complete. Finish your self-check."
            : "The timer pauses when this tab is hidden."}
      </p>
    </section>
  );
}
