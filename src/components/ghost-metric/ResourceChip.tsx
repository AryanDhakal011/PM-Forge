"use client";
import { useEffect, useRef, useState } from "react";
import AnimatedNumber from "./AnimatedNumber";
import s from "./GhostMetric.module.css";
export default function ResourceChip({
  value,
  label,
  day,
  calm,
}: {
  value: number;
  label: string;
  day: number;
  calm: boolean;
}) {
  const previous = useRef(value),
    [spent, setSpent] = useState(0);
  useEffect(() => {
    setSpent(Math.max(0, previous.current - value));
    previous.current = value;
  }, [value]);
  return (
    <span className={`${s.badge} ${s.resourceChip}`}>
      <AnimatedNumber value={value} calm={calm} /> {label} · DAY {day}
      {spent > 0 && (
        <span
          key={value + ":" + label}
          className={s.resourceResidual}
          aria-hidden="true"
        >
          −{spent}h
        </span>
      )}
    </span>
  );
}
