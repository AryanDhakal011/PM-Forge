"use client";

import Link from "next/link";
import { readinessBand, RUBRIC_LIMIT } from "@/lib/product/readiness";
import gsap from "gsap";
import {
  ArrowRight,
  ClipboardCopy,
  Clock3,
  Gauge,
  Mic,
  RotateCcw,
  Send,
  Square,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import { interviewCase } from "@/lib/content";
import {
  evaluateInterview,
  rubricBands,
  rubricSummary,
  type Evaluation,
} from "@/lib/rubric";
import { copyText } from "@/lib/clipboard";
import { scrollToElement } from "@/lib/scrollTo";
import { track } from "@/lib/analytics";
import { scrollState } from "@/lib/scrollState";
import {
  ensureScrollTrigger,
  resolveCalm,
  setCalmVar,
  bindStoryTargets,
} from "@/lib/scrollStory";
import styles from "./InterviewLab.module.css";

type Phase = "idle" | "live" | "review";
type Mode = "voice" | "text";
type MicState =
  "idle" | "requesting" | "granted" | "denied" | "absent" | "stopped";
type DictationState = "off" | "starting" | "on" | "unsupported";

type SpeechAlternative = { transcript: string };
type SpeechResult = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternative;
};
type SpeechResultEvent = Event & {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechend: (() => void) | null;
};
type SpeechConstructor = new () => SpeechRecognitionLike;

function getSpeechConstructor(): SpeechConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechConstructor;
    webkitSpeechRecognition?: SpeechConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

