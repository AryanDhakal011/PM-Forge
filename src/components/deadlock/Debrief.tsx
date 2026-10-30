"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { board, debrief } from "@/lib/deadlock/content";
import { findLevers, forkRun, ledgerKeys, replay } from "@/lib/deadlock/engine";
import {
  downloadRun,
  listRuns,
  loadRun,
  persistRun,
  saveNote,
} from "@/lib/deadlock/storage";
import type { DeadlockState, SavedRun } from "@/lib/deadlock/types";
import s from "./Deadlock.module.css";
import { ReviewCard } from "./Coaching";
const labels = {
  rob: "Robotics resentment",
  sw: "Software resentment",
  runway: "Runway",
  ready: "Readiness",
  align: "Alignment",
  cred: "Credibility",
  ap: "Persuasion points",
  wow: "Wow",
  supervision: "Supervision",
  incidents: "Incidents",
  tokens: "Intervention tokens",
};
export default function Debrief({
  run,
  state,
  onError,
}: {
  run: SavedRun;
  state: DeadlockState;
  onError: (text: string) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("trace"),
    [selected, setSelected] = useState<number | null>(null),
    [expanded, setExpanded] = useState<number | null>(null),
    [other, setOther] = useState<SavedRun | null>(null),
    [branches, setBranches] = useState<SavedRun[]>([]),
    [note, setNote] = useState(run.note || ""),
    [busy, setBusy] = useState(false);
  const levers = useMemo(
    () => (tab === "levers" ? findLevers(run) : []),
    [tab, run.id, run.revision],
  );
  useEffect(() => {
    let active = true;
    void listRuns(run.ownerId).then(async (rows) => {
      if (!active) return;
      setBranches(
        rows.filter((r) => r.parentId === run.id || r.id === run.parentId),
      );
      if (run.parentId) {
        const parent = await loadRun(run.parentId, run.ownerId);
        if (active) setOther(parent);
      }
    });
    return () => {
      active = false;
    };
  }, [run.id]);
  const fork = async (seq: number) => {
    setBusy(true);
    try {
      const branch = forkRun(run, seq, run.ownerId);
      await persistRun(branch);
      window.history.pushState(
        null,
        "",
        `/app/projects/deadlock/play/${branch.id}`,
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not create the replay.");
      setBusy(false);
    }
  };
  const trace = state.trace.filter((t, i, all) => {
    const lane = all[i].title.match(/^(SPEED|RECOVERY|LEARNING) →/);
    return (
      !lane ||
      !all.slice(i + 1).some((later) => later.title.startsWith(`${lane[1]} →`))
    );
  });
  return (
    <>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Debrief · The Trace Laboratory</p>
          <h2>The room remembers.</h2>
        </div>
        <div className={s.row}>
          <button
            className={s.button}
            onClick={() => downloadRun({ ...run, note })}
          >
            EXPORT RUN
          </button>
          <Link className={s.button} href="/app/projects/deadlock">
            THE DEADLOCK ↗
          </Link>
        </div>
      </header>
      <div className={s.spread}>
        <div className={s.archetype}>
          <span>{state.ending} · SIMULATED</span>
          <strong>THE {state.archetype}</strong>
        </div>
        <p className={s.muted} data-beat>
          {debrief.archetypes[state.archetype || "PRAGMATIST"]}
        </p>
      </div>
      <p data-beat>{debrief.copy}</p>
      <div className={s.reviewStack}>
        {[1, 2, 3].map((chapter) => {
          const marker =
            chapter === 1
              ? "consequence1"
              : chapter === 2
                ? "consequence2"
                : "ending";
          const at = run.events.findIndex(
            (e) => e.type === "ACK_SCENE" && e.scene === marker,
          );
          const snapshot = at >= 0 ? replay(run.events.slice(0, at)) : state;
          return (
            <ReviewCard key={chapter} chapter={chapter} state={snapshot} />
          );
        })}
      </div>
      <div className={s.tabs} role="tablist" aria-label="Debrief views">
        {["trace", "levers", "compare"].map((t) => (
          <button
            key={t}
            role="tab"
            id={`dl-tab-${t}`}
            aria-controls={`dl-panel-${t}`}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            THE {t.toUpperCase()}
          </button>
        ))}
      </div>
      {tab === "trace" && (
        <div role="tabpanel" id="dl-panel-trace" aria-labelledby="dl-tab-trace">
          <div className={s.traceBoard}>
            {trace.map((t) => (
              <article
                key={t.seq}
                className={s.traceCard}
                style={{
                  opacity: selected !== null && selected !== t.seq ? 0.7 : 1,
                }}
                onMouseEnter={() => setSelected(t.seq)}
                onMouseLeave={() => setSelected(null)}
                onFocus={() => setSelected(t.seq)}
              >
                <span className={s.kicker} style={{ color: "#765c25" }}>
                  CHAPTER {t.chapter} · EVENT {t.seq}
                </span>
                <h3>{t.title}</h3>
                {t.assumption && (
                  <>
                    <span className={s.chainArrow}>↓</span>
                    <p>
                      You acted on:{" "}
                      {
                        board.assumptions.find((a) => a.id === t.assumption)
                          ?.text
                      }
                    </p>
                  </>
                )}
                <span className={s.chainArrow}>↓</span>
                <p>{t.why}</p>
                <span className={s.chainArrow}>↓</span>
                <p>{t.constraint}</p>
                <div className={s.badges}>
                  {Object.entries(t.badges).map(([key, value]) => (
                    <span key={key}>
                      {value === null ? "—" : value ? "✓" : "×"}{" "}
                      {key === "heard"
                        ? "BOTH SIDES HEARD"
                        : key === "tradeoff"
                          ? "TRADE-OFF NAMED"
                          : key === "evidence"
                            ? "EVIDENCE-LINKED"
                            : "ADAPTED"}
                    </span>
                  ))}
                </div>
                <button
                  className={s.linkButton}
                  style={{ color: "#503f23" }}
                  aria-expanded={expanded === t.seq}
                  onClick={() => setExpanded(expanded === t.seq ? null : t.seq)}
                >
                  EXACT NUMBERS ↓
                </button>
                {expanded === t.seq && (
                  <>
                    <div className={s.ledger}>
                      {ledgerKeys
                        .filter((k) => t.before[k] !== t.after[k])
                        .map((k) => (
                          <div key={k}>
                            <span>{labels[k]}</span>
                            <span>
                              {t.before[k]} → {t.after[k]} (
                              {t.after[k] - t.before[k] > 0 ? "+" : ""}
                              {t.after[k] - t.before[k]})
                            </span>
                          </div>
                        ))}
                    </div>
                    <button
                      className={s.linkButton}
                      style={{ color: "#503f23" }}
                      disabled={busy}
                      onClick={() => void fork(t.seq)}
                    >
                      REPLAY FROM HERE ↗
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
      {tab === "levers" && (
        <div
          role="tabpanel"
          id="dl-panel-levers"
          aria-labelledby="dl-tab-levers"
        >
          <p className={s.muted} style={{ marginBottom: 20 }}>
            Each outcome below was checked by replaying this log with one
            changed decision.
          </p>
          <div className={s.leverGrid}>
            {levers.length ? (
              levers.map((l) => (
                <article key={l.seq} className={s.leverCard}>
                  <p className={s.kicker}>PULL THIS LEVER · EVENT {l.seq}</p>
                  <h3>{l.label}</h3>
                  <p data-beat>
                    The recorded continuation would reach {l.ending}.
                    {l.shift >= 15
                      ? ` A key variable moves by ${l.shift}.`
                      : ""}
                  </p>
                  <small>
                    In the fork, you make the choice and play forward yourself.
                  </small>
                  <button
                    className={s.brassButton}
                    disabled={busy}
                    onClick={() => void fork(l.seq)}
                  >
                    REPLAY FROM HERE
                  </button>
                </article>
              ))
            ) : (
              <article className={s.leverCard}>
                <h3>No big regrets. Try the other archetypes?</h3>
                <p data-beat>
                  No single valid substitution changed the ending or moved a key
                  variable by 15. Try a different sequence from the table.
                </p>
                <button
                  className={s.brassButton}
                  onClick={() => {
                    const e = run.events.find((e) => e.type === "SOCKET");
                    if (e) void fork(e.seq);
                  }}
                >
                  EXPLORE ANOTHER PATH
                </button>
              </article>
            )}
          </div>
        </div>
      )}
      {tab === "compare" && (
        <div
          role="tabpanel"
          id="dl-panel-compare"
          aria-labelledby="dl-tab-compare"
        >
          <div className={s.row} style={{ marginBottom: 20 }}>
            {branches.map((b) => (
              <button
                key={b.id}
                className={s.button}
                onClick={() => setOther(b)}
              >
                {b.id === run.parentId ? "ORIGINAL" : `FORK AT ${b.forkSeq}`}
              </button>
            ))}
          </div>
          {other ? (
            <>
              <div className={s.compare}>
                <Comparison
                  run={run}
                  title={run.parentId ? "THIS FORK" : "THIS RUN"}
                />
                <Comparison
                  run={other}
                  title={other.id === run.parentId ? "ORIGINAL" : "FORK"}
                />
              </div>
              <div className={s.runResult}>
                <h3>DIFFERING DECISIONS</h3>
                {decisionDifferences(run, other).map((text, i) => (
                  <p key={i} className={s.muted}>
                    {text}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className={s.muted}>
              Create a fork from a trace card or lever. The original log stays
              intact.
            </p>
          )}
        </div>
      )}
      <label className={s.note}>
        NOTE TO SELF · OPTIONAL
        <input
          maxLength={500}
          value={note}
          placeholder="What would you do differently?"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => void saveNote(run.id, run.ownerId, note)}
        />
        <small>
          Stored on this device. Never required. Never synced by default.
        </small>
      </label>
      <div className={s.row}>
        {Object.keys(debrief.archetypes).map((a) => (
          <span className={s.muted} key={a}>
            {a === state.archetype ? "✓" : "◇"} THE {a}
          </span>
        ))}
      </div>
    </>
  );
}
function Comparison({ run, title }: { run: SavedRun; title: string }) {
  const state = replay(run.events);
  return (
    <article>
      <p className={s.kicker}>{title}</p>
      <h3>{state.ending || "IN PROGRESS"}</h3>
      <p>THE {state.archetype || "UNASSIGNED"}</p>
      <div className={s.ledger}>
        {(["rob", "sw", "runway", "ready", "align"] as const).map((k) => (
          <div key={k}>
            <span>{labels[k]}</span>
            <b>{state[k]}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function decisionDifferences(first: SavedRun, second: SavedRun) {
  const a = replay(first.events),
    b = replay(second.events),
    rows: string[] = [];
  for (const lane of ["speed", "recovery", "learning"] as const) {
    const describe = (state: DeadlockState) =>
      `${state.lanes[lane].res || "unresolved"} / ${state.lanes[lane].evidence || "no evidence"}`;
    if (describe(a) !== describe(b))
      rows.push(`${lane.toUpperCase()}: ${describe(a)} → ${describe(b)}`);
  }
  if (a.shown.join() !== b.shown.join())
    rows.push(
      `PROJECTED: ${a.shown.join(" → ") || "none"} / ${b.shown.join(" → ") || "none"}`,
    );
  for (const key of ["s", "r", "l"] as const)
    if (a.dials[key] !== b.dials[key])
      rows.push(
        `${{ s: "SPEED", r: "RECOVERY", l: "LEARNING" }[key]}: ${a.dials[key]} → ${b.dials[key]}`,
      );
  for (const n of [2, 3, 4]) {
    const x = a.run.log.find((e) => e.event === n)?.action || "not reached",
      y = b.run.log.find((e) => e.event === n)?.action || "not reached";
    if (x !== y) rows.push(`EVENT ${n}: ${x} → ${y}`);
  }
  return rows.length
    ? rows.slice(0, 5)
    : ["The recorded choices match; timestamps are excluded."];
}
