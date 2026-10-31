"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Action } from "@/lib/ghost-metric/engine";
import type { DrawerId } from "@/lib/ghost-metric/content";
import s from "./GhostMetric.module.css";
type Column = {
  left: DrawerId;
  key: "request_id" | "account_id" | "customer_id";
  label: string;
};
const columns: Column[] = [
  { left: "gateway", key: "request_id", label: "Gateway · request_id" },
  { left: "tags", key: "account_id", label: "Traffic tags · account_id" },
  { left: "gateway", key: "customer_id", label: "Gateway · customer_id" },
];
export default function JoinHands({
  opened,
  attempts,
  result,
  busy,
  calm,
  onJoin,
}: {
  opened: DrawerId[];
  attempts: number;
  result: string;
  busy: boolean;
  calm: boolean;
  onJoin: (action: Action) => void;
}) {
  const [picked, setPicked] = useState<Column | null>(null),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!attempts || !ref.current || calm) return;
    const ctx = gsap.context(
      () =>
        gsap.fromTo(
          "[data-join-row]",
          { x: (i: number) => (i % 2 ? -18 : 18), opacity: 0.3 },
          { x: 0, opacity: 1, duration: 0.6, ease: "power2.inOut" },
        ),
      ref,
    );
    return () => ctx.revert();
  }, [attempts, calm]);
  function join(right: "gateway" | "billing" | "accounts", column = picked) {
    if (!column) return;
    onJoin({ type: "JOIN", left: column.left, key: column.key, right });
    setPicked(null);
  }
  return (
    <div ref={ref} className={s.join}>
      <span className={s.eyebrow}>HANDS-ON JOIN / TAP OR DRAG A COLUMN</span>
      <p className={s.muted}>
        Pick a column, then a destination. Each attempted join costs one hour.
        The selects below do the same task.
      </p>
      <div className={s.joinFields}>
        <div className={s.choices}>
          {columns.map((c) => (
            <button
              key={c.label}
              draggable={opened.includes(c.left) && !busy}
              disabled={busy || !opened.includes(c.left)}
              aria-pressed={picked?.label === c.label}
              onClick={() => setPicked(c)}
              onDragStart={(e) => {
                setPicked(c);
                e.dataTransfer.setData("text/plain", c.label);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={s.choices}>
          {(["gateway", "billing", "accounts"] as const).map((right) => (
            <button
              key={right}
              disabled={
                busy || (right === "billing" && !opened.includes("billing"))
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const column = columns.find(
                  (c) => c.label === e.dataTransfer.getData("text/plain"),
                );
                if (column) join(right, column);
              }}
              onClick={() => join(right)}
            >
              {right === "gateway"
                ? "Drop into gateway request list"
                : right === "billing"
                  ? "Drop into billing events"
                  : "Drop into account reference list"}
            </button>
          ))}
        </div>
      </div>
      {attempts > 0 && (
        <div className={s.grid} aria-label="Joined sample rows">
          <div
            data-join-row=""
            className={s.card}
            style={{
              borderColor: result.startsWith("No valid")
                ? undefined
                : "#b98a48",
            }}
          >
            <code>
              {result.includes("Orbitly")
                ? "Orbitly → account list"
                : "Source → reference"}
            </code>
            <p>Source identifier</p>
          </div>
          <div
            data-join-row=""
            className={s.card}
            style={{
              borderColor: result.startsWith("No valid")
                ? undefined
                : "#b98a48",
            }}
          >
            <code>
              {result.startsWith("No valid")
                ? "Different entity · no match"
                : "Same entity · aligned"}
            </code>
            <p>{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}
