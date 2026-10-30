"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { activationEvents } from "@/lib/product/activation";
import { useWorkspace } from "./WorkspaceProvider";
import styles from "./Product.module.css";
export default function ActivationSummary() {
  const { profile } = useWorkspace();
  const events =
    useLiveQuery(
      () => (profile ? activationEvents(profile.id) : []),
      [profile?.id],
    ) || [];
  const started = events.filter((e) => e.name === "first_run_started");
  const debrief = events.filter(
    (e) => e.name === "debrief_reached" && e.sessionOne,
  );
  const activated = started.filter(
    (e) =>
      debrief.some((d) => d.runId === e.runId) &&
      events.some(
        (r) =>
          r.runId === e.runId &&
          r.name === "reflection_finished" &&
          r.sessionOne,
      ),
  );
  return (
    <section className={styles.notice} aria-label="First-session activation">
      <strong>
        Session-one activation: {activated.length ? "Reached" : "Not yet"}
      </strong>
      <p>
        Guided start {started.length} → debrief in session one {debrief.length}{" "}
        → reflection finished in session one {activated.length}. A timed release
        without a self-grade does not count as activation.
      </p>
      <p className={styles.finePrint}>
        A session ends after 30 minutes of inactivity. This device-only funnel
        starts with this release; it is not population analytics.
      </p>
      <button
        className={styles.textButton}
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(events, null, 2)], {
              type: "application/json",
            }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "pmforge-activation-events.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        Export activation events
      </button>
    </section>
  );
}
