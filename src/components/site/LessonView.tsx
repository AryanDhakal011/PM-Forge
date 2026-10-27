"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Module } from "@/lib/content";
import { lessonNotes } from "@/lib/lessons";
import { readLearning, writeLearning, type LearningState } from "@/lib/progress";
import { track } from "@/lib/analytics";
import styles from "@/styles/pages.module.css";

const EMPTY: LearningState = { completed: [], drills: {} };

export function LessonView({
  module,
  previous,
  next,
}: {
  module: Module;
  previous?: Module;
  next?: Module;
}) {
  const [learning, setLearning] = useState<LearningState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const noteContent = lessonNotes[module.slug];

  useEffect(() => {
    setLearning(readLearning());
    setReady(true);
  }, []);

  const doneDrills = learning.drills[module.slug] ?? [];
  const complete = learning.completed.includes(module.slug);
  const allDrills = doneDrills.length === module.practice.length;

  const save = (nextState: LearningState) => {
    setLearning(nextState);
    writeLearning(nextState);
  };

  const toggleDrill = (index: number) => {
    const current = learning.drills[module.slug] ?? [];
    const nextDrills = current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index].sort((a, b) => a - b);
    save({
      ...learning,
      drills: { ...learning.drills, [module.slug]: nextDrills },
    });
    setNote(
      nextDrills.length === module.practice.length
        ? "All three drills are checked. Mark the module complete when you are ready."
        : `${nextDrills.length} of ${module.practice.length} drills checked.`,
    );
  };

  const markComplete = () => {
    if (!allDrills || complete) return;
    save({
      ...learning,
      completed: [...learning.completed, module.slug],
    });
    setNote("Module marked complete. Your dashboard has been updated.");
    track("lesson_complete", { slug: module.slug });
  };

  const resetModule = () => {
    save({
      ...learning,
      completed: learning.completed.filter((slug) => slug !== module.slug),
      drills: { ...learning.drills, [module.slug]: [] },
    });
    setNote("Module reset. The drills are available again.");
  };

  return (
    <div className={styles.lessonLayout}>
      <article className={styles.lessonBody}>
        <section className={styles.lessonBlock}>
          <h2>The idea</h2>
          <p>{noteContent?.principle ?? module.description}</p>
        </section>

        <section className={styles.lessonBlock}>
          <h2>The failure mode</h2>
          <p>{noteContent?.failure ?? module.description}</p>
        </section>

        <section className={styles.lessonBlock}>
          <h2>Three practice drills</h2>
          <p>
            Do these against a real product you use or work on. Checking a box
            is not the work; the drill is.
          </p>
          <div className={styles.drills}>
            {module.practice.map((step, index) => {
              const done = doneDrills.includes(index);
              return (
                <button
                  key={step}
                  type="button"
                  className={styles.drill}
                  data-done={done}
                  aria-pressed={done}
                  onClick={() => toggleDrill(index)}
                >
                  <span className={styles.drillBox} aria-hidden="true">
                    {done ? <Check size={14} strokeWidth={2.4} /> : null}
                  </span>
                  <span className={styles.drillText}>{step}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.lessonBlock}>
          <h2>Use it in the field</h2>
          <p>{noteContent?.field ?? module.outcome}</p>
        </section>

        <section className={styles.lessonBlock}>
          <h2>What you leave with</h2>
          <div className={styles.lessonOutcome}>
            <span>Artifact</span>
            <strong>{module.outcome}</strong>
          </div>
        </section>

        <div className={styles.lessonNav}>
          {previous ? (
            <Link href={`/learn/${previous.slug}`}>
              <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
              {previous.number} · {previous.title}
            </Link>
          ) : (
            <Link href="/learn">
              <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
              All modules
            </Link>
          )}
          {next ? (
            <Link href={`/learn/${next.slug}`} style={{ textAlign: "right" }}>
              {next.number} · {next.title}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/learn">Back to the curriculum</Link>
          )}
        </div>
      </article>

      <div className={styles.lessonAside}>
        <div className={styles.panel}>
          <p className={styles.eyebrowRow}>Module status</p>
          <div className={styles.lessonOutcome} style={{ marginBottom: "0.9rem" }}>
            <span>Progress</span>
            <strong>
              {complete
                ? "Complete"
                : `${doneDrills.length} of ${module.practice.length} drills`}
            </strong>
          </div>
          <div
            className={styles.progressTrack}
            style={{ width: "100%", marginBottom: "1rem" }}
            role="progressbar"
            aria-valuenow={Math.round((doneDrills.length / module.practice.length) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Module drill progress"
          >
            <span
              style={{
                width: `${Math.round((doneDrills.length / module.practice.length) * 100)}%`,
              }}
            />
          </div>
          {complete ? (
            <>
              <p className={styles.cardBody} style={{ marginBottom: "0.9rem" }}>
                <Check size={13} strokeWidth={2.2} aria-hidden="true" /> This
                module is marked complete in your local workspace.
              </p>
              <button type="button" className="btn btnOutline btnSm" onClick={resetModule}>
                <RotateCcw size={13} strokeWidth={1.8} aria-hidden="true" />
                Reset module
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btnPrimary btnSm"
              onClick={markComplete}
              disabled={!allDrills || !ready}
              aria-describedby="lesson-complete-help"
            >
              <Check size={14} strokeWidth={2.2} aria-hidden="true" />
              Mark module complete
            </button>
          )}
          <p className={styles.fieldHint} id="lesson-complete-help" aria-live="polite">
            {note ||
              (allDrills
                ? "All drills checked. Mark the module complete to update your dashboard."
                : "Complete the three drills above to enable this.")}
          </p>
        </div>

        <div className={styles.panel}>
          <p className={styles.eyebrowRow}>Covers</p>
          <div className={styles.tagRow} style={{ marginBottom: "1rem" }}>
            {module.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
          <p className={styles.cardBody}>
            The same judgment is tested in the interview lab. Try it with the
            microphone on, or use the keyboard answer mode.
          </p>
          <Link href="/practice" className={`${styles.cardLink} btn btnText`}>
            <Sparkles size={14} strokeWidth={1.7} aria-hidden="true" />
            Practise this live
          </Link>
        </div>

        <div className={styles.note}>
          <strong>Next:</strong> put the module into a decision, not a notes
          file. The project workbench asks for a call, a trade-off, and a next
          check.
          <div style={{ marginTop: "0.6rem" }}>
            <Link href="/projects" className={styles.inlineLink}>
              Open the workbench
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
