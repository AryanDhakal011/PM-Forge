"use client";
import { useEffect, useState } from "react";
import s from "@/components/trojan-horse/TrojanHorseSceneRunner.module.css";
export default function Loading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 2000); return () => clearTimeout(t); }, []);
  return <main className={s.root}><div className={s.loading} role="status"><svg viewBox="0 0 160 160" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={80 + Math.cos(i * Math.PI / 6) * 50} cy={80 + Math.sin(i * Math.PI / 6) * 50} r={i === 0 ? 4 : 2.5} fill={i === 0 ? "#e9c776" : "#81738c"}/>)}</svg><span>{slow ? "Warming up the party" : "Opening the scene"}</span></div></main>;
}
