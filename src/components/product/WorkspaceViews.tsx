"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Check, Clock, ChevronRight, Play } from "lucide-react";
import {
  categoryOf,
  getQuestion,
  questions,
  REFERENCE_NOTE,
  evidenceBudget,
} from "@/lib/product/content";
import { createRun, scoreRun, stageLabel } from "@/lib/product/engine";
import { db, markDirty, saveRun } from "@/lib/product/db";
import { entryHref } from "@/lib/product/routes";
import { practiceSession, trackActivation } from "@/lib/product/activation";
import { reviewStatus } from "@/lib/product/readiness";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceData } from "./useWorkspaceData";
import styles from "./Product.module.css";
export { useWorkspaceData } from "./useWorkspaceData";
export { CoverageTable as Coverage } from "./WorkspaceUI";
export { HomeView, LibraryView } from "./WorkspacePages";
export function QuestionDetail({
  slug,
  publicView = false,
}: {
  slug: string;
  publicView?: boolean;
}) {
  const q = getQuestion(slug);
  const { profile } = useWorkspace();
  const { runs, bookmarks } = useWorkspaceData();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!q)
    return (
      <div className={styles.empty}>
        <h1>That brief isn’t here.</h1>
        <p>Try another scenario from the library.</p>
        <Link href="/app/practice" className={styles.primary}>
          Back to practice
        </Link>
      </div>
    );
  const attempts = runs.filter((r) => r.questionId === q.id);
  const resume = attempts.find((r) => r.stage !== "complete");
  const saved = bookmarks.some((b) => b.questionId === q.id);
  const firstRun = runs.length === 0;
  const firstQuestion =
    q.level === "easy" ? q : questions.find((item) => item.id === "RCA-E-1")!;
  const start = async () => {
    if (!profile) {
      router.push(
        entryHref(`/app/practice/${q.slug}`, "public-question", "practice"),
      );
      return;
    }
    setBusy(true);
    try {
      if (resume) {
        router.push(`/app/run/${resume.id}`);
        return;
      }
      const owned = await db.runs.where("ownerId").equals(profile.id).toArray();
      const guided = owned.length === 0;
      const run = createRun(
        guided ? firstQuestion : q,
        profile.id,
        attempts.length % 3,
      );
      if (guided) {
        run.guided = true;
        run.sessionId = practiceSession();
      }
      await saveRun(run, 0, true);
      if (guided) await trackActivation(run, "first_run_started");
      router.push(`/app/run/${run.id}`);
    } catch {
      setError(
        "The session could not be saved. Retry before starting; no work was lost.",
      );
      setBusy(false);
    }
  };
  const bookmark = async () => {
    if (!profile) {
      router.push(entryHref(`/app/practice/${q.slug}`, "detail-bookmark"));
      return;
    }
    const id = `${profile.id}:${q.id}`;
    try {
      if (saved) await db.bookmarks.delete(id);
      else
        await db.bookmarks.put({
          id,
          ownerId: profile.id,
          questionId: q.id,
          updatedAt: new Date().toISOString(),
        });
      await markDirty(profile.id);
    } catch {
      setError("The bookmark could not be saved. Please retry.");
    }
  };
  return (
    <div className={styles.detailGrid}>
      <div data-enter>
        <span className={styles.eyebrow}>{categoryOf(q.category).studio}</span>
        <div className={styles.row}>
          <span className={`${styles.badge} ${styles.badgeGreen}`}>
            {categoryOf(q.category).label}
          </span>
          <span className={styles.badge}>{reviewStatus(q)}</span>
        </div>
        <h1 className={styles.detailTitle}>{q.title}</h1>
        <div className={styles.detailMeta}>
          <span style={{ textTransform: "capitalize" }}>{q.level}</span>
          <span>
            <Clock size={13} style={{ display: "inline" }} /> {q.minutes}{" "}
            minutes
          </span>
          <span>{evidenceBudget(q.level)} evidence credits</span>
          <span>Text & structured decisions</span>
        </div>
        <section className={styles.brief}>
          <span className={styles.eyebrow}>The situation</span>
          <p className={styles.prose}>{q.scenario}</p>
        </section>
        <section className={styles.prose}>
          <p className={`${styles.mobileGuidance} ${styles.notice}`}>
            Full workbenches are best on a desktop. Mobile supports reading,
            guided reps, spoken synthesis, and reflection; you can still
            continue this full run here.
          </p>
          <h2>What you’ll do</h2>
          <p>
            {categoryOf(q.category).description} You’ll pin the objective,
            inspect evidence, work through a{" "}
            {categoryOf(q.category).studio.toLowerCase()} activity, respond to
            interviewer pushback, and defend one call.
          </p>
          <h2>Leave with a clearer next move.</h2>
          <p>
            Your feedback will show what your recorded choices support. Then
            you’ll replay the decision, calibrate your self-grade, and explore
            an expert reasoning trace with more than one defensible path.
          </p>
          <div className={styles.notice} style={{ marginTop: 24 }}>
            No punitive timer. Pressure mode is optional. Your choices and notes
            save as you go.
          </div>
          <h2>Content notes</h2>
          <p className={styles.finePrint}>
            {REFERENCE_NOTE} Content version {q.version}. {reviewStatus(q)}.
          </p>
        </section>
      </div>
      <aside className={styles.detailAside}>
        <section className={styles.panel} data-enter>
          <span className={styles.eyebrow}>An open chair, a real decision</span>
          <h2 style={{ marginBottom: 14 }}>
            {resume ? "Your work is waiting." : "Ready to take the room?"}
          </h2>
          <p
            className={styles.prose}
            style={{ fontSize: ".8rem", marginBottom: 22 }}
          >
            {resume
              ? `Saved at ${stageLabel[resume.stage].toLowerCase()}. Continue without losing your evidence or notes.`
              : firstRun
                ? `Your first run is a guided Easy rep of about 8 minutes: ${firstQuestion.title}. Setup is combined and there is just one pushback.`
                : "Start with three short preflight cards. You don’t need to prepare a script."}
          </p>
          <button
            className={styles.primary}
            onClick={() => void start()}
            disabled={busy}
          >
            <Play size={14} />
            {busy
              ? "Opening…"
              : resume
                ? "Resume this session"
                : firstRun
                  ? "Start 8-minute guided Easy"
                  : "Practice this scenario"}
          </button>
          <button
            className={styles.secondary}
            style={{ width: "100%", marginTop: 10 }}
            aria-pressed={saved}
            onClick={() => void bookmark()}
          >
            <Bookmark size={14} />
            {saved ? "Bookmarked" : "Save for later"}
          </button>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Your attempts</h2>
            <span className={styles.badge}>{attempts.length}</span>
          </div>
          {attempts.length ? (
            attempts.map((r) => (
              <Link
                href={`/app/run/${r.id}${r.completedAt ? "/debrief" : ""}`}
                key={r.id}
                className={styles.listItem}
              >
                <div>
                  <strong>
                    {r.completedAt ? scoreRun(r, q).band : stageLabel[r.stage]}
                  </strong>
                  <small>
                    {new Date(r.updatedAt).toLocaleDateString()} · variant{" "}
                    {r.seed + 1}
                  </small>
                </div>
                <ChevronRight size={13} />
              </Link>
            ))
          ) : (
            <p className={`${styles.small} ${styles.muted}`}>
              A fresh page. Your first attempt starts here.
            </p>
          )}
        </section>
        {publicView && (
          <Link href="/questions" className={styles.textButton}>
            All 63 questions
            <ArrowRight size={14} />
          </Link>
        )}
      </aside>
    </div>
  );
}
