"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  board,
  line,
  objects,
  project,
  experience,
} from "@/lib/deadlock/content";
import {
  append,
  createRun,
  forkRun,
  has,
  initialState,
  reduceEvent,
  replay,
} from "@/lib/deadlock/engine";
import { reactionFor } from "@/lib/deadlock/reactions";
import { selectReaction } from "@/lib/deadlock/dialogue";
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
import { Conversation } from "./Conversation";
import { Guide, StepStrip, ReviewCard } from "./Coaching";
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
  const { prefs, update, ready: preferencesReady } = usePreferences(),
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
  const [voiceRevision, setVoiceRevision] = useState(0);
  const [casePrompt, setCasePrompt] = useState("");
  const casePromptSeen = useRef(new Set<string>());
  const [guide, setGuide] = useState<keyof typeof experience.guides | null>(
      null,
    ),
    [review, setReview] = useState<number | null>(null);
  const guidesSeen = useRef(new Set<string>());
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
    introReplay ||
    !!guide;
  const calm =
    reducedMotion ||
    prefs.motion ||
    prefs.calm ||
    prefs.tier === "C" ||
    tier === "C";
  const audio = useAudio(
    prefs,
    halt && !introReplay && !guide,
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
    (id: string, onEnd?: (played?: boolean) => void, thing?: string) => {
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
        audioRef.current.speak(l.text, l.speaker, false, onEnd, id);
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
    setCasePrompt("");
    setGuide(null);
    setReview(null);
    audioRef.current.stop();
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
      let lines = reactionFor(next.events.at(-1)!, before, after);
      if (action.type === "INSPECT")
        lines = [{ id: experience.evidence[action.card].line }];
      if (action.type === "INSPECT")
        setCasePrompt(
          "New evidence saved. Open your case file to review the discovery.",
        );
      lines = lines.map((response) => {
        if (
          response.id === "T-EV-NONE" &&
          (action.type === "SOCKET" || action.type === "ATTACH")
        )
          return {
            id: selectReaction(
              experience.evidencePrompts[action.lane],
              spokenLog.current.at(-1)?.id,
            ),
          };
        if (!/^T-EV-(SUP|NEU|CON)/.test(response.id)) return response;
        const who = line(response.id).speaker;
        const pool = response.id.includes("-SUP-")
          ? experience.match[who as "Dev" | "Ines" | "Mara"]
          : experience.mismatch[who === "Dev" ? "Dev" : "Ines"];
        return { id: selectReaction(pool, spokenLog.current.at(-1)?.id) };
      });
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
  useEffect(() => {
    if (
      !preferencesReady ||
      !runId ||
      loading ||
      !run ||
      reaction ||
      review ||
      prefs.skipGuides
    )
      return;
    const key = runId + ":" + state.scene;
    if (!(state.scene in experience.guides) || guidesSeen.current.has(key))
      return;
    guidesSeen.current.add(key);
    setGuide(state.scene as keyof typeof experience.guides);
  }, [
    preferencesReady,
    runId,
    loading,
    run,
    state.scene,
    reaction,
    review,
    prefs.skipGuides,
  ]);
  const closeGuide = () => {
    audioRef.current.stop();
    setGuide(null);
    setVoiceRevision((n) => n + 1);
  };
  useEffect(() => {
    if (!runId || !["table", "forge"].includes(state.scene)) return;
    const key = runId + ":" + state.scene;
    if (casePromptSeen.current.has(key)) return;
    casePromptSeen.current.add(key);
    setCasePrompt(
      "Your case file holds the evidence you collected. Use it to support this decision.",
    );
  }, [runId, state.scene]);
  const advance = (action: Action) => {
    if (
      action.type === "ACK_SCENE" &&
      ["consequence1", "consequence2"].includes(action.scene)
    ) {
      audioRef.current.stop();
      setReaction(null);
      setReview(
        action.scene === "consequence1"
          ? 1
          : action.scene === "consequence2"
            ? 2
            : 3,
      );
      return;
    }
    dispatch(action);
  };
  const replayChapter = async (chapter: number) => {
    if (!run) return;
    try {
      const marker = ["intro", "consequence1", "consequence2"][chapter - 1];
      const index = run.events.findIndex(
        (e) => e.type === "ACK_SCENE" && e.scene === marker,
      );
      const branch = forkRun(run, Math.max(1, index + 1), owner);
      await persistRun(branch);
      window.history.pushState(
        null,
        "",
        "/app/projects/deadlock/play/" + branch.id,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not replay this chapter.",
      );
    }
  };
  const start = async (mode: "sound" | "silent" | "listen") => {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    update({ mode });
    if (mode !== "silent") audio.unlock();
    try {
      const next = append(createRun(owner), {
        type: "START",
        mode,
        experienceVersion: 2,
      });
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
    dispatch: advance,
    busy: busy || !!reaction || !!guide,
    paused: halt || !!reaction,
    autoAdvance: prefs.autoAdvance,
    voiceRevision,
    sound: prefs.mode !== "silent",
    toggleSound: () => {
      audio.unlock();
      update({ mode: prefs.mode === "silent" ? "sound" : "silent" });
    },
    calm,
    caption: present,
    preview: setPreview,
  };
  const isEntry = !runId;
  const activeCasePrompt = ["ending", "debrief"].includes(state.scene)
    ? ""
    : casePrompt;
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
              THREE CHAPTERS · YOUR PACE · SAVES AFTER EVERY DECISION
            </p>
            <div className={s.switches}>
              {(
                [
                  ["silent", "Captions only"],
                  ["sound", "Sound + captions"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  className={s.switch}
                  disabled={busy}
                  aria-pressed={mode === prefs.mode}
                  onClick={() => update({ mode })}
                >
                  {label}
                  <small>
                    {mode === prefs.mode
                      ? "Selected"
                      : mode === "silent"
                        ? "Read at your own pace"
                        : "Hear the pre-recorded cast"}
                  </small>
                </button>
              ))}
            </div>
            <button
              className={s.brassButton}
              data-enter-lab=""
              autoFocus
              disabled={busy}
              onClick={() =>
                void start(prefs.mode === "listen" ? "sound" : prefs.mode)
              }
            >
              Enter the lab →
            </button>
            <p className={s.muted} data-beat>
              Step into a robotics team’s hardest decision. Meet the people,
              investigate the evidence, and shape what they build.
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
                      Continue this run →
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
            <button
              className={`${s.button} ${activeCasePrompt ? s.caseFileNudge : ""}`}
              data-evidence-cue={!!activeCasePrompt}
              title={
                activeCasePrompt || "Review your evidence and case briefing"
              }
              onClick={() => {
                setCasePrompt("");
                setCaseOpen(true);
              }}
            >
              ▤ CASE FILE
            </button>
            <div className={s.brand}>
              THE DEADLOCK
              <small title="Fictional company and people; all numbers are simulated.">
                SIMULATED · v2
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
              <div className={s.orientation}>
                <StepStrip
                  scene={state.scene}
                  evidenceHint={activeCasePrompt}
                  onGuide={() =>
                    setGuide(
                      (state.scene in experience.guides
                        ? state.scene
                        : "floor") as keyof typeof experience.guides,
                    )
                  }
                />
                {state.scene !== "debrief" && (
                  <Instruments state={state} preview={preview} calm={calm} />
                )}
              </div>
              <main
                id="main"
                inert={halt}
                ref={heading}
                tabIndex={-1}
                className={s.scene}
                aria-label={`${state.scene} simulation scene`}
              >
                {review ? (
                  <ReviewCard
                    state={state}
                    chapter={review}
                    busy={busy}
                    onContinue={() => {
                      const scene = state.scene;
                      setReview(null);
                      dispatch({ type: "ACK_SCENE", scene });
                    }}
                    onReplay={() => void replayChapter(review)}
                  />
                ) : state.scene === "floor" ? (
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
                  <Cinematic key={state.scene} {...sceneProps} />
                )}
              </main>
              <footer className={s.caption} aria-label="Run status">
                <div
                  className={s.player}
                  aria-label={"Your credibility " + state.cred + " of 100"}
                >
                  {state.cred}
                </div>
                <span className={s.muted}>
                  Credibility · decisions leave a trace
                </span>
                <span className={s.audioStatus} role="status">
                  {audio.status}
                </span>
                <button
                  className={s.linkButton}
                  onClick={() => setTranscriptOpen(true)}
                >
                  Conversation log
                </button>
                <span className={s.saveChip}>
                  {busy
                    ? "Saving…"
                    : saved
                      ? "Saved on this device"
                      : "Memory only"}
                </span>
              </footer>
              {reaction && (
                <Reaction
                  key={reaction.key}
                  lines={reaction.lines}
                  paused={halt}
                  present={present}
                  autoAdvance={prefs.autoAdvance}
                  sound={prefs.mode !== "silent"}
                  toggleSound={() => {
                    audio.unlock();
                    update({
                      mode: prefs.mode === "silent" ? "sound" : "silent",
                    });
                  }}
                  onDone={() => {
                    audioRef.current.stop();
                    setReaction(null);
                  }}
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
          <section className={s.briefingSummary}>
            <h3>Your case briefing</h3>
            <p>
              You are the PM at Halyard Robotics. In twelve weeks, Northgate
              will watch TERN-1 sort a tray. Dev wants autonomy and speed; Ines
              needs reliable safeguards. Your job is to use evidence to agree a
              build the team can demonstrate.
            </p>
            <p>
              Northgate needs both autonomous operation and documented human
              overrides. You have three investigations, five persuasion points
              and three chances to step in.
            </p>
            <button
              className={s.button}
              onClick={() => {
                setCaseOpen(false);
                setIntroReplay(true);
              }}
            >
              Meet the team & replay briefing
            </button>
          </section>
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
        onClose={() => {
          audio.stop();
          setSettings(false);
          setVoiceRevision((n) => n + 1);
        }}
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
              <option value="silent">Captions only</option>
              <option value="sound">Sound + captions</option>
            </select>
          </label>
          <p className={s.muted}>
            Hear each character’s recorded dialogue. You control when the
            conversation moves on; captions are always available.
          </p>
          <label>
            Auto-advance after recording ends
            <input
              type="checkbox"
              checked={prefs.autoAdvance}
              onChange={(e) => update({ autoAdvance: e.target.checked })}
            />
          </label>
          <label>
            Skip automatic guides
            <input
              type="checkbox"
              checked={prefs.skipGuides}
              onChange={(e) => update({ skipGuides: e.target.checked })}
            />
          </label>
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
          <div className={s.row}>
            {(["Mara", "Dev", "Ines", "Theo", "Northgate"] as const).map(
              (speaker, i) => (
                <button
                  key={speaker}
                  className={s.button}
                  onClick={() => {
                    const id = [
                      "INT-01",
                      "INT-03",
                      "INT-05",
                      "EN-S1",
                      "LETTER-01",
                    ][i];
                    audio.unlock();
                    audio.speak(line(id).text, speaker, true, undefined, id);
                  }}
                >
                  Preview {speaker}
                </button>
              ),
            )}
          </div>
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
      {guide && (
        <Guide
          key={guide}
          {...sceneProps}
          paused={false}
          busy={false}
          guideKey={guide}
          onClose={closeGuide}
          skip={prefs.skipGuides}
          setSkip={(skip) => update({ skipGuides: skip })}
        />
      )}
    </div>
  );
}
function Reaction({
  lines,
  paused,
  present,
  onDone,
  autoAdvance,
  sound,
  toggleSound,
}: {
  lines: { id: string; thing?: string }[];
  paused: boolean;
  present: (
    id: string,
    onEnd?: (played?: boolean) => void,
    thing?: string,
  ) => void;
  onDone: () => void;
  autoAdvance: boolean;
  sound: boolean;
  toggleSound: () => void;
}) {
  return (
    <aside className={s.reaction} aria-label="Team response">
      <Conversation
        ids={lines.map((l) => l.id)}
        caption={present}
        paused={paused}
        autoAdvance={autoAdvance}
        sound={sound}
        toggleSound={toggleSound}
        onDone={onDone}
        finishLabel="Back to the decision →"
        title="Team response"
      />
    </aside>
  );
}
