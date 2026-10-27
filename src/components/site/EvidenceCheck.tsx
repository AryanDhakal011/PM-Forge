"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import styles from "@/styles/pages.module.css";

const FACTORS = [
  {
    id: "measured",
    label: "Measured, not reported",
    detail: "A number with a definition and a denominator.",
  },
  {
    id: "recent",
    label: "Recent",
    detail: "It reflects the current product, not last quarter's.",
  },
  {
    id: "broad",
    label: "Broad enough to matter",
    detail: "It affects a segment, not a single account.",
  },
  {
    id: "revenue",
    label: "Tied to value",
    detail: "It connects to revenue, retention, or a core user job.",
  },
];

const LEVELS = [
  {
    title: "An assumption",
    detail: "Useful as a hypothesis. Not yet a reason to commit the team.",
  },
  {
    title: "An anecdote",
    detail: "One signal is not a pattern. Look for a second, independent check.",
  },
  {
    title: "Directional",
    detail: "Worth investigating, but not enough to defend a consequential call.",
  },
  {
    title: "Strong",
    detail: "A reasonable basis for a reversible decision. Name what would change it.",
  },
  {
    title: "Decision-grade",
    detail: "Measured, current, broad, and valuable. Document it and set a review point.",
  },
];

export function EvidenceCheck() {
  const [checked, setChecked] = useState<string[]>([]);
  const score = checked.length;
  const level = LEVELS[score];

  const toggle = (id: string) => {
    setChecked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className={styles.panel}>
      <p className={styles.eyebrowRow}>Quick tool</p>
      <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(1.6rem, 2.4vw, 2.2rem)" }}>
        Is this evidence, or just a loud opinion?
      </h2>
      <p className={styles.cardBody} style={{ marginTop: "0.6rem" }}>
        Check the factors that are actually true of the signal in front of you.
        This is a sorting heuristic, not a score to hide behind.
      </p>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="srOnly">Evidence strength factors</legend>
        <div className={styles.factorGrid}>
          {FACTORS.map((factor) => (
            <label key={factor.id} className={styles.factor}>
              <input
                type="checkbox"
                checked={checked.includes(factor.id)}
                onChange={() => toggle(factor.id)}
              />
              <span>
                <strong style={{ display: "block", fontWeight: 600, color: "var(--ink)" }}>
                  {factor.label}
                </strong>
                {factor.detail}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.evidenceMeter} aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} data-on={index < score} />
        ))}
      </div>
      <div aria-live="polite" role="status">
        <p className={styles.evidenceResult}>
          {level.title}
          <small>
            {score} of 4 factors · {level.detail}
          </small>
        </p>
      </div>

      <div className={styles.formActions}>
        <Link href="/#signal" className="btn btnPrimary btnSm">
          Test it against ten inputs
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        {score > 0 ? (
          <button
            type="button"
            className="btn btnOutline btnSm"
            onClick={() => setChecked([])}
          >
            <RotateCcw size={13} strokeWidth={1.8} aria-hidden="true" />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
