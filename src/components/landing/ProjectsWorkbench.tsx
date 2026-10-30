"use client";

import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Check,
  ClipboardCopy,
  Clock3,
  Gauge,
  Move3d,
  RotateCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  onboardingPressureOutcomes,
  pressureChoices,
  pressureOutcomes,
  projectScenarios,
} from "@/lib/content";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/analytics";
import { scrollState } from "@/lib/scrollState";
import {
  ensureScrollTrigger,
  resolveCalm,
  setCalmVar,
  bindStoryTargets,
} from "@/lib/scrollStory";
import styles from "./ProjectsWorkbench.module.css";

type DecisionMap = Record<string, string>;
type SprintMap = Record<string, string[]>;
type Stream = 0 | 1 | 2;

const STORAGE_KEY = "pmforge.projects.v1";

const streamTilt = [-30, 30, 0];

export function ProjectsWorkbench() {
  const { playCue, reducedMotion } = useSettings();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [checks, setChecks] = useState<SprintMap>({});
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hoveredStream, setHoveredStream] = useState<Stream | null>(null);
  const [pinnedStream, setPinnedStream] = useState<Stream | null>(null);
  const [artifactOpen, setArtifactOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [sectionIn, setSectionIn] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const recordLinkRef = useRef<HTMLAnchorElement>(null);

  const scenario = projectScenarios[scenarioIndex];
  const phase = scenario.phases[phaseIndex];
  const artifacts = scenario.artifacts[phase.name] ?? [];
  const done = checks[scenario.id] ?? [];
  const decisionId = decisions[scenario.id] ?? null;
  const outcome = decisionId
    ? scenario.id === "onboarding"
      ? onboardingPressureOutcomes[decisionId]
      : pressureOutcomes[decisionId]
    : null;
  const chosen =
    pressureChoices.find((choice) => choice.id === decisionId) ?? null;
  const activeStream: Stream | null = pinnedStream ?? hoveredStream;
  const constraint =
    activeStream !== null
      ? scenario.pressure.constraints[activeStream]
      : scenario.pressure.constraints[2];
  const sprintPercent = Math.round(
    (done.length / scenario.sprint.length) * 100,
  );
  const pressureReady = revealed;

  const meters = outcome?.meters ?? scenario.baseline;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          checks?: SprintMap;
          decisions?: DecisionMap;
        };
        setChecks(parsed.checks ?? {});
        setDecisions(parsed.decisions ?? {});
      }
    } catch {
      // A corrupted local record should never break the workbench.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ checks, decisions }),
      );
      window.dispatchEvent(new CustomEvent("pmforge:progress"));
    } catch {
      // Storage can be unavailable in private mode; the session still works.
    }
  }, [checks, decisions, loaded]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSectionIn(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * The desk surfaces as the section enters: the wood drifts a few pixels,
   * the light shaft straightens, and the loose sheets square up. A
   * pass-through trigger only — no pin, no extra scroll length.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    bindStoryTargets(
      section,
      "--calm",
      `.${styles.wood},.${styles.lightShaft},.${styles.sheet},.${styles.sprint},.${styles.artifact}`,
    );

    if (reducedMotion) {
      scrollState.projects = 1;
      scrollState.calm = 1;
      setCalmVar(section, 1);
      return;
    }

    const ScrollTrigger = ensureScrollTrigger();
    const apply = (value: number) => {
      const calm = resolveCalm(value);
      scrollState.projects = calm;
      scrollState.calm = calm;
      setCalmVar(section, calm);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 82%",
      end: "center 42%",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);

    return () => trigger.kill();
  }, [reducedMotion]);

  const selectScenario = (index: number) => {
    if (index === scenarioIndex) return;
    setScenarioIndex(index);
    setPhaseIndex(0);
    setPinnedStream(null);
    const next = projectScenarios[index];
    track("project_scenario", { id: next.id });
    playCue("paper");
  };

  const toggleCheck = (id: string) => {
    setChecks((current) => {
      const existing = current[scenario.id] ?? [];
      const next = existing.includes(id)
        ? existing.filter((item) => item !== id)
        : [...existing, id];
      return { ...current, [scenario.id]: next };
    });
    playCue("tick");
    track("sprint_check", { scenario: scenario.id, id });
  };

  const choose = (id: string) => {
    setDecisions((current) => ({ ...current, [scenario.id]: id }));
    setCopied(false);
    setCopyFailed(false);
    playCue("paper");
    track("project_decision", { scenario: scenario.id, choice: id });
  };

  const resetScenario = () => {
    setChecks((current) => ({ ...current, [scenario.id]: [] }));
    setDecisions((current) => {
      const next = { ...current };
      delete next[scenario.id];
      return next;
    });
    setPhaseIndex(0);
    setPinnedStream(null);
    setCopied(false);
    setCopyFailed(false);
    playCue("error");
    track("project_reset", { scenario: scenario.id });
  };

  const copyRecord = async () => {
    if (!outcome || !chosen) return;
    const text = [
      `DECISION RECORD — ${scenario.name}`,
      "",
      `Decision: ${outcome.title}`,
      `Context: ${scenario.brief}`,
      `Evidence: ${scenario.pressure.evidence.join(" ")}`,
      `Trade-off chosen: ${chosen.label} — ${chosen.note}`,
      `Consequence: ${outcome.consequence}`,
      `Owner: You, Product Lead`,
      `Next review: ${outcome.review}`,
    ].join("\n");
    const ok = await copyText(text);
    setCopied(ok);
    setCopyFailed(!ok);
    if (ok) {
      playCue("chime");
      track("decision_record_copy", { scenario: scenario.id });
      window.setTimeout(
        () => recordLinkRef.current?.focus({ preventScroll: true }),
        240,
      );
    }
  };

  const streamButtons: { index: Stream; label: string }[] = [
    { index: 0, label: "Engineering" },
    { index: 1, label: "Sales" },
    { index: 2, label: "UI" },
  ];

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={styles.section}
      data-revealed={sectionIn}
      aria-labelledby="projects-title"
    >
      <div className={styles.wood} aria-hidden="true" />
      <div className={styles.lightShaft} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.introCopy}>
            <p className={`eyebrow ${styles.eyebrow}`}>Real-world projects</p>
            <h2 id="projects-title" className={`${styles.title} display`}>
              Build. <br />
              Ship. <br />
              Learn.
            </h2>
            <p className={styles.body}>
              Work on full-cycle product projects with real-world inputs,
              stakeholder feedback, and evolving scenarios.
            </p>
            <Link
              href="/projects"
              className={`${styles.explore} btn btnOutlineLight`}
            >
              Explore Projects
              <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
            </Link>

            <div
              className={styles.switch}
              role="radiogroup"
              aria-label="Project scenario"
              data-segmented="true"
            >
              {projectScenarios.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={index === scenarioIndex}
                  tabIndex={index === scenarioIndex ? 0 : -1}
                  className={styles.switchButton}
                  onClick={() => selectScenario(index)}
                  onKeyDown={(event) => {
                    if (!["ArrowRight", "ArrowLeft"].includes(event.key))
                      return;
                    event.preventDefault();
                    const next =
                      event.key === "ArrowRight"
                        ? (index + 1) % projectScenarios.length
                        : (index - 1 + projectScenarios.length) %
                          projectScenarios.length;
                    selectScenario(next);
                    const parent = event.currentTarget.parentElement;
                    parent
                      ?.querySelectorAll<HTMLButtonElement>("[role='radio']")
                      [next]?.focus();
                  }}
                >
                  <span>{item.id === "checkout" ? "01" : "02"}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div
            id="project-panel"
            aria-label={`${scenario.name} project scenario`}
            className={styles.sheet}
            key={scenario.id}
          >
            <div className={styles.sheetHead}>
              <div>
                <span className={styles.sheetKicker}>Project</span>
                <h3 className={styles.sheetTitle}>{scenario.name}</h3>
              </div>
              <span className={styles.sheetTag}>{scenario.descriptor}</span>
            </div>

            <p className={styles.sheetBrief}>{scenario.brief}</p>

            <div
              className={styles.timeline}
              role="group"
              aria-label="Project phases"
            >
              <span className={styles.timelineLine} aria-hidden="true" />
              <span
                className={styles.timelineFill}
                aria-hidden="true"
                style={{
                  width: `${(phaseIndex / (scenario.phases.length - 1)) * 100}%`,
                }}
              />
              {scenario.phases.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  className={`${styles.phaseButton} ${
                    index === phaseIndex ? styles.phaseActive : ""
                  } ${index < phaseIndex ? styles.phaseDone : ""}`}
                  aria-current={index === phaseIndex ? "step" : undefined}
                  onClick={() => {
                    setPhaseIndex(index);
                    track("project_phase", {
                      scenario: scenario.id,
                      phase: item.name,
                    });
                  }}
                >
                  <span className={styles.phaseDot}>
                    {index < phaseIndex ? (
                      <Check size={9} strokeWidth={2.4} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className={styles.phaseName}>{item.name}</span>
                  <span className={styles.phaseNote}>{item.note}</span>
                </button>
              ))}
            </div>

            <div className={styles.artifacts} aria-live="polite">
              {artifacts.map((artifact, index) => (
                <article className={styles.artifact} key={artifact.title}>
                  <span className={styles.artifactKicker}>
                    {artifact.kicker}
                  </span>
                  <h4>{artifact.title}</h4>
                  <p>{artifact.body}</p>
                  <button
                    type="button"
                    className={styles.artifactOpen}
                    onClick={() => setArtifactOpen(index)}
                  >
                    Open artifact
                    <ArrowRight
                      size={12}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </button>
                </article>
              ))}
            </div>

            <p className={styles.sheetFoot}>
              <Clock3 size={12} strokeWidth={1.6} aria-hidden="true" />
              Phase {phaseIndex + 1} of {scenario.phases.length} · {phase.note}
            </p>
          </div>

          <div
            className={styles.sprint}
            role="group"
            aria-label="Sprint checklist"
          >
            <div className={styles.sprintHead}>
              <span className={styles.sprintKicker}>Sprint 3</span>
              <span
                className={`${styles.sprintCount} ${
                  sprintPercent === 100 ? styles.sprintDone : ""
                }`}
              >
                {done.length}/{scenario.sprint.length}
              </span>
            </div>
            <h3 className={styles.sprintTitle}>This week on the desk</h3>
            <div className={styles.sprintBar}>
              <span style={{ width: `${sprintPercent}%` }} />
            </div>
            <ul className={styles.checklist}>
              {scenario.sprint.map((item) => {
                const isDone = done.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.check} ${isDone ? styles.checked : ""}`}
                      aria-pressed={isDone}
                      onClick={() => toggleCheck(item.id)}
                    >
                      <span className={styles.checkBox} aria-hidden="true">
                        {isDone ? <Check size={11} strokeWidth={2.4} /> : null}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className={styles.sprintNote} aria-live="polite">
              {sprintPercent === 100
                ? "Sprint complete. This evidence carries into the career board."
                : "Check items off as the work happens. The career board reads this progress."}
            </p>
            <Link href="/career" className={styles.sprintLink}>
              See it on the career board
              <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />

        <div className={styles.deskRow}>
          <div className={styles.monolithCard}>
            <div className={styles.monolithHead}>
              <span className={styles.darkKicker}>
                Cross-functional pressure
              </span>
              <h3 className={styles.panelTitle}>One decision. Three pulls.</h3>
            </div>

            <div
              className={styles.monolithStage}
              style={
                {
                  "--tilt": `${activeStream === null ? -9 : streamTilt[activeStream]}deg`,
                  "--tilt-x": `${activeStream === 2 ? -42 : 0}deg`,
                } as React.CSSProperties
              }
            >
              <svg
                className={styles.streams}
                viewBox="0 0 320 230"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className={activeStream === 0 ? styles.streamPathActive : ""}
                  d="M34 34C90 42 120 78 148 108"
                />
                <path
                  className={activeStream === 1 ? styles.streamPathActive : ""}
                  d="M286 34C230 42 200 78 172 108"
                />
                <path
                  className={
                    activeStream === 2 || activeStream === null
                      ? styles.streamPathActive
                      : ""
                  }
                  d="M160 230C160 190 160 145 160 112"
                />
                <circle
                  r="3.5"
                  className={styles.streamPulse}
                  aria-hidden="true"
                >
                  <animateMotion
                    key={activeStream ?? "idle"}
                    path={
                      activeStream === 0
                        ? "M34 34C90 42 120 78 148 108"
                        : activeStream === 1
                          ? "M286 34C230 42 200 78 172 108"
                          : "M160 230C160 190 160 145 160 112"
                    }
                    dur={activeStream === null ? "8s" : "900ms"}
                    repeatCount={activeStream === null ? "indefinite" : "1"}
                    fill="freeze"
                  />
                </circle>
              </svg>
              <span className={styles.monolithShadow} aria-hidden="true" />
              <span className={styles.monolith} aria-hidden="true">
                <span className={styles.monolithLine} />
                <span className={styles.monolithGlint} />
              </span>
              {streamButtons.map((stream) => (
                <button
                  key={stream.label}
                  type="button"
                  className={`${styles.stream} ${styles[`stream${stream.index}`]} ${
                    activeStream === stream.index ? styles.streamActive : ""
                  }`}
                  aria-pressed={pinnedStream === stream.index}
                  onMouseEnter={() => setHoveredStream(stream.index)}
                  onMouseLeave={() => setHoveredStream(null)}
                  onFocus={() => setHoveredStream(stream.index)}
                  onBlur={() => setHoveredStream(null)}
                  onClick={() =>
                    setPinnedStream((current) =>
                      current === stream.index ? null : stream.index,
                    )
                  }
                >
                  {stream.label}
                </button>
              ))}
            </div>

            <p className={styles.monolithNote}>
              <Move3d size={12} strokeWidth={1.5} aria-hidden="true" />
              At rest, it leans toward the customer outcome. Pull a stream to
              feel the cost.
            </p>
            <p className={styles.constraint} role="status">
              <span>{constraint.team}</span>
              {constraint.note}
            </p>
          </div>

          <div
            className={`${styles.pressure} ${pressureReady ? styles.pressureOn : ""}`}
            role="group"
            aria-labelledby="pressure-title"
          >
            <div className={styles.pressureHead}>
              <span className={styles.alertKicker}>
                <AlertTriangle size={13} strokeWidth={1.8} aria-hidden="true" />
                New evidence detected.
              </span>
              <h3 id="pressure-title" className={styles.panelTitle}>
                The room changes shape.
              </h3>
              <p className={styles.pressureIntro}>
                Three signals land at once. You still have to move.
              </p>
            </div>

            <ul className={styles.evidence}>
              {scenario.pressure.evidence.map((item, index) => (
                <li key={item} style={{ "--i": index } as React.CSSProperties}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div
              className={styles.choices}
              role="group"
              aria-label="Pressure decision"
            >
              {pressureChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`${styles.choice} ${
                    decisionId === choice.id ? styles.choiceOn : ""
                  }`}
                  aria-pressed={decisionId === choice.id}
                  onClick={() => choose(choice.id)}
                >
                  <span className={styles.choiceLabel}>{choice.label}</span>
                  <span className={styles.choiceNote}>{choice.note}</span>
                </button>
              ))}
            </div>

            <div
              className={styles.meters}
              role="group"
              aria-label="Decision impact, out of ten"
            >
              <Meter
                icon={<Users size={14} strokeWidth={1.7} />}
                label="Users"
                value={meters.users}
              />
              <Meter
                icon={<TrendingUp size={14} strokeWidth={1.7} />}
                label="Revenue"
                value={meters.revenue}
              />
              <Meter
                icon={<Gauge size={14} strokeWidth={1.7} />}
                label="Team load"
                value={meters.load}
              />
            </div>

            <button
              type="button"
              className={styles.reset}
              onClick={resetScenario}
            >
              <RotateCcw size={12} strokeWidth={1.7} aria-hidden="true" />
              Reset scenario to baseline
            </button>
          </div>
        </div>

        <div
          id="decision-record"
          className={styles.recordBar}
          data-written={Boolean(outcome && chosen)}
          aria-live="polite"
        >
          {outcome && chosen ? (
            <>
              <div className={styles.recordIntro}>
                <div className={styles.recordHead}>
                  <span>Decision record · written</span>
                  <span className={styles.recordStamp}>v1.0</span>
                </div>
                <h4 className={styles.recordTitle}>{outcome.title}</h4>
              </div>
              <dl className={styles.recordFields}>
                <div className={styles.recordContext}>
                  <dt>Context</dt>
                  <dd>{scenario.brief}</dd>
                </div>
                <div className={styles.recordEvidence}>
                  <dt>Evidence</dt>
                  <dd>{scenario.pressure.evidence.slice(0, 2).join(" ")}</dd>
                </div>
                <div className={styles.recordDecision}>
                  <dt>Decision</dt>
                  <dd>
                    {chosen.label}. {chosen.note}
                  </dd>
                </div>
                <div className={styles.recordConsequence}>
                  <dt>Consequence</dt>
                  <dd>{outcome.consequence}</dd>
                </div>
                <div className={styles.recordOwner}>
                  <dt>Owner</dt>
                  <dd>You, Product Lead</dd>
                </div>
                <div className={styles.recordReview}>
                  <dt>Next review</dt>
                  <dd>{outcome.review}</dd>
                </div>
              </dl>
              <div className={styles.recordActions}>
                <Link
                  href="/signup?intent=save&src=project-record&next=%2Fapp%2Fportfolio"
                  className="btn btnOutline btnSm"
                >
                  Save this record to my portfolio
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={`${styles.copyRecord} btn btnOutline btnSm`}
                  onClick={copyRecord}
                >
                  <ClipboardCopy
                    size={13}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  {copied
                    ? "Record copied"
                    : copyFailed
                      ? "Copy failed"
                      : "Copy record"}
                </button>
                <Link
                  href="/#blueprint"
                  ref={recordLinkRef}
                  className={styles.recordLink}
                  data-ready={copied || copyFailed}
                  aria-hidden={!copied && !copyFailed}
                  tabIndex={copied || copyFailed ? 0 : -1}
                >
                  Turn it into a blueprint
                  <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
              <span className={styles.writtenStamp} aria-hidden="true">
                Written
              </span>
              <span className="srOnly" aria-live="polite">
                {copied
                  ? "Record copied. You can turn it into a blueprint."
                  : ""}
                {copyFailed
                  ? "Copying is blocked here. Select the record text and copy it manually."
                  : ""}
              </span>
            </>
          ) : (
            <p className={styles.recordEmpty}>
              No decision yet. Choose one pressure response above. The record
              writes itself, including the consequence you are accepting.
            </p>
          )}
        </div>
      </div>

      <Dialog
        open={artifactOpen !== null}
        onClose={() => setArtifactOpen(null)}
        title={artifacts[artifactOpen ?? 0]?.title ?? "Artifact"}
        description={artifacts[artifactOpen ?? 0]?.kicker}
        size="md"
        footer={
          <button
            type="button"
            className="btn btnOutline btnSm"
            onClick={() => setArtifactOpen(null)}
          >
            Close
          </button>
        }
      >
        <p className={styles.dialogBody}>
          {artifacts[artifactOpen ?? 0]?.body}
        </p>
        <p className={styles.dialogNote}>
          This artifact belongs to the {phase.name.toLowerCase()} phase of{" "}
          {scenario.name}. Open the pressure event to see what it changes.
        </p>
      </Dialog>
    </section>
  );
}

function Meter({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={styles.meter}>
      <div className={styles.meterLabel}>
        <span>
          {icon}
          {label}
        </span>
        <strong>{value}/10</strong>
      </div>
      <div
        className={styles.meterTrack}
        role="progressbar"
        aria-label={`${label}: ${value} out of 10`}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
      >
        <span style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}
