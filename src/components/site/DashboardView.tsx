"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Circle,
  ClipboardCheck,
  LogOut,
  Mic,
  Sparkles,
  Target,
  Waypoints,
} from "lucide-react";
import {
  GOAL_LABELS,
  clearUser,
  firstName,
  initials,
  readUser,
  saveUser,
  type LocalUser,
} from "@/lib/user";
import { nextAction, readProgress, type ProgressSnapshot } from "@/lib/progress";
import { modules } from "@/lib/content";
import { track } from "@/lib/analytics";
import styles from "@/styles/pages.module.css";

const EMPTY: ProgressSnapshot = {
  signal: null,
  interview: null,
  projects: { decisions: {}, checks: {} },
  blueprint: false,
  career: null,
  learning: { completed: [], drills: {} },
};

export function DashboardView() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);

  const sync = () => {
    setUser(readUser());
    setProgress(readProgress());
  };

  useEffect(() => {
    sync();
    setReady(true);
    const onProgress = () => {
      setUser(readUser());
      setProgress(readProgress());
    };
    window.addEventListener("pmforge:progress", onProgress);
    window.addEventListener("storage", onProgress);
    return () => {
      window.removeEventListener("pmforge:progress", onProgress);
      window.removeEventListener("storage", onProgress);
    };
  }, []);

  const startDemo = () => {
    saveUser({
      name: "Alex Morgan",
      email: "demo@pmforge.local",
      goal: "aspiring-pm",
      createdAt: new Date().toISOString(),
    });
    sync();
    track("login_submitted", { result: "demo", source: "dashboard" });
  };

  const signOut = () => {
    clearUser();
    setUser(null);
    track("logout");
    router.push("/");
  };

  if (!ready) {
    return (
      <div className={styles.panel} aria-live="polite">
        <p className={styles.cardBody}>Reading your local workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <div>
          <p className={styles.eyebrowRow}>No profile in this browser</p>
          <h2 className={styles.sectionTitle}>
            Your workspace is waiting.
          </h2>
          <p className={styles.sectionIntro} style={{ marginTop: "0.9rem" }}>
            PMForge keeps everything local. Create a profile to label your
            progress, or preview the dashboard with a demo identity. Nothing is
            sent to a server either way.
          </p>
          <div className={styles.actions}>
            <Link href="/signup" className="btn btnPrimary">
              Create local profile
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <button type="button" className="btn btnOutline" onClick={startDemo}>
              Preview with demo profile
            </button>
          </div>
          <p className={styles.formNote}>
            Already have a profile?{" "}
            <Link href="/login" className={styles.inlineLink}>
              Log in
            </Link>
            .
          </p>
        </div>
        <div className={styles.gateCard}>
          <h2>What the demo shows</h2>
          <ul className={styles.asideList}>
            <li>
              <Check size={15} strokeWidth={2} aria-hidden="true" />
              A progress snapshot drawn from this browser, not a fake chart.
            </li>
            <li>
              <Check size={15} strokeWidth={2} aria-hidden="true" />
              One next action, chosen from what you have actually finished.
            </li>
            <li>
              <Check size={15} strokeWidth={2} aria-hidden="true" />
              Direct paths to the signal test, workbench, interview, and
              blueprint.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const next = nextAction(progress);
  const decisions = Object.values(progress.projects.decisions).filter(Boolean).length;
  const incomplete = modules
    .filter((module) => !progress.learning.completed.includes(module.slug))
    .slice(0, 3);

  const stats = [
    {
      value: `${progress.learning.completed.length}/${modules.length}`,
      label: "Modules complete",
    },
    {
      value: progress.signal ? progress.signal.strength : "—",
      label: "Signal strength",
    },
    {
      value: String(decisions),
      label: decisions === 1 ? "Decision documented" : "Decisions documented",
    },
    {
      value: progress.interview ? `${progress.interview.overall}` : "—",
      label: "Interview score",
    },
  ];

  return (
    <div>
      <div className={styles.greeting}>
        <div>
          <p className={styles.eyebrowRow}>
            {GOAL_LABELS[user.goal] ?? "Practice profile"}
          </p>
          <h1>
            Welcome back,
            <br />
            {firstName(user.name)}.
          </h1>
        </div>
        <div className={styles.accountRow}>
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "var(--sage-dark)",
              color: "var(--white)",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {initials(user.name)}
          </span>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user.name}</p>
            <p style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
              {user.email}
            </p>
          </div>
          <button type="button" className="btn btnOutline btnSm" onClick={signOut}>
            <LogOut size={14} strokeWidth={1.8} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <strong className={styles.statValue}>{stat.value}</strong>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.dashGrid}>
        <div>
          <div className={styles.nextCard}>
            <p className={styles.eyebrowRow} style={{ color: "rgba(255,253,247,0.66)" }}>
              {next.label}
            </p>
            <h2>{next.label === "Start with signal" ? "Find the signal first." : next.label}</h2>
            <p>{next.body}</p>
            <Link href={next.href} className="btn">
              {next.cta}
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.sectionHead} style={{ marginTop: "2.4rem" }}>
            <div>
              <p className={styles.eyebrowRow}>Curriculum</p>
              <h2 className={styles.sectionTitle}>Your next three modules</h2>
            </div>
            <Link href="/learn" className="btn btnOutline btnSm">
              All modules
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.moduleList}>
            {incomplete.length ? (
              incomplete.map((module) => (
                <Link
                  key={module.slug}
                  href={`/learn/${module.slug}`}
                  className={styles.moduleRow}
                >
                  <span className={styles.moduleNumber}>{module.number}</span>
                  <span className={styles.moduleTitle}>{module.title}</span>
                  <span className={styles.moduleShort}>{module.short}</span>
                  <span className={styles.moduleState}>
                    <Circle size={7} strokeWidth={1.5} aria-hidden="true" />
                    Start
                  </span>
                </Link>
              ))
            ) : (
              <div className={styles.panel}>
                <p className={styles.cardBody}>
                  All ten modules are marked complete. Revisit any module, or put
                  the work into a fresh project decision.
                </p>
                <Link href="/learn" className={`${styles.cardLink} btn btnText`}>
                  Review the curriculum
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={styles.lessonAside}>
          <div className={styles.panel}>
            <p className={styles.eyebrowRow}>Evidence locker</p>
            <ul style={{ display: "grid", gap: "0.85rem" }}>
              <li>
                <Link href="/#signal" className={styles.cardLink}>
                  <Target size={15} strokeWidth={1.7} aria-hidden="true" />
                  {progress.signal
                    ? `Signal: ${progress.signal.verdict} (${progress.signal.strength})`
                    : "Signal test not attempted"}
                </Link>
              </li>
              <li>
                <Link href="/projects" className={styles.cardLink}>
                  <ClipboardCheck size={15} strokeWidth={1.7} aria-hidden="true" />
                  {decisions
                    ? `${decisions} project decision${decisions === 1 ? "" : "s"} recorded`
                    : "No project decision yet"}
                </Link>
              </li>
              <li>
                <Link href="/practice" className={styles.cardLink}>
                  <Mic size={15} strokeWidth={1.7} aria-hidden="true" />
                  {progress.interview
                    ? `Interview ${progress.interview.overall}/100 · ${progress.interview.band}`
                    : "Interview not rehearsed"}
                </Link>
              </li>
              <li>
                <Link href="/#blueprint" className={styles.cardLink}>
                  <Waypoints size={15} strokeWidth={1.7} aria-hidden="true" />
                  {progress.blueprint
                    ? "Blueprint generated"
                    : "Blueprint not built"}
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.note}>
            <Sparkles size={14} strokeWidth={1.6} aria-hidden="true" />{" "}
            <strong>Local only.</strong> Progress is stored in this browser.
            Clearing site data or signing out does not send anything anywhere,
            but it can remove the history.
          </div>

          <div className={styles.panel} style={{ background: "var(--warm)" }}>
            <p className={styles.eyebrowRow}>Need a reset?</p>
            <p className={styles.cardBody}>
              The help page explains how to clear practice data, reset the
              profile, and what the interview lab does with your microphone.
            </p>
            <Link href="/help" className={`${styles.cardLink} btn btnText`}>
              Open help
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
