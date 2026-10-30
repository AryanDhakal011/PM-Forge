"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db, exportWorkspace } from "@/lib/product/db";
import type { Profile, Run } from "@/lib/product/types";
import styles from "./Product.module.css";
export default function KeepRun({
  run,
  profile,
}: {
  run: Run;
  profile: Profile;
}) {
  const [status, setStatus] = useState("");
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(
      localStorage.getItem(`pmforge.keep-run:${profile.id}`) === "dismissed",
    );
  }, [profile.id]);
  const [first, setFirst] = useState(false);
  useEffect(() => {
    if (first && !dismissed && profile.identity === "guest")
      void navigator.storage
        ?.persist?.()
        .then((granted) =>
          setStatus(
            granted
              ? "Persistent storage granted. Keep a backup too."
              : "Storage is best-effort. Export a backup.",
          ),
        )
        .catch(() =>
          setStatus("Storage protection unavailable. Export a backup."),
        );
  }, [first, dismissed, profile.identity]);
  useEffect(() => {
    let active = true;
    void db.runs
      .where("ownerId")
      .equals(profile.id)
      .sortBy("startedAt")
      .then((rows) => {
        if (active) setFirst(rows.find((r) => r.completedAt)?.id === run.id);
      });
    return () => {
      active = false;
    };
  }, [run.id, profile.id]);
  const persist = async () => {
    try {
      setStatus(
        (await navigator.storage?.persist?.())
          ? "Persistent storage granted. Keep a backup too."
          : "This browser did not grant persistent storage. Export a backup.",
      );
    } catch {
      setStatus("Storage protection unavailable. Export a backup.");
    }
  };
  const backup = async () => {
    try {
      const data = await exportWorkspace(profile);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "pmforge-workspace.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Backup exported. Store it somewhere safe.");
    } catch {
      setStatus(
        "Export failed. Retry from Settings before clearing browser data.",
      );
    }
  };
  if (profile.identity !== "guest" || !first || dismissed) return null;
  return (
    <section className={styles.notice} aria-label="Keep this run">
      <h2>Keep this run.</h2>
      <p>Create an account to sync, or export a backup now.</p>
      <div className={styles.row}>
        <Link
          href={`/signup?next=${encodeURIComponent(`/app/run/${run.id}/debrief`)}`}
          className={styles.primary}
        >
          Keep this run · create account
        </Link>
        <button className={styles.secondary} onClick={() => void backup()}>
          Export a backup
        </button>
        <button className={styles.textButton} onClick={() => void persist()}>
          Protect device storage
        </button>
      </div>
      <p className={styles.finePrint}>
        Browser data can be evicted. Safari may clear script-written storage
        after seven days of Safari use without interaction here. Storage
        protection is browser-controlled and is not a backup.
      </p>
      <p role="status">{status}</p>
      <button
        className={styles.textButton}
        onClick={() => {
          localStorage.setItem(`pmforge.keep-run:${profile.id}`, "dismissed");
          setDismissed(true);
        }}
      >
        Dismiss
      </button>
    </section>
  );
}
