"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Circle, LoaderCircle, Move3d } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { modules, type Module } from "@/lib/content";
import { readLearning, type LearningState } from "@/lib/progress";
import { track } from "@/lib/analytics";
import { useSceneActivity } from "@/three/sceneLifecycle";
import styles from "./LearningPath.module.css";

const EMPTY: LearningState = { completed: [], drills: {} };

const MODULE_ACCENTS = [
  "#D9694A",
  "#6FA67A",
  "#4F7FA8",
  "#9A5C86",
  "#E0B02E",
  "#D9694A",
  "#6FA67A",
  "#4F7FA8",
  "#9A5C86",
  "#E0B02E",
];

const MODULE_PULLS: [number, number, number][] = [
  [1, 2, 1],
  [0, 1, 3],
  [2, 1, 1],
  [2, 2, 2],
  [3, 0, 1],
  [1, 0, 3],
  [3, 1, 1],
  [1, 3, 1],
  [3, 1, 2],
  [1, 2, 2],
];
const PULL_CAPTIONS = [
  "Engineering pulls: ship it safely.",
  "Sales pulls: close the deal.",
  "UX pulls: make it usable.",
];

const LearningCluster = dynamic(
  () => import("@/three/LearningCluster").then((mod) => mod.LearningCluster),
  { ssr: false, loading: () => <ClusterFallback /> },
);

function ClusterFallback() {
  return (
    <div className={styles.fallback} aria-hidden="true">
      <span className={styles.fallbackRing} />
      <span className={styles.fallbackCore} />
      <span className={`${styles.fallbackCard} ${styles.fallbackA}`}>
        <small>Module 04</small>
        <strong>Prioritization &amp; decision making</strong>
      </span>
      <span className={`${styles.fallbackCard} ${styles.fallbackB}`}>
        <small>Module 01</small>
        <strong>Foundation &amp; product strategy</strong>
      </span>
      <span className={`${styles.fallbackCard} ${styles.fallbackC}`}>
        <small>Module 09</small>
        <strong>AI product management</strong>
      </span>
      <span className={styles.fallbackBlockA} />
      <span className={styles.fallbackBlockB} />
      <span className={styles.fallbackBlockC} />
    </div>
  );
}

