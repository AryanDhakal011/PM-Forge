"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { board, line, objects, project } from "@/lib/deadlock/content";
import {
  append,
  createRun,
  has,
  initialState,
  reduceEvent,
  replay,
} from "@/lib/deadlock/engine";
import { reactionFor } from "@/lib/deadlock/reactions";
import {
  DeadlockConflict,
  deleteRun,
  downloadRun,
  listRuns,
  loadRun,
  persistRun,
} from "@/lib/deadlock/storage";
import type {
  Action,
  DeadlockState,
  Metrics,
  SavedRun,
} from "@/lib/deadlock/types";
import { Arm, Instruments, RoomPlate } from "./Stage";
import Cinematic from "./Cinematic";
import {
  useAudio,
  useClock,
  usePreferences,
  useVisible,
  type SceneProps,
} from "./runtime";
import s from "./Deadlock.module.css";
const FloorWalk = dynamic(() => import("./FloorWalk"));
const DecisionTable = dynamic(() => import("./DecisionTable"));
const DataRoom = dynamic(() => import("./DataRoom"));
const Forge = dynamic(() => import("./Forge"));
const FirstRun = dynamic(() => import("./FirstRun"));
const Debrief = dynamic(() => import("./Debrief"));
type Spoken = ReturnType<typeof line> & { seq?: number };
const transcriptKey = (owner: string, id: string) =>
  `pmforge.deadlock.transcript.v1:${owner}:${id}`;
