"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  FileText,
  Mic,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import type { Question } from "@/lib/product/types";
import { copyText } from "@/lib/clipboard";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  bindStoryTargets,
  ensureScrollTrigger,
  resolveCalm,
  setCalmVar,
} from "@/lib/scrollStory";
import { scrollState } from "@/lib/scrollState";
import s from "./InterviewPreview.module.css";

type Phase = "idle" | "clarify" | "investigate" | "synthesis" | "review";
type PreviewQuestion = Pick<
  Question,
  | "slug"
  | "title"
  | "scenario"
  | "goal"
  | "evidence"
  | "choices"
  | "dimensions"
  | "trace"
>;
const stages = ["Clarify", "Investigate", "Defend a call", "Reflect"];
const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function InterviewLab({ scenario: q }: { scenario: PreviewQuestion }) {
  const { reducedMotion } = useSettings();
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>("idle"),
    [clarifier, setClarifier] = useState("");
  const [opened, setOpened] = useState<string[]>([]),
    [choice, setChoice] = useState(""),
    [guardrail, setGuardrail] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text"),
    [note, setNote] = useState(""),
    [grade, setGrade] = useState("");
  const [seconds, setSeconds] = useState(120),
    [speaking, setSpeaking] = useState(false),
    [spoken, setSpoken] = useState(0),
    [copied, setCopied] = useState("");
  const phaseIndex = ["clarify", "investigate", "synthesis", "review"].indexOf(
    phase,
  );
  const picked = q.choices.find((c) => c.id === choice);
  const checks = [
    {
      name: q.dimensions[0].label,
      observed: opened.includes("E2") || opened.includes("E3"),
      yes: "You separated the drop by platform or app version.",
      no: "Separate platforms before treating the drop as a product-wide loss.",
    },
    {
      name: q.dimensions[1].label,
      observed: clarifier === "verify",
      yes: "You checked whether the measurement changed before assuming the UI failed.",
      no: "A release and a falling metric do not establish the cause.",
    },
    {
      name: q.dimensions[2].label,
      observed: opened.includes("E1"),
      yes: "You opened the independent server-side sign-up count.",
      no: "Compare the client dashboard with an independent count.",
    },
    {
      name: q.dimensions[3].label,
      observed: !!picked && !picked.trap && opened.includes("E1") && guardrail,
      yes: "Your recorded call has an independent check and a reason to revisit it.",
      no: "Connect the call to independent evidence and a reversal condition.",
    },
  ];
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    bindStoryTargets(
      section,
      "--calm",
      `.${s.copy},.${s.card},.${s.pivots},.${s.leafShadows}`,
    );
    if (reducedMotion) {
      setCalmVar(section, 1);
      return;
    }
    const ST = ensureScrollTrigger();
    const trigger = ST.create({
      trigger: section,
      start: "top 90%",
      end: "center 50%",
      onUpdate: (self) => {
        const calm = resolveCalm(self.progress);
        scrollState.calm = calm;
        setCalmVar(section, calm);
      },
      onRefresh: (self) => setCalmVar(section, resolveCalm(self.progress)),
    });
    return () => trigger.kill();
  }, [reducedMotion]);
  useEffect(() => {
    if (phase === "idle" || phase === "review") return;
    const started = Date.now(),
      initial = seconds;
    const tick = () =>
      setSeconds(
        Math.max(0, initial - Math.floor((Date.now() - started) / 1000)),
      );
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (!speaking || phase !== "synthesis") return;
    const started = Date.now(),
      initial = spoken;
    const timer = setInterval(() => {
      const value = Math.min(
        90,
        initial + Math.floor((Date.now() - started) / 1000),
      );
      setSpoken(value);
      if (value === 90) setSpeaking(false);
    }, 1000);
    return () => clearInterval(timer);
  }, [speaking, phase]);
  useEffect(() => {
    if (phase === "idle") return;
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  const reset = () => {
    setPhase("idle");
    setClarifier("");
    setOpened([]);
    setChoice("");
    setGuardrail(false);
    setNote("");
    setGrade("");
    setSeconds(120);
    setSpeaking(false);
    setSpoken(0);
    setCopied("");
  };
  const review = () => {
    setSpeaking(false);
    setPhase("review");
    try {
      localStorage.setItem(
        "pmforge.interview.preview.v2",
        JSON.stringify({
          question: q.slug,
          opened,
          choiceId: choice,
          guardrail,
          at: Date.now(),
        }),
      );
    } catch {
      /* The preview works without storage. */
    }
  };
  const fullHref = `/app/practice/${q.slug}`;
  return (
    <section
      id="interview"
      ref={root}
      className={s.section}
      aria-labelledby="interview-title"
    >
      <div className={s.leafShadows} aria-hidden="true" />
      <div className={s.inner}>
        <div className={s.copy}>
          <p className="eyebrow">Interview practice</p>
          <h2 id="interview-title" className={`${s.title} display`}>
            Think.
            <br />
            Test.
            <br />
            Defend.
          </h2>
          <p>
            Real interviews turn on the questions you ask and the evidence you
            act on. Try one small decision before taking the room.
          </p>
          <Link href="/app/practice" className="btn btnOutline">
            Explore Interview Practice <ArrowRight size={16} />
          </Link>
          <div className={s.pivots}>
            <span>In the full run</span>
            <p>
              Category workbench → interviewer pushback → spoken synthesis →
              evidence-backed debrief.
            </p>
          </div>
        </div>
        <article
          id="interview-card"
          className={s.card}
          data-phase={phase}
          aria-label="Interactive interview preview"
        >
          <div className={s.cardTop}>
            <span>Root Cause Analysis · Easy</span>
            <span role="timer" aria-label="Preview time remaining">
              <Clock3 size={14} />
              {seconds ? time(seconds) : "Take your time"}
            </span>
          </div>
          <ol className={s.stages} aria-label="Preview stages">
            {stages.map((name, i) => (
              <li
                key={name}
                aria-current={phaseIndex === i ? "step" : undefined}
                data-done={phaseIndex > i || (i === 3 && !!grade)}
              >
                <span>
                  {phaseIndex > i || (i === 3 && grade) ? (
                    <Check size={12} />
                  ) : (
                    i + 1
                  )}
                </span>
                {name}
              </li>
            ))}
          </ol>
          {phase === "idle" ? (
            <>
              <span className={s.kicker}>A two-minute product preview</span>
              <h3>{q.title}</h3>
              <p>{q.scenario}</p>
              <div className={s.dashboard}>
                <span>Client sign-ups</span>
                <strong>−12%</strong>
                <svg viewBox="0 0 240 44" aria-hidden="true">
                  <path
                    d="M1 12 35 10 70 12 105 9 140 11 155 33 190 32 238 35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <small>After release v7.4 · simulated</small>
              </div>
              <button
                className="btn btnPrimary"
                onClick={() => setPhase("clarify")}
              >
                Try the decision preview <ArrowRight size={16} />
              </button>
              <p className={s.fine}>
                A short demonstration of the real workflow. It does not count
                toward your practice coverage.
              </p>
            </>
          ) : (
            <>
              <h3 ref={heading} tabIndex={-1}>
                {phase === "clarify"
                  ? "Start with a better question."
                  : phase === "investigate"
                    ? "Open the evidence you need."
                    : phase === "synthesis"
                      ? "Make one defensible call."
                      : "Notice what your choices support."}
              </h3>
              {phase === "clarify" && (
                <>
                  <p>Your goal: {q.goal} What should you check first?</p>
                  <div
                    className={s.options}
                    role="group"
                    aria-label="Clarifying question"
                  >
                    {[
                      {
                        id: "verify",
                        label:
                          "Did sign-ups fall, or did their measurement change?",
                      },
                      {
                        id: "assume",
                        label: "Which part of the new UI should we roll back?",
                      },
                    ].map((c) => (
                      <button
                        key={c.id}
                        aria-pressed={clarifier === c.id}
                        onClick={() => setClarifier(c.id)}
                      >
                        {c.label}
                        {clarifier === c.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btnPrimary"
                    disabled={!clarifier}
                    onClick={() => setPhase("investigate")}
                  >
                    Inspect the evidence <ArrowRight size={16} />
                  </button>
                </>
              )}
              {phase === "investigate" && (
                <>
                  <p>
                    Open a source to read it. Every number is simulated; opening
                    a card is a recorded action.
                  </p>
                  <div className={s.evidence}>
                    {q.evidence
                      .filter((e) => ["E1", "E2", "E3"].includes(e.id))
                      .map((e) => (
                        <details
                          key={e.id}
                          onToggle={(event) => {
                            if (event.currentTarget.open)
                              setOpened((rows) =>
                                rows.includes(e.id) ? rows : [...rows, e.id],
                              );
                          }}
                        >
                          <summary>
                            <FileText size={16} />
                            {e.title}
                            <span>
                              {opened.includes(e.id) ? "Opened" : "Open"}
                            </span>
                          </summary>
                          <p>{e.text}</p>
                        </details>
                      ))}
                  </div>
                  <p className={s.fine} role="status">
                    {opened.length} of 3 sources opened
                  </p>
                  <button
                    className="btn btnPrimary"
                    disabled={!opened.length}
                    onClick={() => setPhase("synthesis")}
                  >
                    Defend a call <ArrowRight size={16} />
                  </button>
                </>
              )}
              {phase === "synthesis" && (
                <>
                  <div
                    className={s.options}
                    role="group"
                    aria-label="Decision direction"
                  >
                    {q.choices.map((c) => (
                      <button
                        key={c.id}
                        aria-pressed={choice === c.id}
                        onClick={() => setChoice(c.id)}
                      >
                        {c.label}
                        {choice === c.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                  <label className={s.check}>
                    <input
                      type="checkbox"
                      checked={guardrail}
                      onChange={(e) => setGuardrail(e.target.checked)}
                    />
                    Revisit the call if independent server sign-ups also fall.
                  </label>
                  <div
                    className={s.mode}
                    role="group"
                    aria-label="Rehearsal mode"
                  >
                    <button
                      aria-pressed={mode === "text"}
                      onClick={() => {
                        setMode("text");
                        setSpeaking(false);
                      }}
                    >
                      Write notes
                    </button>
                    <button
                      aria-pressed={mode === "voice"}
                      onClick={() => setMode("voice")}
                    >
                      <Mic size={14} />
                      Say it aloud
                    </button>
                  </div>
                  {mode === "voice" ? (
                    <div className={s.spoken}>
                      <strong>{time(90 - spoken)}</strong>
                      <p>
                        Give your recommendation, evidence and reversal
                        condition. No recording or speech analysis.
                      </p>
                      <button
                        className="btn btnOutline btnSm"
                        onClick={() => setSpeaking((v) => !v)}
                        disabled={spoken === 90}
                      >
                        {spoken === 90
                          ? "Rehearsal complete"
                          : speaking
                            ? "Pause rehearsal"
                            : "Start 90-second rehearsal"}
                      </button>
                    </div>
                  ) : (
                    <label className={s.notes}>
                      Your reasoning, in your own words
                      <textarea
                        id="interview-answer"
                        value={note}
                        maxLength={2000}
                        rows={3}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Your call, the evidence behind it, and what would change your mind."
                      />
                      <small>
                        Private rehearsal notes. Never machine-scored.
                      </small>
                    </label>
                  )}
                  <button
                    className="btn btnPrimary"
                    disabled={!choice || !guardrail}
                    onClick={review}
                  >
                    Review my recorded choices <ArrowRight size={16} />
                  </button>
                </>
              )}
              {phase === "review" && (
                <div id="interview-feedback" className={s.feedback}>
                  <p>
                    These checks reflect what you opened and chose. Your notes
                    and spoken delivery were not scored.
                  </p>
                  {checks.map((c) => (
                    <div
                      key={c.name}
                      data-preview-check={c.observed ? "observed" : "missing"}
                    >
                      <span>
                        {c.observed ? (
                          <Check size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <p>{c.observed ? c.yes : c.no}</p>
                      </div>
                    </div>
                  ))}
                  <fieldset className={s.reflection}>
                    <legend>How would you self-grade this call?</legend>
                    {[
                      "I missed a useful check",
                      "I can explain the tradeoff",
                      "I would defend it, with a guardrail",
                    ].map((value) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="preview-reflection"
                          value={value}
                          checked={grade === value}
                          onChange={() => setGrade(value)}
                        />
                        {value}
                      </label>
                    ))}
                  </fieldset>
                  {grade && (
                    <div className={s.trace}>
                      <strong>One useful lesson</strong>
                      <p>
                        Verify the metric before changing the product. A
                        cautious pause and a tracking hotfix can both be
                        defensible when you name the cost and your next check.
                      </p>
                    </div>
                  )}
                  <div className={s.actions}>
                    <button
                      className="btn btnOutline btnSm"
                      onClick={() => {
                        setPhase("synthesis");
                        setGrade("");
                      }}
                    >
                      Revise the call
                    </button>
                    <button
                      className="btn btnOutline btnSm"
                      onClick={async () =>
                        setCopied(
                          (await copyText(
                            [
                              "PMForge decision preview",
                              ...checks.map(
                                (c) =>
                                  `${c.name}: ${c.observed ? c.yes : c.no}`,
                              ),
                              "Notes and spoken delivery were not scored.",
                            ].join("\n"),
                          ))
                            ? "Checks copied."
                            : "Copy unavailable. Select the checks above.",
                        )
                      }
                    >
                      Copy checks
                    </button>
                  </div>
                  <p role="status" className={s.fine}>
                    {copied}
                  </p>
                </div>
              )}
              <div className={s.cardFooter}>
                <Link href={fullHref}>
                  Take the full guided Easy run <ArrowRight size={15} />
                </Link>
                <button onClick={reset} aria-label="Reset decision preview">
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </>
          )}
        </article>
        <aside className={s.rubric}>
          <span className={s.kicker}>What the full product observes</span>
          <h3>A rubric that follows the room.</h3>
          <ul>
            {q.dimensions.map((d) => (
              <li key={d.id}>
                <span />
                {d.label}
              </li>
            ))}
          </ul>
          <p>
            Each category has its own workbench and rubric. Feedback cites your
            recorded choices, evidence and checks.
          </p>
          <p>
            Free text is rehearsal, not a keyword test. Spoken delivery and
            originality need human judgment. Expert calibration is pending.
          </p>
          <Link href={fullHref}>
            Start an 8-minute guided run <ArrowRight size={15} />
          </Link>
        </aside>
      </div>
    </section>
  );
}