const MIN_CHARS = 80;
const PIVOT_PROMPTS: Record<string, string> = {
  problem: "What exactly changed, for whom, and where in the journey?",
  impact: "What user outcome moves, and what business metric follows it?",
  risks: "What could still go wrong, and when will you look again?",
  prioritization:
    "What are you choosing not to do, and why is that acceptable?",
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function InterviewLab() {
  const { playCue, reducedMotion } = useSettings();
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<Mode>("voice");
  const [micState, setMicState] = useState<MicState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(interviewCase.minutes * 60);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [activePivot, setActivePivot] = useState<number | null>(null);
  const [levelPercent, setLevelPercent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [dictation, setDictation] = useState<DictationState>("off");
  const [interim, setInterim] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [rubricOpen, setRubricOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictationWanted = useRef(false);
  const startDictationRef = useRef<() => void>(() => undefined);
  const resetTimerRef = useRef(0);
  const restartTimerRef = useRef(0);
  const restartDelayRef = useRef(150);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const speechLevelRef = useRef(0);
  speechLevelRef.current = levelPercent;
  const sectionRef = useRef<HTMLElement>(null);
  const startedAtRef = useRef<number>(0);
  const timeoutRef = useRef(false);
  const mountedRef = useRef(true);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const rubricTriggerRef = useRef<HTMLButtonElement>(null);

  const stopDictation = useCallback(() => {
    dictationWanted.current = false;
    window.clearTimeout(restartTimerRef.current);
    restartDelayRef.current = 150;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch {
        // Some engines throw if the session already ended.
      }
    }
    if (mountedRef.current) {
      setDictation("off");
      setInterim("");
      setLevelPercent(0);
      setMicState((current) => (current === "granted" ? "stopped" : current));
    }
  }, []);

  const startDictation = useCallback(() => {
    if (recognitionRef.current) return;
    if (!window.isSecureContext) {
      setDictation("off");
      setMicState("denied");
      setSpeechError(
        "Voice typing requires a secure HTTPS connection. Type your answer instead.",
      );
      return;
    }
    const Constructor = getSpeechConstructor();
    if (!Constructor) {
      setDictation("unsupported");
      setSpeechError(
        "Voice typing is not available in this browser. Type your answer instead — the rubric reads the same text.",
      );
      return;
    }

    const recognition = new Constructor();
    recognition.lang = speechLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!mountedRef.current) return;
      setDictation("on");
      setMicState("granted");
      setSpeechError("");
      restartDelayRef.current = 150;
    };

    recognition.onresult = (event: SpeechResultEvent) => {
      let finalText = "";
      let draft = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalText += transcript;
        else draft += transcript;
      }
      if (finalText.trim()) {
        const field = answerRef.current;
        const current = field?.value ?? answer;
        const start = field?.selectionStart ?? current.length;
        const end = field?.selectionEnd ?? current.length;
        const separator =
          start > 0 && !/\s$/.test(current.slice(0, start)) ? " " : "";
        const insertion = `${separator}${finalText.trim()} `;
        const next =
          `${current.slice(0, start)}${insertion}${current.slice(end)}`.slice(
            0,
            4000,
          );
        setAnswer(next);
        window.requestAnimationFrame(() => {
          const caret = Math.min(start + insertion.length, next.length);
          field?.setSelectionRange(caret, caret);
        });
      }
      if (mountedRef.current) setInterim(draft.trim());
    };
    const indicateSpeech = () => {
      if (mountedRef.current) setLevelPercent(100);
    };
    recognition.onaudiostart = indicateSpeech;
    recognition.onsoundstart = indicateSpeech;
    recognition.onspeechstart = indicateSpeech;
    recognition.onsoundend = () => {
      if (mountedRef.current) setLevelPercent(0);
    };
    recognition.onspeechend = () => {
      if (mountedRef.current) setLevelPercent(0);
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "no-speech" || code === "aborted") return;
      dictationWanted.current = false;
      if (!mountedRef.current) return;
      setDictation("off");
      setInterim("");
      if (code === "not-allowed" || code === "service-not-allowed") {
        setMicState("denied");
        setSpeechError(
          "Voice typing was blocked. Allow microphone access in your browser settings, or type the answer instead.",
        );
      } else if (code === "audio-capture") {
        setMicState("absent");
        setSpeechError(
          "No microphone was found. Type your answer — voice is optional here.",
        );
      } else if (code === "network") {
        setSpeechError(
          "The browser's speech service is unreachable. Your typed answer still works offline.",
        );
      } else {
        setSpeechError(
          "Dictation stopped unexpectedly. You can restart it or keep typing.",
        );
      }
      track("mic_permission", { result: `speech_${code}` });
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;
      setInterim("");
      if (dictationWanted.current) {
        const delay = restartDelayRef.current;
        restartDelayRef.current = Math.min(restartDelayRef.current * 2, 2000);
        restartTimerRef.current = window.setTimeout(() => {
          if (dictationWanted.current) startDictationRef.current();
        }, delay);
      } else {
        setDictation("off");
        setLevelPercent(0);
      }
    };

    recognitionRef.current = recognition;
    dictationWanted.current = true;
    setDictation("starting");
    try {
      recognition.start();
    } catch {
      dictationWanted.current = false;
      recognitionRef.current = null;
      setDictation("off");
      setSpeechError(
        "Dictation could not start. Type your answer; the rubric still works.",
      );
    }
  }, [answer, speechLanguage]);

  useEffect(() => {
    startDictationRef.current = startDictation;
  }, [startDictation]);

  const stopAudio = useCallback(() => {
    stopDictation();
    if (mountedRef.current) {
      setLevelPercent(0);
      setMicState((current) =>
        current === "granted" || current === "requesting" ? "stopped" : current,
      );
    }
  }, [stopDictation]);

  useEffect(() => {
    mountedRef.current = true;
    if (navigator.language) setSpeechLanguage(navigator.language);
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    const onHide = () => {
      stopAudio();
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [stopAudio]);

  useEffect(() => {
    const onPopState = () => {
      if (window.location.hash === "#/interview/scoring") return;
      setRubricOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /**
   * The answer sheet comes to rest as the section enters. Pass-through
   * trigger only: the lab itself stays fully usable at any scroll position.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    bindStoryTargets(
      section,
      "--calm",
      `.${styles.copy},.${styles.card},.${styles.pivots},.${styles.leafShadows}`,
    );

    if (reducedMotion) {
      scrollState.calm = 1;
      setCalmVar(section, 1);
      return;
    }

    const ScrollTrigger = ensureScrollTrigger();
    const apply = (value: number) => {
      const calm = resolveCalm(value);
      scrollState.calm = calm;
      setCalmVar(section, calm);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 82%",
      end: "center 46%",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);

    return () => trigger.kill();
  }, [reducedMotion]);

  const openRubric = () => {
    window.history.pushState(
      { dialog: "interview-scoring" },
      "",
      "#/interview/scoring",
    );
    setRubricOpen(true);
  };

  // Finite transitions follow the actual session. Nothing here starts audio
  // or substitutes an animation for microphone permission or speech events.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const context = gsap.context(() => {
      if (phase === "review") {
        gsap.fromTo(
          resultsRef.current,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.32,
            clearProps: "opacity,transform",
          },
        );
      }
      gsap.fromTo(
        `.${styles.timer}`,
        { y: 2, opacity: 0.72 },
        {
          y: 0,
          opacity: 1,
          duration: 0.18,
          clearProps: "opacity,transform",
        },
      );
    }, section);
    return () => context.revert();
  }, [phase, secondsLeft, reducedMotion]);

  const closeRubric = () => {
    if (window.location.hash === "#/interview/scoring") {
      window.history.back();
    } else {
      setRubricOpen(false);
    }
  };

  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let visible = false;
    let lastFrame = 0;
    const animate =
      !reducedMotion &&
      phase === "live" &&
      mode === "voice" &&
      dictation === "on";
    const context = canvas.getContext("2d");
    if (!context) return;

    const render = (now: number) => {
      if (!visible) return;
      if (now - lastFrame >= 50 && width > 0 && height > 0) {
        lastFrame = now;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.lineWidth = 1.35;
        context.strokeStyle = "rgba(143, 70, 53, 0.78)";
        context.lineCap = "round";
        context.beginPath();
        const time = animate ? now / 1000 : 0;
        const amplitude = animate ? (speechLevelRef.current / 100) * 8 : 0;
        for (let x = 0; x < width; x += 1) {
          const y =
            height / 2 +
            Math.sin(x * 0.028 + time * 0.8) * amplitude +
            Math.sin(x * 0.011 - time * 0.45) * amplitude * 0.5;
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
        context.strokeStyle = "rgba(143, 70, 53, 0.12)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, height / 2);
        context.lineTo(width, height / 2);
        context.stroke();
      }
      if (animate) raf = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      if (visible && !animate) render(performance.now());
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(render);
    });
    intersectionObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [reducedMotion, phase, mode, dictation]);

  useEffect(() => {
    if (phase !== "live") return;
    startedAtRef.current = Date.now();
    timeoutRef.current = false;
    const tick = () => {
      const left = Math.max(
        0,
        interviewCase.minutes * 60 -
          Math.floor((Date.now() - startedAtRef.current) / 1000),
      );
      setSecondsLeft(left);
      if (left === 0 && !timeoutRef.current) {
        timeoutRef.current = true;
        stopAudio();
        track("interview_timeout", { seconds: interviewCase.minutes * 60 });
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [phase, stopAudio]);

  const begin = (nextMode: Mode) => {
    stopDictation();
    setMode(nextMode);
    setPhase("live");
    setEvaluation(null);
    setError("");
    setCopied(false);
    setCopyFailed(false);
    setSpeechError("");
    setInterim("");
    setResetArmed(false);
    setSecondsLeft(interviewCase.minutes * 60);
    setActivePivot(null);
    playCue("paper");
    track("interview_started", { mode: nextMode });
    if (nextMode === "voice" && voiceConsent) {
      startDictation();
    } else {
      window.setTimeout(() => answerRef.current?.focus(), 80);
    }
  };

  const submit = () => {
    const trimmed = answer.trim();
    if (trimmed.length < MIN_CHARS) {
      setError(
        `Write at least ${MIN_CHARS} characters before requesting feedback. Your answer is ${trimmed.length}.`,
      );
      track("interview_validation_failed", { length: trimmed.length });
      return;
    }
    setError("");
    stopAudio();
    const result = evaluateInterview(trimmed);
    setEvaluation(result);
    setPhase("review");
    try {
      window.localStorage.setItem(
        "pmforge.interview.v1",
        JSON.stringify({
          overall: result.overall,
          answer: trimmed,
          mode,
          promptId: "landing-demo",
          band: result.band,
          missing: result.missing.label,
          words: result.words,
          at: Date.now(),
        }),
      );
      window.dispatchEvent(new CustomEvent("pmforge:progress"));
    } catch {
      // Feedback still renders without persistence.
    }
    track("interview_submitted", {
      overall: result.overall,
      words: result.words,
      band: result.band,
    });
    playCue("chime");
    window.setTimeout(() => {
      scrollToElement("interview-feedback", { offset: -96, duration: 1.1 });
      const heading = document.getElementById("interview-feedback-title");
      heading?.focus({ preventScroll: true });
    }, 140);
  };

  const revise = () => {
    setPhase("live");
    setEvaluation(null);
    setError("");
    setCopied(false);
    setCopyFailed(false);
    setSpeechError("");
    setSecondsLeft(interviewCase.minutes * 60);
    setActivePivot(null);
    setResetArmed(false);
    track("interview_retry");
    window.setTimeout(() => {
      scrollToElement("interview-answer", { offset: -150, duration: 0.9 });
      window.setTimeout(
        () => answerRef.current?.focus({ preventScroll: true }),
        950,
      );
    }, 80);
  };

  const reset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(
        () => setResetArmed(false),
        4200,
      );
      return;
    }
    window.clearTimeout(resetTimerRef.current);
    setResetArmed(false);
    stopAudio();
    setPhase("idle");
    setMicState("idle");
    setMode("voice");
    setAnswer("");
    setEvaluation(null);
    setError("");
    setCopied(false);
    setCopyFailed(false);
    setSpeechError("");
    setInterim("");
    setSecondsLeft(interviewCase.minutes * 60);
    setActivePivot(null);
    try {
      window.localStorage.removeItem("pmforge.interview.v1");
    } catch {
      // Session reset is independent of storage.
    }
    track("interview_reset");
    window.setTimeout(() => {
      scrollToElement("interview", { offset: -96, duration: 0.8 });
      window.setTimeout(
        () =>
          document
            .getElementById("interview-start")
            ?.focus({ preventScroll: true }),
        850,
      );
    }, 80);
  };

  const copyFeedback = async () => {
    if (!evaluation) return;
    const text = [
      `PMForge interview feedback · ${interviewCase.prompt}`,
      `Overall: ${readinessBand(evaluation.overall)} · provisional`,
      `Method: deterministic local rubric — no model call`,
      "",
      ...evaluation.criteria.map(
        (criterion) =>
          `${criterion.label}: ${readinessBand(criterion.score * 25)} — ${criterion.feedback}`,
      ),
      "",
      `Strength: "${evaluation.strength}"`,
      `Missing: ${evaluation.missing.label} — ${evaluation.improvement}`,
      "",
      "Stronger outline:",
      ...evaluation.outline.map((line, index) => `${index + 1}. ${line}`),
    ].join("\n");
    const ok = await copyText(text);
    setCopied(ok);
    setCopyFailed(!ok);
    if (ok) {
      playCue("chime");
      track("interview_feedback_copy");
    }
  };

  const activePrompt =
    activePivot !== null
      ? PIVOT_PROMPTS[interviewCase.pivots[activePivot].criterion]
      : "Type the answer you would give out loud. Aim for 90–150 words.";

  const micMessage =
    micState === "denied"
      ? "Microphone access was denied. You can still write your answer; the rubric does not depend on audio."
      : micState === "absent"
        ? "No microphone is available in this browser. Use the written answer mode."
        : micState === "stopped"
          ? "Listening stopped. Review your answer and submit it when ready."
          : null;

  const scoreRows = evaluation
    ? [
        [...evaluation.criteria].sort((a, b) => b.score - a.score)[0],
        evaluation.missing,
        evaluation.criteria.find((criterion) => criterion.id === "clarity") ??
          evaluation.criteria[0],
      ]
    : [];

  return (
    <section
      id="interview"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="interview-title"
    >
      <div className={styles.leafShadows} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className="eyebrow">Interview prep</p>
          <h2 id="interview-title" className={`${styles.title} display`}>
            Think.
            <br />
            Respond.
            <br />
            Improve.
          </h2>
          <p className={styles.body}>
            Simulate real interview scenarios with dynamic questioning,
            branching paths, and rubric-based feedback.
          </p>
          <button
            id="interview-start"
            type="button"
            className={`${styles.practice} btn btnOutline`}
            onClick={() => {
              begin("voice");
              document.getElementById("interview-card")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
                block: "center",
              });
            }}
          >
            Practice Interviews
            <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <ul className={styles.features}>
            <li>
              <span className={styles.featureIcon}>
                <Mic size={15} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span>
                <strong>Live simulation</strong>
                <small>Real-time branching</small>
              </span>
            </li>
            <li>
              <span className={styles.featureIcon}>
                <Gauge size={15} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span>
                <strong>Voice &amp; written feedback</strong>
                <small>Speech levels to structured rubric</small>
              </span>
            </li>
            <li>
              <span className={styles.featureIcon}>
                <Target size={15} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span>
                <strong>Performance tracking</strong>
                <small>Detailed, deterministic rubric</small>
              </span>
            </li>
          </ul>
        </div>

        <div
          id="interview-card"
          className={styles.card}
          data-mode={mode}
          data-phase={phase}
        >
          <div className={styles.cardHead}>
            <div className={styles.cardTitleGroup}>
              <span
                className={`${styles.recordDot} ${
                  phase === "live" && dictation === "on"
                    ? styles.recordDotLive
                    : ""
                }`}
                aria-hidden="true"
              />
              <div>
                <span className={styles.cardKicker}>
                  Product design interview
                </span>
                <h3 className={styles.cardTitle}>{interviewCase.prompt}</h3>
              </div>
            </div>
            <span
              className={styles.timer}
              role="timer"
              aria-label={`${formatTime(secondsLeft)} remaining`}
            >
              <Clock3 size={12} strokeWidth={1.7} aria-hidden="true" />
              {formatTime(secondsLeft)}
            </span>
          </div>

          <p className={styles.context}>{interviewCase.context}</p>

          <div
            className={`${styles.waveStage} ${mode === "text" ? styles.waveCollapsed : ""}`}
          >
            <canvas ref={waveRef} className={styles.wave} aria-hidden="true" />
            <div className={styles.levelRow}>
              <span className={styles.levelLabel}>
                {phase === "live" && dictation === "on"
                  ? "Listening"
                  : phase === "live" && mode === "text"
                    ? "Written mode"
                    : phase === "live" && dictation === "starting"
                      ? "Connecting"
                      : phase === "idle"
                        ? "Ready"
                        : "Session complete"}
              </span>
              <div
                className={styles.levelTrack}
                role="progressbar"
                aria-label="Speech activity"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={levelPercent}
              >
                <span style={{ width: `${levelPercent}%` }} />
              </div>
            </div>
          </div>

          {phase === "idle" ? (
            <div className={styles.idleActions}>
              <button
                type="button"
                className={styles.recordButton}
                disabled={!voiceConsent}
                onClick={() => begin("voice")}
              >
                <Mic size={17} strokeWidth={1.8} aria-hidden="true" />
                {dictation === "unsupported"
                  ? "Voice unavailable"
                  : "Start with voice"}
              </button>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={voiceConsent}
                  onChange={(event) => setVoiceConsent(event.target.checked)}
                />
                <span>
                  Voice typing uses your browser&apos;s speech service, which
                  may send audio to its provider. PMForge does not record or
                  store audio.
                </span>
              </label>
              <button
                type="button"
                className={styles.typeButton}
                onClick={() => begin("text")}
              >
                Type instead
                <ArrowRight size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <p className={styles.honesty}>
                Voice is optional. Your written answer is evaluated locally with
                a deterministic rubric.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.modeRow}>
                <div
                  className={styles.modeTabs}
                  role="group"
                  aria-label="Answer mode"
                >
                  <button
                    type="button"
                    className={`${styles.modeTab} ${mode === "voice" ? styles.modeOn : ""}`}
                    aria-pressed={mode === "voice"}
                    onClick={() => {
                      setMode("voice");
                      if (voiceConsent) startDictation();
                    }}
                  >
                    <Mic size={13} strokeWidth={1.7} aria-hidden="true" />
                    Voice
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeTab} ${mode === "text" ? styles.modeOn : ""}`}
                    aria-pressed={mode === "text"}
                    onClick={() => {
                      setMode("text");
                      stopAudio();
                      window.setTimeout(() => answerRef.current?.focus(), 60);
                    }}
                  >
                    Type
                  </button>
                </div>

                {mode === "voice" ? (
                  <div className={styles.micActions}>
                    {dictation === "on" ? (
                      <button
                        type="button"
                        className={styles.micButton}
                        onClick={stopDictation}
                      >
                        <Square size={10} strokeWidth={2} aria-hidden="true" />
                        Stop listening
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {mode === "voice" ? (
                <label className={styles.language}>
                  Dictation language
                  <select
                    value={speechLanguage}
                    onChange={(event) => {
                      const wasListening = dictation !== "off";
                      stopDictation();
                      setSpeechLanguage(event.target.value);
                      if (wasListening && voiceConsent) {
                        window.setTimeout(() => startDictationRef.current(), 0);
                      }
                    }}
                  >
                    {[
                      ...new Set([
                        speechLanguage,
                        "en-US",
                        "en-GB",
                        "es-ES",
                        "fr-FR",
                      ]),
                    ].map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {mode === "voice" && !voiceConsent ? (
                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    checked={voiceConsent}
                    onChange={(event) => setVoiceConsent(event.target.checked)}
                  />
                  <span>
                    Voice typing uses your browser&apos;s speech service, which
                    may send audio to its provider. PMForge does not record or
                    store audio.
                  </span>
                </label>
              ) : null}
              {mode === "voice" && voiceConsent && dictation === "off" ? (
                <button
                  type="button"
                  className={styles.retryDictation}
                  onClick={startDictation}
                >
                  <Mic size={13} aria-hidden="true" />
                  Start voice input
                </button>
              ) : null}

              {micMessage ? (
                <p className={styles.micMessage} role="status">
                  {micMessage}
                </p>
              ) : null}

              {micState === "requesting" ? (
                <p className={styles.micMessage} role="status">
                  Allow microphone access to see live input levels. You can keep
                  typing while you wait.
                </p>
              ) : null}
              {speechError ? (
                <p className={styles.micMessage} role="status">
                  {speechError}
                </p>
              ) : null}

              <div className={styles.answerWrap}>
                <label
                  htmlFor="interview-answer"
                  className={styles.answerLabel}
                >
                  Your answer
                  <span>
                    {answer.trim().length} chars · {MIN_CHARS} minimum
                  </span>
                </label>
                <textarea
                  id="interview-answer"
                  ref={answerRef}
                  className={styles.answer}
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder={activePrompt}
                  rows={6}
                  aria-describedby="answer-help"
                  aria-invalid={error ? true : undefined}
                />
                {interim ? (
                  <p className={styles.interim} aria-live="polite">
                    Listening: <em>{interim}</em>
                  </p>
                ) : null}
                <p id="answer-help" className={styles.answerHelp}>
                  Write as if you are speaking to the interviewer. Context,
                  evidence, a decision, a metric, a risk.
                </p>
                {error ? (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className={styles.submitRow}>
                <button
                  type="button"
                  className={`${styles.submit} btn btnPrimary`}
                  onClick={submit}
                  disabled={!answer.trim()}
                >
                  <Send size={15} strokeWidth={1.8} aria-hidden="true" />
                  Get rubric feedback
                </button>
                <span className={styles.timerNote}>
                  {secondsLeft === 0
                    ? "Time is up. Finish in writing, then submit."
                    : "Timer runs from the actual start."}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.side}>
          <div className={styles.pivots}>
            <p className={styles.pivotTitle}>
              Pick a pivot to load its prompt into your answer:
              <span aria-hidden="true">↘</span>
            </p>
            <ul>
              {interviewCase.pivots.map((pivot, index) => (
                <li key={pivot.label}>
                  <button
                    type="button"
                    className={`${styles.pivotButton} ${
                      activePivot === index ? styles.pivotOn : ""
                    }`}
                    aria-pressed={activePivot === index}
                    onMouseEnter={() => setActivePivot(index)}
                    onMouseLeave={() => setActivePivot(null)}
                    onFocus={() => setActivePivot(index)}
                    onBlur={() => setActivePivot(null)}
                    onClick={() => {
                      if (phase === "idle") begin("text");
                      setActivePivot(index);
                      window.setTimeout(() => answerRef.current?.focus(), 80);
                    }}
                  >
                    <span aria-hidden="true">—</span>
                    {pivot.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.pivotHint}>
              Select a prompt, then write or dictate your response.
            </p>
          </div>

          <p className={styles.sticky}>
            Think like a PM.
            <br />
            Not just a problem solver.
          </p>

          <div className={styles.feedbackPreview} aria-live="polite">
            <div className={styles.previewHead}>
              <span>Rubric-based feedback</span>
              <span className={styles.localBadge}>Local</span>
            </div>
            {evaluation ? (
              <>
                <div className={styles.previewScore}>
                  <strong style={{ fontSize: "2rem" }}>
                    {readinessBand(evaluation.overall)}
                  </strong>
                  <span>Provisional band</span>
                </div>
                <ul>
                  {scoreRows.map((row, index) => (
                    <li key={`${row.id}-${index}`}>
                      <span>{row.label}</span>
                      <strong>{readinessBand(row.score * 25)}</strong>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.previewLink}
                  onClick={() =>
                    resultsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  Read full rubric
                  <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <p className={styles.previewEmpty}>
                  Seven criteria. Scored locally from your written answer — no
                  model call, no invented confidence.
                </p>
                <ul className={styles.criteriaList}>
                  {[
                    "Problem framing",
                    "Evidence & assumptions",
                    "Trade-offs",
                    "Impact",
                    "Success metric",
                    "Risks",
                    "Clarity",
                  ].map((label) => (
                    <li key={label}>
                      <span>{label}</span>
                      <span aria-hidden="true">—</span>
                    </li>
                  ))}
                </ul>
                <button
                  ref={rubricTriggerRef}
                  type="button"
                  className={styles.previewLink}
                  onClick={openRubric}
                >
                  How scoring works
                  <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {evaluation ? (
        <div
          className={styles.results}
          ref={resultsRef}
          id="interview-feedback"
        >
          <div className={styles.resultsInner}>
            <div className={styles.resultsHead}>
              <div>
                <p className="eyebrow">Rubric feedback</p>
                <h3 className={`${styles.resultsTitle} display`}>
                  {readinessBand(evaluation.overall)}.
                </h3>
                <p className={styles.methodNote}>{RUBRIC_LIMIT}</p>
              </div>
              <div className={styles.scoreDial}>
                <strong style={{ fontSize: "1rem" }}>
                  {readinessBand(evaluation.overall)}
                </strong>
                <span>Provisional</span>
              </div>
            </div>

            <div className={styles.feedbackGrid}>
              <div className={styles.criteria}>
                {evaluation.criteria.map((criterion) => {
                  const linked =
                    activePivot !== null &&
                    interviewCase.pivots[activePivot].criterion ===
                      criterion.id;
                  return (
                    <details
                      key={criterion.id}
                      className={`${styles.criterion} ${
                        linked ? styles.criterionLinked : ""
                      }`}
                    >
                      <summary>
                        <span className={styles.criterionLabel}>
                          {criterion.label}
                        </span>
                        <span
                          className={styles.dots}
                          aria-label={readinessBand(criterion.score * 25)}
                        >
                          {[0, 1, 2, 3].map((index) => (
                            <i
                              key={index}
                              data-on={
                                index < criterion.score ? "true" : "false"
                              }
                            />
                          ))}
                        </span>
                        <span className={styles.criterionScore}>
                          {readinessBand(criterion.score * 25)}
                        </span>
                      </summary>
                      <div className={styles.criterionBody}>
                        <p>{criterion.feedback}</p>
                        <p className={styles.criterionPrompt}>
                          <strong>Interviewer might ask:</strong>{" "}
                          {criterion.prompt}
                        </p>
                      </div>
                    </details>
                  );
                })}
              </div>

              <div className={styles.findings}>
                <div className={styles.finding}>
                  <span className={styles.findingLabel}>
                    Strength, in your words
                  </span>
                  <blockquote>&ldquo;{evaluation.strength}&rdquo;</blockquote>
                </div>
                <div className={styles.finding}>
                  <span className={styles.findingLabel}>
                    Most important gap · {evaluation.missing.label}
                  </span>
                  <p>{evaluation.improvement}</p>
                </div>
                <div className={styles.finding}>
                  <span className={styles.findingLabel}>
                    A stronger outline
                  </span>
                  <ol>
                    {evaluation.outline.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
                <div className={styles.resultActions}>
                  <button
                    type="button"
                    className="btn btnPrimary btnSm"
                    onClick={revise}
                  >
                    <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
                    Revise answer
                  </button>
                  <button
                    type="button"
                    className="btn btnOutline btnSm"
                    onClick={copyFeedback}
                  >
                    <ClipboardCopy
                      size={13}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                    {copied
                      ? "Copied"
                      : copyFailed
                        ? "Copy failed"
                        : "Copy feedback"}
                  </button>
                  <button
                    type="button"
                    className={styles.resetLink}
                    onClick={reset}
                  >
                    Reset session
                  </button>
                  <Link
                    href="/signup?intent=save&src=interview-demo&next=%2Fapp%2Fpractice"
                    className="btn btnOutline btnSm"
                  >
                    Save this attempt & try the full bank
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
                <p className={styles.copyStatus} role="status">
                  {copied
                    ? "Feedback copied to your clipboard."
                    : copyFailed
                      ? "Copying is blocked here. Select the rubric text and copy it manually."
                      : ""}
                </p>
                <p className={styles.resultNote}>
                  This feedback is a mirror, not a verdict. It scores what is on
                  the page; it cannot hear delivery, pacing, or warmth.
                </p>
              </div>
            </div>
            <p className="srOnly" aria-live="polite">
              Feedback ready. Provisional band:{" "}
              {readinessBand(evaluation.overall)}. Most important gap:{" "}
              {evaluation.missing.label}.
            </p>
          </div>
        </div>
      ) : null}

      <Dialog
        open={rubricOpen}
        onClose={closeRubric}
        title="How the rubric works"
        description="Four checks turn your written answer into a consistent practice score."
        size="md"
        footer={
          <button
            type="button"
            className="btn btnPrimary btnSm"
            onClick={closeRubric}
          >
            Back to my feedback
          </button>
        }
      >
        <div className={styles.rubricDialog}>
          <p>
            <strong>Frame the problem.</strong> Name the user, the friction, and
            the evidence that makes it worth solving.
          </p>
          <p>
            <strong>Make a reasoned choice.</strong> Separate facts from
            assumptions and compare realistic alternatives.
          </p>
          <p>
            <strong>Define impact.</strong> Connect a measurable user outcome to
            a business result, with a guardrail.
          </p>
          <p>
            <strong>Show your judgment.</strong> Surface risks, state what you
            would not do, and set a review point.
          </p>
          <p>
            The rubric is deterministic and runs in this browser. It is practice
            feedback, not a hiring score.
          </p>
        </div>
      </Dialog>

      <p className="srOnly" aria-live="polite">
        {phase === "live" && secondsLeft === 0
          ? "Time is up. Finish your written answer and submit."
          : ""}
        {micState === "granted" ? "Browser speech recognition is active." : ""}
      </p>
    </section>
  );
}
