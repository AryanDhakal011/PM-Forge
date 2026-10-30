export function InstrumentDrawing({ coverage = 0 }: { coverage?: number }) {
  return (
    <svg viewBox="0 0 400 280" fill="none" aria-hidden="true">
      <ellipse cx="200" cy="241" rx="96" ry="8" fill="#10251b" opacity=".25" />
      <g stroke="#c5b279">
        <ellipse
          cx="200"
          cy="139"
          rx="98"
          ry="77"
          transform="rotate(-28 200 139)"
          strokeWidth="3"
        />
        <ellipse
          cx="200"
          cy="139"
          rx="78"
          ry="102"
          transform="rotate(-50 200 139)"
          strokeWidth="2"
        />
        <ellipse
          cx="200"
          cy="139"
          rx="110"
          ry="41"
          transform="rotate(18 200 139)"
          strokeWidth="2"
        />
        <path d="M200 40V24m0 230v-18M90 139H73m254 0h-17" opacity=".6" />
      </g>
      <circle cx="200" cy="139" r="43" fill="url(#core)" stroke="#d8d9bb" />
      {Array.from({ length: 63 }, (_, i) => {
        const angle = (i / 63) * Math.PI * 2;
        const done = i < Math.round(coverage * 63);
        return (
          <circle
            key={i}
            cx={200 + Math.cos(angle) * 120}
            cy={139 + Math.sin(angle) * 120}
            r={done ? 2.8 : 1.6}
            fill={done ? "#e3cc83" : "#6c816c"}
          />
        );
      })}
      <defs>
        <radialGradient id="core" cx=".3" cy=".25" r=".8">
          <stop stopColor="#fff9df" />
          <stop offset=".5" stopColor="#bfc6af" />
          <stop offset="1" stopColor="#697c60" />
        </radialGradient>
      </defs>
    </svg>
  );
}
