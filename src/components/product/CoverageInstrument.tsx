"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CATEGORIES, questions } from "@/lib/product/content";
import type { Run } from "@/lib/product/types";
import { useSettings } from "@/components/providers/SettingsProvider";
import s from "./CoverageInstrument.module.css";
const Scene = dynamic(() => import("./CoverageScene"), { ssr: false });
export const coverageQuestions = CATEGORIES.flatMap((c) =>
  ["easy", "medium", "hard"].flatMap((l) =>
    questions.filter((q) => q.category === c.id && q.level === l),
  ),
);
export default function CoverageInstrument({
  runs,
  nextId,
  edge,
}: {
  runs: Run[];
  nextId: string;
  edge?: string;
}) {
  const { reducedMotion } = useSettings();
  const [desktop, setDesktop] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const done = new Set(
    runs.filter((r) => r.completedAt).map((r) => r.questionId),
  );
  const reflected = new Set(
    runs.filter((r) => r.reflectionCompletedAt).map((r) => r.questionId),
  );
  const states = coverageQuestions.map((q) =>
    reflected.has(q.id) ? 2 : done.has(q.id) ? 1 : 0,
  );
  useEffect(() => {
    const media = matchMedia("(min-width:901px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    let inView = false;
    const publish = () =>
      setVisible(inView && document.visibilityState !== "hidden");
    const observer = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      publish();
    });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", publish);
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
      document.removeEventListener("visibilitychange", publish);
    };
  }, []);
  const first = reflected.size > 0;
  const [light, setLight] = useState(false);
  useEffect(() => {
    const owner = runs[0]?.ownerId;
    if (!owner || !first) return;
    const key = `pmforge.first-light:${owner}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setLight(true);
      const timer = setTimeout(() => setLight(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [first, runs[0]?.ownerId]);
  const selected = coverageQuestions.find((q) => q.id === hover);
  return (
    <div
      className={s.root}
      ref={ref}
      data-first-light={light && !reducedMotion}
    >
      <div className={s.drawing}>
        <svg
          viewBox="0 0 400 340"
          role="img"
          aria-label="Coverage instrument: seven rooms, nine scenarios in each. Choose a bead to open its brief."
        >
          <defs>
            <radialGradient id="coverage-chrome" cx="32%" cy="24%">
              <stop stopColor="#fffdf1" />
              <stop offset=".18" stopColor="#e8eee7" />
              <stop offset=".38" stopColor="#748078" />
              <stop offset=".51" stopColor="#192b24" />
              <stop offset=".57" stopColor="#e0d3ab" />
              <stop offset=".8" stopColor="#536359" />
              <stop offset="1" stopColor="#122a20" />
            </radialGradient>
          </defs>
          {CATEGORIES.map((c, i) => (
            <g
              key={c.id}
              transform={`translate(200 165) rotate(${i * 25 - 70})`}
            >
              <ellipse
                rx={122 + i * 3}
                ry={45 + i * 5}
                fill="none"
                stroke={c.color}
                opacity=".6"
              />
              {coverageQuestions.slice(i * 9, i * 9 + 9).map((q, j) => {
                const a = (j / 9) * Math.PI * 2;
                const x = Math.cos(a) * (122 + i * 3),
                  y = Math.sin(a) * (45 + i * 5);
                const state = states[i * 9 + j];
                return (
                  <a
                    key={q.id}
                    href={`/app/practice/${q.slug}`}
                    aria-label={`${q.title}, ${q.level}, ${q.minutes} minutes, ${state === 2 ? "reflected" : state ? "completed" : "available"}`}
                    onFocus={() => setHover(q.id)}
                    onBlur={() => setHover("")}
                    onMouseEnter={() => setHover(q.id)}
                    onMouseLeave={() => setHover("")}
                  >
                    <title>
                      {q.title} · {q.level} · {q.minutes} min
                    </title>
                    <circle cx={x} cy={y} r="14" fill="transparent" />
                    <circle
                      cx={x}
                      cy={y}
                      r={q.id === nextId ? 6 : state ? 5 : 3.5}
                      fill={state ? c.color : "#223c2f"}
                      stroke={q.id === nextId ? "#f7df99" : c.color}
                      strokeWidth={state === 2 ? 3 : 1.5}
                    />
                  </a>
                );
              })}
            </g>
          ))}
          <circle cx="200" cy="165" r="58" fill="url(#coverage-chrome)" />
          <ellipse
            cx="200"
            cy="315"
            rx="110"
            ry="3"
            fill="#d8c28c"
            opacity=".15"
          />
        </svg>
      </div>
      {desktop && !reducedMotion && (
        <Scene states={states} visible={visible} onHover={setHover} />
      )}
      <div className={s.caption} aria-live="polite">
        {selected ? (
          `${selected.title} · ${selected.level} · ${selected.minutes} min`
        ) : (
          <span className={s.next}>
            next edge ↗ {edge || "Start with curiosity"}
          </span>
        )}
      </div>
      <div className={s.legend} aria-label="Coverage by room">
        {CATEGORIES.map((c) => (
          <Link
            href={`/app/practice?category=${c.id}`}
            key={c.id}
            title={`${c.label}: ${questions.filter((q) => q.category === c.id && done.has(q.id)).length} of 9 completed`}
          >
            <i style={{ background: c.color }} />
            {c.short}
            <span>
              {
                questions.filter((q) => q.category === c.id && done.has(q.id))
                  .length
              }
              /9
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