export function LearningPath() {
  const { reducedMotion } = useSettings();
  const webgl = useWebGLSupport();
  const scene = useSceneActivity("learning", reducedMotion);
  const [webglFailed, setWebglFailed] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [openModule, setOpenModule] = useState<Module | null>(null);
  const [learning, setLearning] = useState<LearningState>(EMPTY);

  useEffect(() => {
    const sync = () => setLearning(readLearning());
    sync();
    window.addEventListener("pmforge:progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pmforge:progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const states = useMemo(
    () =>
      modules.map((module) => {
        const complete = learning.completed.includes(module.slug);
        const drills = learning.drills[module.slug]?.length ?? 0;
        return {
          state: complete
            ? ("complete" as const)
            : drills > 0
              ? ("in-progress" as const)
              : ("not-started" as const),
          progress: complete
            ? 100
            : Math.round((drills / module.practice.length) * 100),
        };
      }),
    [learning],
  );
  const openState = openModule
    ? states[modules.findIndex((module) => module.slug === openModule.slug)]
    : null;
  const activePull = hovered === null ? null : MODULE_PULLS[hovered];
  const strongestPull = activePull
    ? Math.max(...activePull)
    : 0;
  const pullCaption =
    activePull && activePull.filter((weight) => weight === strongestPull).length === 1
      ? PULL_CAPTIONS[activePull.indexOf(strongestPull)]
      : "A good decision weighs all three.";

  const selectModule = (index: number) => {
    setOpenModule(modules[index]);
    track("lesson_open", { slug: modules[index].slug, source: "learning_path" });
  };

  return (
    <section id="learning" className={styles.section} aria-labelledby="learning-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className="eyebrow">Learning path</p>
          <h2 id="learning-title" className={`${styles.title} display`}>
            Pressure test logic.
          </h2>
          <p className={styles.body}>
            The real world isn&apos;t a straight line. It&apos;s a series of course
            corrections based on messy evidence.
          </p>
          <Link href="/learn" className={`${styles.explore} btn btnOutline`}>
            Explore all modules
            <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
          </Link>

        </div>

        <div className={styles.stage}>
          <div className={styles.canvasWrap}>
            {webgl === false || webglFailed || !scene.near ? (
              <ClusterFallback />
            ) : (
              <LearningCluster
                reducedMotion={reducedMotion}
                frameloop={scene.frameloop}
                hovered={hovered}
                onHover={setHovered}
                onSelect={selectModule}
                states={states}
                pulls={MODULE_PULLS}
                onFail={() => setWebglFailed(true)}
              />
            )}
          </div>
          <p className={styles.handNote}>
            Better products
            <br />
            for real people.
            <svg viewBox="0 0 132 20" aria-hidden="true">
              <path d="M3 13c21-5 69-9 126-5" />
              <path d="M18 18c35-6 74-8 103-6" />
            </svg>
          </p>
          <p className={styles.dragHint}>
            <Move3d size={13} strokeWidth={1.5} aria-hidden="true" />
            Drag the cluster to explore.
          </p>
          <p className={styles.pullCaption} aria-hidden="true">
            {pullCaption} <span>Illustrative</span>
          </p>
        </div>

        <div className={styles.listCol}>
          <div className={styles.listHead}>
            <span>Curriculum</span>
            <span>01 — 10</span>
          </div>
          <ul className={styles.list} aria-label="Ten learning modules">
            {modules.map((module, index) => {
              const state = states[index];
              return (
                <li key={module.slug}>
                  <button
                    type="button"
                    className={`${styles.row} ${
                      hovered === index ? styles.rowHot : ""
                    } ${state.state === "complete" ? styles.rowComplete : ""}`}
                    style={
                      { "--accent": MODULE_ACCENTS[index % MODULE_ACCENTS.length] } as React.CSSProperties
                    }
                    data-state={state.state}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    onClick={() => selectModule(index)}
                    aria-label={`${module.number} ${module.title}, ${state.state.replace("-", " ")}${
                      state.state === "in-progress"
                        ? `, ${state.progress} percent`
                        : ""
                    }`}
                  >
                    <span className={styles.rowNumber}>{module.number}</span>
                    <span className={styles.rowTitle}>{module.title}</span>
                    <span className={styles.rowState} aria-hidden="true">
                      {state.state === "complete" ? (
                        <Check size={12} strokeWidth={2.2} />
                      ) : state.state === "in-progress" ? (
                        <span className={styles.rowProgress}>
                          <span style={{ width: `${state.progress}%` }} />
                        </span>
                      ) : (
                        <Circle size={12} strokeWidth={1.5} />
                      )}
                    </span>
                    <span className="srOnly">
                      {state.state === "complete"
                        ? "Complete"
                        : state.state === "in-progress"
                          ? `In progress, ${state.progress} percent`
                          : "Not started"}
                    </span>
                    {state.state === "in-progress" ? (
                      <span className={styles.rowPercent}>{state.progress}%</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.legend} role="group" aria-label="Module progress legend">
            <span>
              <Circle size={12} strokeWidth={1.5} aria-hidden="true" /> Not started
            </span>
            <span>
              <LoaderCircle size={12} strokeWidth={1.5} aria-hidden="true" /> In progress
            </span>
            <span>
              <Check size={12} strokeWidth={2} aria-hidden="true" /> Complete
            </span>
          </div>
          <p className={styles.listFoot}>
            Each module ends with a decision you have to defend, not a quiz you
            can guess. Progress shown here is read from this browser. The
            decision-frame illustration is illustrative, not module scoring.
          </p>
        </div>
      </div>

      <Dialog
        open={openModule !== null}
        onClose={() => setOpenModule(null)}
        title={openModule ? `${openModule.number} · ${openModule.title}` : "Module"}
        description={openModule?.short}
        size="md"
        footer={
          openModule ? (
            <>
              <button
                type="button"
                className="btn btnOutline btnSm"
                onClick={() => setOpenModule(null)}
              >
                Close
              </button>
              <Link
                href={`/learn/${openModule.slug}`}
                className="btn btnPrimary btnSm"
                onClick={() => setOpenModule(null)}
              >
                {openState?.state === "not-started"
                  ? "Start module"
                  : "Continue module"}
                <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </>
          ) : null
        }
      >
        {openModule ? (
          <div className={styles.lesson}>
            <p className={styles.lessonDesc}>{openModule.description}</p>
            <div className={styles.lessonOutcome}>
              <span>What you leave with</span>
              <strong>{openModule.outcome}</strong>
            </div>
            <div className={styles.lessonGrid}>
              <div>
                <h3>Three practice steps</h3>
                <ol>
                  {openModule.practice.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>Artifact</h3>
                <p className={styles.artifact}>{openModule.artifact}</p>
                <h3 className={styles.tagHead}>Covers</h3>
                <div className={styles.tags}>
                  {openModule.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className={styles.lessonNote}>
              <LoaderCircle size={13} strokeWidth={1.7} aria-hidden="true" />
              The interview simulator can use this module as a lens.{" "}
              <Link href="/practice" onClick={() => setOpenModule(null)}>
                Practice this in the interview
              </Link>
            </p>
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
