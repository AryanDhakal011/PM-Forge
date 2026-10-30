"use client";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  History,
} from "lucide-react";
import { getQuestion, categoryOf } from "@/lib/product/content";
import { readinessBand, RUBRIC_LIMIT } from "@/lib/product/readiness";
import { EmptyState, Emblem, Meter } from "./WorkspaceUI";
import { ProjectActivity } from "@/components/projects/ProjectViews";
import { scoreRun, stageLabel } from "@/lib/product/engine";
import { CoverageTable as Coverage } from "./WorkspaceUI";
import { useWorkspaceData } from "./useWorkspaceData";
import { useWorkspace } from "./WorkspaceProvider";
import styles from "./Product.module.css";

export function ProgressView() {
  const { runs } = useWorkspaceData();
  const params = useSearchParams();
  const complete = runs.filter((r) => r.completedAt);
  const average = complete.length
    ? Math.round(
        complete.reduce((sum, r) => sum + scoreRun(r).total, 0) /
          complete.length,
      )
    : 0;
  const dimensions = new Map<string, { sum: number; count: number }>();
  complete.forEach((r) =>
    scoreRun(r).dimensions.forEach((d) => {
      const old = dimensions.get(d.label) || { sum: 0, count: 0 };
      dimensions.set(d.label, { sum: old.sum + d.score, count: old.count + 1 });
    }),
  );
  if (params.get("tab") === "history") return <HistoryView />;
  return (
    <>
      <div className={styles.pageHead} data-enter>
        <div>
          <span className={styles.eyebrow}>Your practice, made visible</span>
          <h1>Notice what’s getting clearer.</h1>
          <p>Coverage and reasoning patterns from your completed sessions.</p>
        </div>
      </div>
      <ProgressTabs active="overview" />
      <FirstWin />
      <ProjectActivity />
      <div className={styles.statStrip}>
        <div>
          <strong>{complete.length}</strong>
          <span>Completed runs</span>
        </div>
        <div>
          <strong>
            {complete.length ? readinessBand(average) : "Not enough data yet"}
          </strong>
          <span title="Provisional bands reflect recorded choices and checks. Expert calibration is pending.">
            Band ⓘ
          </span>
        </div>
        <div>
          <strong>{new Set(complete.map((r) => r.questionId)).size}</strong>
          <span>Unique scenarios</span>
        </div>
        <div>
          <strong>
            {Math.round(
              runs.reduce((sum, r) => sum + r.elapsedSeconds, 0) / 60,
            )}{" "}
            min
          </strong>
          <span>Practice time</span>
        </div>
      </div>
      <div className={styles.grid2}>
        <section className={styles.panel} data-enter>
          <div className={styles.panelHead}>
            <h2>Your coverage</h2>
            <span className={styles.small}>3 questions per cell</span>
          </div>
          <Coverage runs={runs} />
        </section>
        <section className={styles.panel} data-enter>
          <div className={styles.panelHead}>
            <h2>Reasoning dimensions</h2>
          </div>
          {dimensions.size ? (
            [...dimensions].map(([name, data]) => (
              <div className={styles.dimension} key={name}>
                <div className={styles.dimensionHead}>
                  <span>{name}</span>
                  <strong>{readinessBand(data.sum / data.count)}</strong>
                </div>
                <div className={styles.progressBar}>
                  <span
                    style={{
                      width: `${data.sum / data.count >= 85 ? 100 : data.sum / data.count >= 70 ? 67 : 33}%`,
                    }}
                  />
                </div>
                <p>
                  {data.count} completed {data.count === 1 ? "run" : "runs"}
                </p>
              </div>
            ))
          ) : (
            <>
              <div
                className={styles.exampleBars}
                aria-label="Example dimension bars, no recorded data"
              >
                <span>Example</span>
                {Array.from({ length: 7 }, (_, i) => (
                  <i key={i} style={{ width: 35 + i * 7 + "%" }} />
                ))}
              </div>
              <p className={styles.prose}>
                Finish a scenario to see your reasoning dimensions.
              </p>
              <Link className={styles.textButton} href="/app/practice">
                Choose your first scenario <ArrowRight size={14} />
              </Link>
            </>
          )}
        </section>
      </div>
      <p className={styles.finePrint} style={{ marginTop: 24 }}>
        Bands come from your recorded choices and checks. They do not judge
        spoken delivery or originality. Expert calibration is pending.
      </p>
    </>
  );
}
export function ProgressTabs({ active }: { active: string }) {
  return (
    <nav className={styles.tabs} aria-label="Progress views">
      {[
        { key: "overview", href: "/app/progress", label: "Overview" },
        { key: "history", href: "/app/progress?tab=history", label: "History" },
      ].map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
export function HistoryView() {
  const { runs } = useWorkspaceData();
  const params = useSearchParams();
  const status = params.get("status") || "all";
  const isProjects = params.get("type") === "project";
  const filtered = runs.filter(
    (r) =>
      status === "all" ||
      (status === "complete" ? !!r.completedAt : !r.completedAt),
  );
  const group = (stamp: string) => {
    const date = new Date(stamp),
      today = new Date();
    const days = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) /
        86400000,
    );
    return days === 0
      ? "Today"
      : days === 1
        ? "Yesterday"
        : days < 7
          ? "This week"
          : date.toLocaleDateString();
  };
  return (
    <>
      <div className={styles.pageHead} data-enter>
        <div>
          <h1>Your session history.</h1>
          <p>
            Resume a thought or revisit the decisions that changed your mind.
          </p>
        </div>
      </div>
      <ProgressTabs active="history" />
      <nav className={styles.tabs} aria-label="Session type">
        <Link
          href="/app/progress?tab=history"
          aria-current={!isProjects ? "page" : undefined}
        >
          Interviews
        </Link>
        <Link
          href="/app/progress?tab=history&type=project"
          aria-current={isProjects ? "page" : undefined}
        >
          Projects
        </Link>
      </nav>
      {isProjects ? (
        <ProjectActivity mode="history" />
      ) : (
        <>
          <nav className={styles.historyFilters} aria-label="Session status">
            {[
              { id: "all", label: "All", count: runs.length },
              {
                id: "in-progress",
                label: "In progress",
                count: runs.filter((r) => !r.completedAt).length,
              },
              {
                id: "complete",
                label: "Completed",
                count: runs.filter((r) => r.completedAt).length,
              },
            ].map((f) => (
              <Link
                key={f.id}
                aria-current={status === f.id ? "page" : undefined}
                href={`/app/progress?tab=history&status=${f.id}`}
              >
                {f.label} <span>{f.count}</span>
              </Link>
            ))}
          </nav>
          {filtered.length ? (
            <section
              className={styles.historyTrail}
              aria-label="Interview session trail"
            >
              {filtered.map((run, i) => {
                const q = getQuestion(run.questionId);
                if (!q) return null;
                return (
                  <Fragment key={run.id}>
                    {(!i ||
                      group(filtered[i - 1].updatedAt) !==
                        group(run.updatedAt)) && (
                      <h2 className={styles.historyDate}>
                        {group(run.updatedAt)}
                      </h2>
                    )}
                    <article
                      style={
                        {
                          "--accent": categoryOf(q.category).color,
                        } as React.CSSProperties
                      }
                    >
                      <Emblem category={q.category} />
                      <div>
                        <span className={styles.small}>
                          {categoryOf(q.category).label} ·{" "}
                          <Meter
                            value={
                              ["easy", "medium", "hard"].indexOf(q.level) + 1
                            }
                            label={q.level}
                          />{" "}
                          {q.level}
                        </span>
                        <h3>{q.title}</h3>
                        <p>
                          {run.completedAt
                            ? scoreRun(run, q).band
                            : stageLabel[run.stage]}{" "}
                          · {Math.floor(run.elapsedSeconds / 60)} min
                        </p>
                        <div className={styles.row}>
                          <Link
                            className={styles.textButton}
                            href={`/app/run/${run.id}${run.completedAt ? "/debrief" : ""}`}
                          >
                            {run.completedAt ? "Open debrief" : "Resume"}{" "}
                            <ArrowRight size={14} />
                          </Link>
                          {run.completedAt && (
                            <Link
                              className={styles.textButton}
                              href={`/app/practice/${q.slug}`}
                            >
                              Retry
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </Fragment>
                );
              })}
            </section>
          ) : (
            <EmptyState
              kind="history"
              title="Your next attempt starts the story."
              href="/app/practice"
              action="Find a scenario"
            >
              Every session leaves a trail, including the ones you pause.
            </EmptyState>
          )}
        </>
      )}
    </>
  );
}

function FirstWin() {
  const { runs } = useWorkspaceData();
  const { profile } = useWorkspace();
  const [finished, setFinished] = useState(false);
  const reflected = runs.some((r) => r.reflectionCompletedAt);
  useEffect(() => {
    if (!profile) return;
    const key = `pmforge.first-win:${profile.id}`;
    if (reflected) localStorage.setItem(key, "done");
    setFinished(localStorage.getItem(key) === "done");
  }, [profile?.id, reflected]);
  const first = runs.find((r) => r.guided) || runs[0];
  if (reflected || finished) return null;
  const step = !first
    ? 0
    : ["feedback", "replay", "reflection", "expert", "complete"].includes(
          first.stage,
        )
      ? 2
      : 1;
  return (
    <section className={styles.firstWin} aria-label="Your first win">
      <div>
        <h2>Your first win</h2>
        <p>One guided run. One useful thing to improve.</p>
      </div>
      <ol>
        {["Start a guided run", "Reach the debrief", "Finish reflection"].map(
          (label, i) => (
            <li key={label} data-done={step > i}>
              <span>{step > i ? "✓" : i + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <Link
        className={styles.textButton}
        href={first ? `/app/run/${first.id}` : "/app/practice"}
      >
        {first ? "Continue" : "Choose an Easy scenario"}{" "}
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}
