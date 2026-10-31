"use client";
import { useEffect, useRef, useState } from "react";
import s from "./GhostMetric.module.css";
export default function UncertaintyBand({
  low,
  high,
  calm,
}: {
  low: number;
  high: number;
  calm: boolean;
}) {
  const prior = useRef({ low, high }),
    [trail, setTrail] = useState<{ low: number; high: number } | null>(null);
  useEffect(() => {
    if (prior.current.low !== low || prior.current.high !== high)
      setTrail(prior.current);
    prior.current = { low, high };
  }, [low, high]);
  return (
    <div
      className={s.band}
      aria-label={`Evidence supports ${Math.round(low)} to ${Math.round(high)} percent ghost growth`}
    >
      {trail && !calm && (
        <span
          key={low + ":" + high}
          className={s.bandTrail}
          style={{ left: trail.low + "%", width: trail.high - trail.low + "%" }}
          aria-hidden="true"
        />
      )}
      <i style={{ left: low + "%", width: high - low + "%" }} />
    </div>
  );
}
