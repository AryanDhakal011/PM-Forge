"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { objects, experience } from "@/lib/deadlock/content";
import type { Evidence } from "@/lib/deadlock/types";
import { Arm, Avatar } from "./Stage";
import type { SceneProps } from "./runtime";
import s from "./Deadlock.module.css";
export default function FloorWalk(props: SceneProps) {
  const { state, dispatch, busy, calm, caption } = props;
  const [zone, setZone] = useState<"bay" | "table" | "pit">("bay"),
    [object, setObject] = useState<Evidence | null>(null),
    [confirm, setConfirm] = useState(false),
    [discovery, setDiscovery] = useState<Evidence | null>(null);
  const camera = useRef<HTMLDivElement>(null),
    swipe = useRef(0);
  useEffect(() => {
    const ctx = gsap.context(() =>
      gsap.fromTo(
        camera.current,
        { x: calm ? 0 : 60, opacity: 0.4 },
        { x: 0, opacity: 1, duration: calm ? 0.3 : 0.7, ease: "power3.inOut" },
      ),
    );
    return () => ctx.revert();
  }, [zone, calm]);
  const pan = (delta: number) => {
    const zones = ["bay", "table", "pit"] as const;
    setZone(zones[Math.max(0, Math.min(2, zones.indexOf(zone) + delta))]);
  };
  return (
    <>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Chapter 1 · Boiler Room</p>
          <h2>Walk the floor.</h2>
        </div>
        <div
          className={s.bolts}
          aria-label={`Investigations left: ${state.focus} of 3`}
        >
          {[0, 1, 2].map((i) => (
            <i key={i} data-spent={i >= state.focus} />
          ))}
          <span>Investigations left: {state.focus}</span>
        </div>
      </header>
      <div
        ref={camera}
        className={s.floorZone}
        tabIndex={0}
        aria-label="Lab floor. Left and right arrow keys move between zones."
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            pan(e.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onPointerDown={(e) => {
          swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (e.target !== e.currentTarget) return;
          const d = e.clientX - swipe.current;
          if (Math.abs(d) > 70) pan(d < 0 ? 1 : -1);
        }}
      >
        <Avatar
          person={zone === "bay" ? "Dev" : zone === "pit" ? "Ines" : "Mara"}
        />
        <div className={s.floorObjects}>
          {objects
            .filter((o) => o.zone === zone)
            .map((o) => {
              const seen = state.inspected.includes(o.id),
                blocked =
                  (!seen && state.focus === 0 && state.inspecting !== o.id) ||
                  (!!state.inspecting && state.inspecting !== o.id);
              return (
                <button
                  key={o.id}
                  className={s.hotspot}
                  data-seen={seen}
                  data-object={o.id}
                  disabled={blocked || busy}
                  onClick={() => setObject(o.id)}
                >
                  <span className={s.objectIcon} aria-hidden="true">
                    {o.id === "E1"
                      ? "▣"
                      : o.id === "E2"
                        ? "▤"
                        : o.id === "E3"
                          ? "▦"
                          : o.id === "E4"
                            ? "▱"
                            : "✉"}
                  </span>
                  <strong>{o.title}</strong>
                  <span>
                    {seen
                      ? "PINNED · inspect again"
                      : state.inspecting === o.id
                        ? "OPEN · finish inspection"
                        : blocked
                          ? "Unseen · no investigations left"
                          : o.label}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
      {discovery && (
        <div className={s.discovery} role="status">
          <span className={s.kicker}>DISCOVERY · SAVED TO YOUR CASE FILE</span>
          <h3>{objects.find((o) => o.id === discovery)?.title}</h3>
          <p>{experience.evidence[discovery].discovery}</p>
        </div>
      )}
      <nav className={s.zoneNav} aria-label="Lab zones">
        {(
          [
            ["bay", "ROBOTICS"],
            ["table", "THE TABLE"],
            ["pit", "SOFTWARE PIT"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={zone === id}
            onClick={() => setZone(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className={s.planFooter}>
        <span className={s.muted}>
          Choose three investigations. Your case file keeps what you discover.
        </span>
        <button
          className={s.brassButton}
          disabled={busy || !!state.inspecting}
          onClick={() => {
            if (state.focus > 0) {
              caption("FW-07");
              setConfirm(true);
            } else dispatch({ type: "ACK_SCENE", scene: "floor" });
          }}
        >
          GO TO THE TABLE →
        </button>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="You still have looks left."
        description="Go to the table anyway?"
      >
        <div className={s.row}>
          <button className={s.button} onClick={() => setConfirm(false)}>
            KEEP LOOKING
          </button>
          <button
            className={s.brassButton}
            onClick={() => dispatch({ type: "ACK_SCENE", scene: "floor" })}
          >
            THE TABLE →
          </button>
        </div>
      </Dialog>
      <Dialog
        open={!!object}
        onClose={() => setObject(null)}
        title={objects.find((o) => o.id === object)?.title || "Evidence object"}
        size="lg"
      >
        {object && (
          <Inspection
            key={object}
            id={object}
            {...props}
            onClose={() => setObject(null)}
            onDiscover={() => {
              setDiscovery(object);
              setObject(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
}
function Inspection({
  id,
  state,
  dispatch,
  busy,
  paused,
  caption,
  onClose,
  onDiscover,
}: SceneProps & { id: Evidence; onClose: () => void; onDiscover: () => void }) {
  const obj = objects.find((o) => o.id === id)!;
  const [scrub, setScrub] = useState(0),
    [slips, setSlips] = useState<number[]>([]),
    [frozen, setFrozen] = useState(true),
    [pins, setPins] = useState<number[]>([]),
    [revealed, setRevealed] = useState(false),
    [highlight, setHighlight] = useState<number[]>([]),
    [feed, setFeed] = useState(6),
    [hint, setHint] = useState("");
  const finished = useRef(false);
  const [moment, setMoment] = useState(false);
  const began = useRef(state.inspecting === id || state.inspected.includes(id));
  const mark = () => {
    if (!began.current) {
      began.current = true;
      dispatch({ type: "BEGIN_INSPECT", card: id });
    }
  };
  useEffect(() => {
    if (id === "E5" && revealed) caption("LETTER-01");
  }, [id, revealed, caption]);
  const complete =
    id === "E1"
      ? moment
      : id === "E2"
        ? slips.length === 3
        : id === "E3"
          ? pins.includes(2) && pins.includes(3)
          : id === "E4"
            ? revealed
            : highlight.length === 2;
  useEffect(() => {
    if (!complete || busy || finished.current) return;
    finished.current = true;
    if (!state.inspected.includes(id)) dispatch({ type: "INSPECT", card: id });
    onDiscover();
  }, [complete, busy, state.inspected, id, dispatch, onDiscover]);
  const messages = [
    "94% of picks fully autonomous.",
    "Three near-misses in six weeks.",
    "Capping speed kills the demo. Obviously.",
    "Confirmation prompts cost nothing. Always have.",
    "Twelve weeks of runway.",
    "BENCH-0914: shared with neither team.",
  ];
  return (
    <div className={`${s.game} ${s.inspector}`}>
      <p className={s.objectInstruction}>
        {experience.evidence[id].instruction}
      </p>
      {id === "E1" && (
        <>
          <p className={s.kicker}>Demo reconstruction · review the near-miss</p>
          <Arm
            state={state}
            active={scrub > 0 && !paused}
            crossing={scrub >= 45 && scrub <= 50}
          />
          <p className={s.footageObservation} role="status">
            {scrub >= 45 && scrub <= 50
              ? "0:47 · A technician crosses within 0.4 m while the arm is still moving. This is the safety concern."
              : scrub > 50
                ? "The technician has passed. Move back to 0:47 to review the near-miss."
                : "The robot is sorting without help. Move toward 0:47 to see the technician enter its path."}
          </p>
          <label>
            Demo footage · {Math.floor(scrub / 60)}:
            {Math.floor(scrub % 60)
              .toString()
              .padStart(2, "0")}{" "}
            / 1:00
            <input
              type="range"
              aria-label="Scrub demo footage"
              min="0"
              max="60"
              step=".1"
              value={scrub}
              onChange={(e) => {
                mark();
                const value = Number(e.target.value);
                setScrub(value);
              }}
            />
          </label>
          <div className={s.spread}>
            <span>94% autonomous picks</span>
            <button
              className={s.button}
              onClick={() => {
                mark();
                setScrub(47);
              }}
            >
              Show the near-miss at 0:47 →
            </button>
          </div>
          {scrub >= 45 && scrub <= 50 && (
            <button
              className={s.brassButton}
              disabled={busy}
              onClick={() => setMoment(true)}
            >
              Save this finding to the case file →
            </button>
          )}
          {complete && (
            <p className={s.pattern}>
              FRAME FROZEN · 1.1 m/s · 0.4 m from a person
            </p>
          )}
        </>
      )}
      {id === "E2" && (
        <>
          <p>Pull each slip aside. Look for the repeated failure.</p>
          {obj.slips?.map((text, i) => (
            <button
              className={s.logSlip}
              draggable
              key={i}
              aria-label={`Reveal incident slip ${i + 1}`}
              data-open={slips.includes(i)}
              onDragEnd={() => {
                mark();
                setSlips((rows) => [...new Set([...rows, i])]);
              }}
              onClick={() => {
                mark();
                setSlips((rows) => [...new Set([...rows, i])]);
              }}
            >
              {slips.includes(i) ? text : `SLIP ${i + 1} · PULL ASIDE →`}
            </button>
          ))}
          {slips.includes(0) && slips.includes(1) && (
            <span className={s.pattern}>
              PATTERN PINNED · e-stop not wired to interlock
            </span>
          )}
        </>
      )}
      {id === "E3" && (
        <>
          <div className={s.slackMessages}>
            {messages.slice(0, feed).map((text, i) => (
              <button
                key={i}
                disabled={!frozen}
                aria-pressed={pins.includes(i)}
                onClick={() => {
                  mark();
                  if (i === 2 || i === 3) {
                    setPins((p) => [...new Set([...p, i])]);
                    setHint("ASSUMPTION · UNVERIFIED");
                  } else
                    setHint("That is a fact. Find an untested assumption.");
                }}
              >
                <small>{i % 2 === 0 ? "DEV" : "INES"}</small>
                <p>{text}</p>
                {pins.includes(i) && <b>⌖ ASSUMPTION · UNVERIFIED</b>}
              </button>
            ))}
          </div>
          <p role="status">{hint || "Freeze the feed. Pin two assumptions."}</p>
        </>
      )}
      {id === "E4" && (
        <div className={s.seal}>
          <strong>BENCH-0914</strong>
          <p>Shared with: neither team.</p>
          {!revealed ? (
            <button
              draggable
              onDragEnd={() => {
                mark();
                setRevealed(true);
              }}
              onClick={() => {
                mark();
                setRevealed(true);
              }}
            >
              Open report →
            </button>
          ) : (
            <>
              <p>
                Throughput vs. speed cap · Learning accuracy · Safety margins ·
                Jam recovery.
              </p>
              <div className={s.sealedValues} aria-hidden="true">
                BENCH RESULTS · SEALED UNTIL THE DATA ROOM
              </div>
              <p>HEADSTART · first Chapter 2 folder is free</p>
            </>
          )}
        </div>
      )}
      {id === "E5" && (
        <div className={s.letter}>
          {!revealed ? (
            <button
              className={s.button}
              draggable
              onDragEnd={() => {
                mark();
                setRevealed(true);
              }}
              onClick={() => {
                mark();
                setRevealed(true);
              }}
            >
              Open Northgate’s letter →
            </button>
          ) : (
            <>
              <span className={s.kicker}>NORTHGATE VENTURES</span>
              {obj.letter?.map((text, i) => (
                <button
                  key={i}
                  aria-pressed={highlight.includes(i)}
                  onPointerEnter={(e) => {
                    if (e.buttons) {
                      mark();
                      setHighlight((h) => [...new Set([...h, i])]);
                    }
                  }}
                  onClick={() => {
                    mark();
                    setHighlight((h) => [...new Set([...h, i])]);
                  }}
                >
                  {text}
                </button>
              ))}
              {complete && (
                <strong className={s.pattern}>⌜ BOTH REQUIRED ⌟</strong>
              )}
              <small>Highlight both lines to connect the requirements.</small>
            </>
          )}
        </div>
      )}
      <p className={s.muted}>
        {began.current && !state.inspected.includes(id)
          ? "Investigation started. Complete the short task; your discovery is saved automatically."
          : "Looking costs one investigation once you start handling the object."}
      </p>
    </div>
  );
}
