"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  LockKeyhole,
  Pause,
  Pin,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import gsap from "gsap";
import { db, EMPTY_FIELDS, saveRun, WriteConflict } from "@/lib/product/db";
import {
  categoryOf,
  evidenceBudget,
  getQuestion,
  questions,
  RCA_CUTS,
} from "@/lib/product/content";
import {
  advance,
  createRun,
  eventTypes,
  fundamentalQuestions,
  GUARDRAILS,
  METRICS,
  remainingEvidence,
  requestEvidence,
  scoreRun,
  STAGES,
  stageIssue,
  stageLabel,
  TESTS,
} from "@/lib/product/engine";
import { estimate, getDials } from "@/lib/product/estimation";
import type { DecisionRecord, Run, RunStage } from "@/lib/product/types";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "./WorkspaceProvider";
import styles from "./Product.module.css";
import VoiceNote from "./VoiceNote";
import { CategoryWorkbench } from "./CategoryWorkbench";
import SpokenSynthesis from "./SpokenSynthesis";
import KeepRun from "./KeepRun";
import { stagesFor } from "@/lib/product/engine";
import { practiceSession, trackActivation } from "@/lib/product/activation";
import {
  readinessBand,
  RUBRIC_LIMIT,
  reviewStatus,
} from "@/lib/product/readiness";
import {
  questionForRun,
  variantConstraint,
  variantNumber,
} from "@/lib/product/variants";

const primerTitles = [
  "The situation",
  "The constraint that bites",
  "What you must defend",
];
const describe = (value: number) =>
  value >= 85
    ? "Strong"
    : value >= 70
      ? "Solid"
      : value >= 50
        ? "Basic"
        : "Missing evidence";
