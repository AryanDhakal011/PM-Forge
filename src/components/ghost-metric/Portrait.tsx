import { people, type Person } from "@/lib/ghost-metric/content";
export default function Portrait({
  id,
  mood = "neutral",
}: {
  id: Person;
  mood?: string;
}) {
  const p = people.find((p) => p.id === id)!;
  const dark = id === "Ravi" || id === "Joyce",
    older = id === "Anders";
  return (
    <svg
      viewBox="0 0 80 80"
      role="img"
      aria-label={`${p.name}, ${mood}`}
      width="80"
      height="80"
      style={{ borderRadius: 18, flexShrink: 0 }}
    >
      <rect width="80" height="80" rx="18" fill={p.color} />
      <path
        d="M8 80q2-25 32-25t32 25"
        fill={
          id === "Elena" ? "#ede7dd" : id === "Marcus" ? "#333c48" : "#374c47"
        }
      />
      <path d="M32 50v12q8 8 16 0V50" fill={dark ? "#b88260" : "#d9ae91"} />
      <ellipse
        cx="40"
        cy="32"
        rx={id === "Marcus" ? 19 : 17}
        ry="23"
        fill={dark ? "#c18d6b" : "#e4bfa4"}
      />
      <path
        d={
          id === "Joyce"
            ? "M21 51Q8 3 42 5q35 5 17 48l-4-31q-20 4-28-6z"
            : id === "Elena"
              ? "M20 40Q11 5 40 5q29 0 23 43l-7-27-26-6z"
              : older
                ? "M23 25Q20 6 40 7q20 0 18 19l-8-10-21 4z"
                : "M21 26Q15 4 40 4q27 0 19 25L49 17 25 22z"
        }
        fill={older ? "#d9d8cf" : dark ? "#242322" : "#51443c"}
      />
      <ellipse cx="33" cy="33" rx="4.2" ry="3.8" fill="#fffaf2" />
      <ellipse cx="48" cy="33" rx="4.2" ry="3.8" fill="#fffaf2" />
      <circle cx="34" cy="33" r="2.1" fill="#292827" />
      <circle cx="47" cy="33" r="2.1" fill="#292827" />
      <path
        d={
          mood === "annoyed"
            ? "M27 25l11 4m5 0 11-4"
            : mood === "thinking"
              ? "M27 26l10-2m6 2 11 1"
              : "M27 26q5-3 10 0m6 0q5-3 11 0"
        }
        fill="none"
        stroke="#433a33"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M41 34l-2 8 4 1"
        fill="none"
        stroke="#a17154"
        strokeWidth="1.3"
      />
      <path
        d={
          mood === "approving"
            ? "M33 48q8 7 15 0"
            : mood === "annoyed"
              ? "M33 50q8-4 15 0"
              : "M34 49q7 2 13 0"
        }
        fill="none"
        stroke="#714b3e"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {(id === "Ravi" || older) && (
        <g fill="none" stroke={older ? "#675a4d" : "#262b31"} strokeWidth="1.4">
          <rect x="25" y="28" width="14" height="11" rx="4" />
          <rect x="42" y="28" width="14" height="11" rx="4" />
          <path d="M39 32h3" />
        </g>
      )}
      {id === "Ravi" && (
        <path
          d="M26 45q1 16 14 17 15-2 15-17l-7 10H34z"
          fill="#35312d"
          opacity=".8"
        />
      )}
    </svg>
  );
}
