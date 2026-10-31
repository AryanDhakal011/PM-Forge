"use client";
import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import type { DeadlockState, Metrics } from "@/lib/deadlock/types";
import { cast } from "@/lib/deadlock/content";
import s from "./Deadlock.module.css";
function RoomPlateDrawing({ state }: { state: DeadlockState }) {
  return (
    <div
      className={s.plates}
      aria-hidden="true"
      data-room={state.room}
      data-ending={state.ending}
      data-imposed={state.flags.includes("imposed")}
    >
      <svg
        className={s.wall}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="dl-brick"
            width="120"
            height="55"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0H120V55H0ZM60 0V27M0 27H120M30 27V55M90 27V55"
              fill="none"
              stroke="#c0bca5"
              strokeOpacity=".13"
            />
          </pattern>
          <pattern
            id="dl-mesh"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0H24V24"
              fill="none"
              stroke="#808f84"
              strokeOpacity=".16"
            />
          </pattern>
        </defs>
        <rect width="1600" height="1000" fill="#101b1c" />
        <rect y="60" width="1600" height="700" fill="url(#dl-brick)" />
        <g fill="none" stroke="#344143">
          <path strokeWidth="26" d="M-20 160H440V250H1180V100H1620" />
          <path strokeWidth="13" d="M130 0V680H460M1450 0V500H1260" />
          <path strokeWidth="10" d="M0 80H1600" />
        </g>
        <g fill="#070e10" stroke="#60716a" strokeOpacity=".4">
          <rect x="76" y="330" width="380" height="400" />
          <rect x="90" y="342" width="350" height="370" fill="url(#dl-mesh)" />
          <path
            d="M120 720V610L205 560 265 445 340 510"
            stroke="#aa8155"
            strokeWidth="28"
            fill="none"
          />
          <rect x="1180" y="260" width="210" height="400" />
          <rect x="1195" y="276" width="180" height="70" />
          <rect x="1195" y="366" width="180" height="70" />
          <rect x="1195" y="456" width="180" height="70" />
          <rect
            x="600"
            y="310"
            width="410"
            height="245"
            fill="#8e9a8e"
            fillOpacity=".12"
          />
        </g>
        <path d="M0 740H1600V1000H0Z" fill="#101616" />
        <path
          d="M0 1000 630 740M1600 1000 970 740M0 830H1600M0 940H1600"
          stroke="#a6a99a"
          strokeOpacity=".1"
        />
        <g fill="#e19b50">
          <path d="M145 160 190 190H100Z" />
          <path d="M420 155 465 185H375Z" />
        </g>
        <g fill="#67c0bd" opacity=".45">
          <rect x="1200" y="285" width="170" height="4" />
          <rect x="1200" y="378" width="170" height="4" />
          <rect x="1200" y="466" width="170" height="4" />
        </g>
      </svg>
      <div className={s.orangeLight} />
      <div className={s.tealLight} />
      <div className={s.foreground} />
      <div className={s.grain} />
      {state.room === "STALLED" && (
        <span className={s.waitingProp}>WAITING</span>
      )}
      {state.room === "ROBOTICS_WIN" && (
        <span className={s.visitorProp}>NADIA BRANDT · VISITOR</span>
      )}
      {state.room === "SOFTWARE_WIN" && (
        <span className={s.coatProp}>DEV · PERSONAL EFFECTS</span>
      )}
      {state.room === "ALIGNED_BURN" && (
        <span className={s.specProp}>SHARED SPEC · D.R. + I.C.</span>
      )}
    </div>
  );
}
export function Gauge({
  label,
  value,
  preview,
  calm,
}: {
  label: string;
  value: number;
  preview?: number;
  calm: boolean;
}) {
  const needle = useRef<SVGGElement>(null),
    trail = useRef<SVGPathElement>(null),
    last = useRef(value);
  useEffect(() => {
    const from = last.current,
      to = value;
    last.current = value;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        needle.current,
        { attr: { transform: `rotate(${-120 + from * 2.4} 60 60)` } },
        {
          attr: { transform: `rotate(${-120 + to * 2.4} 60 60)` },
          duration: calm ? 0.3 : 0.7,
          ease: calm ? "none" : "elastic.out(1,0.6)",
        },
      );
      if (trail.current)
        gsap.fromTo(
          trail.current,
          { opacity: 0.55 },
          { opacity: 0, duration: calm ? 0.8 : 1.6 },
        );
    });
    return () => ctx.revert();
  }, [value, calm]);
  return (
    <div
      className={s.gauge}
      aria-label={`${label} ${value} of 100${preview !== undefined ? `, projected ${preview}` : ""}`}
    >
      <svg viewBox="0 0 120 106" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="#122326"
          stroke="#b69a59"
          strokeWidth="3"
        />
        <path
          d="M19 84A47 47 0 1 1 101 84"
          stroke="#a79c76"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M83 21A45 45 0 0 1 104 75"
          stroke="#b34a37"
          strokeWidth="5"
          fill="none"
          strokeDasharray="2 2"
        />
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d="M60 16V22"
            transform={`rotate(${-120 + i * 24} 60 60)`}
            stroke="#d6ccb1"
          />
        ))}
        <path
          ref={trail}
          d={gaugeArc(last.current, value)}
          fill="none"
          stroke="#ff9a5b"
          strokeWidth="7"
          opacity="0"
        />
        {preview !== undefined && (
          <g transform={`rotate(${-120 + preview * 2.4} 60 60)`}>
            <path
              d="M60 64V25"
              stroke="#e6c965"
              strokeWidth="4"
              strokeDasharray="3 2"
              opacity=".7"
            />
          </g>
        )}
        <g ref={needle} transform={`rotate(${-120 + value * 2.4} 60 60)`}>
          <path d="M60 69V24" stroke="#ff9a5b" strokeWidth="2.4" />
          <circle cx="60" cy="60" r="5" fill="#c9a24a" />
        </g>
        <text
          x="60"
          y="89"
          textAnchor="middle"
          fill="#e9efea"
          fontSize="17"
          fontFamily="monospace"
        >
          {value}
        </text>
      </svg>
      <span>{label}</span>
      {preview !== undefined && preview !== value && (
        <b>
          {preview - value > 0 ? "+" : ""}
          {preview - value}
        </b>
      )}
    </div>
  );
}
function gaugeArc(from: number, to: number) {
  const point = (value: number) => {
    const a = ((-120 + value * 2.4) * Math.PI) / 180;
    return `${60 + Math.sin(a) * 41} ${60 - Math.cos(a) * 41}`;
  };
  return `M${point(from)}A41 41 0 ${Math.abs(to - from) * 2.4 > 180 ? 1 : 0} ${to >= from ? 1 : 0} ${point(to)}`;
}
export function Instruments({
  state,
  preview,
  calm,
}: {
  state: DeadlockState;
  preview?: Metrics;
  calm: boolean;
}) {
  return (
    <div className={s.instruments} aria-label="Live instruments">
      <Gauge
        label="Robotics resentment"
        value={state.rob}
        preview={preview?.rob}
        calm={calm}
      />
      <div
        className={s.smallInstrument}
        aria-label={`Runway ${state.runway} weeks`}
      >
        <span>RUNWAY</span>
        <svg viewBox="0 0 120 110" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M54 10H66V27H54Z"
              transform={`rotate(${i * 30} 60 55)`}
              fill={
                i < (preview?.runway ?? state.runway)
                  ? state.runway < 4
                    ? "#e5392b"
                    : "#c9a24a"
                  : "#33403d"
              }
            />
          ))}
          <text x="60" y="60" fill="#e9efea" textAnchor="middle" fontSize="25">
            {preview?.runway ?? state.runway}
          </text>
          <text x="60" y="78" fill="#bcbcae" textAnchor="middle" fontSize="10">
            WEEKS
          </text>
        </svg>
      </div>
      <div
        className={s.smallInstrument}
        aria-label={`Prototype readiness ${state.ready} of 100`}
      >
        <span>TERN-1</span>
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <path
            d="M22 90H98M38 90V70L61 50 77 29 95 42"
            fill="none"
            stroke="#415450"
            strokeWidth="13"
          />
          <path
            d="M38 90V70L61 50 77 29 95 42"
            fill="none"
            stroke="#ff9a5b"
            strokeWidth="9"
            pathLength="100"
            strokeDasharray={`${preview?.ready ?? state.ready} 100`}
          />
        </svg>
        <b>{preview?.ready ?? state.ready}% ready</b>
      </div>
      <div
        className={s.alignment}
        aria-label={`Team alignment ${state.align} of 100`}
      >
        <span>ALIGNMENT</span>
        <div>
          <i
            style={{
              transform: `translateX(${Math.max(0, 35 - state.align * 0.3)}px)`,
            }}
          >
            ◖
          </i>
          <b>{preview?.align ?? state.align}</b>
          <i
            style={{
              transform: `translateX(${-Math.max(0, 35 - state.align * 0.3)}px)`,
            }}
          >
            ◗
          </i>
        </div>
        <small>shared ground</small>
      </div>
      <Gauge
        label="Software resentment"
        value={state.sw}
        preview={preview?.sw}
        calm={calm}
      />
    </div>
  );
}
function AvatarDrawing({
  person,
  mood = "neutral",
  expression,
  small = false,
}: {
  person: string;
  mood?: "neutral" | "pleased" | "tense" | "away";
  expression?: "neutral" | "thinking" | "annoyed" | "approving";
  small?: boolean;
}) {
  const p = cast.find((x) => x.id === person) || cast[0];
  const row = Math.max(
    0,
    ["Mara", "Dev", "Ines", "Nadia", "Theo"].indexOf(person),
  );
  const face =
    expression ||
    (mood === "pleased"
      ? "approving"
      : mood === "tense"
        ? "annoyed"
        : "neutral");
  const col = ["neutral", "thinking", "annoyed", "approving"].indexOf(face);
  return (
    <figure
      className={s.avatar}
      data-mood={mood}
      data-small={small}
      data-person={person}
      data-expression={face}
    >
      <div
        className={s.portrait}
        role="img"
        aria-label={
          p.name + ", " + (mood === "away" ? "not in the room" : face)
        }
        style={
          {
            backgroundPosition: (col * 100) / 3 + "% " + row * 25 + "%",
            "--skin": ["#9e6a49", "#ba865e", "#c89576", "#ae7856", "#dba17b"][
              row
            ],
          } as React.CSSProperties
        }
      ></div>
      <figcaption>
        <strong>{p.name}</strong>
        <span>{mood === "away" ? "Not in the room" : p.role}</span>
      </figcaption>
    </figure>
  );
}
function ArmDrawing({
  state,
  active = false,
  incident = false,
  crossing = false,
}: {
  state: DeadlockState;
  active?: boolean;
  incident?: boolean;
  crossing?: boolean;
}) {
  if (state.ending === "QUIET ROOM")
    return (
      <svg
        className={s.arm}
        viewBox="0 0 800 380"
        role="img"
        aria-label="TERN-1 under a tarp. The demo is postponed."
      >
        <path d="M25 302H775V330H25Z" fill="#203334" />
        <path
          d="M180 302 215 142 285 110 333 45 395 70 435 150 540 215 584 302Z"
          fill="#4f6560"
          stroke="#a6aa90"
          strokeWidth="2"
        />
        <path
          d="M333 45 312 302M395 70 444 302M215 142 252 302"
          stroke="#223d3d"
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M525 260H677V320H525Z"
          fill="#e2d5b2"
          transform="rotate(-6 600 290)"
        />
        <text
          x="600"
          y="288"
          textAnchor="middle"
          fontSize="14"
          fill="#203839"
          transform="rotate(-6 600 290)"
        >
          DEMO POSTPONED
        </text>
        <text
          x="400"
          y="365"
          textAnchor="middle"
          fill="#b7c2af"
          fontSize="13"
          letterSpacing="3"
        >
          TERN-1 · WAITING
        </text>
      </svg>
    );
  return (
    <svg
      className={s.arm}
      data-active={active}
      data-incident={incident}
      viewBox="0 0 800 380"
      role="img"
      aria-label={`TERN-1 test cell, ${state.dials.s} meters per second, ${state.dials.r} recovery, ${state.dials.l} confirmation`}
    >
      <defs>
        <pattern
          id="dl-belt"
          width="42"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0V24"
            stroke="#a2a995"
            strokeOpacity=".35"
            strokeWidth="3"
          />
        </pattern>
      </defs>
      <path d="M25 302H775V330H25Z" fill="#223536" stroke="#64746a" />
      <rect x="34" y="306" width="730" height="19" fill="url(#dl-belt)" />
      <g className={s.parcels} fill="#b3996b">
        <rect x="470" y="264" width="36" height="36" />
        <path d="M570 266H606V300H570Z" />
        <path d="M670 266 698 255 720 268V300H670Z" />
      </g>
      <path d="M235 300V267H325V300" fill="#5f7770" />
      <g className={s.armRig}>
        <path
          d="M280 265V202L385 155 350 66"
          fill="none"
          stroke="#b46737"
          strokeWidth="32"
          strokeLinejoin="round"
        />
        <path
          d="M280 265V202L385 155 350 66"
          fill="none"
          stroke="#e4aa63"
          strokeWidth="14"
          strokeLinejoin="round"
        />
        {[
          [280, 202],
          [385, 155],
          [350, 66],
        ].map(([cx, cy]) => (
          <circle
            key={cx}
            cx={cx}
            cy={cy}
            r="18"
            fill="#1c383c"
            stroke="#c9a24a"
            strokeWidth="4"
          />
        ))}
        <path
          d="M350 66 430 92 441 121M430 92 454 97"
          fill="none"
          stroke="#c2c0a8"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>
      {state.dials.s >= 1 && (
        <g stroke="#7ccfc7" fill="none">
          <path d="M164 295V60M550 295V60" strokeWidth="9" />
          <path
            d="M169 90H546M169 130H546M169 170H546M169 210H546M169 250H546"
            strokeDasharray="8 8"
            opacity=".3"
          />
        </g>
      )}
      <g
        transform={`translate(${crossing ? 480 : 72} 165)`}
        fill={crossing ? "#efbe8c" : "#8a9b93"}
      >
        <circle cx="0" cy="-29" r="16" />
        <path d="M-15 0H15L20 68 11 120H1V63H-4L-7 120H-18L-21 66Z" />
      </g>
      {crossing && (
        <g aria-hidden="true">
          <path
            d="M452 128H393"
            stroke="#f8bd73"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <text x="473" y="102" fill="#f8d4a4" fontSize="16">
            Technician crosses
          </text>
          <text
            x="430"
            y="153"
            fill="#f8d4a4"
            fontSize="14"
            textAnchor="middle"
          >
            0.4 m
          </text>
        </g>
      )}
      {state.dials.r === "auto" && (
        <g fill="#c9a24a">
          <path d="M290 27Q318 0 343 27Z" />
          <path d="M316 28V49" stroke="#c9a24a" strokeWidth="6" />
        </g>
      )}
      {state.dials.l !== "never" && (
        <g>
          <rect
            x="630"
            y="90"
            width="115"
            height="75"
            rx="4"
            fill="#12373a"
            stroke="#6f9e94"
          />
          <text
            x="687"
            y="122"
            textAnchor="middle"
            fill="#a4d7cc"
            fontSize="11"
          >
            {state.dials.l === "always" ? "CONFIRM EACH" : "UNCERTAIN ONLY"}
          </text>
          <path
            d="M675 145 683 152 700 135"
            fill="none"
            stroke="#c9a24a"
            strokeWidth="3"
          />
        </g>
      )}
      {incident && (
        <path
          d="M300 0 350 90 320 124 410 200 381 226 480 380M350 90 470 60M410 200 570 185"
          fill="none"
          stroke="#e5392b"
          strokeWidth="5"
        />
      )}
      <text
        x="400"
        y="365"
        textAnchor="middle"
        fill="#c3c7b8"
        fontSize="13"
        letterSpacing="4"
      >
        TERN-1 · SIMULATED TEST CELL
      </text>
    </svg>
  );
}

export const RoomPlate = memo(RoomPlateDrawing);
export const Avatar = memo(AvatarDrawing);
export const Arm = memo(ArmDrawing);