function Options({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: string; label: string; detail?: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className={styles.nodeList} role="group" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          className={styles.choice}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          <span className={styles.row} style={{ fontSize: ".83rem" }}>
            <span className={styles.badge}>
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.label}
            {value === item.id && <Check size={15} />}
          </span>
          {item.detail && <small>{item.detail}</small>}
        </button>
      ))}
    </div>
  );
}
function StructuredSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose deliberately…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export default function InterviewRunner({ runId }: { runId: string }) {
  const { profile } = useWorkspace();
  const router = useRouter();
  const { reducedMotion, playCue } = useSettings();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [review, setReview] = useState<RunStage | null>(null);
  const [exit, setExit] = useState(false);
  const [clock, setClock] = useState(0);
  const [reflectionWait, setReflectionWait] = useState(0);
  const [recordSaved, setRecordSaved] = useState("");
  const [showTable, setShowTable] = useState(true);
  const current = useRef<Run | null>(null);
  const revision = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const persistRef = useRef<
    ((run: Run, lock?: boolean) => Promise<boolean>) | null
  >(null);
  const [deskOpen, setDeskOpen] = useState(false);
  useEffect(() => {
    if (run?.stage !== "reflection") return;
    const update = () =>
      setReflectionWait(
        Math.max(
          0,
          120 -
            Math.floor(
              (Date.now() -
                Date.parse(
                  run.reflectionStartedAt || new Date().toISOString(),
                )) /
                1000,
            ),
        ),
      );
    if (!run.reflectionStartedAt) {
      const value = { ...run, reflectionStartedAt: new Date().toISOString() };
      current.current = value;
      setRun(value);
      void persistRef.current?.(value);
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [run?.stage, run?.reflectionStartedAt]);
  useEffect(() => {
    setDeskOpen(matchMedia("(min-width:901px)").matches);
  }, []);
  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const saved = await db.runs.get(runId);
      if (!saved || saved.ownerId !== profile.id) {
        setError(
          "This session isn’t in your workspace. It may belong to another profile or device.",
        );
        return;
      }
      current.current = saved;
      revision.current = saved.revision;
      elapsedRef.current = saved.elapsedSeconds;
      setRun(saved);
      setClock(saved.elapsedSeconds);
      setConflict(false);
      setError("");
    } catch {
      setError(
        "This saved session could not be read. You can restore a snapshot or return to your library.",
      );
    } finally {
      setLoading(false);
    }
  }, [profile, runId]);
  useEffect(() => {
    void load();
    return () => {
      if (saveTimer.current && current.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        void persistRef.current?.(current.current);
      }
    };
  }, [load]);
  const persist = useCallback((candidate: Run, lock = false) => {
    const operation = queue.current.then(async () => {
      setSaving(true);
      try {
        const next = await saveRun(
          {
            ...candidate,
            revision: revision.current,
            elapsedSeconds: elapsedRef.current,
          },
          revision.current,
          lock,
        );
        revision.current = next.revision;
        if (current.current) {
          current.current = { ...current.current, revision: next.revision };
          setRun(current.current);
        }
        setSavedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setError("");
        return true;
      } catch (err) {
        if (err instanceof WriteConflict) setConflict(true);
        setError(
          err instanceof Error
            ? err.message
            : "Could not save. Your current work is still on this screen; retry before leaving.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    });
    queue.current = operation;
    return operation;
  }, []);
  persistRef.current = persist;
  const change = (patch: Partial<Run>, immediate = false) => {
    if (!current.current || conflict) return;
    const next = { ...current.current, ...patch };
    current.current = next;
    setRun(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    if (immediate) void persist(next, true);
    else
      saveTimer.current = setTimeout(() => {
        saveTimer.current = undefined;
        void persist(current.current!);
      }, 300);
  };
  useEffect(() => {
    const timer = setInterval(() => {
      const active = current.current;
      if (
        !active ||
        pausedRef.current ||
        active.status === "paused" ||
        (active.completedAt &&
          !(
            active.guided && ["feedback", "reflection"].includes(active.stage)
          )) ||
        document.hidden
      )
        return;
      elapsedRef.current++;
      if (elapsedRef.current % 30 === 0) practiceSession();
      setClock(elapsedRef.current);
      if (elapsedRef.current % 15 === 0) void persist(active);
    }, 1000);
    const hide = () => {
      if (document.hidden && current.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        void persist(current.current, true);
      }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveTimer.current && current.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [persist]);
  useEffect(() => {
    if (!run || reducedMotion) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-stage-content]",
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          clearProps: "opacity,transform",
        },
      );
    }, stageRef);
    stageRef.current
      ?.querySelector<HTMLElement>("h1")
      ?.focus({ preventScroll: true });
    return () => context.revert();
  }, [run?.stage, run?.eventIndex, reducedMotion]);
  if (loading)
    return (
      <div className={styles.runMain}>
        <div className={styles.skeleton} />
        <p className={styles.muted}>Putting your desk back in order…</p>
      </div>
    );
  const q = run ? questionForRun(run) : undefined;
  if (!run || !q)
    return (
      <div className={styles.onboarding}>
        <h1>This session isn’t available.</h1>
        <p className={styles.error}>
          {error || "The question is unavailable."}
        </p>
        <Link href="/app/practice" className={styles.primary}>
          Back to practice
        </Link>
      </div>
    );
  const score = scoreRun(run, q);
  const resultStages = [
    "feedback",
    "replay",
    "reflection",
    "expert",
    "complete",
  ];
  const inDebrief = resultStages.includes(run.stage);
  const paused = run.status === "paused";
  const budget = remainingEvidence(run, q);
  const category = categoryOf(q.category);
  const chosen = q.choices.find((c) => c.id === run.choiceId);
  const eventType = eventTypes(q)[run.eventIndex];
  const authoredProbes = [
    ...(q.task + " " + q.probes).matchAll(
      /(?:PROBE|PUSHBACK|PIVOT)[^"]*"([^"]+)"/g,
    ),
  ].map((match) => match[1]);
  const authoredProbe =
    authoredProbes[run.eventIndex % Math.max(1, authoredProbes.length)];
  const stages = stagesFor(run);
  const stepIndex = stages.indexOf(run.stage);
  const estimateResult =
    q.category === "estimation" ? estimate(q.id, run.dials, run.seed) : null;
  const next = async () => {
    const issue = stageIssue(current.current!);
    if (issue) {
      setError(issue);
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    const nextRun = advance(current.current!);
    current.current = nextRun;
    setRun(nextRun);
    setReview(null);
    if (!(await persist(nextRun, true))) return;
    if (nextRun.stage === "feedback")
      void trackActivation(nextRun, "debrief_reached");
    if (run.stage === "reflection")
      void trackActivation(
        nextRun,
        nextRun.reflectionCompletedAt
          ? "reflection_finished"
          : "reflection_skipped",
      );
    playCue("paper");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (nextRun.stage === "feedback")
      router.replace(`/app/run/${run.id}/debrief`, { scroll: false });
  };
  const pause = () => {
    pausedRef.current = !paused;
    change({ status: paused ? "active" : "paused" }, true);
  };
  const restore = async () => {
    const snapshots = await db.snapshots
      .where("runId")
      .equals(run.id)
      .sortBy("revision");
    const last = snapshots.filter((s) => s.ownerId === profile?.id).at(-1);
    if (!last) {
      setError("No snapshot is available yet. The session is still here.");
      return;
    }
    const saved = await db.runs.get(run.id);
    if (!saved || saved.ownerId !== profile?.id) return;
    revision.current = saved.revision;
    current.current = { ...last.data, revision: saved.revision };
    setRun(current.current);
    setConflict(false);
    await persist(current.current, true);
  };
  const retry = async () => {
    const nextRun = createRun(q, profile!.id, (run.seed + 1) % 3);
    nextRun.stage = q.category === "root-cause" ? "investigate" : "workbench";
    nextRun.objectivePinned = true;
    nextRun.locked = ["primer", "fundamentals", "clarify"];
    nextRun.fundamentals = run.fundamentals;
    await saveRun(nextRun, 0, true);
    router.push(`/app/run/${nextRun.id}`);
  };
  const saveRecord = async () => {
    const at = new Date().toISOString();
    const id = crypto.randomUUID();
    const primary =
      q.choices.find((c) => c.id === run.synthesis.decision)?.label ||
      run.synthesis.decision;
    const record: DecisionRecord = {
      id,
      ownerId: profile!.id,
      title: q.title,
      source: "run",
      runId: run.id,
      createdAt: at,
      updatedAt: at,
      fields: {
        ...EMPTY_FIELDS,
        problem: q.goal,
        evidence: q.evidence
          .filter((e) => run.evidenceIds.includes(e.id))
          .map((e) => `${e.id}: ${e.text}`)
          .join("\n\n"),
        assumptions: run.synthesis.note,
        options: q.choices
          .filter((c) => !c.trap)
          .map((c) => c.label)
          .join("\n"),
        tradeoffs: run.synthesis.tradeoff,
        decision: primary,
        metric: `${run.synthesis.metric}; guardrail: ${run.synthesis.guardrail}`,
        nextCheck: run.synthesis.stopRule,
      },
    };
    try {
      const existing = await db.records
        .where("ownerId")
        .equals(profile!.id)
        .filter((r) => r.runId === run.id)
        .first();
      if (existing) {
        setRecordSaved(existing.id);
        return;
      }
      await db.records.add(record);
      setRecordSaved(id);
    } catch {
      setError("The record could not be saved. Your session is safe; retry.");
    }
  };
  const patchMetrics = (key: "primary" | "guardrail" | "test", value: string) =>
    change({ metrics: { ...run.metrics, [key]: value } });
  const timeText = `${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, "0")}`;
  const showExhausted = budget === 0 && run.stage === "investigate";
  return (
    <div className={styles.runPage}>
      <header className={styles.runHeader}>
        <div className={styles.runTitle}>
          <Link href="/app" className={styles.brand}>
            <Compass size={22} />
            PMForge
          </Link>
          <div>
            {category.studio}
            <br />
            <strong>
              {q.id} · Variant {run.seed + 1}
            </strong>
          </div>
        </div>
        <div className={styles.row}>
          <span
            className={`${styles.pill} ${styles.small}`}
            role="timer"
            aria-label={
              run.guided
                ? `${Math.max(0, 480 - clock)} seconds remaining in guided timebox`
                : `${timeText} time practised`
            }
          >
            <Clock size={13} />
            {run.guided
              ? `${Math.floor(Math.max(0, 480 - clock) / 60)}:${String(Math.max(0, 480 - clock) % 60).padStart(2, "0")} left · guided`
              : timeText}
          </span>
          {!inDebrief && (
            <button className={styles.secondary} onClick={pause}>
              {paused ? <Play size={12} /> : <Pause size={12} />}{" "}
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          <button className={styles.secondary} onClick={() => setExit(true)}>
            <X size={12} />
            Exit
          </button>
        </div>
      </header>
      <div className={styles.goalPin}>
        <Pin size={14} style={{ flex: "none" }} />
        <p>
          {run.objectivePinned
            ? q.goal
            : "Your first job: understand the decision before solving it."}
        </p>
        <span>{q.status} content · local-first</span>
      </div>
      <div className={styles.runGrid}>
        <details
          className={styles.evidenceDesk}
          open={deskOpen}
          onToggle={(event) => setDeskOpen(event.currentTarget.open)}
        >
          <summary>
            Evidence desk{" "}
            <span className={styles.row}>
              <span className={styles.badge}>
                {budget}/{evidenceBudget(q.level)}
              </span>
              <ChevronDown size={13} />
            </span>
          </summary>
          <p className={styles.finePrint} style={{ marginTop: 12 }}>
            Ask the interviewer. Every request has a cost; every observation is
            saved.
          </p>
          {q.evidence.map((card) => {
            const opened = run.evidenceIds.includes(card.id);
            return opened ? (
              <article
                key={card.id}
                className={styles.evidenceCard}
                data-open="true"
              >
                <div className={styles.spread}>
                  <span className={styles.badge}>{card.id}</span>
                  <span className={styles.badge}>
                    {card.tag === "REFERENCE"
                      ? "Unverified reference"
                      : "Simulated"}
                  </span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                {card.tag === "REFERENCE" && (
                  <small>Source in supplied handoff · SME review pending</small>
                )}
              </article>
            ) : (
              <button
                key={card.id}
                className={styles.evidenceCard}
                disabled={
                  budget < card.cost ||
                  run.locked.includes("synthesis") ||
                  !run.objectivePinned ||
                  paused
                }
                onClick={() => change(requestEvidence(run, card.id), true)}
              >
                <span className={styles.spread}>
                  <span className={styles.badge}>{card.id}</span>
                  <LockKeyhole size={12} />
                </span>
                <h3>{card.title}</h3>
                <small>
                  {card.cost} evidence credit{card.cost === 1 ? "" : "s"} ·
                  Request this cut
                </small>
              </button>
            );
          })}
          <p className={styles.finePrint} style={{ marginTop: 18 }}>
            Internal metrics are simulated, never private data from real
            companies. {reviewStatus(q)}.
          </p>
        </details>
        <div className={styles.runMain} ref={stageRef}>
          <div className={styles.runStage}>
            <div className={styles.stageTop}>
              <span>
                {String(stepIndex + 1).padStart(2, "0")} /{" "}
                {stageLabel[run.stage]}
              </span>
              <div
                className={styles.steps}
                aria-label={`Step ${stepIndex + 1} of ${stages.length}`}
              >
                {stages.map((s, i) => (
                  <i key={s} title={stageLabel[s]} data-on={i <= stepIndex} />
                ))}
              </div>
            </div>
            {run.guided && (
              <p className={styles.finePrint}>
                Brief → evidence & workbench → one pushback → 90-second spoken
                call → debrief & reflection. About 8 minutes; take longer
                whenever you need.
              </p>
            )}
            {error && (
              <div className={styles.error} role="alert">
                <p>{error}</p>
                <div className={styles.row}>
                  {conflict ? (
                    <button
                      className={styles.textButton}
                      onClick={() => void load()}
                    >
                      Load the latest version
                    </button>
                  ) : (
                    <button
                      className={styles.textButton}
                      onClick={() => void persist(current.current!, true)}
                    >
                      Retry saving
                    </button>
                  )}
                  <button
                    className={styles.textButton}
                    onClick={() => void restore()}
                  >
                    Restore last snapshot
                  </button>
                </div>
              </div>
            )}
            {run.seed > 0 && !inDebrief && (
              <p className={styles.notice}>
                Variant {run.seed + 1}: {variantConstraint(run.seed)} These
                constraints and changed evidence percentages are simulated.
                Re-evaluate the evidence; choice positions change too.
              </p>
            )}
            {paused ? (
              <section className={styles.empty}>
                <Pause size={32} />
                <h1 tabIndex={-1}>A moment to think.</h1>
                <p>
                  Your choices are saved. The clock is paused. Come back when
                  you’re ready.
                </p>
                <button className={styles.primary} onClick={pause}>
                  <Play size={14} />
                  Back to the room
                </button>
              </section>
            ) : review ? (
              <section>
                <h1>Read-only decision review.</h1>
                <p className={styles.lead}>
                  Locked choices are part of your reasoning trail. You can
                  revisit them here; changes happen through interviewer events
                  or a new attempt.
                </p>
                <ul className={styles.timeline}>
                  {run.decisions
                    .filter((d) => d.stage === review)
                    .map((d, i) => (
                      <li key={i}>
                        <strong>{d.action}</strong>
                        <p>
                          {q.choices.find((c) => c.id === d.value)?.label ||
                            d.value}
                        </p>
                      </li>
                    ))}
                </ul>
                <button
                  className={styles.primary}
                  onClick={() => setReview(null)}
                >
                  Return to {stageLabel[run.stage]}
                  <ArrowRight size={14} />
                </button>
              </section>
            ) : (
              <div data-stage-content>
                {run.stage === "primer" && (
                  <>
                    <span className={styles.eyebrow}>
                      {category.studio} · preflight
                    </span>
                    <h1 tabIndex={-1}>Before you take the room.</h1>
                    <p className={styles.lead}>
                      Three things to hold in mind. This is context, not a
                      script.
                    </p>
                    <div className={styles.primer}>
                      {q.primer.map((text, i) => (
                        <article className={styles.primerCard} key={i}>
                          <span>{i + 1}.</span>
                          <div>
                            <h3>{primerTitles[i]}</h3>
                            <p>{text}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className={styles.settingRow}>
                      <div>
                        <h3>Optional pressure mode</h3>
                        <p>
                          A soft timebox. You can extend it; time never lowers
                          your score.
                        </p>
                      </div>
                      <button
                        role="switch"
                        aria-label="Pressure mode"
                        aria-checked={run.pressureSeconds !== null}
                        className={styles.switch}
                        onClick={() =>
                          change({
                            pressureSeconds:
                              run.pressureSeconds === null
                                ? q.minutes * 60
                                : null,
                          })
                        }
                      >
                        <span />
                      </button>
                    </div>
                  </>
                )}
                {run.stage === "fundamentals" && (
                  <>
                    <span className={styles.eyebrow}>A short warm-up</span>
                    <h1 tabIndex={-1}>Get your bearings.</h1>
                    <p className={styles.lead}>
                      Choose what you would do. We’ll discuss the reasoning in
                      your debrief, without interrupting the run.
                    </p>
                    {fundamentalQuestions.map((f, i) => (
                      <section key={f.id} style={{ marginTop: 25 }}>
                        <h3>
                          {i + 1}. {f.question}
                        </h3>
                        <Options
                          items={f.options.map((label, index) => ({
                            id: String(index),
                            label,
                          }))}
                          value={run.fundamentals[f.id]}
                          onChange={(value) =>
                            change({
                              fundamentals: {
                                ...run.fundamentals,
                                [f.id]: value,
                              },
                            })
                          }
                          label={f.question}
                        />
                      </section>
                    ))}
                  </>
                )}
                {run.stage === "clarify" && (
                  <>
                    <span className={styles.eyebrow}>The opening brief</span>
                    <h1 tabIndex={-1}>{q.title}</h1>
                    <div className={styles.scenarioBrief}>{q.scenario}</div>
                    <h2>What decision are we here to make?</h2>
                    <p className={styles.lead} style={{ marginTop: 14 }}>
                      Keep the goal visible while the evidence changes. Solution
                      choices unlock after you pin it.
                    </p>
                    <button
                      className={styles.choice}
                      aria-pressed={run.objectivePinned}
                      onClick={() =>
                        change({ objectivePinned: !run.objectivePinned })
                      }
                    >
                      <span className={styles.row}>
                        <Pin size={16} />
                        {q.goal}
                        {run.objectivePinned && <Check size={17} />}
                      </span>
                      <small>
                        {run.objectivePinned
                          ? "Pinned to your workspace."
                          : "Pin this objective for the rest of the session."}
                      </small>
                    </button>
                  </>
                )}
                {run.stage === "investigate" && (
                  <>
                    <span className={styles.eyebrow}>Ask the interviewer</span>
                    <h1 tabIndex={-1}>What do you need to know?</h1>
                    <p className={styles.lead}>
                      Open the evidence desk and choose the cuts that would
                      separate explanations. The order and cost of your requests
                      become part of the replay.
                    </p>
                    <div className={styles.calculation}>
                      <span className={styles.eyebrow}>
                        Evidence budget remaining
                      </span>
                      <strong>
                        {budget}
                        <small style={{ font: ".9rem var(--font-body)" }}>
                          {" "}
                          / {evidenceBudget(q.level)}
                        </small>
                      </strong>
                      <p>
                        {
                          q.evidence.filter((e) =>
                            run.evidenceIds.includes(e.id),
                          ).length
                        }{" "}
                        artifacts open · You can make your call without buying
                        every card.
                      </p>
                    </div>
                    {showExhausted && (
                      <p className={styles.notice}>
                        “We’re out of time on data. Make your call with what you
                        have.” You can continue; this is not a dead end.
                      </p>
                    )}
                    <p className={styles.prose}>
                      The useful question isn’t “Which card looks important?”
                      It’s “What would I conclude differently if this
                      observation went the other way?”
                    </p>
                    <p className={styles.finePrint} style={{ marginTop: 20 }}>
                      On a phone, open “Evidence desk” above. On a larger screen
                      it sits to your left.
                    </p>
                  </>
                )}
                {run.stage === "workbench" && (
                  <>
                    {run.guided && (
                      <p className={styles.notice}>
                        Guided move: request one useful cut from the Evidence
                        desk, compare it with the brief, then defend a
                        direction. Pinning the goal and the warm-up are combined
                        in this first run.
                      </p>
                    )}
                    <span className={styles.eyebrow}>{category.studio}</span>
                    <h1 tabIndex={-1}>
                      {q.category === "root-cause"
                        ? "Find the break in the story."
                        : q.category === "estimation"
                          ? "Make your assumptions visible."
                          : q.category === "ai-technical"
                            ? "A system with a reason to exist."
                            : q.category === "behavioral"
                              ? "Step out of the scene. Into your story."
                              : q.category === "product-sense"
                                ? "Choose the problem worth solving."
                                : q.category === "strategy"
                                  ? "Choose your ground."
                                  : "A metric that earns your trust."}
                    </h1>
                    <p className={styles.lead}>
                      {category.description} Use the evidence you requested to
                      choose a direction.
                    </p>
                    <CategoryWorkbench question={q} run={run} change={change} />
                    {q.category === "root-cause" && (
                      <>
                        <StructuredSelect
                          label="Cut the data by"
                          value={run.segment}
                          onChange={(segment) => change({ segment })}
                          options={[
                            {
                              id: "target",
                              label: RCA_CUTS[q.id]?.label || "Affected cohort",
                            },
                            { id: "aggregate", label: "Overall average only" },
                          ]}
                        />
                        {run.segment && (
                          <>
                            <div
                              className={styles.spread}
                              style={{ marginTop: 18 }}
                            >
                              <span className={styles.badge}>
                                Simulated scenario data
                              </span>
                              <button
                                className={styles.textButton}
                                onClick={() => setShowTable((v) => !v)}
                              >
                                {showTable ? "Read summary" : "View data table"}
                              </button>
                            </div>
                            {showTable ? (
                              <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                  <caption className="srOnly">
                                    Comparison by {RCA_CUTS[q.id]?.label}
                                  </caption>
                                  <thead>
                                    <tr>
                                      <th>
                                        {run.segment === "aggregate"
                                          ? "View"
                                          : RCA_CUTS[q.id]?.label}
                                      </th>
                                      <th>Before</th>
                                      <th>After</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(run.segment === "aggregate"
                                      ? [
                                          [
                                            "Aggregate",
                                            "See opening brief",
                                            "Inspect the individual E cards",
                                          ],
                                        ]
                                      : RCA_CUTS[q.id]?.rows || []
                                    ).map((row, i) => (
                                      <tr key={i}>
                                        {row.map((cell, j) => (
                                          <td key={j}>
                                            {variantNumber(cell, run.seed)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p
                                className={styles.notice}
                                style={{ marginTop: 15 }}
                              >
                                {(RCA_CUTS[q.id]?.rows || [])
                                  .map(
                                    (row) =>
                                      `${row[0]}: ${variantNumber(row[1], run.seed)} → ${variantNumber(row[2], run.seed)}`,
                                  )
                                  .join(". ")}
                                . This cut is an additional simulated analysis
                                view; E cards record paid requests separately.
                              </p>
                            )}
                          </>
                        )}
                        <h3 style={{ marginTop: 26 }}>
                          Rank your working hypotheses
                        </h3>
                        <p className={styles.finePrint}>
                          Put the explanation you would test first at the top.
                          Move buttons work with keyboard and touch.
                        </p>
                        <ol className={styles.rankList}>
                          {run.rank.map((hypothesis, index) => (
                            <li key={hypothesis}>
                              <span className={styles.rankNumber}>
                                {index + 1}
                              </span>
                              <span>{hypothesis}</span>
                              <button
                                className={styles.iconButton}
                                aria-label={`Move ${hypothesis} up`}
                                disabled={index === 0}
                                onClick={() => {
                                  const rank = [...run.rank];
                                  [rank[index - 1], rank[index]] = [
                                    rank[index],
                                    rank[index - 1],
                                  ];
                                  change({ rank });
                                }}
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                className={styles.iconButton}
                                aria-label={`Move ${hypothesis} down`}
                                disabled={index === run.rank.length - 1}
                                onClick={() => {
                                  const rank = [...run.rank];
                                  [rank[index + 1], rank[index]] = [
                                    rank[index],
                                    rank[index + 1],
                                  ];
                                  change({ rank });
                                }}
                              >
                                <ArrowDown size={13} />
                              </button>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                    {estimateResult && (
                      <>
                        <div className={styles.notice}>
                          Your model uses your assumptions, not one “correct”
                          final number. The range alarm is intentionally coarse;
                          a plausible value still needs evidence.
                        </div>
                        {getDials(q.id).map((d) => {
                          const value = run.dials[d.id] ?? d.value;
                          const alarm =
                            value < d.band[0] / 2 || value > d.band[1] * 2;
                          const set = (v: number) => {
                            if (Number.isFinite(v))
                              change({
                                dials: {
                                  ...run.dials,
                                  [d.id]: Math.max(d.min, Math.min(d.max, v)),
                                },
                              });
                          };
                          return (
                            <div className={styles.dial} key={d.id}>
                              <label htmlFor={`dial-${d.id}`}>{d.label}</label>
                              <div className={styles.dialControls}>
                                <button
                                  className={styles.iconButton}
                                  aria-label={`Decrease ${d.label}`}
                                  onClick={() =>
                                    set(Number((value - d.step).toFixed(2)))
                                  }
                                >
                                  −
                                </button>
                                <input
                                  type="range"
                                  aria-label={d.label}
                                  min={d.min}
                                  max={d.max}
                                  step={d.step}
                                  value={value}
                                  onChange={(e) => set(Number(e.target.value))}
                                />
                                <button
                                  className={styles.iconButton}
                                  aria-label={`Increase ${d.label}`}
                                  onClick={() =>
                                    set(Number((value + d.step).toFixed(2)))
                                  }
                                >
                                  +
                                </button>
                                <input
                                  id={`dial-${d.id}`}
                                  type="number"
                                  min={d.min}
                                  max={d.max}
                                  step={d.step}
                                  value={value}
                                  onChange={(e) => set(Number(e.target.value))}
                                />
                                <small>{d.unit}</small>
                              </div>
                              {alarm && (
                                <p className={styles.error}>
                                  Order-of-magnitude alarm. Recheck the unit or
                                  the population behind this assumption.
                                </p>
                              )}
                            </div>
                          );
                        })}
                        <div className={styles.calculation}>
                          <span className={styles.eyebrow}>
                            Your calculation
                          </span>
                          <strong>
                            {estimateResult.value.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })}
                          </strong>
                          <p>{estimateResult.unit}</p>
                          <p>{estimateResult.formula}</p>
                          <p>{estimateResult.comparison}</p>
                        </div>
                        <label className={styles.check}>
                          <input
                            type="checkbox"
                            checked={run.unitConfirmed}
                            onChange={(e) =>
                              change({ unitConfirmed: e.target.checked })
                            }
                          />
                          I checked that each rate uses the right population and
                          that the output unit is {estimateResult.unit}.
                        </label>
                      </>
                    )}
                    {q.category === "ai-technical" && (
                      <>
                        <h3>Connect the components you can justify.</h3>
                        <p
                          className={styles.finePrint}
                          style={{ margin: "10px 0 18px" }}
                        >
                          An architectural sketch, not a performance benchmark.
                          Exact costs and latency live in your scenario
                          evidence.
                        </p>
                        <div className={styles.architecture}>
                          {[
                            { id: "client", label: "Client / input" },
                            {
                              id: "retrieval",
                              label: "Retrieval / live facts",
                            },
                            { id: "small", label: "Small / on-device model" },
                            { id: "large", label: "Large cloud model" },
                            {
                              id: "guardrail",
                              label: "Verification / escalation",
                            },
                            { id: "monitor", label: "Eval & monitoring" },
                          ].map((component) => (
                            <button
                              key={component.id}
                              aria-pressed={run.architecture.includes(
                                component.id,
                              )}
                              onClick={() =>
                                change({
                                  architecture: run.architecture.includes(
                                    component.id,
                                  )
                                    ? run.architecture.filter(
                                        (id) => id !== component.id,
                                      )
                                    : [...run.architecture, component.id],
                                })
                              }
                            >
                              {component.label}
                            </button>
                          ))}
                        </div>
                        <p className={styles.notice}>
                          Current path:{" "}
                          {run.architecture.length
                            ? run.architecture.join(" → ")
                            : "No components connected"}
                          . What user requirement earns each layer its place?
                        </p>
                      </>
                    )}
                    {q.category === "behavioral" && (
                      <>
                        <div className={styles.scenePanel}>
                          <p>{q.scenario}</p>
                          <small>Simulated scene / real reflection</small>
                        </div>
                        <div className={styles.notice}>
                          Use a real episode. Avoid confidential employer
                          information. This is a structure-based estimate, not a
                          judgment about truthfulness.
                        </div>
                        <VoiceNote
                          onText={(text) => {
                            const latest = current.current!;
                            const actions = [...latest.story.actions];
                            const index = actions.findIndex(
                              (action) => !action.trim(),
                            );
                            actions[index < 0 ? actions.length - 1 : index] =
                              text;
                            change({ story: { ...latest.story, actions } });
                          }}
                        />
                        <h2 style={{ marginTop: 24 }}>
                          {q.storyPrompt ||
                            "Tell us about a real moment like this."}
                        </h2>
                        <div className={styles.stack} style={{ marginTop: 20 }}>
                          <label className={styles.field}>
                            Situation: stakes, people, and their competing goals
                            <textarea
                              maxLength={20000}
                              value={run.story.stakes}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    stakes: e.target.value,
                                  },
                                })
                              }
                              placeholder="Who was in the room? What made the decision difficult?"
                            />
                          </label>
                          {run.story.actions.map((action, i) => (
                            <label className={styles.field} key={i}>
                              My action {i + 1}
                              <input
                                maxLength={2000}
                                value={action}
                                onChange={(e) => {
                                  const actions = [...run.story.actions];
                                  actions[i] = e.target.value;
                                  change({ story: { ...run.story, actions } });
                                }}
                                placeholder="I asked… I decided… I changed…"
                              />
                            </label>
                          ))}
                          <label className={styles.field}>
                            The result, including what did not work
                            <textarea
                              maxLength={10000}
                              value={run.story.result}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    result: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                          <label className={styles.check}>
                            <input
                              type="checkbox"
                              checked={run.story.observable}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    observable: e.target.checked,
                                  },
                                })
                              }
                            />
                            I included an observable result—or honestly
                            explained why it could not be measured.
                          </label>
                          <label className={styles.field}>
                            What changed in your behavior?
                            <textarea
                              maxLength={10000}
                              value={run.story.learning}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    learning: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                          <label className={styles.field}>
                            A later example of applying that learning
                            <input
                              maxLength={2000}
                              value={run.story.later}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    later: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                          <label className={styles.check}>
                            <input
                              type="checkbox"
                              checked={run.story.ownership}
                              onChange={(e) =>
                                change({
                                  story: {
                                    ...run.story,
                                    ownership: e.target.checked,
                                  },
                                })
                              }
                            />
                            These actions distinguish my contribution from the
                            team’s, including the trade-off I owned.
                          </label>
                        </div>
                      </>
                    )}
                    {["execution-metrics", "product-sense"].includes(
                      q.category,
                    ) && (
                      <div className={styles.stack}>
                        <StructuredSelect
                          label={
                            q.category === "product-sense"
                              ? "Which result proves the friction improved?"
                              : "Primary metric"
                          }
                          value={run.metrics.primary}
                          options={METRICS}
                          onChange={(value) => patchMetrics("primary", value)}
                        />
                        <StructuredSelect
                          label="What must remain healthy?"
                          value={run.metrics.guardrail}
                          options={GUARDRAILS}
                          onChange={(value) => patchMetrics("guardrail", value)}
                        />
                        <StructuredSelect
                          label="How will you distinguish effect from coincidence?"
                          value={run.metrics.test}
                          options={TESTS}
                          onChange={(value) => patchMetrics("test", value)}
                        />
                        {q.category === "product-sense" && (
                          <p className={styles.notice}>
                            Kill a darling: your final decision must name one
                            appealing thing you will deliberately leave out. A
                            feature list is not a product vision.
                          </p>
                        )}
                      </div>
                    )}
                    <h3 style={{ marginTop: 28 }}>
                      Which direction will you defend?
                    </h3>
                    <Options
                      label="Choose a decision path"
                      items={q.choices}
                      value={run.choiceId}
                      onChange={(choiceId) => change({ choiceId })}
                    />
                    {chosen && (
                      <p className={styles.notice}>{chosen.consequence}</p>
                    )}
                  </>
                )}
                {run.stage === "event" && (
                  <>
                    <span className={styles.eyebrow}>
                      The room responds · {run.eventIndex + 1}/
                      {eventTypes(q).length}
                    </span>
                    <h1 tabIndex={-1}>
                      {eventType === "pivot"
                        ? "The constraint just changed."
                        : eventType === "probe"
                          ? "Walk me through that."
                          : "One more thing before you commit."}
                    </h1>
                    <div className={styles.event}>
                      <span className={styles.badge}>
                        Simulated interviewer · {eventType}
                      </span>
                      <blockquote>
                        {authoredProbe ||
                          (eventType === "pivot"
                            ? "Your delivery capacity has been cut by 20%. Which part of your earlier choice no longer holds?"
                            : q.category === "estimation"
                              ? "Which assumption moves this decision most—and what observation would make you change it?"
                              : q.category === "behavioral"
                                ? "What exactly did you say first? What did that choice cost the other person?"
                                : run.eventIndex === 2
                                  ? "What would you stop, and which observation would make you reverse this decision?"
                                  : "You’ve chosen a direction. What evidence rules out the strongest competing explanation?")}
                      </blockquote>
                      <p>Your current direction: {chosen?.label}</p>
                    </div>
                    <Options
                      label="Respond to the interviewer"
                      value={run.eventResponse}
                      onChange={(eventResponse) => change({ eventResponse })}
                      items={[
                        {
                          id: "defend",
                          label:
                            "Defend it with the evidence already requested",
                          detail:
                            "Keep the choice; explain the evidence link in your final claim.",
                        },
                        {
                          id: "adjust",
                          label:
                            "Adjust the recommendation to fit the evidence and constraint",
                          detail: "Reconsider the scope, not just the wording.",
                        },
                        {
                          id: "insist",
                          label:
                            "Keep the original recommendation without another check",
                          detail:
                            "Accept the uncertainty and make it visible in the record.",
                        },
                      ]}
                    />
                    {run.eventResponse === "adjust" && (
                      <>
                        <h3>Revised direction</h3>
                        <Options
                          label="Revised decision path"
                          items={q.choices.filter((c) => !c.trap)}
                          value={run.choiceId}
                          onChange={(choiceId) => change({ choiceId })}
                        />
                      </>
                    )}
                    {q.category === "behavioral" && (
                      <label className={styles.field}>
                        Your exact words (optional, replay only)
                        <textarea
                          value={run.reflectionNote}
                          maxLength={20000}
                          onChange={(e) =>
                            change({ reflectionNote: e.target.value })
                          }
                        />
                      </label>
                    )}
                  </>
                )}
                {run.stage === "synthesis" && (
                  <>
                    <SpokenSynthesis
                      paused={paused}
                      value={
                        run.spoken || {
                          seconds: 0,
                          structure: false,
                          clarity: false,
                          skipped: false,
                        }
                      }
                      onChange={(spoken) => change({ spoken })}
                    />
                    <span className={styles.eyebrow}>The decision record</span>
                    <h1 tabIndex={-1}>Make a call you can stand behind.</h1>
                    <p className={styles.lead}>
                      One primary decision, linked to evidence. State the cost
                      you accept, what you will not do, and the condition for
                      revisiting it.
                    </p>
                    <div className={styles.stack}>
                      <StructuredSelect
                        label="My primary decision"
                        value={run.synthesis.decision}
                        options={q.choices.map((c) => ({
                          id: c.id,
                          label: c.label,
                        }))}
                        onChange={(decision) =>
                          change({ synthesis: { ...run.synthesis, decision } })
                        }
                      />
                      <StructuredSelect
                        label="The observation this decision relies on"
                        value={run.synthesis.evidenceId}
                        options={q.evidence
                          .filter((e) => run.evidenceIds.includes(e.id))
                          .map((e) => ({
                            id: e.id,
                            label: `${e.id} · ${e.title}`,
                          }))}
                        onChange={(evidenceId) =>
                          change({
                            synthesis: { ...run.synthesis, evidenceId },
                          })
                        }
                      />
                      <StructuredSelect
                        label="The trade-off I accept"
                        value={run.synthesis.tradeoff}
                        options={[
                          {
                            id: "speed-risk",
                            label:
                              "Speed and learning over certainty; accept bounded exposure",
                          },
                          {
                            id: "cost-control",
                            label:
                              "Lower exposure over speed; accept delay or lost opportunity",
                          },
                          {
                            id: "scope-quality",
                            label:
                              "Narrower scope for higher reliability; accept incomplete coverage",
                          },
                        ]}
                        onChange={(tradeoff) =>
                          change({ synthesis: { ...run.synthesis, tradeoff } })
                        }
                      />
                      <StructuredSelect
                        label="What I will deliberately not do"
                        value={run.synthesis.notDoing}
                        options={[
                          {
                            id: "broad-rollout",
                            label:
                              "A broad rollout before this cohort is understood",
                          },
                          {
                            id: "parallel-features",
                            label:
                              "Add secondary features while the core problem is unresolved",
                          },
                          {
                            id: "full-rebuild",
                            label:
                              "Rebuild the whole system for a narrow failure",
                          },
                        ]}
                        onChange={(notDoing) =>
                          change({ synthesis: { ...run.synthesis, notDoing } })
                        }
                      />
                      <StructuredSelect
                        label="What I will measure"
                        value={run.synthesis.metric}
                        options={METRICS}
                        onChange={(metric) =>
                          change({ synthesis: { ...run.synthesis, metric } })
                        }
                      />
                      <StructuredSelect
                        label="The guardrail"
                        value={run.synthesis.guardrail}
                        options={GUARDRAILS}
                        onChange={(guardrail) =>
                          change({ synthesis: { ...run.synthesis, guardrail } })
                        }
                      />
                      <StructuredSelect
                        label="When I will stop or reconsider"
                        value={run.synthesis.stopRule}
                        options={[
                          {
                            id: "threshold-review",
                            label:
                              "Review at a defined window; stop if the guardrail breaches its threshold",
                          },
                          {
                            id: "contradicting-evidence",
                            label:
                              "Revisit as soon as the discriminating evidence contradicts this call",
                          },
                          {
                            id: "capacity-limit",
                            label:
                              "Stop when measured capacity or error severity exceeds the agreed limit",
                          },
                        ]}
                        onChange={(stopRule) =>
                          change({ synthesis: { ...run.synthesis, stopRule } })
                        }
                      />
                      <label className={styles.field}>
                        In your own words (optional)
                        <textarea
                          value={run.synthesis.note}
                          maxLength={20000}
                          onChange={(e) =>
                            change({
                              synthesis: {
                                ...run.synthesis,
                                note: e.target.value,
                              },
                            })
                          }
                          placeholder="Name the exact cohort, threshold, time window, or assumption you want in your record."
                        />
                        <small>
                          This note appears in your replay. Free text is not
                          machine-scored.
                        </small>
                      </label>
                    </div>
                  </>
                )}
                {run.stage === "feedback" && (
                  <>
                    <span className={styles.eyebrow}>
                      Feedback comes first · provisional bands
                    </span>
                    <h1 tabIndex={-1}>Here’s what your decisions show.</h1>
                    <div className={styles.scoreHero}>
                      <CheckCircle2 size={34} color="var(--p-green)" />
                      <div>
                        <h2>{score.band}</h2>
                        <p>
                          {score.structureBased
                            ? "Structure-based estimate, not a truthfulness assessment."
                            : "Deterministic feedback from your structured decisions, evidence requests, and recorded checks."}
                        </p>
                      </div>
                    </div>
                    <p className={styles.notice}>
                      <strong>Your next edge: {score.lowest.label}.</strong>{" "}
                      {q.pump}
                    </p>
                    <section
                      className={styles.panel}
                      aria-label="Evidence behind your band"
                    >
                      <h2>Evidence behind this band</h2>
                      <p>
                        Committed direction:{" "}
                        {q.choices.find((c) => c.id === run.synthesis.decision)
                          ?.label || "Not recorded"}
                      </p>
                      <p>
                        Requested evidence:{" "}
                        {q.evidence
                          .filter((e) => run.evidenceIds.includes(e.id))
                          .map((e) => e.title)
                          .join("; ") || "None"}
                        .
                      </p>
                      <p>
                        Linked observation:{" "}
                        {q.evidence.find(
                          (e) => e.id === run.synthesis.evidenceId,
                        )?.text || "No observation linked"}
                      </p>
                      <p>
                        Guardrail:{" "}
                        {GUARDRAILS.find(
                          (g) => g.id === run.synthesis.guardrail,
                        )?.label || "None"}
                        . {variantConstraint(run.seed)}
                      </p>
                      <button
                        className={styles.textButton}
                        onClick={() => setReview("workbench")}
                      >
                        Review my recorded workbench decisions
                      </button>
                    </section>
                    {score.dimensions.map((d) => (
                      <div key={d.id} className={styles.dimension}>
                        <div className={styles.dimensionHead}>
                          <strong>{d.label}</strong>
                          <span>{readinessBand(d.score)}</span>
                        </div>
                        <div
                          className={styles.progressBar}
                          role="meter"
                          aria-label={d.label}
                          aria-valuenow={
                            d.score >= 85 ? 3 : d.score >= 70 ? 2 : 1
                          }
                          aria-valuemin={0}
                          aria-valuemax={3}
                        >
                          <span
                            style={{
                              width: `${d.score >= 85 ? 100 : d.score >= 70 ? 67 : 33}%`,
                            }}
                          />
                        </div>
                        <p>
                          {readinessBand(d.score)} ·{" "}
                          {d.score >= 85
                            ? "Your recorded actions support a clear, evidence-linked decision."
                            : "Make the evidence link, explicit constraint, or verification step visible in the next attempt."}
                        </p>
                      </div>
                    ))}
                    <p className={styles.finePrint} style={{ marginTop: 20 }}>
                      {RUBRIC_LIMIT}
                    </p>
                  </>
                )}
                {run.stage === "replay" && (
                  <>
                    <span className={styles.eyebrow}>
                      Replay / the pivot moment
                    </span>
                    <h1 tabIndex={-1}>
                      {score.trap === "fell"
                        ? "The moment the reasoning drifted."
                        : score.trap === "recovered"
                          ? "You changed course when it mattered."
                          : "You made room for the evidence."}
                    </h1>
                    <div className={styles.event}>
                      <span className={styles.badge}>The trap</span>
                      <blockquote>{q.trap.split("→")[0]}</blockquote>
                      <p>{q.trap.split("→")[1] || q.trap}</p>
                    </div>
                    <p className={styles.lead}>
                      {score.trap === "fell"
                        ? "At the workbench, your choice committed to a cause before the evidence supported it. An earlier independent check would have changed what came next."
                        : score.trap === "recovered"
                          ? "The interviewer’s pushback caused you to reconsider. That revision is part of your reasoning, not a penalty for changing your mind."
                          : "At the workbench you chose a defensible path. The value comes from the evidence and guardrails that support it, not the label of the option."}
                    </p>
                    {q.category === "behavioral" && (
                      <article
                        className={styles.panel}
                        style={{ marginTop: 24 }}
                      >
                        <h2>Your real story, replayed.</h2>
                        <div className={styles.prose}>
                          <h3 style={{ marginTop: 18 }}>The situation</h3>
                          <p>{run.story.stakes || "Not documented."}</p>
                          <h3 style={{ marginTop: 18 }}>My actions</h3>
                          <ol>
                            {run.story.actions
                              .filter(Boolean)
                              .map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                          </ol>
                          <h3>The result</h3>
                          <p>{run.story.result || "Not documented."}</p>
                          <h3 style={{ marginTop: 18 }}>
                            What changed afterward
                          </h3>
                          <p>
                            {run.story.learning} {run.story.later}
                          </p>
                        </div>
                      </article>
                    )}
                    <ol className={styles.timeline}>
                      {run.decisions.map((decision, i) => (
                        <li key={i}>
                          <strong>
                            {stageLabel[decision.stage]} · {decision.action}
                          </strong>
                          <p>
                            {q.choices.find((c) => c.id === decision.value)
                              ?.label ||
                              q.evidence.find((e) => e.id === decision.value)
                                ?.title ||
                              decision.value}
                          </p>
                          {decision.stage === score.pivotStage && (
                            <span className={styles.badge}>
                              Reasoning pivot
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                    {run.synthesis.note && (
                      <div className={styles.scenarioBrief}>
                        <span className={styles.eyebrow}>In your words</span>
                        {run.synthesis.note}
                      </div>
                    )}
                  </>
                )}
                {run.stage === "reflection" && (
                  <>
                    <span className={styles.eyebrow}>
                      Before the expert trace
                    </span>
                    <h1 tabIndex={-1}>How would you grade your reasoning?</h1>
                    <p className={styles.lead}>
                      Give at least one self-grade to continue immediately, or
                      reflect for up to two minutes. Agreement with the engine
                      is not required.
                    </p>
                    <p role="status">
                      {reflectionWait > 0
                        ? `Continue after one self-grade, or in ${reflectionWait}s.`
                        : "You can continue now, with or without a self-grade."}
                    </p>
                    {q.dimensions.map((d) => (
                      <div key={d.id} className={styles.dimension}>
                        <h3>{d.label}</h3>
                        <div
                          className={styles.grade}
                          role="group"
                          aria-label={`Self-grade ${d.label}`}
                        >
                          {[
                            "1 · Missing",
                            "2 · Basic",
                            "3 · Solid",
                            "4 · Strong",
                          ].map((label, i) => (
                            <button
                              key={label}
                              aria-pressed={run.reflection[d.id] === i + 1}
                              onClick={() =>
                                change({
                                  reflection: {
                                    ...run.reflection,
                                    [d.id]: i + 1,
                                  },
                                })
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p>
                          {run.reflection[d.id] === 4
                            ? "I can point to a specific action and observation that supports this dimension."
                            : run.reflection[d.id] === 3
                              ? "The key reasoning move is present, with some uncertainty left explicit."
                              : "What specific move in your replay supports the grade?"}
                        </p>
                      </div>
                    ))}
                    <label className={styles.field} style={{ marginTop: 24 }}>
                      One thing I would do differently (optional)
                      <textarea
                        value={run.reflectionNote}
                        maxLength={20000}
                        onChange={(e) =>
                          change({ reflectionNote: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
                {run.stage === "expert" && (
                  <>
                    {profile && <KeepRun run={run} profile={profile} />}
                    <span className={styles.eyebrow}>
                      Not the only answer. A defensible one.
                    </span>
                    <h1 tabIndex={-1}>Look at the thinking, not the script.</h1>
                    <div className={styles.notice}>
                      Compare your self-grade with the recorded actions below.
                      Neither is a calibrated hiring assessment.
                    </div>
                    <h2 style={{ margin: "30px 0 18px" }}>A reasoning trace</h2>
                    {run.seed > 0 && (
                      <p className={styles.finePrint}>
                        This reference trace describes the baseline case. Use
                        your variant’s observed numbers and binding constraint
                        when comparing the reasoning.
                      </p>
                    )}
                    <ol className={styles.trace}>
                      {q.trace
                        .split(/;\s*|\s+→\s+/)
                        .filter(Boolean)
                        .map((move, i) => (
                          <li key={i}>{move}</li>
                        ))}
                    </ol>
                    <h2 style={{ margin: "32px 0 16px" }}>
                      Other defensible choices
                    </h2>
                    <div className={styles.stack}>
                      {q.alternatives.map((option, i) => (
                        <article className={styles.panel} key={i}>
                          <span className={styles.eyebrow}>Path {i + 1}</span>
                          <p className={styles.prose}>{option}</p>
                        </article>
                      ))}
                    </div>
                    <p className={styles.finePrint} style={{ marginTop: 24 }}>
                      {reviewStatus(q)}. The purpose is a justified decision,
                      not memorising a preferred option.
                    </p>
                  </>
                )}
                {run.stage === "complete" && (
                  <>
                    <span className={styles.eyebrow}>
                      A little clearer than before
                    </span>
                    <h1 tabIndex={-1}>Keep the lesson. Make the next move.</h1>
                    <div className={styles.scoreHero}>
                      <CheckCircle2 size={34} color="var(--p-green)" />
                      <div>
                        <h2>{score.band}</h2>
                        <p>
                          Your weakest dimension is{" "}
                          {score.lowest.label.toLowerCase()}. {q.pump}
                        </p>
                      </div>
                    </div>
                    <div className={styles.stack}>
                      <button
                        className={styles.primary}
                        onClick={() => void retry()}
                      >
                        <RotateCcw size={15} />
                        Retry {score.lowest.label.toLowerCase()} · new variant
                      </button>
                      {recordSaved ? (
                        <Link
                          href={`/app/portfolio/${recordSaved}`}
                          className={styles.secondary}
                        >
                          <FileText size={15} />
                          Open your decision record
                        </Link>
                      ) : (
                        <button
                          className={styles.secondary}
                          onClick={() => void saveRecord()}
                        >
                          <Save size={15} />
                          Save as a decision record
                        </button>
                      )}
                      <Link
                        className={styles.secondary}
                        href={`/app/practice/${questions[(questions.findIndex((question) => question.id === q.id) + 1) % questions.length].slug}`}
                      >
                        Explore the next scenario
                        <ArrowRight size={15} />
                      </Link>
                      <Link className={styles.textButton} href="/app/practice">
                        Back to practice
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            {run.pressureSeconds !== null &&
              !inDebrief &&
              !paused &&
              clock >= run.pressureSeconds && (
                <div className={styles.notice} style={{ marginTop: 20 }}>
                  Your soft timebox is up. No score penalty.{" "}
                  <button
                    className={styles.textButton}
                    onClick={() =>
                      change(
                        { pressureSeconds: (run.pressureSeconds || 0) + 300 },
                        true,
                      )
                    }
                  >
                    Add five minutes
                  </button>
                  <button
                    className={styles.textButton}
                    onClick={() => change({ pressureSeconds: null }, true)}
                  >
                    Continue without a timer
                  </button>
                </div>
              )}
            {!paused && !review && run.stage !== "complete" && (
              <footer className={styles.runFooter}>
                <div>
                  <p aria-live="polite">
                    {saving
                      ? "Saving…"
                      : savedAt
                        ? `Saved on device · ${savedAt}`
                        : "Saved on this device"}
                  </p>
                  {stepIndex > 0 && (
                    <button
                      className={styles.textButton}
                      style={{ fontSize: ".68rem", minHeight: 32 }}
                      onClick={() =>
                        setReview((run.locked.at(-1) as RunStage) || "primer")
                      }
                    >
                      <ArrowLeft size={12} />
                      Review last locked step
                    </button>
                  )}
                </div>
                <button
                  className={styles.primary}
                  disabled={saving || conflict}
                  onClick={() => void next()}
                >
                  {run.stage === "synthesis"
                    ? "Commit & see feedback"
                    : run.stage === "reflection"
                      ? "Unlock the expert trace"
                      : run.stage === "expert"
                        ? "Choose your next move"
                        : "Lock & continue"}
                  <ArrowRight size={15} />
                </button>
              </footer>
            )}
          </div>
        </div>
        <aside className={styles.runNotes}>
          <section>
            <h3>Your session</h3>
            <p>{q.title}</p>
            <p style={{ marginTop: 10 }}>
              {q.level} · {q.minutes} min suggested
            </p>
          </section>
          <div>
            <div className={styles.note}>
              Don’t chase an answer.
              <br />
              Build a reason.
            </div>
            <div className={styles.noteRule} />
          </div>
          <section>
            <h3>A useful constraint</h3>
            <p>
              One decision. An observation that supports it. A cost you accept.
              A reason to reconsider.
            </p>
          </section>
          <section style={{ marginTop: "auto" }}>
            <ShieldCheck size={16} color="var(--p-muted)" />
            <p>
              No audio is recorded. Your work saves on this device. An account
              syncs only after sign-in.
            </p>
          </section>
        </aside>
      </div>
      <Dialog
        open={exit}
        onClose={() => setExit(false)}
        title="Leave your desk for now?"
        description="Your locked decisions and current notes will stay saved on this device."
        size="sm"
      >
        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => setExit(false)}>
            Keep practising
          </button>
          <button
            className={styles.primary}
            onClick={async () => {
              clearTimeout(saveTimer.current);
              if (await persist(current.current!, true)) router.push("/app");
            }}
          >
            Save & exit
            <ArrowRight size={14} />
          </button>
        </div>
      </Dialog>
    </div>
  );
}
