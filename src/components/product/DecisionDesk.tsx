"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Shuffle,
  Paperclip,
  Info,
  FileText,
} from "lucide-react";
import { questions, categoryOf, evidenceBudget, getQuestion } from "@/lib/product/content";
import { createRun, stageLabel } from "@/lib/product/engine";
import { createLive } from "@/lib/product/interview-live";
import { saveRun } from "@/lib/product/db";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceData } from "./useWorkspaceData";
import {
  coverageByRoom,
  dailyPick,
  litCount,
  nextUnlitInRoom,
  readTodayProgress,
  streak,
  todayKey,
  weekActivity,
  writeTodayProgress,
  type TodayProgress,
} from "@/lib/product/todayProgress";
import type { Question, Run } from "@/lib/product/types";
import u from "./Product.module.css";
import s from "./DecisionDesk.module.css";
import { ROOM_BY_ID, ROOMS } from "@/lib/product/rooms";
import { warmupFor } from "@/lib/product/todayWarmup";
import { layoutStars } from "@/lib/product/todayGeometry";


export default function DecisionDesk() {
  const { profile } = useWorkspace();
  const { runs } = useWorkspaceData();
  const router = useRouter();
  const [initialProgress] = useState<TodayProgress>(() => readTodayProgress());
  const initialRerolls = initialProgress.daily.date === todayKey() ? initialProgress.daily.rerolls || 0 : 0;
  const [reroll, setReroll] = useState(initialRerolls);
  const [deckMoving, setDeckMoving] = useState(false);
  const [table, setTable] = useState(false);
  const [chartIndex, setChartIndex] = useState(9);
  const [chartHover, setChartHover] = useState(false);
  const [chartFocus, setChartFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [firstLight, setFirstLight] = useState(false);
  const [progress, setProgress] = useState<TodayProgress>(initialProgress);
  const caseRef = useRef<HTMLElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<SVGCircleElement>(null);
  const threadRef = useRef<SVGPathElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [warmChoice, setWarmChoice] = useState<string>("");

  const open = runs.find((run) => !run.completedAt && run.status !== "complete");
  const openQuestion = open ? getQuestion(open.questionId) : null;
  const completed = runs.filter((run) => run.completedAt);
  const coverage = coverageByRoom(runs);
  const lit = litCount(runs);
  const streakDays = streak(runs);
  const q = useMemo(
    () =>
      (openQuestion ||
        dailyPick(runs, profile?.id || "guest", reroll) ||
        questions[0]) as Question,
    [openQuestion, profile?.id, reroll, runs],
  );
  const warmup = useMemo(() => warmupFor(q), [q]);
  const starLayout = useMemo(layoutStars, []);
  const targetRoomIndex = ROOMS.findIndex((roomItem) => roomItem.id === q.category);
  const target = starLayout.find((star) => star.room === targetRoomIndex && star.k === 7);
  const activity = useMemo(() => {
    const real: Record<string, number> = {};
    completed.forEach((run) => {
      const key = todayKey(new Date(run.completedAt!));
      real[key] = (real[key] || 0) + 1;
    });
    return real;
  }, [completed]);
  const week = weekActivity(activity);
  const unlitInRoom = nextUnlitInRoom(runs, q.category);
  const starsByRoom = (roomIndex: number) =>
    starLayout.filter((star) => star.room === roomIndex);
  const doneIds = new Set(completed.map((run) => run.questionId));
  const chartValues = [49, 44, 50, 38, 44, 30, 36, 27, 31, 86, 80, 93, 84, 91, 85];
  const chartDates = ["Aug 1", "Aug 3", "Aug 5", "Aug 8", "Aug 10", "Aug 12", "Aug 14", "Aug 16", "Aug 18", "Release", "Aug 22", "Aug 24", "Aug 27", "Aug 29", "Aug 31"];

  useEffect(() => {
    const date = todayKey();
    const activityNext = { ...progress.activity };
    Object.entries(activity).forEach(([key, value]) => { activityNext[key] = value; });
    const litNext = { ...progress.lit };
    completed.forEach((run) => {
      if (!litNext[run.questionId]) {
        litNext[run.questionId] = {
          litAt: run.completedAt!,
          roomId: getQuestion(run.questionId)?.category || "root-cause",
        };
      }
    });
    const next: TodayProgress = {
      ...progress,
      lit: litNext,
      inProgress: open
        ? { scenarioId: open.questionId, step: Math.max(1, progress.inProgress?.step || 1), startedAt: open.startedAt }
        : null,
      activity: activityNext,
      daily: progress.daily.date === date ? progress.daily : { date, scenarioId: q.id, rerolls: reroll },
    };
    setStorageError(!writeTodayProgress(next));
    setProgress(next);
    // eslint-disable-next-line react-hooks/exhaustive-hooks
  }, [lit, runs.length, q.id]);

  useEffect(() => {
    const rebuild = () => {
      if (!rootRef.current || !caseRef.current || !metaRef.current || !targetRef.current || !threadRef.current) return;
      const root = rootRef.current.getBoundingClientRect();
      const caseRect = caseRef.current.getBoundingClientRect();
      const meta = metaRef.current.getBoundingClientRect();
      const star = targetRef.current.getBoundingClientRect();
      const x1 = caseRect.right - root.left;
      const y1 = meta.top + meta.height / 2 - root.top;
      const x2 = star.left + star.width / 2 - root.left;
      const y2 = star.top + star.height / 2 - root.top;
      threadRef.current.setAttribute("d", `M ${x1} ${y1} C ${x1 + 110} ${y1}, ${x2 - 110} ${y2}, ${x2} ${y2}`);
    };
    rebuild();
    const observer = new ResizeObserver(rebuild);
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [q.id]);

  useEffect(() => {
    const justLit = Object.keys(progress.lit).filter((id) => !progress.seenLit.includes(id));
    if (!justLit.length) return;
    const timer = window.setTimeout(() => {
      setFirstLight(true);
      const next = { ...progress, seenLit: [...progress.seenLit, ...justLit] };
      writeTodayProgress(next);
      setProgress(next);
      window.setTimeout(() => setFirstLight(false), 2500);
    }, 700);
    return () => window.clearTimeout(timer);
    // Replay only newly observed lit stars.
    // eslint-disable-next-line react-hooks/exhaustive-hooks
  }, [lit]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>("[aria-label='Search the workspace']")?.click();
      }
      if ((event.key === "Enter" || event.key === " ") && document.activeElement === ctaRef.current) {
        // Native activation remains the source of truth.
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const start = async (targetQuestion = q) => {
    if (!profile || busy) return;
    setBusy(true);
    try {
      const existing = runs.find((run) => run.questionId === targetQuestion.id && !run.completedAt && run.status !== "complete");
      if (existing) {
        router.push(`/app/run/${existing.id}`);
        return;
      }
      const run = createRun(targetQuestion, profile.id, runs.filter((runItem) => runItem.questionId === targetQuestion.id).length % 3);
      run.live = createLive();
      run.guided = runs.length === 0;
      await saveRun(run, 0, true);
      if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(() => router.push(`/app/run/${run.id}`));
      } else {
        router.push(`/app/run/${run.id}`);
      }
    } catch {
      setError("Could not save a new session. Enable device storage and retry.");
      setStorageError(true);
      setBusy(false);
    }
  };

  const pickAnother = () => {
    if (open) return;
    setDeckMoving(true);
    window.setTimeout(() => {
      const next = reroll + 1;
      setReroll(next);
      setProgress((current) => {
        const nextProgress = { ...current, daily: { ...current.daily, rerolls: next } };
        writeTodayProgress(nextProgress);
        return nextProgress;
      });
      setDeckMoving(false);
    }, 600);
  };

  const backUp = () => {
    const backedUp = { ...progress, lastBackupAt: new Date().toISOString() };
    const saved = writeTodayProgress(backedUp);
    if (!saved) {
      setStorageError(true);
      return;
    }
    setProgress(backedUp);
    const blob = new Blob([JSON.stringify(backedUp, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pmforge-today-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const greeting = lit === 63
    ? "Every star is lit. Time to build your portfolio."
    : open
      ? "You left a case open. Pick it back up?"
      : runs.length
        ? "Good morning. Your case is ready."
        : "Welcome to the desk. One decision is waiting.";
  const chartX = 5 + chartIndex * (640 / 14);
  const chartY = chartValues[chartIndex] * 0.9 + 4;

  return (
    <div className={s.page} ref={rootRef} data-enter>
      <svg className={s.thread} aria-hidden="true"><path ref={threadRef} /></svg>
      <header className={s.greeting}>
        <div className={s.dateTicket}><b>{new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</b><span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
        <h1>{greeting}</h1>
      </header>

      <div className={s.deskGrid}>
        <section className={`${s.caseDeck} ${deckMoving ? s.deckMoving : ""}`} aria-label="Today’s case">
          <div className={s.peekPaperOne} />
          <div className={s.peekPaperTwo} />
          <article className={s.caseFile} ref={caseRef}>
            <div className={s.folderTab}><span>{ROOM_BY_ID[q.category].label}</span></div>
            <div className={s.clip}><Paperclip size={30} /></div>
            <div className={s.caseSurface}>
            <div className={s.caseEyebrow}>On your desk today</div>
            <h2 style={{ "--case-h": `${q.title.length <= 40 ? 60 : q.title.length <= 70 ? 48 : 40}px` } as React.CSSProperties}>{q.title}</h2>
            <p className={s.caseSummary}>{(q.id === "RCA-E-1" ? "Two numbers disagree after a release. Find out whether the product changed, or the measurement did." : q.goal).replace(/^./, (letter) => letter.toUpperCase()).replace(/[.!?]$/, "")}.</p>

            <div
              className={s.chart}
              tabIndex={0}
              role="group"
              aria-label="Interactive illustrative evidence signal. Use left and right arrow keys to inspect values."
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const index = Math.max(0, Math.min(14, Math.round(((event.clientX - rect.left) / rect.width) * 14)));
                setChartIndex(index);
                setChartHover(true);
              }}
              onMouseLeave={() => setChartHover(false)}
              onFocus={() => setChartFocus(true)}
              onBlur={() => setChartFocus(false)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") { event.preventDefault(); setChartIndex((value) => Math.max(0, value - 1)); }
                if (event.key === "ArrowRight") { event.preventDefault(); setChartIndex((value) => Math.min(14, value + 1)); }
              }}
            >
              <svg viewBox="0 0 650 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Illustrative signal falling after a release">
                <line x1={416} x2={416} y1="0" y2="112" className={s.releaseLine} />
                <text x="422" y="18" className={s.releaseLabel}>release</text>
                <path className={s.chartLine} d="M5 49 L55 44 L105 50 L155 38 L205 44 L255 30 L305 36 L355 27 L395 31 L405 86 L455 80 L505 93 L555 84 L605 91 L645 85" />
                <circle cx={chartX} cy={chartY} r="6" className={s.chartDot} />
                {(chartHover || chartFocus) && <g className={s.crosshair}><line x1={chartX} x2={chartX} y1="8" y2="112" /><rect x={chartX > 560 ? chartX - 118 : chartX + 7} y={Math.max(4, chartY - 38)} width="112" height="34" rx="5" /><text x={chartX > 560 ? chartX - 112 : chartX + 13} y={Math.max(20, chartY - 22)}>{chartDates[chartIndex]} · {100 - chartValues[chartIndex]}%</text></g>}
              </svg>
              <span className={s.chartCaption}><Info size={13} /> Illustrative signal</span>
              <span className={s.srOnly} aria-live="polite">{chartDates[chartIndex]}, {100 - chartValues[chartIndex]} percent</span>
              <span className={`${s.stamp} ${open ? s.stampProgress : completed.some((run) => run.questionId === q.id) ? s.stampDone : ""}`} data-decor>
                {open ? "In progress" : completed.some((run) => run.questionId === q.id) ? "Decided" : "Not started"}
              </span>
            </div>

            <div className={s.metadata} ref={metaRef}>
              <span className={s.metaRoom} title={ROOM_BY_ID[q.category].label}>{ROOM_BY_ID[q.category].label}<i>{ROOM_BY_ID[q.category].code}</i></span>
              <span className={s.metaChip}><b>Difficulty</b><i className={s.difficultyDots}>{[1, 2, 3].map((dot) => <em key={dot} className={["easy", "medium", "hard"].indexOf(q.level) >= dot - 1 ? s.dotLit : ""} />)}</i>{q.level}</span>
              <span className={s.metaChip}><Clock3 size={14} /><b>{q.minutes} min</b></span>
              <span className={s.credits} title="Evidence you open uses credits. Open what you need."><b>{evidenceBudget(q.level)}</b><i><em /><em /><em /><em /><em /><em /></i><span>evidence credits</span></span>
            </div>

            <div className={s.actions}>
              <button ref={ctaRef} className={s.primary} disabled={busy} onClick={() => void start()}>
                <span>{open ? "Resume investigation" : completed.some((run) => run.questionId === q.id) ? "Defend this decision again" : "Step into the scenario"}</span><ArrowRight size={18} /><kbd>Enter</kbd>
              </button>
              {open ? (
                <button className={s.secondary} disabled title="The case you left open is kept"><Shuffle size={15} /> Start something else</button>
              ) : (
                <button className={s.secondary} onClick={pickAnother}><Shuffle size={15} /> Pick another</button>
              )}
              <Link className={s.browse} href={`/app/practice`}>Browse all {questions.length}</Link>
            </div>
            {error && <p role="alert" className={s.error}>{error}</p>}
            </div>
          </article>
        </section>

        <aside className={s.constellationPanel} aria-label="Coverage and momentum">
          <header className={s.skyHeader}>
            <div><span className={u.eyebrow}>Coverage & momentum</span><strong>{lit} <small>lit</small></strong></div>
            <div className={s.segmented} role="tablist" aria-label="Constellation view">
              <span className={!table ? s.selected : ""} />
              <button role="tab" aria-selected={!table} onClick={() => setTable(false)}>Sky</button>
              <button role="tab" aria-selected={table} onClick={() => setTable(true)}>Table</button>
            </div>
          </header>
          {!table ? (
            <>
              <svg className={s.sky} viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${lit} of 63 decisions lit. Seven rooms, nine stars each.`}>
                <ellipse cx="210" cy="188" rx="118" ry="106" className={s.orbit} />
                <ellipse cx="210" cy="188" rx="172" ry="154" className={s.orbit} />
                {lit === 0 && <text x="210" y="184" textAnchor="middle" className={s.skyZero}>0</text>}
                {lit === 0 && <text x="210" y="205" textAnchor="middle" className={s.skyLabel}>DECISIONS LIT</text>}
                {lit > 0 && <text x="210" y="184" textAnchor="middle" className={s.skyZero}>{lit}</text>}
                {lit > 0 && <text x="210" y="205" textAnchor="middle" className={s.skyLabel}>DECISIONS LIT</text>}
                {ROOMS.map((roomItem) => {
                  const angle = (roomItem.order / 7) * Math.PI * 2 - Math.PI / 2;
                  const x = 210 + Math.cos(angle) * 184;
                  const y = 188 + Math.sin(angle) * 184 * 0.9;
                  return <g key={roomItem.id} className={s.armLabel}><circle cx={x} cy={y} r="11" /><text x={x} y={y + 4} textAnchor="middle"><title>{roomItem.label}</title>{roomItem.code}</text></g>;
                })}
                {starLayout.map((star, index) => {
                  const roomItem = ROOMS[star.room];
                  const roomQuestions = questions.filter((qItem) => qItem.category === roomItem.id);
                  const questionId = roomQuestions[star.k]?.id;
                  const isLit = Boolean(questionId) && doneIds.has(questionId);
                  const isTarget = star.room === targetRoomIndex && star.k === 7 && !open;
                  const roomComplete = coverage[roomItem.id] === 9;
                  return <g key={`${star.room}-${star.k}`} className={`${s.starGroup} ${isTarget ? s.target : ""}`} role="group" tabIndex={0} aria-label={`${roomItem.label}, ${coverage[roomItem.id]} of 9 lit${isLit ? ", lit" : ""}`} onClick={() => router.push(isLit || roomQuestions[star.k] ? `/app/practice/${roomQuestions[star.k]?.slug}` : categoryOf(roomItem.id).id ? `/app/practice?category=${roomItem.id}` : "/app/practice")}>
                    {isLit && star.k > 0 && <line x1={starLayout[index - 1]?.x} y1={starLayout[index - 1]?.y} x2={star.x} y2={star.y} className={s.starLink} />}
                    <circle ref={isTarget ? targetRef : undefined} cx={star.x} cy={star.y} r={isTarget ? 8 : isLit ? 7 : 5} className={isLit ? s.starLit : isTarget ? s.starTarget : s.starDark} />
                    {roomComplete && star.k === 8 && <text x={star.x} y={star.y + 22} textAnchor="middle" className={s.completeMark}>✓</text>}
                  </g>;
                })}
              </svg>
              {firstLight && <span className={s.firstLight}>First light.</span>}
              <p className={s.skyCopy}>{lit === 0 ? "63 stars, all dark. Finish today's case to light the first." : `${lit} decisions lit. ${questions.length - lit} stars are still waiting.`}</p>
              <div className={s.legend} aria-label="Coverage by room">
                {ROOMS.map((roomItem) => (
                  <Link href={`/app/practice?category=${roomItem.id}`} key={roomItem.id} title={`${roomItem.label}, ${coverage[roomItem.id]} of 9 lit`}>
                    <span>{roomItem.code}</span><b>{roomItem.label}</b><em>{coverage[roomItem.id]} / 9</em>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className={s.tableWrap}>
              <table>
                <caption>Constellation coverage, 63 scenarios</caption>
                <thead><tr><th>Room</th><th>Lit</th><th>Total</th></tr></thead>
                <tbody>{ROOMS.map((roomItem) => <tr key={roomItem.id}><td><Link href={`/app/practice?category=${roomItem.id}`}>{roomItem.label}</Link></td><td>{coverage[roomItem.id]}</td><td>9</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </aside>
      </div>

      <section className={s.weekStrip} aria-label="Practice activity this week">
        <div className={s.weekDays}>
          {week.map((day) => (
            <button key={day.key} className={day.count ? s.weekDone : day.today ? s.weekToday : ""} title={`${day.count} decisions on ${day.date.toLocaleDateString("en-US", { weekday: "short" })}`} aria-label={`${day.date.toLocaleDateString("en-US", { weekday: "long" })}, ${day.count} decisions`}>
              <span>{day.date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2).toUpperCase()}</span>{day.count || ""}
            </button>
          ))}
        </div>
        <div className={s.weekSummary}>
          <span>This week: {Object.values(activity).reduce((sum, value) => sum + value, 0)} decisions. One is enough.</span>
          {streakDays >= 2 && <b>{streakDays} days</b>}
        </div>
      </section>

      <div className={s.lowerGrid}>
        <article className={s.lowerCard}>
          <span className={s.cardEyebrow}>Resume</span>
          {open && openQuestion ? <><h2>Pick up where you left off.</h2><p>{openQuestion.title}</p><div className={s.progressRing} style={{ "--step": `${Math.max(8, stageLabel[open.stage] ? 35 : 8)}%` } as React.CSSProperties}><span>{stageLabel[open.stage] || "Open"}</span></div><button onClick={() => void start(openQuestion)} className={s.cardAction}>Continue <ArrowRight size={15} /></button></> : <><h2>Pick up where you left off.</h2><div className={s.cleanDesk}><FileText size={38} /><Paperclip size={28} /></div><p>Nothing open. A clean desk.</p><Link href="/app/practice" className={s.cardAction}>Browse practice <ArrowRight size={15} /></Link></>}
        </article>
        {warmup && <article className={s.lowerCard}>
          <span className={s.cardEyebrow}>Warm-up</span>
          <h2>One useful question</h2>
          <p className={s.warmQuestion}>{warmup.question}</p>
          <div className={s.warmChoices}>{warmup.options.map((choice) => <button key={choice.id} className={warmChoice === choice.id ? s.warmSelected : ""} onClick={() => setWarmChoice(choice.id)}>{choice.label}</button>)}</div>
          <small>Warm-ups do not light stars. They warm you up.</small>
        </article>}
        <article className={`${s.lowerCard} ${!warmup ? s.portfolioWide : ""}`}>
          <span className={s.cardEyebrow}>Portfolio</span>
          <h2>Your reasoning, so far.</h2>
          {completed.length ? <><p>{completed[0].questionId ? getQuestion(completed[0].questionId)?.title : ""}</p><Link href="/app/portfolio" className={s.cardAction}>Open portfolio <ArrowRight size={15} /></Link></> : <><div className={s.ghostPaper}><i /><i /><i /><i /></div><p>Your first decision becomes a case study here.</p><Link href="/app/portfolio" className={s.cardAction}>See portfolio <ArrowRight size={15} /></Link></>}
        </article>
      </div>
    </div>
  );
}
