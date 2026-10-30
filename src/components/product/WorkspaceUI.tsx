"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import gsap from "gsap";
import { CATEGORIES, questions } from "@/lib/product/content";
import { projects } from "@/lib/projects/content";
import type { Run } from "@/lib/product/types";
import { useSettings } from "@/components/providers/SettingsProvider";
import s from "./WorkspaceUI.module.css";

export const DRAFT_NOTICE =
  "Scenarios are drafts until reviewed by product experts. Company numbers are simulated for practice.";
export function DraftDot() {
  return (
    <span
      className={s.draftDot}
      tabIndex={0}
      aria-label="Draft, expert review pending"
    >
      <span role="tooltip">Draft, expert review pending</span>
    </span>
  );
}
const emblems = [
  "M8 28h12l6-18 9 33 7-15h14",
  "M14 14h24v24H14z M25 25h24v24H25z",
  "M9 47l15-27 12 16 18-25 M43 11h11v11",
  "M12 47V32m13 15V19m13 28V9m13 38V25",
  "M12 14h40v36H12z M12 26h40 M27 14v36 M40 26v24",
  "M23 10h18v13h13v18H41v13H23V41H10V23h13z",
  "M13 46c0-13 7-20 19-20s19 7 19 20 M23 17a9 9 0 1 0 18 0a9 9 0 1 0-18 0",
];
export function Emblem({
  category,
  scene = false,
}: {
  category: string;
  scene?: boolean;
}) {
  const index = Math.max(
    0,
    CATEGORIES.findIndex((c) => c.id === category),
  );
  return (
    <svg
      className={scene ? s.roomScene : s.emblem}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" opacity=".18" />
      <path d={emblems[index]} />
      <circle
        className={s.scenePoint}
        cx="52"
        cy="12"
        r="3"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
export function Meter({
  value,
  total = 3,
  label,
}: {
  value: number;
  total?: number;
  label: string;
}) {
  return (
    <span className={s.meter} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-lit={i < value} />
      ))}
    </span>
  );
}
export function EmptyState({
  kind,
  title,
  children,
  href,
  action,
}: {
  kind: "saved" | "history" | "filter" | "portfolio";
  title: string;
  children?: React.ReactNode;
  href: string;
  action: string;
}) {
  return (
    <section className={s.empty}>
      <svg
        viewBox="0 0 180 110"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {kind === "saved" ? (
          <>
            <path
              d="M55 15h65v82L88 76 55 97z"
              fill="#d8c89f"
              fillOpacity=".2"
            />
            <path d="M42 33h-9v64M134 26v61M67 37h40M67 48h29" />
          </>
        ) : kind === "history" ? (
          <>
            <path
              d="M15 88C48 10 60 110 94 45S147 80 165 20"
              strokeDasharray="3 7"
            />
            <circle cx="18" cy="82" r="7" />
            <circle cx="94" cy="45" r="7" />
            <path d="m155 14 13 3-5 14" />
          </>
        ) : kind === "filter" ? (
          <>
            <path d="M28 35h124v59H28z M20 25h140v15H20z M65 55h50M80 65h20" />
            <path d="m126 8 8 9M145 9l-4 12" />
          </>
        ) : (
          <>
            <path d="M24 87h133M38 85V23h32v62M76 85V15h32v70M114 85V32h32v53 M46 36h16M84 29h16M122 44h16" />
          </>
        )}
      </svg>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      <Link className={s.action} href={href}>
        {action} <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (open)
      ref.current
        ?.querySelector<HTMLElement>(`[data-option="${index}"]`)
        ?.focus();
  }, [open, index]);
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <div
      className={s.select}
      ref={ref}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setIndex(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {options.find((o) => o.value === value)?.label || label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          id={id}
          role="listbox"
          aria-label={label}
          className={s.options}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            }
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              setIndex(
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? options.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length,
              );
            }
          }}
        >
          {options.map((o, i) => (
            <button
              key={o.value}
              role="option"
              aria-selected={value === o.value}
              tabIndex={i === index ? 0 : -1}
              data-option={i}
              onClick={() => choose(o.value)}
            >
              {o.label}
              {value === o.value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function CoverageTable({ runs = [] }: { runs?: Run[] }) {
  const completed = new Set(
    runs.filter((r) => r.completedAt).map((r) => r.questionId),
  );
  return (
    <div className={s.coverage}>
      <table>
        <caption>
          Scenario coverage. Each pip is one completed scenario.
        </caption>
        <thead>
          <tr>
            <th scope="col">Room</th>
            {["Easy", "Medium", "Hard"].map((x) => (
              <th scope="col" key={x}>
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((c) => (
            <tr key={c.id} style={{ "--accent": c.color } as CSSProperties}>
              <th scope="row">
                <Link href={`/app/practice?category=${c.id}`}>
                  <Emblem category={c.id} />
                  {c.label}
                </Link>
              </th>
              {["easy", "medium", "hard"].map((level) => {
                const n = questions.filter(
                  (q) =>
                    q.category === c.id &&
                    q.level === level &&
                    completed.has(q.id),
                ).length;
                return (
                  <td key={level}>
                    <Link
                      href={`/app/practice?category=${c.id}&level=${level}`}
                      aria-label={`${c.label}, ${level}: ${n} of 3 complete`}
                    >
                      <Meter value={n} label={`${n} of 3 complete`} />
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p>○ Available &nbsp; ● Completed with debrief</p>
    </div>
  );
}
export function RouteMap({
  states = {},
  selected,
  onSelect,
}: {
  states?: Record<string, number>;
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { reducedMotion } = useSettings();
  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-route-path]",
        { strokeDasharray: 600, strokeDashoffset: 600 },
        { strokeDashoffset: 0, duration: 2, ease: "power2.out" },
      );
    }, ref);
    return () => ctx.revert();
  }, [reducedMotion]);
  return (
    <svg
      ref={ref}
      className={s.routeMap}
      viewBox="0 0 480 180"
      role="group"
      aria-label="Twelve project waypoints. Open a project or jump to its card."
    >
      <path
        data-route-path
        d="M30 45H450V100H30V150H450"
        fill="none"
        stroke="currentColor"
        opacity=".35"
      />
      {projects.map((p, i) => {
        const row = Math.floor(i / 4);
        const x = 30 + (row % 2 ? 3 - (i % 4) : i % 4) * 140;
        const y = [45, 100, 150][row];
        return (
          <a
            key={p.id}
            href={onSelect ? `#project-${p.id}` : `/app/projects/${p.id}`}
            onClick={
              onSelect
                ? (e) => {
                    e.preventDefault();
                    onSelect(p.id);
                  }
                : undefined
            }
            aria-label={`${p.title}, ${states[p.id] === 3 ? "completed" : states[p.id] ? "in progress" : "not started"}`}
          >
            <title>{p.title}</title>
            <circle cx={x} cy={y} r="22" fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={selected === p.id ? 11 : 8}
              fill={states[p.id] ? p.palette.accent : "var(--p-bg, #f2efe7)"}
              stroke="currentColor"
              strokeWidth={selected === p.id ? 3 : 1.5}
            />
            <text
              x={x}
              y={y - 17}
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
