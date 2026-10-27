"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { modules } from "@/lib/content";
import { readLearning, type LearningState } from "@/lib/progress";
import styles from "@/styles/pages.module.css";

const EMPTY: LearningState = { completed: [], drills: {} };

export function ModuleGrid() {
  const [learning, setLearning] = useState<LearningState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setLearning(readLearning());
    sync();
    setReady(true);
    window.addEventListener("pmforge:progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pmforge:progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const complete = learning.completed.length;
  const percent = Math.round((complete / modules.length) * 100);
  const nextModule = modules.find(
    (module) => !learning.completed.includes(module.slug),
  );

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.eyebrowRow}>
            {complete} of {modules.length} complete
          </p>
          <h2 className={styles.sectionTitle}>
            {complete === 0
              ? "Begin with the frame."
              : complete === modules.length
                ? "The curriculum is complete."
                : "Keep the loop moving."}
          </h2>
        </div>
        {ready && nextModule ? (
          <Link href={`/learn/${nextModule.slug}`} className="btn btnPrimary">
            {complete === 0 ? "Start module 01" : "Continue"}
            <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div
        className={styles.progressTrack}
        style={{ width: "100%", height: 5, marginBottom: "1.6rem" }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Curriculum progress: ${percent} percent`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.moduleList}>
        {modules.map((module) => {
          const done = learning.completed.includes(module.slug);
          const drills = learning.drills[module.slug]?.length ?? 0;
          const drillPercent = Math.round((drills / module.practice.length) * 100);
          return (
            <Link
              key={module.slug}
              href={`/learn/${module.slug}`}
              className={styles.moduleRow}
              aria-label={`${module.number} ${module.title}. ${
                done
                  ? "Complete"
                  : drills > 0
                    ? `${drillPercent} percent through the practice drills`
                    : "Not started"
              }. ${module.short}`}
            >
              <span className={styles.moduleNumber}>{module.number}</span>
              <span>
                <span className={styles.moduleTitle}>{module.title}</span>
                <span className={styles.cardBody} style={{ display: "block", marginTop: "0.25rem" }}>
                  {module.tags.join(" · ")}
                </span>
              </span>
              <span className={styles.moduleShort}>{module.short}</span>
              <span className={styles.moduleState}>
                {done ? (
                  <>
                    <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                    Complete
                  </>
                ) : drills > 0 ? (
                  <>
                    <span className={styles.progressTrack} aria-hidden="true">
                      <span style={{ width: `${drillPercent}%` }} />
                    </span>
                    {drillPercent}%
                  </>
                ) : (
                  <>
                    <Circle size={8} strokeWidth={1.5} aria-hidden="true" />
                    Not started
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      <p className={styles.formNote}>
        A module is complete when you finish its three practice drills and mark
        it complete. Nothing is timed, and every drill stays available.
      </p>
    </div>
  );
}