export default function DeadlockExperience() {
  const { profile } = useWorkspace(),
    { reducedMotion } = useSettings();
  const owner = profile?.id || "memory-guest";
  const router = useRouter(),
    pathname = usePathname();
  const runId = pathname.match(/\/(?:play|debrief)\/([^/]+)$/)?.[1];
  const { prefs, update } = usePreferences(),
    visible = useVisible();
  const [run, setRun] = useState<SavedRun | null>(null),
    [runs, setRuns] = useState<SavedRun[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [paused, setPaused] = useState(false),
    [exit, setExit] = useState(false),
    [caseOpen, setCaseOpen] = useState(false),
    [settings, setSettings] = useState(false),
    [transcriptOpen, setTranscriptOpen] = useState(false),
    [introReplay, setIntroReplay] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(true),
    [preview, setPreview] = useState<Metrics>(),
    [spoken, setSpoken] = useState<Spoken | null>(null),
    [transcript, setTranscript] = useState<Spoken[]>([]),
    [reaction, setReaction] = useState<{
      key: number;
      lines: { id: string; thing?: string }[];
    } | null>(null),
    [tier, setTier] = useState("B");
  const root = useRef<HTMLDivElement>(null),
    current = useRef<SavedRun | null>(null),
    writing = useRef(false),
    session = useRef(0),
    heading = useRef<HTMLElement>(null);
  const state = useMemo(
    () => (run ? replay(run.events) : initialState()),
    [run],
  );
  const halt =
    paused ||
    !visible ||
    settings ||
    caseOpen ||
    transcriptOpen ||
    exit ||
    introReplay;
  const calm =
    reducedMotion ||
    prefs.motion ||
    prefs.calm ||
    prefs.tier === "C" ||
    tier === "C";
  const audio = useAudio(
    prefs,
    halt && !introReplay,
    (state.rob + state.sw) / 2,
  );
  const audioRef = useRef(audio);
  const spokenLog = useRef<Spoken[]>([]);
  const introduced = useRef(new Set<string>());
  audioRef.current = audio;
  useEffect(() => {
    // A resumed scene must not parse every unrelated chapter while animating.
    if (runId) return;
    // Prepare the remaining small scene chunks after the entry is usable.
    // Native history keeps scene/run changes local when the network disappears.
    const timer = window.setTimeout(() => {
      void Promise.allSettled([
        import("./FloorWalk"),
        import("./DecisionTable"),
        import("./DataRoom"),
        import("./Forge"),
        import("./FirstRun"),
        import("./Debrief"),
      ]).then(() => {
        if ("serviceWorker" in navigator)
          void navigator.serviceWorker.ready
            .then((reg) => {
              reg.active?.postMessage({ type: "CACHE_DEADLOCK_SHELL" });
              reg.active?.postMessage({
                type: "CACHE_VISITED_ASSETS",
                urls: performance
                  .getEntriesByType("resource")
                  .map((r) => r.name),
              });
            })
            .catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  const present = useCallback(
    (id: string, onEnd?: () => void, thing?: string) => {
      try {
        const l: Spoken = {
          ...line(id, thing),
          seq: current.current?.events.length,
        };
        setSpoken(l);
        const rows = spokenLog.current;
        const next = rows.at(-1)?.id === l.id ? rows : [...rows.slice(-300), l];
        spokenLog.current = next;
        setTranscript(next);
        const active = current.current;
        if (active)
          try {
            localStorage.setItem(
              transcriptKey(active.ownerId, active.id),
              JSON.stringify(next),
            );
          } catch {
            /* Captions continue when storage is unavailable. */
          }
        audioRef.current.speak(l.text, l.speaker, false, onEnd);
      } catch (e) {
        setError(String(e));
      }
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;
    const seq = ++session.current;
    writing.current = false;
    setLoading(true);
    setError("");
    setReaction(null);
    setPreview(undefined);
    setPaused(false);
    setTranscript([]);
    spokenLog.current = [];
    if (!runId) {
      current.current = null;
      setRun(null);
      void listRuns(owner).then((rows) => {
        if (!cancelled) {
          setRuns(rows);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    void loadRun(runId, owner)
      .then((found) => {
        if (cancelled || session.current !== seq) return;
        current.current = found;
        setRun(found);
        if (!found)
          setError("This run is not in your workspace on this device.");
        else {
          let previous = initialState();
          const recovered: Spoken[] = [];
          for (const e of found.events) {
            const after = reduceEvent(previous, e);
            for (const r of reactionFor(e, previous, after))
              recovered.push(line(r.id, r.thing));
            previous = after;
          }
          let restored = recovered.slice(-300);
          try {
            const local = JSON.parse(
              localStorage.getItem(transcriptKey(owner, found.id)) || "null",
            );
            const parent =
              !local && found.parentId
                ? JSON.parse(
                    localStorage.getItem(
                      transcriptKey(owner, found.parentId),
                    ) || "null",
                  )
                : null;
            const candidate = local || parent;
            if (Array.isArray(candidate))
              restored = candidate
                .filter(
                  (row: Spoken) =>
                    typeof row.id === "string" &&
                    typeof row.text === "string" &&
                    typeof row.speaker === "string" &&
                    row.text.length <= 1000 &&
                    (row.seq || 0) <=
                      (parent ? found.forkSeq || 0 : found.events.length),
                )
                .slice(-300);
          } catch {
            /* A damaged optional transcript never invalidates the run. */
          }
          spokenLog.current = restored;
          setTranscript(restored);
          setSpoken(restored.at(-1) || line("CO-06"));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "The saved log could not be verified. Export it from the entry card before starting a new run.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [runId, owner]);
  useEffect(() => {
    if (!runId || loading || reaction || !run) return;
    const key = `${runId}:${state.scene}`;
    if (introduced.current.has(key)) return;
    introduced.current.add(key);
    const id =
      state.scene === "floor"
        ? "CO-06"
        : state.scene === "table"
          ? "T-INTRO"
          : state.scene === "forge"
            ? "F-INTRO"
            : undefined;
    if (id) present(id);
  }, [runId, loading, state.scene, reaction, run, present]);
  const dispatch = useCallback((action: Action) => {
    const beforeRun = current.current;
    if (!beforeRun || writing.current) return;
    try {
      const before = replay(beforeRun.events),
        next = append(beforeRun, action),
        after = replay(next.events);
      current.current = next;
      setRun(next);
      setPreview(undefined);
      writing.current = true;
      setBusy(true);
      const lines = reactionFor(next.events.at(-1)!, before, after);
      if (lines.length) {
        setReaction({ key: next.events.length, lines });
        audioRef.current.effect(
          has(after, "golden_cue") && !has(before, "golden_cue")
            ? "gold"
            : after.run.incidents > before.run.incidents
              ? "alarm"
              : "slam",
        );
      }
      const ticket = session.current;
      void persistRun(next, beforeRun.revision)
        .then((ok) => {
          if (ticket === session.current) setSaved(ok);
        })
        .catch((e) => {
          if (ticket !== session.current) return;
          current.current = beforeRun;
          setRun(beforeRun);
          setPaused(true);
          setError(
            e instanceof DeadlockConflict
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not save this event.",
          );
        })
        .finally(() => {
          if (ticket === session.current) {
            writing.current = false;
            setBusy(false);
          }
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "This action is unavailable.");
    }
  }, []);
  const start = async (mode: "sound" | "silent" | "listen") => {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    update({ mode });
    if (mode !== "silent") audio.unlock();
    try {
      const next = append(createRun(owner), { type: "START", mode });
      const ok = await persistRun(next);
      setSaved(ok);
      window.history.pushState(
        null,
        "",
        `/app/projects/deadlock/play/${next.id}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the run.");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!runId || loading) return;
    const frame = requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.scene, loading, runId]);
  useEffect(() => {
    if (!runId) return;
    const currentUrl = location.href;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        audioRef.current.speak(
          `Robotics resentment ${state.rob}. Software resentment ${state.sw}. Runway ${state.runway} weeks. Readiness ${state.ready}. Team alignment ${state.align}.`,
          "CONTROL",
          true,
        );
      }
      if (e.key === "Escape" && !document.querySelector('[role="dialog"]'))
        setPaused((p) => !p);
    };
    const back = () => {
      history.pushState(null, "", currentUrl);
      setPaused(true);
    };
    window.addEventListener("popstate", back);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", back);
    };
  }, [
    runId,
    state.rob,
    state.sw,
    state.runway,
    state.ready,
    state.align,
    caseOpen,
    settings,
    transcriptOpen,
  ]);
  useEffect(() => {
    if (runId) history.pushState(null, "", location.href);
  }, [runId]);
  useEffect(() => {
    if (!root.current) return;
    const tweens = gsap.getTweensOf(root.current.querySelectorAll("*"));
    for (const t of tweens) halt ? t.pause() : t.resume();
  }, [halt]);
  useEffect(() => {
    if (prefs.tier !== "auto") {
      setTier(prefs.tier);
      return;
    }
    let frame = 0,
      start = 0,
      last = 0;
    const intervals: number[] = [];
    const probe = (now: number) => {
      if (!start) {
        start = last = now;
      } else {
        intervals.push(now - last);
        last = now;
      }
      if (now - start < 1500) frame = requestAnimationFrame(probe);
      else {
        const sorted = intervals.sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] || 16.7;
        const memory =
          (navigator as Navigator & { deviceMemory?: number }).deviceMemory ||
          8;
        setTier(
          memory <= 2 || median > 45
            ? "C"
            : memory <= 4 || median > 24
              ? "B"
              : "A",
        );
      }
    };
    frame = requestAnimationFrame(probe);
    return () => cancelAnimationFrame(frame);
  }, [prefs.tier]);
  useEffect(() => {
    if (!runId || state.scene !== "debrief" || pathname.includes("/debrief/"))
      return;
    window.history.replaceState(
      null,
      "",
      `/app/projects/deadlock/debrief/${runId}`,
    );
  }, [state.scene, runId, pathname, router]);
  const sceneProps: SceneProps = {
    state,
    dispatch,
    busy,
    paused: halt || !!reaction,
    calm,
    caption: present,
    preview: setPreview,
  };
  const isEntry = !runId;
  return (
    <div
      ref={root}
      className={s.game}
      data-deadlock=""
      data-scene={state.scene}
      data-room={state.room}
      data-paused={halt}
      data-motion={reducedMotion || prefs.motion ? "reduced" : "full"}
      data-tier={tier}
      data-contrast={prefs.contrast}
      data-text={prefs.textSize}
      data-captions={prefs.captionSize}
    >
      <RoomPlate state={state} />
      {!saved && (
        <p role="alert" className={s.warning}>
          This device can’t save your run. It will be lost when you close the
          tab. Export a backup before leaving.
        </p>
      )}
      {error && (
        <div className={s.warning} role="alert">
          {error}{" "}
          <button className={s.linkButton} onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}
      {isEntry ? (
        <main id="main" className={s.entry}>
          <div className={s.entryTop}>
            <Link href="/app/projects">← PMForge / Projects</Link>
            <button className={s.button} onClick={() => setSettings(true)}>
              SETTINGS
            </button>
          </div>
          <div className={s.entryTitle}>
            <div>
              <p className={s.kicker}>HALYARD ROBOTICS · A SIMULATED PROJECT</p>
              <h1>
                The
                <br />
                <em>Deadlock.</em>
              </h1>
              <p className={s.entryTag}>{project.tagline}</p>
            </div>
            <div className={s.entryArt}>
              <Arm state={initialState()} />
            </div>
          </div>
          <div className={s.entryPlate}>
            <p className={s.kicker}>
              ABOUT 40 MINUTES · THREE CHAPTERS · PAUSE ANYWHERE
            </p>
            <div className={s.switches}>
              {(
                [
                  ["sound", "SOUND + CAPTIONS"],
                  ["silent", "SILENT + CAPTIONS"],
                  ["listen", "LISTEN MODE"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  className={s.switch}
                  disabled={busy}
                  autoFocus={mode === prefs.mode}
                  onClick={() => void start(mode)}
                >
                  {label}
                  {mode === "listen" && (
                    <small>Device narration · waits at every decision</small>
                  )}
                </button>
              ))}
            </div>
            <p className={s.muted} data-beat>
              Fictional company. Fictional people. Simulated numbers. Not safety
              advice. No typing required.
            </p>
          </div>
          {loading ? (
            <p>Opening the Case file…</p>
          ) : (
            <div className={s.resumeList}>
              {runs.map((r) => {
                let state: DeadlockState;
                try {
                  state = replay(r.events);
                } catch {
                  return null;
                }
                return (
                  <article key={r.id} className={s.resumeCard}>
                    <span className={s.kicker}>
                      {r.parentId ? "FORK" : "SAVED RUN"} ·{" "}
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                    <strong>{state.ending || state.scene.toUpperCase()}</strong>
                    <Link
                      prefetch={false}
                      href={`/app/projects/deadlock/${state.scene === "debrief" ? "debrief" : "play"}/${r.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(
                          null,
                          "",
                          `/app/projects/deadlock/${state.scene === "debrief" ? "debrief" : "play"}/${r.id}`,
                        );
                      }}
                    >
                      Continue on v1.0 →
                    </Link>
                    <div className={s.row}>
                      <button
                        className={s.linkButton}
                        onClick={() => downloadRun(r)}
                      >
                        Export
                      </button>
                      <button
                        className={s.linkButton}
                        onClick={() => {
                          if (window.confirm("Delete this local Deadlock run?"))
                            void deleteRun(r.id, owner).then(() =>
                              setRuns((rows) =>
                                rows.filter((x) => x.id !== r.id),
                              ),
                            );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        <>
          <header className={s.topbar}>
            <button className={s.button} onClick={() => setCaseOpen(true)}>
              ▤ CASE FILE
            </button>
            <div className={s.brand}>
              THE DEADLOCK
              <small title="Fictional company and people; all numbers are simulated.">
                SIMULATED · v1.0
              </small>
            </div>
            <button className={s.button} onClick={() => setPaused(true)}>
              PAUSE
            </button>
            <button className={s.button} onClick={() => setExit(true)}>
              EXIT
            </button>
          </header>
          {loading ? (
            <main className={s.scene}>
              <p>Restoring the room from its event log…</p>
            </main>
          ) : !run ? (
            <main className={s.scene}>
              <h2>The Case file isn’t here.</h2>
              <Link className={s.brassButton} href="/app/projects/deadlock">
                BACK TO THE DEADLOCK
              </Link>
            </main>
          ) : (
            <>
              <Instruments state={state} preview={preview} calm={calm} />
              <main
                id="main"
                inert={halt}
                ref={heading}
                tabIndex={-1}
                className={s.scene}
                aria-label={`${state.scene} simulation scene`}
              >
                {state.scene === "floor" ? (
                  <FloorWalk {...sceneProps} />
                ) : state.scene === "table" ? (
                  <DecisionTable {...sceneProps} />
                ) : state.scene === "data" ? (
                  <DataRoom {...sceneProps} />
                ) : state.scene === "forge" ? (
                  <Forge {...sceneProps} />
                ) : state.scene === "run" ? (
                  <FirstRun {...sceneProps} />
                ) : state.scene === "debrief" ? (
                  <Debrief run={run} state={state} onError={setError} />
                ) : (
                  <Cinematic
                    key={state.scene}
                    {...sceneProps}
                    listen={
                      prefs.mode === "listen" &&
                      audio.voices.length > 0 &&
                      prefs.voice !== "off"
                    }
                  />
                )}
              </main>
              <footer className={s.caption} aria-label="Captions">
                <div
                  className={s.player}
                  aria-label={`Your credibility ${state.cred} of 100`}
                >
                  {state.cred}
                </div>
                <div
                  className={s.captionBody}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <strong>{spoken?.speaker || "CONTROL"}</strong>
                  <p>{spoken?.text || "The room is waiting for you."}</p>
                </div>
                <button
                  className={s.button}
                  aria-label="Replay caption"
                  onClick={() =>
                    spoken && audio.speak(spoken.text, spoken.speaker, true)
                  }
                >
                  ↻
                </button>
                <span className={s.saveChip}>
                  {busy ? "SAVING…" : saved ? "ON THIS DEVICE" : "MEMORY ONLY"}
                </span>
              </footer>
              {reaction && (
                <Reaction
                  key={reaction.key}
                  lines={reaction.lines}
                  paused={halt}
                  present={present}
                  onDone={() => setReaction(null)}
                />
              )}
            </>
          )}
        </>
      )}
      <Dialog
        open={caseOpen}
        onClose={() => setCaseOpen(false)}
        title="Case file"
        size="lg"
      >
        <div className={s.game} style={{ padding: 22, minHeight: 0 }}>
          <p className={s.muted} style={{ marginBottom: 20 }}>
            Twelve weeks. Full autonomy. Documented overrides. Both required.
          </p>
          <div className={s.caseCards}>
            {objects.map((o) => (
              <article
                className={s.caseCard}
                key={o.id}
                data-unseen={!state.inspected.includes(o.id)}
              >
                <h3>
                  {o.id} · {o.title}
                </h3>
                <p>
                  {state.inspected.includes(o.id)
                    ? o.card
                    : state.inspecting === o.id
                      ? "OPEN · inspection in progress"
                      : "UNSEEN · you could have opened this object"}
                </p>
              </article>
            ))}
          </div>
          <div className={s.row} style={{ marginTop: 20 }}>
            <button
              className={s.button}
              onClick={() => {
                setCaseOpen(false);
                setIntroReplay(true);
              }}
            >
              REPLAY INTRO
            </button>
            <button
              className={s.button}
              onClick={() => {
                setCaseOpen(false);
                setTranscriptOpen(true);
              }}
            >
              TRANSCRIPT
            </button>
            {run && (
              <button className={s.button} onClick={() => downloadRun(run)}>
                EXPORT RUN
              </button>
            )}
          </div>
        </div>
      </Dialog>
      <Dialog
        open={settings}
        onClose={() => setSettings(false)}
        title="Boiler room controls"
        size="lg"
      >
        <div className={`${s.game} ${s.settings}`} style={{ minHeight: 0 }}>
          <label>
            Listening mode
            <select
              value={prefs.mode}
              onChange={(e) => {
                update({ mode: e.target.value as typeof prefs.mode });
                if (e.target.value !== "silent") audio.unlock();
              }}
            >
              <option value="silent">Silent + captions</option>
              <option value="sound">Sound + captions</option>
              <option value="listen">Listen mode</option>
            </select>
          </label>
          <label>
            Device voice
            <select
              value={prefs.voice}
              onChange={(e) => update({ voice: e.target.value })}
            >
              <option value="device">Automatic device voice</option>
              {audio.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                </option>
              ))}
              <option value="off">Text only</option>
            </select>
          </label>
          <p className={s.muted} data-beat>
            Uses your device’s installed voices. Studio voice recordings are not
            included in this prototype. Captions always remain available.
          </p>
          <label>
            Character voices
            <input
              type="checkbox"
              checked={prefs.characters}
              onChange={(e) => update({ characters: e.target.checked })}
            />
          </label>
          <label>
            Playback speed
            <input
              aria-label="Playback speed"
              type="range"
              min=".8"
              max="1.4"
              step=".1"
              value={prefs.rate}
              onChange={(e) => update({ rate: Number(e.target.value) })}
            />
            {prefs.rate.toFixed(1)}×
          </label>
          {(["narration", "effects", "music"] as const).map((k) => (
            <label key={k}>
              {k.toUpperCase()}
              <input
                aria-label={`${k} volume`}
                type="range"
                min="0"
                max="1"
                step=".05"
                value={prefs[k]}
                onChange={(e) => update({ [k]: Number(e.target.value) })}
              />
            </label>
          ))}
          {(
            [
              ["calm", "Calm FX"],
              ["motion", "Reduced motion"],
              ["contrast", "High contrast"],
              ["haptics", "Haptics (supported devices)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => update({ [key]: e.target.checked })}
              />
            </label>
          ))}
          <label>
            Caption size
            <select
              value={prefs.captionSize}
              onChange={(e) =>
                update({ captionSize: e.target.value as "normal" | "large" })
              }
            >
              <option value="normal">Normal · 17px</option>
              <option value="large">Large · 21px</option>
            </select>
          </label>
          <label>
            Text size
            <select
              value={prefs.textSize}
              onChange={(e) =>
                update({ textSize: e.target.value as "normal" | "large" })
              }
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Effects tier
            <select
              value={prefs.tier}
              onChange={(e) =>
                update({ tier: e.target.value as typeof prefs.tier })
              }
            >
              <option value="auto">Auto · {tier}</option>
              <option value="A">A · Full</option>
              <option value="B">B · Calm room</option>
              <option value="C">C · Static room</option>
            </select>
          </label>
          <button
            className={s.brassButton}
            onClick={() => {
              audio.unlock();
              audio.speak(
                "Twelve weeks. Two teams. One prototype.",
                "CONTROL",
                true,
              );
            }}
          >
            TEST DEVICE VOICE
          </button>
        </div>
      </Dialog>
      <Dialog
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
        title="Transcript"
      >
        <div className={s.transcript}>
          {transcript.length ? (
            transcript.map((l, i) => (
              <article key={`${l.id}-${i}`}>
                <b>{l.speaker}</b>
                <p>{l.text}</p>
              </article>
            ))
          ) : (
            <p>No lines yet.</p>
          )}
        </div>
      </Dialog>
      <Dialog
        open={paused || exit}
        onClose={() => {
          setPaused(false);
          setExit(false);
        }}
        title={exit ? "Pause or leave?" : "The room can wait."}
      >
        <div className={`${s.game} ${s.pausePanel}`} style={{ minHeight: 0 }}>
          <p>
            Your event log is{" "}
            {saved
              ? "saved on this device."
              : "in memory. Export before leaving."}
          </p>
          <button
            className={s.brassButton}
            onClick={() => {
              setPaused(false);
              setExit(false);
            }}
          >
            RESUME
          </button>
          <button
            className={s.button}
            onClick={() => {
              setPaused(false);
              setExit(false);
              setSettings(true);
            }}
          >
            SETTINGS
          </button>
          {run && (
            <button className={s.button} onClick={() => downloadRun(run)}>
              EXPORT BACKUP
            </button>
          )}
          <Link
            className={s.button}
            href="/app/projects/deadlock"
            prefetch={false}
            onClick={(e) => {
              e.preventDefault();
              setPaused(false);
              setExit(false);
              window.history.pushState(null, "", "/app/projects/deadlock");
            }}
          >
            SAVE & LEAVE THE ROOM
          </Link>
        </div>
      </Dialog>
      <Dialog
        open={introReplay}
        onClose={() => setIntroReplay(false)}
        title="Replay intro"
        size="lg"
      >
        <div className={s.game} style={{ padding: 20 }}>
          <Cinematic
            {...sceneProps}
            paused={!visible}
            previewIntro
            onIntroEnd={() => setIntroReplay(false)}
          />
        </div>
      </Dialog>
    </div>
  );
}
function Reaction({
  lines,
  paused,
  present,
  onDone,
}: {
  lines: { id: string; thing?: string }[];
  paused: boolean;
  present: (id: string, onEnd?: () => void, thing?: string) => void;
  onDone: () => void;
}) {
  const elapsed = useClock(Math.max(1800, lines.length * 1900), paused, onDone),
    index = Math.max(0, Math.min(lines.length - 1, Math.floor(elapsed / 1900)));
  const current = lines[index];
  useEffect(() => {
    present(current.id, undefined, current.thing);
  }, [current.id, current.thing]);
  const l = line(current.id, current.thing);
  return (
    <aside className={s.reaction} aria-label="Authored reaction">
      <div className={s.speech}>
        <b>{l.speaker}</b>
        <p>{l.text}</p>
      </div>
      <button className={s.button} onClick={onDone}>
        SKIP REACTION →
      </button>
    </aside>
  );
}
