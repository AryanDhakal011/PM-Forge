"use client";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { projectEntrance } from "@/lib/motion/projectEntrances";
import type { Project } from "@/lib/projects/types";
import s from "./Projects.module.css";
const scenes: Record<string, [string, string]> = {
  "root-cause": [
    "A perfect system. One quiet fracture.",
    "Follow the signal beneath the dashboard.",
  ],
  strategy: [
    "The city has more than one map.",
    "Territory moves when you make a commitment.",
  ],
  "product-sense": [
    "Every complaint is a different map.",
    "A blueprint takes shape. Its torn corner still matters.",
  ],
  "execution-metrics": [
    "The dashboard stops telling one story.",
    "One falling line changes the room.",
  ],
  "ai-technical": [
    "A network with one opaque connection.",
    "Capability is only one part of the system.",
  ],
  behavioral: [
    "A room of competing reflections.",
    "Ownership begins where the fragments meet.",
  ],
};
export default function Entrance({
  project,
  onDone,
  skipImmediately = false,
  calm = false,
  copy,
}: {
  project: Pick<Project, "id" | "category" | "title">;
  onDone: () => void;
  skipImmediately?: boolean;
  calm?: boolean;
  copy?: [string, string];
}) {
  const root = useRef<HTMLDivElement>(null),
    done = useRef(onDone);
  done.current = onDone;
  const { reducedMotion } = useSettings();
  const [skip, setSkip] = useState(skipImmediately);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    root.current?.focus();
    if (reducedMotion || calm) {
      const t = setTimeout(() => done.current(), 300);
      return () => clearTimeout(t);
    }
    const skipTimer = setTimeout(() => setSkip(true), 2500);
    const timeline = projectEntrance(root.current!, project.category, () =>
      done.current(),
    );
    return () => {
      clearTimeout(skipTimer);
      timeline.kill();
      if (before?.isConnected) before.focus();
    };
  }, [project.id, project.category, reducedMotion, calm]);
  const lines = copy || scenes[project.category] || scenes.strategy;
  return (
    <div
      ref={root}
      className={s.entrance}
      data-calm={reducedMotion || calm}
      role="dialog"
      aria-modal="true"
      aria-label={`Entering ${project.title}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          root.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
        if (event.key === "Escape" && skip) done.current();
      }}
    >
      <div className={s.entranceBar}>
        <span>PMForge / field simulation</span>
        {skip && (
          <button autoFocus onClick={() => done.current()}>
            Skip entrance →
          </button>
        )}
      </div>
      <div className={s.entranceArt} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            data-paper
            style={{
              left: `${20 + i * 17}%`,
              top: `${25 + i * 8}%`,
              rotate: `${i * 8 - 10}deg`,
            }}
          >
            FIELD NOTE / 0{i + 1}
            <br />
            {
              [
                "A partial signal.",
                "A promise already made.",
                "A constraint that stays.",
              ][i]
            }
          </span>
        ))}
        <svg viewBox="0 0 800 360">
          {Array.from({ length: 35 }, (_, i) => (
            <g key={i} data-node>
              <rect
                x={50 + (i % 7) * 103}
                y={35 + Math.floor(i / 7) * 59}
                width="73"
                height="36"
                rx={project.category === "behavioral" ? 0 : 5}
                fill="none"
                stroke="currentColor"
                opacity=".5"
              />
              <path
                d={`M${123 + (i % 7) * 103} ${53 + Math.floor(i / 7) * 59}h30`}
                stroke="currentColor"
                opacity=".35"
              />
            </g>
          ))}
          <path
            data-fracture
            d="M400 0l-40 84 67 42-55 48 61 31-74 89 31 66M372 174l-112-41-59 57M433 205l142-34 80 50"
            stroke="currentColor"
            fill="none"
            strokeWidth="3"
            opacity="0"
            strokeDasharray="900"
            strokeDashoffset="900"
          />
        </svg>
        <b data-pin className={s.brassPin}>
          ✦
        </b>
      </div>
      <div data-message className={s.entranceMessage}>
        <span>{project.title}</span>
        <h1>{lines[0]}</h1>
        <p>{lines[1]}</p>
        <em>The map draws itself while you walk.</em>
      </div>
    </div>
  );
}
