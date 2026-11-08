import s from "./HotSeat.module.css";
export function Presence({
  state,
  level,
  color,
}: {
  state: string;
  level: number;
  color: string;
}) {
  return (
    <div
      className={s.presence}
      data-state={state}
      style={{ "--person": color, "--amp": level } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 300">
        <circle cx="160" cy="130" r="110" fill={color} opacity=".06" />
        <circle
          className={s.ring}
          cx="160"
          cy="125"
          r="82"
          fill="none"
          stroke={color}
        />
        <g className={s.figure}>
          <path d="M70 300c0-62 38-96 90-96s90 34 90 96Z" fill={color} />
          <rect x="146" y="174" width="28" height="36" rx="12" fill="#e4bf9d" />
          <g className={s.head}>
            <circle cx="160" cy="130" r="48" fill="#f1d3b5" />
            <path
              d="M112 130c0-30 21-52 48-52s48 22 48 52c-10-16-28-24-48-24s-38 8-48 24Z"
              fill="#2b1d16"
            />
            <g className={s.eyes}>
              <circle cx="144" cy="136" r="3.6" fill="#2b1d16" />
              <circle cx="176" cy="136" r="3.6" fill="#2b1d16" />
            </g>
            <ellipse
              className={s.mouth}
              cx="160"
              cy="160"
              rx="9"
              ry="5"
              fill="#8a3b2f"
            />
          </g>
        </g>
        <rect
          x="24"
          y="262"
          width="272"
          height="10"
          rx="5"
          fill="#f4f1e4"
          opacity=".2"
        />
        <rect x="204" y="248" width="66" height="16" rx="2" fill="#fdfcf4" />
        <g className={s.pen}>
          <rect
            x="226"
            y="226"
            width="4"
            height="34"
            rx="2"
            fill="#f2c46b"
            transform="rotate(22 228 243)"
          />
        </g>
      </svg>
    </div>
  );
}
