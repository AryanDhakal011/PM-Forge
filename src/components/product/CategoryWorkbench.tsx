"use client";
import { ArrowDown, Check, Flag, ShieldCheck, Target, X } from "lucide-react";
import type { Question, Run } from "@/lib/product/types";
import styles from "./Product.module.css";
export function CategoryWorkbench({
  question: q,
  run,
  change,
}: {
  question: Question;
  run: Run;
  change: (patch: Partial<Run>) => void;
}) {
  if (q.category === "strategy")
    return (
      <section className={styles.panel} style={{ marginBottom: 24 }}>
        <span className={styles.eyebrow}>The competitive map</span>
        <h2>Pick the ground you can defend.</h2>
        <p
          className={styles.prose}
          style={{ fontSize: ".8rem", margin: "14px 0 20px" }}
        >
          A constraint is useful when it tells you where not to compete. Pick an
          initial focus, then choose your strategic lever below.
        </p>
        <div className={styles.choiceGrid}>
          {[
            {
              id: "focused",
              label: "One evidence-backed segment",
              text: "Concentrate the first move where the evidence is strongest.",
            },
            {
              id: "underserved",
              label: "An underserved niche",
              text: "Accept limited scale to earn a sharper position.",
            },
            {
              id: "broad",
              label: "The whole market",
              text: "Accept a larger coordination and distribution burden.",
            },
          ].map((item) => (
            <button
              key={item.id}
              className={styles.choice}
              aria-pressed={run.segment === item.id}
              onClick={() => change({ segment: item.id })}
            >
              <Flag size={16} />
              {item.label}
              <small>{item.text}</small>
            </button>
          ))}
        </div>
        {run.segment && (
          <p className={styles.notice} style={{ marginTop: 16 }}>
            Your strategic scope is {run.segment}. The interviewer will ask how
            the evidence supports this scope.
          </p>
        )}
      </section>
    );
  if (q.category === "execution-metrics")
    return (
      <section className={styles.panel} style={{ marginBottom: 24 }}>
        <span className={styles.eyebrow}>Your metric tree</span>
        <h2>Connect movement to meaning.</h2>
        <p
          className={styles.prose}
          style={{ fontSize: ".8rem", marginTop: 13 }}
        >
          Choose the center of the tree. Then give it a boundary: what must not
          get worse while it improves?
        </p>
        <div className={styles.metricTree}>
          <div className={styles.metricRoot}>
            <Target size={22} />
            <strong>
              {run.metrics.primary === "outcome"
                ? "Affected-cohort outcome"
                : run.metrics.primary === "revenue"
                  ? "Revenue per eligible customer"
                  : run.metrics.primary === "activity"
                    ? "All-user activity"
                    : "A metric needs a population"}
            </strong>
            <span className={styles.badge}>Primary outcome</span>
          </div>
          <div className={styles.treeStem} aria-hidden="true" />
          <div className={styles.choiceGrid}>
            <button
              className={styles.choice}
              aria-pressed={run.metrics.primary === "outcome"}
              onClick={() =>
                change({ metrics: { ...run.metrics, primary: "outcome" } })
              }
            >
              <Target size={17} />
              Observe the affected cohort
              <small>A behavior and a window, not a global total.</small>
            </button>
            <button
              className={styles.choice}
              aria-pressed={run.metrics.guardrail === "retention"}
              onClick={() =>
                change({ metrics: { ...run.metrics, guardrail: "retention" } })
              }
            >
              <ShieldCheck size={17} />
              Protect repeat success
              <small>Cohort retention, repeat use, and user trust.</small>
            </button>
          </div>
        </div>
        <p className={styles.finePrint}>
          The tree reflects your selections below. The actual scenario data
          stays in the evidence desk; no outcomes are being forecast.
        </p>
      </section>
    );
  if (q.category === "product-sense")
    return (
      <section className={styles.panel} style={{ marginBottom: 24 }}>
        <span className={styles.eyebrow}>The idea board</span>
        <h2>Make room for the important thing.</h2>
        <p
          className={styles.prose}
          style={{ fontSize: ".8rem", margin: "14px 0 18px" }}
        >
          Not every defensible idea belongs in the first version. Set one aside,
          then defend what remains. You can change the cut before you lock it.
        </p>
        <div className={styles.stack}>
          {q.choices
            .filter((c) => !c.trap)
            .map((choice) => {
              const killed = run.architecture.includes(choice.id);
              return (
                <button
                  key={choice.id}
                  className={styles.choice}
                  style={{
                    opacity: killed ? 0.62 : 1,
                    borderStyle: killed ? "dashed" : "solid",
                  }}
                  aria-pressed={killed}
                  onClick={() =>
                    change({ architecture: killed ? [] : [choice.id] })
                  }
                >
                  <span className={styles.row}>
                    {killed ? <X size={16} /> : <Flag size={16} />}
                    <span
                      style={{
                        textDecoration: killed ? "line-through" : "none",
                        fontSize: ".8rem",
                      }}
                    >
                      {choice.label}
                    </span>
                  </span>
                  <small>
                    {killed
                      ? "Deliberately set aside. Click to reconsider."
                      : "Set this path aside for this iteration."}
                  </small>
                </button>
              );
            })}
        </div>
      </section>
    );
  return null;
}
