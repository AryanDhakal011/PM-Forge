"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import styles from "@/styles/pages.module.css";

const PRACTICE_KEYS = [
  "pmforge.signal.v1",
  "pmforge.projects.v1",
  "pmforge.interview.v1",
  "pmforge.career.v1",
  "pmforge.blueprint.v1",
  "pmforge.learning.v1",
];

type Action = "practice" | "profile" | "all" | null;

const COPY: Record<Exclude<Action, null>, { title: string; detail: string }> = {
  practice: {
    title: "Clear practice data",
    detail:
      "Removes the signal result, project checklist and decision, interview score, career card, blueprint, and module progress. Your profile stays.",
  },
  profile: {
    title: "Delete local profile",
    detail:
      "Removes your name, email, and goal. Practice data stays until you clear it separately.",
  },
  all: {
    title: "Clear everything",
    detail:
      "Removes the profile, all practice data, and the sound, motion, and haptics preferences stored by this browser.",
  },
};

export function LocalDataControls() {
  const [pending, setPending] = useState<Action>(null);
  const [status, setStatus] = useState("");

  const run = () => {
    if (!pending) return;
    try {
      if (pending === "practice") {
        PRACTICE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      }
      if (pending === "profile") {
        window.localStorage.removeItem("pmforge.user");
      }
      if (pending === "all") {
        const keys: string[] = [];
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key?.startsWith("pmforge.")) keys.push(key);
        }
        keys.forEach((key) => window.localStorage.removeItem(key));
      }
      setStatus(`${COPY[pending].title} complete. This page now reflects the empty state.`);
      window.dispatchEvent(new CustomEvent("pmforge:progress"));
    } catch {
      setStatus(
        "This browser blocked local storage, so there was nothing to clear. Private browsing can cause this.",
      );
    }
    setPending(null);
  };

  return (
    <div className={styles.panel} style={{ marginTop: "1.2rem" }}>
      <p className={styles.eyebrowRow}>Local data controls</p>
      <h3 className={styles.cardTitle}>You are the administrator here.</h3>
      <p className={styles.cardBody}>
        These actions affect this browser only. They cannot be undone, and there
        is no server copy to restore.
      </p>

      <div className={styles.formActions}>
        <button
          type="button"
          className="btn btnOutline btnSm"
          onClick={() => setPending("practice")}
        >
          <RotateCcw size={13} strokeWidth={1.8} aria-hidden="true" />
          Clear practice data
        </button>
        <button
          type="button"
          className="btn btnOutline btnSm"
          onClick={() => setPending("profile")}
        >
          <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
          Delete profile
        </button>
        <button
          type="button"
          className="btn btnText btnSm"
          onClick={() => setPending("all")}
        >
          Clear everything
        </button>
      </div>

      {pending ? (
        <div
          className={styles.note}
          role="group"
          aria-labelledby="clear-title"
          aria-describedby="clear-detail"
          style={{ marginTop: "1rem" }}
        >
          <p
            id="clear-title"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}
          >
            <AlertTriangle size={14} strokeWidth={1.8} aria-hidden="true" />
            {COPY[pending].title}?
          </p>
          <p id="clear-detail" style={{ marginTop: "0.35rem" }}>
            {COPY[pending].detail}
          </p>
          <div className={styles.formActions}>
            <button type="button" className="btn btnPrimary btnSm" onClick={run}>
              Yes, {COPY[pending].title.toLowerCase()}
            </button>
            <button
              type="button"
              className="btn btnOutline btnSm"
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p className={styles.fieldHint} role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
