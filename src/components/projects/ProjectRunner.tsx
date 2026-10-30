"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  LockKeyhole,
  Pause,
  Play,
  ChevronDown,
} from "lucide-react";
import { db, downloadFile, WriteConflict } from "@/lib/product/db";
import { getProject } from "@/lib/projects/content";
import {
  lockProjectDecision,
  nextProjectChapter,
  replayProject,
  projectArchetype,
  projectLogMarkdown,
  projectPracticeTarget,
  projectDecisionIssue,
} from "@/lib/projects/engine";
import { saveProjectRun } from "@/lib/projects/db";
import type { ProjectRun } from "@/lib/projects/types";
import { stakeholderSignal } from "@/lib/projects/presentation";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Dialog } from "@/components/ui/Dialog";
import { palette, toggleProjectBookmark } from "./ProjectViews";
import s from "./Projects.module.css";
import u from "@/components/product/Product.module.css";
const Entrance = dynamic(() => import("./Entrance"), { ssr: false });
export default function ProjectRunner({
  runId,
  projectId,
  debrief = false,
}: {
  runId: string;
  projectId?: string;
  debrief?: boolean;
}) {
  const { profile, sync } = useWorkspace();
  const { reducedMotion, playCue, vibrate } = useSettings();
  const router = useRouter();
  const [run, setRun] = useState<ProjectRun | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [confirm, setConfirm] = useState(false),
    [recap, setRecap] = useState(false),
    [exit, setExit] = useState(false),
    [ready, setReady] = useState(false),
    [savedAt, setSavedAt] = useState("");
  const [bookmarkStatus, setBookmarkStatus] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const [reviewChapter, setReviewChapter] = useState<number | null>(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const editVersion = useRef(0),
    transitioningRef = useRef(false);
  const current = useRef<ProjectRun | null>(null),
    loadVersion = useRef(0),
    revision = useRef(0),
    pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    persistRef = useRef<((r: ProjectRun) => Promise<boolean>) | null>(null),
    root = useRef<HTMLDivElement>(null),
    locked = useRef(false);
  const load = useCallback(async () => {
    if (!profile) return;
    const generation = ++loadVersion.current;
    setLoading(true);
    setRun(null);
    current.current = null;
    try {
      const r = await db.projectRuns.get(runId);
      if (generation !== loadVersion.current) return;
      if (
        !r ||
        r.ownerId !== profile.id ||
        (projectId && r.projectId !== projectId)
      )
        throw Error("This campaign is not in your workspace.");
      current.current = r;
      revision.current = r.revision;
      editVersion.current = 0;
      setSavedVersion(0);
      setRun(r);
      setError("");
      locked.current = false;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read the saved campaign.",
      );
    } finally {
      if (generation === loadVersion.current) setLoading(false);
    }
  }, [profile?.id, projectId, runId]);
  const persist = useCallback((candidate: ProjectRun): Promise<boolean> => {
    const version = editVersion.current;
    const op = queue.current.then(async () => {
      if (locked.current) return false;
      setSaving(true);
      try {
        const saved = await saveProjectRun(
          { ...candidate, revision: revision.current },
          revision.current,
        );
        revision.current = saved.revision;
        if (
          current.current?.id === candidate.id &&
          current.current.ownerId === candidate.ownerId
        ) {
          current.current = {
            ...current.current,
            revision: saved.revision,
            updatedAt: saved.updatedAt,
          };
          setRun(current.current);
          setSavedVersion(version);
        }
        setSavedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setError("");
        return true;
      } catch (e) {
        if (e instanceof WriteConflict) locked.current = true;
        setError(
          e instanceof Error
            ? e.message
            : "Saving failed. Stay here and retry before leaving.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    });
    queue.current = op;
    return op;
  }, []);
  persistRef.current = persist;
  useEffect(() => {
    void load();
    return () => {
      if (pending.current && current.current) {
        clearTimeout(pending.current);
        pending.current = undefined;
        void persistRef.current?.(current.current);
      }
    };
  }, [load]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden && current.current && !transitioningRef.current) {
        clearTimeout(pending.current);
        pending.current = undefined;
        void persistRef.current?.(current.current);
      }
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("beforeunload", unload);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  useEffect(() => {
    if (run?.phase !== "consequence") return;
    setReady(false);
    const timer = setTimeout(() => setReady(true), reducedMotion ? 100 : 1100);
    const ctx = gsap.context(() => {
      if (reducedMotion) return;
      gsap.fromTo(
        "[data-world-reaction]",
        { opacity: 0.2, y: 8 },
        { opacity: 1, y: 0, duration: 0.65 },
      );
      gsap.fromTo(
        "[data-state-fill]",
        { scaleX: 0.75 },
        {
          scaleX: 1,
          transformOrigin: "left",
          duration: 1.1,
          ease: "power2.out",
        },
      );
      if (run.decisions.at(-1)?.kind === "fracture")
        gsap.fromTo(
          "[data-fracture-reaction]",
          { opacity: 0 },
          { opacity: 0.3, duration: 0.8 },
        );
      if (run.decisions.at(-1)?.kind === "dim")
        gsap.fromTo(
          "[data-stakeholder]",
          { opacity: 0.35 },
          { opacity: 1, duration: 1.1, stagger: 0.04 },
        );
    }, root);
    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [run?.phase, run?.chapter, reducedMotion]);
  useEffect(() => {
    if (loading || !run || run.phase === "entrance") return;
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>(
        "[data-project-heading]",
      );
      heading?.focus({ preventScroll: true });
      if (heading) {
        const bounds = heading.getBoundingClientRect();
        const headerBottom = Math.max(
          16,
          root.current?.querySelector("header")?.getBoundingClientRect()
            .bottom || 0,
        );
        if (bounds.top < headerBottom || bounds.bottom > innerHeight)
          heading.scrollIntoView({ block: "start", behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [run?.phase, run?.chapter, run?.status, loading]);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>("[data-project-save-error]")
        ?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [error]);
  const update = (patch: Partial<ProjectRun>, immediate = false) => {
    if (!current.current || locked.current || transitioningRef.current) return;
    editVersion.current++;
    const next = { ...current.current, ...patch };
    current.current = next;
    setRun(next);
    clearTimeout(pending.current);
    pending.current = undefined;
    if (immediate) void persist(next);
    else
      pending.current = setTimeout(() => {
        pending.current = undefined;
        void persist(current.current!);
      }, 350);
  };
  const commit = async (next: ProjectRun) => {
    if (transitioningRef.current || locked.current) return false;
    transitioningRef.current = true;
    setTransitioning(true);
    editVersion.current++;
    clearTimeout(pending.current);
    pending.current = undefined;
    try {
      const saved = await persist(next);
      if (
        saved &&
        current.current?.id === next.id &&
        current.current.ownerId === next.ownerId
      ) {
        current.current = {
          ...next,
          revision: revision.current,
          updatedAt: current.current.updatedAt,
        };
        setRun(current.current);
      }
      return saved;
    } finally {
      transitioningRef.current = false;
      setTransitioning(false);
    }
  };
  if (loading)
    return (
      <div className={u.onboarding}>
        <p>Restoring the room and your commitments…</p>
      </div>
    );
  if (!run || run.ownerId !== profile?.id || !getProject(run.projectId))
    return (
      <div className={u.onboarding}>
        <h1 data-project-heading tabIndex={-1}>
          Campaign unavailable.
        </h1>
        <p role="alert">{error}</p>
        <Link href="/app/projects" className={u.primary}>
          Back to projects
        </Link>
      </div>
    );
  const p = getProject(run.projectId)!,
    ch = p.chapters[run.chapter - 1],
    last = run.decisions.at(-1),
    choice = ch.choices.find((c) => c.id === run.draft.choiceId),
    isComplete = run.phase === "debrief";
  const lockIssue = projectDecisionIssue(run);
  const fork = async (chapter: number) => {
    try {
      if (!(await persist(current.current!))) return;
      const next = await saveProjectRun(
        replayProject(current.current!, chapter),
        0,
      );
      router.push(`/app/projects/${p.id}/run/${next.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not create the alternate timeline.",
      );
    }
  };
  const confirmLock = async () => {
    try {
      const next = lockProjectDecision(current.current!);
      setConfirm(false);
      if (await commit(next)) {
        playCue("paper");
        vibrate(18);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not lock this choice.");
      setConfirm(false);
    }
  };
  const move = async () => {
    try {
      const next = nextProjectChapter(current.current!);
      if (await commit(next)) {
        window.scrollTo({ top: 0, behavior: "instant" });
        if (next.phase === "debrief")
          router.replace(`/app/projects/debrief/${run.id}`);
      }
    } catch (e) {
      setError(String(e));
    }
  };
  const exportLog = (format: "json" | "md") =>
    downloadFile(
      `${p.id}-decision-log.${format}`,
      format === "json"
        ? JSON.stringify(run, null, 2)
        : projectLogMarkdown(run),
      format === "json" ? "application/json" : "text/markdown",
    );
  if (isComplete)
    return (
      <div className={u.content} style={{ maxWidth: 1150 }}>
        <span className={u.eyebrow}>
          Project debrief / a laboratory, not a grade
        </span>
        <h1
          data-project-heading
          tabIndex={-1}
          style={{
            fontSize: "clamp(2.5rem,5vw,4.5rem)",
            lineHeight: 1.05,
            margin: "20px 0",
          }}
        >
          {p.title}: the room you left.
        </h1>
        <p className={u.lead}>{last?.reaction}</p>
        <span className={s.archetype}>{projectArchetype(run).label}</span>
        <p className={u.prose}>{projectArchetype(run).definition}</p>
        <p className={u.finePrint}>
          An authored description of your commitments, not a personality test or
          performance rating. All observations and state indices are simulated.{" "}
          {run.parentRunId
            ? "This is an alternate timeline; the original campaign is preserved."
            : "Your original timeline remains intact when you replay."}
        </p>
        {error && <p className={u.error}>{error}</p>}
        <div className={u.row} style={{ margin: "25px 0" }}>
          <button className={u.secondary} onClick={() => exportLog("json")}>
            Export decision log · JSON
          </button>
          <button className={u.secondary} onClick={() => exportLog("md")}>
            Export readable Markdown
          </button>
          <Link className={u.primary} href="/app/projects">
            Back to projects
          </Link>
        </div>
        {p.id === "last-mile" && (
          <section className={u.panel}>
            <h2>Three constituencies, three remaining responsibilities.</h2>
            {p.variables.slice(0, 3).map((v) => (
              <p key={v.id}>
                {v.label}: {run.state[v.id]} / 100 simulated index
              </p>
            ))}
            <p className={u.finePrint}>
              Service continuity and financial pressure do not cancel any of
              these obligations.
            </p>
          </section>
        )}
        {bookmarkStatus && (
          <p role="status" className={u.notice}>
            {bookmarkStatus}
          </p>
        )}
        <div className={s.trace}>
          {run.decisions.map((d) => (
            <details key={d.chapter} open>
              <summary>
                0{d.chapter} / {p.chapters[d.chapter - 1].title} — {d.label}
              </summary>
              <p>
                <strong>Decision →</strong> {d.label}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>State variable</th>
                    <th>Before</th>
                    <th>Change</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {p.variables.map((v) => (
                    <tr key={v.id}>
                      <td>{v.label}</td>
                      <td>{d.before[v.id]}</td>
                      <td>
                        {d.delta[v.id] >= 0 ? "+" : ""}
                        {d.delta[v.id]}
                      </td>
                      <td>{d.after[v.id]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>World reaction →</strong> {d.reaction}
              </p>
              <p>
                <strong>Later constraint →</strong> {d.constraint}
              </p>
              <p>
                <strong>Your rationale →</strong>{" "}
                {d.rationale || "No rationale recorded."}
              </p>
              <div className={u.row}>
                <button
                  className={u.secondary}
                  onClick={() => void fork(d.chapter)}
                  disabled={saving}
                >
                  Replay from chapter {d.chapter} · alternate preselected
                </button>
                <button
                  className={u.textButton}
                  onClick={() =>
                    profile &&
                    void toggleProjectBookmark(profile.id, p.id, d.chapter)
                      .then((saved) =>
                        setBookmarkStatus(
                          saved
                            ? "Decision point saved."
                            : "Decision point removed.",
                        ),
                      )
                      .catch(() =>
                        setError("Bookmark could not be saved. Retry."),
                      )
                  }
                >
                  Save this decision point
                </button>
              </div>
            </details>
          ))}
        </div>
        <section className={u.panel}>
          <h2>What lever would change the trajectory?</h2>
          {run.decisions.map((d) => (
            <p key={d.chapter}>
              <button
                className={u.textButton}
                onClick={() => void fork(d.chapter)}
              >
                {
                  p.chapters[d.chapter - 1].choices.find(
                    (c) => c.id !== d.choiceId,
                  )?.label
                }{" "}
                → chapter {d.chapter}
              </button>
            </p>
          ))}
          <p className={u.prose}>
            Practice the underlying reasoning in Interview Studio before
            returning to this battle.
          </p>
          <Link
            className={u.primary}
            href={`/app/practice?category=${projectPracticeTarget(run).category}&level=easy`}
          >
            Train {projectPracticeTarget(run).category} reasoning →
          </Link>
          <p className={u.finePrint}>{projectPracticeTarget(run).reason}</p>
        </section>
      </div>
    );
  if (debrief)
    return (
      <div className={u.onboarding}>
        <h1 data-project-heading tabIndex={-1}>
          This campaign is still in progress.
        </h1>
        <Link
          className={u.primary}
          href={`/app/projects/${p.id}/run/${run.id}`}
        >
          Resume chapter {run.chapter}
        </Link>
      </div>
    );
  return (
    <div ref={root} className={s.campaign} style={palette(p)}>
      {run.phase === "entrance" && !run.entranceSeen && (
        <Entrance
          project={p}
          onDone={() => {
            update({ phase: "decision", entranceSeen: true }, true);
          }}
        />
      )}
      <header className={s.focusHeader}>
        <Link
          href={`/app/projects/${p.id}`}
          aria-disabled={transitioning}
          onClick={(event) => {
            if (transitioningRef.current) {
              event.preventDefault();
              return;
            }
            if (current.current) void persist(current.current);
          }}
        >
          <strong>PMForge / {p.title}</strong>
          <small>
            Campaign v1 · Chapter {run.chapter} of 3
            {run.parentRunId ? " · alternate timeline" : ""}
          </small>
        </Link>
        <div className={s.headerActions}>
          <span
            className={s.syncLabel}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {locked.current
              ? "Save conflict · recovery needed"
              : error && editVersion.current > savedVersion
                ? "Not saved · retry"
                : saving
                  ? "Saving…"
                  : editVersion.current > savedVersion
                    ? "Unsaved changes"
                    : savedAt
                      ? `Saved ${savedAt}`
                      : "Saved on this device"}{" "}
            · {profile?.identity === "member" ? sync : "guest / local"}
          </span>
          <button
            className={`${s.caseButton} ${s.caseSecondary}`}
            disabled={transitioning}
            onClick={() =>
              update(
                { status: run.status === "paused" ? "active" : "paused" },
                true,
              )
            }
          >
            {run.status === "paused" ? <Play size={13} /> : <Pause size={13} />}{" "}
            {run.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            className={`${s.caseButton} ${s.caseSecondary}`}
            disabled={transitioning}
            onClick={() => setExit(true)}
          >
            Exit
          </button>
        </div>
      </header>
      <nav className={s.chapterRail} aria-label="Campaign chapters">
        {p.chapters.map((chapter, i) => {
          const number = i + 1,
            done = run.decisions.some((d) => d.chapter === number),
            active = run.chapter === number;
          return (
            <div key={chapter.title} data-current={active} data-complete={done}>
              {done || active ? (
                <button
                  disabled={transitioning}
                  aria-current={active ? "step" : undefined}
                  aria-label={
                    done
                      ? `Review chapter ${number}: ${chapter.title}`
                      : `Current chapter ${number}: ${chapter.title}`
                  }
                  onClick={() => {
                    if (done) {
                      setReviewChapter(number);
                      setRecap(true);
                    } else {
                      document
                        .querySelector<HTMLElement>("[data-project-heading]")
                        ?.focus();
                    }
                  }}
                >
                  <span>
                    {done ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      String(number).padStart(2, "0")
                    )}
                  </span>
                  <span>
                    <strong>{chapter.title}</strong>
                    <small>
                      {active ? "Current chapter" : "Review commitment"}
                    </small>
                  </span>
                </button>
              ) : (
                <span className={s.futureChapter} aria-disabled="true">
                  <LockKeyhole size={13} aria-hidden="true" />
                  <span>
                    <strong>{chapter.title}</strong>
                    <small>Chapter {number} · locked</small>
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </nav>
      <div className={s.stakes}>
        <span>
          {ch.title} · {p.skill}
        </span>
        <span>No forced timer · your tradeoffs set the pace</span>
      </div>
      {bookmarkStatus && (
        <p role="status" className={s.carry}>
          {bookmarkStatus}
        </p>
      )}
      <div className={s.campaignGrid}>
        <aside className={s.stateDesk} data-expanded={stateOpen}>
          <h2>The operating state</h2>
          <button
            className={s.stateToggle}
            aria-expanded={stateOpen}
            aria-controls="project-state-meters"
            onClick={() => setStateOpen((value) => !value)}
          >
            Operating state <ChevronDown size={15} aria-hidden="true" />
          </button>
          <p className={s.statePeek}>
            {p.variables
              .slice(0, 2)
              .map(
                (v) =>
                  `${v.label} ${run.state[v.id]}${v.unit === "weeks" ? "w" : ""}`,
              )
              .join(" · ")}
          </p>
          <div className={s.meterGrid} id="project-state-meters">
            {p.variables.map((v) => (
              <div className={s.meter} key={v.id}>
                <div className={s.meterLabel}>
                  <span>{v.label}</span>
                  <strong>
                    {run.state[v.id]}
                    {v.unit === "weeks" ? "w" : ""}
                  </strong>
                </div>
                <div
                  className={s.meterTrack}
                  role="meter"
                  aria-label={v.label}
                  aria-valuenow={run.state[v.id]}
                  aria-valuemin={0}
                  aria-valuemax={v.max}
                >
                  <i
                    style={{
                      width: `${((last?.before[v.id] ?? run.state[v.id]) / v.max) * 100}%`,
                    }}
                  />
                  <span
                    data-state-fill
                    style={{ width: `${(run.state[v.id] / v.max) * 100}%` }}
                  />
                </div>
                <small>
                  {v.bad
                    ? "Higher means more pressure"
                    : "Higher means more capacity"}{" "}
                  · simulated {v.unit}
                </small>
              </div>
            ))}
          </div>
          <button
            className={`${s.caseButton} ${s.caseSecondary}`}
            disabled={transitioning}
            onClick={() => {
              setReviewChapter(null);
              setRecap(true);
            }}
          >
            Recap so far
          </button>
          <p className={s.fine}>
            Every movement comes from a locked choice or an explicit carry rule.
            No hidden random events.
          </p>
        </aside>
        <section className={s.decisionDesk}>
          {error && (
            <div
              className={s.error}
              role="alert"
              tabIndex={-1}
              data-project-save-error
            >
              <p>{error}</p>
              <button
                className={`${s.caseButton} ${s.caseSecondary}`}
                onClick={() => exportLog("json")}
              >
                Export screen recovery copy
              </button>
              <button
                className={`${s.caseButton} ${s.caseSecondary}`}
                onClick={() => void load()}
              >
                Reload latest saved version
              </button>
              {!locked.current && (
                <button
                  className={s.caseButton}
                  onClick={() => void persist(current.current!)}
                >
                  Retry save
                </button>
              )}
            </div>
          )}
          {run.status === "paused" ? (
            <>
              <span className={s.eyebrow}>The room can wait.</span>
              <h1 data-project-heading tabIndex={-1}>
                Your commitments are held.
              </h1>
              <p className={s.brief}>
                The state is frozen. Come back to this exact chapter and
                decision surface.
              </p>
              <button
                className={s.caseButton}
                onClick={() => update({ status: "active" }, true)}
              >
                Resume the campaign
              </button>
            </>
          ) : run.phase === "consequence" && last ? (
            <>
              <span className={s.eyebrow}>
                Decision locked / consequence {run.chapter}
              </span>
              <h1 data-project-heading tabIndex={-1}>
                The world answers.
              </h1>
              <div className={s.reaction} data-world-reaction>
                <svg
                  className={s.fracture}
                  data-fracture-reaction
                  aria-hidden="true"
                  viewBox="0 0 800 300"
                >
                  <path
                    d={
                      last.kind === "fracture"
                        ? "M400 0l-35 70 80 40-110 60 100 30-65 100M335 170l-150-40-80 50M435 200l180-100 110 50"
                        : "M0 250C150 220 200 250 300 160S500 200 800 40"
                    }
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                  />
                </svg>
                <h2>
                  {last.kind === "fracture"
                    ? "The fault line is visible."
                    : last.kind === "dim"
                      ? "The room changes its posture."
                      : last.kind === "surge"
                        ? "Momentum carries a cost."
                        : last.kind === "fog"
                          ? "The ambiguity stays with you."
                          : "A boundary holds."}
                </h2>
                <p>{last.reaction}</p>
                <div className={s.deltas}>
                  {p.variables.map((v) => (
                    <span className={s.delta} key={v.id}>
                      {v.label} {last.delta[v.id] >= 0 ? "+" : ""}
                      {last.delta[v.id]}
                    </span>
                  ))}
                </div>
              </div>
              <div className={s.carry}>
                <strong>The next room inherits this:</strong>
                <br />
                {last.constraint}
              </div>
              <button
                className={s.caseButton}
                onClick={() => void move()}
                disabled={!ready || saving || !!error}
              >
                {run.chapter === 3
                  ? "Open the debrief laboratory"
                  : "Continue to chapter " + (run.chapter + 1)}{" "}
                →
              </button>
              <p className={s.fine}>
                Your choice is immutable in this timeline. Pause here, or branch
                from the recap without deleting it.
              </p>
            </>
          ) : run.phase === "entrance" ? (
            <section aria-busy="true" aria-live="polite">
              <h1>Entering {p.title}.</h1>
              <p className={s.brief}>
                Preparing the room and its first decision.
              </p>
            </section>
          ) : (
            <fieldset className={s.decisionFields} disabled={transitioning}>
              <span className={s.eyebrow}>
                Chapter 0{run.chapter} / {ch.pattern} decision
              </span>
              <h1 data-project-heading tabIndex={-1}>
                {ch.title}
              </h1>
              <p className={s.brief}>{ch.brief}</p>
              {last && (
                <div className={s.carry}>
                  <strong>Carried from chapter {last.chapter}:</strong>
                  <br />
                  {last.constraint}
                </div>
              )}
              <div className={s.evidence}>
                {ch.evidence.map((e, i) => (
                  <details
                    key={`${run.chapter}:${i}`}
                    onToggle={(event) => {
                      if (
                        event.currentTarget.open &&
                        !current.current!.draft.evidence.includes(String(i))
                      )
                        update({
                          draft: {
                            ...current.current!.draft,
                            evidence: [
                              ...current.current!.draft.evidence,
                              String(i),
                            ],
                          },
                        });
                    }}
                  >
                    <summary>
                      {run.draft.evidence.includes(String(i)) ? "✓" : "+"}{" "}
                      {e.source}
                    </summary>
                    <p>{e.text}</p>
                    <small>SIMULATED · {e.confidence}</small>
                  </details>
                ))}
              </div>
              {ch.pattern === "rank" && (
                <section aria-label="Rank evidence">
                  <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>
                    What will you act on first?
                  </h2>
                  {(run.draft.ranking.length
                    ? run.draft.ranking
                    : ["0", "1", "2"]
                  ).map((id, i, list) => (
                    <div className={s.rank} key={id}>
                      <span>
                        {i + 1}. {ch.evidence[Number(id)].source}
                      </span>
                      <div>
                        <button
                          aria-label={`Move evidence ${id} up`}
                          disabled={i === 0}
                          onClick={() => {
                            const copy = [...list];
                            [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                            update({ draft: { ...run.draft, ranking: copy } });
                          }}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          aria-label={`Move evidence ${id} down`}
                          disabled={i === list.length - 1}
                          onClick={() => {
                            const copy = [...list];
                            [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                            update({ draft: { ...run.draft, ranking: copy } });
                          }}
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className={`${s.caseButton} ${s.caseSecondary}`}
                    onClick={() =>
                      update({
                        draft: {
                          ...run.draft,
                          ranking: run.draft.ranking.length
                            ? run.draft.ranking
                            : ["0", "1", "2"],
                        },
                      })
                    }
                  >
                    Use this evidence order
                  </button>
                </section>
              )}
              <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>
                Which commitment will you own?
              </h2>
              <div
                className={s.choices}
                role="group"
                aria-label="Project decision choices"
              >
                {ch.choices.map((c, i) => (
                  <button
                    key={c.id}
                    className={s.choice}
                    aria-pressed={run.draft.choiceId === c.id}
                    onClick={() =>
                      update({ draft: { ...run.draft, choiceId: c.id } })
                    }
                  >
                    <span className={s.choiceNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{c.label}</strong>
                      <small>{c.cost}</small>
                    </span>
                    {run.draft.choiceId === c.id && <Check size={18} />}
                  </button>
                ))}
              </div>
              <label className={s.notes}>
                What makes this tradeoff defensible? What would change your
                mind? (optional)
                <textarea
                  maxLength={20000}
                  value={run.draft.rationale}
                  onChange={(e) =>
                    update({
                      draft: { ...run.draft, rationale: e.target.value },
                    })
                  }
                />
              </label>
              <label className={s.notesCheck}>
                <input
                  type="checkbox"
                  checked={run.includeNotes}
                  onChange={(e) => update({ includeNotes: e.target.checked })}
                />
                Include my free-form rationale in account sync. Off by default;
                structured decisions always sync for configured accounts.
              </label>
              <ul className={s.lockChecklist} aria-label="Decision readiness">
                <li data-ready={run.draft.evidence.length > 0}>
                  {run.draft.evidence.length > 0 ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">○</span>
                  )}{" "}
                  Evidence opened {run.draft.evidence.length} of{" "}
                  {ch.evidence.length}
                </li>
                <li data-ready={!!choice}>
                  {choice ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">○</span>
                  )}{" "}
                  {choice ? "Direction selected" : "Choose a direction"}
                </li>
                {ch.pattern === "rank" && (
                  <li
                    data-ready={run.draft.ranking.length === ch.evidence.length}
                  >
                    {run.draft.ranking.length === ch.evidence.length ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">○</span>
                    )}{" "}
                    Evidence order{" "}
                    {run.draft.ranking.length === ch.evidence.length
                      ? "confirmed"
                      : "needs confirmation"}
                  </li>
                )}
              </ul>
              <p
                id="project-lock-requirements"
                className={s.readinessHint}
                role="status"
              >
                {lockIssue ||
                  "Ready to review. You will confirm the known cost before locking."}
              </p>
              <div className={s.lockRow}>
                <button
                  className={`${s.caseButton} ${s.caseSecondary}`}
                  onClick={() =>
                    profile &&
                    void toggleProjectBookmark(profile.id, p.id, run.chapter)
                      .then((saved) =>
                        setBookmarkStatus(
                          saved
                            ? "Decision point saved."
                            : "Decision point removed.",
                        ),
                      )
                      .catch(() =>
                        setError("Bookmark could not be saved. Retry."),
                      )
                  }
                >
                  <Bookmark size={14} />
                  Save decision point
                </button>
                <button
                  className={s.caseButton}
                  onClick={() => setConfirm(true)}
                  aria-describedby="project-lock-requirements"
                  disabled={!!lockIssue || saving || transitioning || !!error}
                >
                  <LockKeyhole size={14} />
                  Review & lock decision
                </button>
              </div>
              <p className={s.fine}>
                Inspect an evidence source before locking. The confirmation
                names the known cost; consequences can be replayed in a separate
                timeline.
              </p>
            </fieldset>
          )}
        </section>
        <aside className={s.stakeholders}>
          <h2>The people who inherit your call</h2>
          {p.variables
            .filter((v) =>
              /trust|loyalty|support|alignment|consensus|capital|resentment|safety/.test(
                v.id,
              ),
            )
            .slice(0, 3)
            .map((v) => (
              <div className={s.avatarRow} data-stakeholder key={v.id}>
                <span
                  style={{
                    opacity: stakeholderSignal(v, run.state[v.id]).opacity,
                  }}
                >
                  {v.label
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <strong>{v.label}</strong>
                  <small>{stakeholderSignal(v, run.state[v.id]).label}</small>
                </div>
              </div>
            ))}
          <p className={s.fine}>
            These indicators describe the simulated operating state. They do not
            diagnose people or predict their behaviour.
          </p>
        </aside>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Lock this commitment?"
        description={choice?.label}
        size="md"
      >
        <div className={u.stack}>
          <p>{choice?.cost}</p>
          <p className={u.prose}>
            This changes the operating state and becomes a constraint in the
            next chapter. You can branch into an alternate timeline later; this
            timeline keeps the original decision.
          </p>
          <button
            className={u.primary}
            onClick={() => void confirmLock()}
            disabled={saving}
          >
            Lock decision & see consequence
          </button>
          <button className={u.secondary} onClick={() => setConfirm(false)}>
            Keep investigating
          </button>
        </div>
      </Dialog>
      <Dialog
        open={recap}
        onClose={() => setRecap(false)}
        title={
          reviewChapter
            ? `Your chapter ${reviewChapter} commitment`
            : "Your commitments so far"
        }
        size="lg"
      >
        <div className={u.stack}>
          {run.decisions.length ? (
            run.decisions
              .filter((d) => !reviewChapter || d.chapter === reviewChapter)
              .map((d) => (
                <section key={d.chapter}>
                  <h3>
                    Chapter {d.chapter}: {d.label}
                  </h3>
                  <p className={u.prose}>{d.reaction}</p>
                  <p className={u.finePrint}>{d.constraint}</p>
                  <button
                    className={u.secondary}
                    disabled={saving || transitioning}
                    onClick={() => void fork(d.chapter)}
                  >
                    Branch from chapter {d.chapter}
                  </button>
                </section>
              ))
          ) : (
            <p>No locked decisions yet. Your current draft is saved locally.</p>
          )}
        </div>
      </Dialog>
      <Dialog
        open={exit}
        onClose={() => setExit(false)}
        title="Leave the room with your work saved?"
        size="sm"
      >
        <p className={u.prose}>
          Your state and chapter stay exactly where you left them. Account sync
          requires a current signed-in session; keep a backup for device-only
          work.
        </p>
        <div className={u.row}>
          <button
            className={u.primary}
            disabled={saving}
            onClick={async () => {
              if (await commit({ ...current.current!, status: "paused" }))
                router.push(`/app/projects/${p.id}`);
            }}
          >
            Save, pause & exit
          </button>
          <button className={u.secondary} onClick={() => setExit(false)}>
            Stay in the campaign
          </button>
        </div>
      </Dialog>
    </div>
  );
}
