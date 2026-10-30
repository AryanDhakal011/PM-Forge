"use client";
import { useState, useRef, useLayoutEffect, type CSSProperties } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  RouteMap,
  Meter,
  DraftDot,
  DRAFT_NOTICE,
  Select,
  EmptyState,
} from "@/components/product/WorkspaceUI";
import ProjectPosterArt from "./ProjectPosterArt";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  Bookmark,
  Compass,
  Check,
  Clock,
  LockKeyhole,
  Info,
} from "lucide-react";
import { db } from "@/lib/product/db";
import { projects, getProject } from "@/lib/projects/content";
import { createProjectRun, projectArchetype } from "@/lib/projects/engine";
import { saveProjectRun } from "@/lib/projects/db";
import type { Project } from "@/lib/projects/types";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useWorkspaceData } from "@/components/product/useWorkspaceData";
import { scoreRun } from "@/lib/product/engine";
import { entryHref } from "@/lib/product/routes";
import u from "@/components/product/Product.module.css";
import s from "./Projects.module.css";
const chapterTeasers: Record<string, [string, string]> = {
  "sacred-no": [
    "A promise leaves the room before you do.",
    "The board sees the version your commitments made possible.",
  ],
  "silent-churn": [
    "Five executives. Different definitions of the same loss.",
    "Trust returns slowly. Your coalition decides who stays with the plan.",
  ],
  "feature-factory": [
    "The release is out. The reliability bill comes due.",
    "Choose which growth story survives its footnotes.",
  ],
  "ghost-metric": [
    "The number changes. Its sponsor is still in the room.",
    "An honest metric needs an organisation willing to use it.",
  ],
  "pivot-point": [
    "A quality floor meets a budget ceiling.",
    "Who gets access—and who can the team keep helping?",
  ],
  "legacy-fracture": [
    "A mandate opens doors. The people behind them decide what moves.",
    "One fleet. Two systems. A cutover somebody must own.",
  ],
  "shadow-roadmap": [
    "The official map meets the one people actually follow.",
    "The truth reaches the board. Your alliances reach it too.",
  ],
  "trojan-horse": [
    "The defect has customers nobody planned for.",
    "A reward ends. The expectations it created remain.",
  ],
  "invisible-wall": [
    "The bottleneck has an owner—and a reason.",
    "A wider audience meets the boundary you kept or removed.",
  ],
  deadlock: [
    "One test. Two teams. Neither keeps its whole story.",
    "The prototype leaves the workshop. The compromise comes with it.",
  ],
  "public-fracture": [
    "Support needs instructions. The headline needs a sentence.",
    "The patch ships before trust has finished recovering.",
  ],
  "last-mile": [
    "The city goes quiet. Your partners still need an answer.",
    "The rain recedes. Not every relationship recovers with it.",
  ],
};
const categoryNames: Record<string, string> = {
  "root-cause": "Root Cause Analysis",
  strategy: "Market Strategy",
  "execution-metrics": "Execution & Metrics",
  "product-sense": "Product Sense",
  "ai-technical": "AI & Technical",
  behavioral: "Behavioral",
};
function detailPalette(p: Project): CSSProperties {
  const values = p.palette.accent
    .match(/\w\w/g)!
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance =
    values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  return {
    ...palette(p),
    "--detail-action-ink": luminance > 0.179 ? "#000000" : "#ffffff",
  } as CSSProperties;
}
export const palette = (p: Project) =>
  ({
    "--case-bg": p.palette.bg,
    "--case-ink": p.palette.ink,
    "--case-accent": p.palette.accent,
  }) as CSSProperties;
export function useProjectRuns() {
  const { profile } = useWorkspace();
  return (
    useLiveQuery(
      () =>
        profile
          ? db.projectRuns
              .where("ownerId")
              .equals(profile.id)
              .reverse()
              .sortBy("updatedAt")
          : [],
      [profile?.id],
    ) || []
  );
}
export async function toggleProjectBookmark(
  ownerId: string,
  projectId: string,
  chapter?: number,
) {
  const key = `project:${projectId}${chapter ? `:c${chapter}` : ""}`,
    id = `${ownerId}:${key}`;
  const existed = !!(await db.bookmarks.get(id));
  if (existed) await db.bookmarks.delete(id);
  else
    await db.bookmarks.put({
      id,
      ownerId,
      questionId: key,
      updatedAt: new Date().toISOString(),
    });
  await db.meta.put({ key: `dirty:${ownerId}`, value: String(Date.now()) });
  return !existed;
}
export function ProjectGallery({
  publicView = false,
}: {
  publicView?: boolean;
}) {
  const { profile } = useWorkspace();
  const runs = useProjectRuns();
  const { runs: interviews } = useWorkspaceData();
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("recommended");
  const [hover, setHover] = useState("");
  const { reducedMotion } = useSettings();
  const grid = useRef<HTMLDivElement>(null);
  const snapshot = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const change = (apply: () => void) => {
    if (!reducedMotion && grid.current) {
      gsap.registerPlugin(Flip);
      snapshot.current = Flip.getState(grid.current.children);
    }
    apply();
  };
  useLayoutEffect(() => {
    if (!snapshot.current || reducedMotion) return;
    const state = snapshot.current;
    snapshot.current = null;
    const ctx = gsap.context(
      () =>
        Flip.from(state, { duration: 0.45, ease: "power2.inOut", prune: true }),
      grid,
    );
    return () => ctx.revert();
  }, [filters, sort, reducedMotion]);
  const dimensions = interviews
    .filter((r) => r.completedAt)
    .flatMap((r) => scoreRun(r).dimensions);
  const weakest = dimensions.sort((a, b) => a.score - b.score)[0]?.id;
  const recommended =
    weakest && ["validation", "segmentation", "ranking"].includes(weakest)
      ? "silent-churn"
      : profile?.role.includes("Lead")
        ? "shadow-roadmap"
        : weakest === "guardrail"
          ? "public-fracture"
          : weakest
            ? "sacred-no"
            : "";
  const filtered = projects.filter(
    (p) => !filters.length || filters.some((tag) => p.tags.includes(tag)),
  );
  filtered.sort((a, b) =>
    sort === "pressure"
      ? Number(b.tags.includes("High pressure")) -
        Number(a.tags.includes("High pressure"))
      : sort === "duration"
        ? projects.indexOf(a) - projects.indexOf(b)
        : Number(b.id === recommended) - Number(a.id === recommended),
  );
  return (
    <>
      <div className={s.galleryHead} data-enter>
        <span className={u.eyebrow}>Real World Projects</span>
        <h1>
          The map draws itself
          <br />
          <em>while you walk.</em>
        </h1>
        <p>
          Three chapters. Decisions that stay with you. Enter a company under
          pressure, make a tradeoff, and watch the next room inherit it.
        </p>
        <div className={s.galleryMeta}>
          <span>3 chapters</span>
          <span>45–75 minutes</span>
          <span>Pause between chapters</span>
        </div>
        <div className={s.galleryMap}>
          <p>
            {hover
              ? projects.find((p) => p.id === hover)?.title
              : "Choose a waypoint to find its mission."}
          </p>
          <RouteMap
            selected={hover}
            states={Object.fromEntries(
              runs.map((r) => [r.projectId, r.decisions.length]),
            )}
            onSelect={(id) => {
              document.getElementById("project-" + id)?.scrollIntoView({
                behavior: reducedMotion ? "instant" : "smooth",
                block: "center",
              });
              setHover(id);
              document
                .querySelector<HTMLElement>("#project-" + id + " a")
                ?.focus({ preventScroll: true });
            }}
          />
        </div>
      </div>
      <p className={s.galleryRule}>
        There is no single right path. There are standards for what makes a
        decision sound.
      </p>
      <p className={s.galleryDraft}>{DRAFT_NOTICE}</p>
      <div className={s.filters} role="group" aria-label="Project filters">
        <button
          className={u.secondary}
          aria-pressed={!filters.length}
          onClick={() => change(() => setFilters([]))}
        >
          All 12
        </button>
        {["High pressure", "Corporate", "Technical", "Crisis", "Political"].map(
          (tag) => (
            <button
              key={tag}
              className={u.secondary}
              aria-pressed={filters.includes(tag)}
              onClick={() =>
                change(() =>
                  setFilters(
                    filters.includes(tag)
                      ? filters.filter((t) => t !== tag)
                      : [...filters, tag],
                  ),
                )
              }
            >
              {tag}{" "}
              <small>
                {projects.filter((p) => p.tags.includes(tag)).length}
              </small>
            </button>
          ),
        )}
        <Select
          label="Sort projects"
          value={sort}
          onChange={(value) => change(() => setSort(value))}
          options={[
            { value: "recommended", label: "Recommended" },
            { value: "duration", label: "Duration (all 45–75 min)" },
            { value: "pressure", label: "Pressure first" },
          ]}
        />
        <span className={u.small} role="status">
          {filtered.length} projects
        </span>
      </div>
      <div ref={grid} className={s.grid}>
        {filtered.map((p, i) => {
          const history = runs.filter((r) => r.projectId === p.id),
            open = history.find((r) => r.phase !== "debrief"),
            done = history.find((r) => r.phase === "debrief");
          return (
            <article
              key={p.id}
              className={s.card}
              id={`project-${p.id}`}
              data-highlighted={hover === p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover("")}
              onFocus={() => setHover(p.id)}
              onBlur={() => setHover("")}
              style={palette(p)}
              data-enter
            >
              <div className={s.cardTop}>
                <span>
                  Case {String(projects.indexOf(p) + 1).padStart(2, "0")} /{" "}
                  {categoryNames[p.category] || p.category}
                </span>
                <DraftDot />
              </div>
              <ProjectPosterArt id={p.id} />
              <h2>{p.title}</h2>
              <p>{p.skill}.</p>
              {!publicView && (
                <span className={s.cardStatus}>
                  {open && (
                    <Meter
                      value={open.decisions.length}
                      label={`${open.decisions.length} of 3 chapters complete`}
                    />
                  )}
                  {open
                    ? `In progress · chapter ${open.chapter}/3`
                    : done
                      ? `Completed · ${projectArchetype(done).label}`
                      : "New"}
                </span>
              )}
              {p.id === recommended && !publicView && (
                <p className={s.recommend}>
                  ↗ Suggested from your recorded practice
                </p>
              )}
              {open && (
                <p className={s.remaining}>
                  About {Math.max(15, (3 - open.decisions.length) * 20)} min
                  remaining, estimate
                </p>
              )}
              <div className={s.cardFoot}>
                <span>45–75 min · {p.tags[0]}</span>
                <Link href={`/app/projects/${p.id}`}>
                  {open ? "Resume" : "Enter project"}{" "}
                  <ArrowRight size={13} style={{ display: "inline" }} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
export function ProjectLanding({
  projectId,
  chapterPreview,
}: {
  projectId: string;
  chapterPreview?: number;
}) {
  const p = getProject(projectId)!;
  const { profile } = useWorkspace();
  const runs = useProjectRuns();
  const { bookmarks } = useWorkspaceData();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const own = runs.filter((r) => r.projectId === p.id),
    open = own.find((r) => r.phase !== "debrief"),
    complete = own.find((r) => r.phase === "debrief");
  const saved = bookmarks.some((b) => b.questionId === `project:${p.id}`);
  const progress = open || complete;
  const isChapterComplete = (chapter: number) =>
    !!progress?.decisions.some((d) => d.chapter === chapter);
  const titleParts = [
    p.title.split(" ").slice(0, -1).join(" "),
    p.title.split(" ").at(-1)!,
  ];
  const start = async () => {
    if (!profile) {
      router.push(entryHref(`/app/projects/${p.id}`, "project"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (open) {
        router.push(`/app/projects/${p.id}/run/${open.id}`);
        return;
      }
      const run = await saveProjectRun(createProjectRun(p, profile.id), 0);
      router.push(`/app/projects/${p.id}/run/${run.id}`);
    } catch {
      setError("Could not open the campaign. Your existing work is unchanged.");
      setBusy(false);
    }
  };
  return (
    <>
      <section className={s.detail} style={detailPalette(p)} data-enter>
        <div className={s.detailLabel}>
          <span className={s.paperTag}>Living case study</span>
          <span className={s.categoryTag}>
            {categoryNames[p.category] || p.category}
          </span>
        </div>
        <h1 aria-label={p.title}>
          {titleParts.map((line, i) => (
            <span key={line}>
              {line}
              {i === 0 ? " " : ""}
            </span>
          ))}
        </h1>
        <div className={s.detailDescription}>
          <p className={s.setting}>{p.setting}.</p>
          <p className={s.skill}>{p.skill}.</p>
          <p className={s.practiceCopy}>
            Practice diagnosis under ambiguity, stakeholder negotiation, and a
            commitment you can defend.
          </p>
        </div>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.detailActions}>
          <button
            className={s.caseButton}
            onClick={() => void start()}
            disabled={busy}
          >
            {busy
              ? "Opening…"
              : open
                ? `Resume chapter ${open.chapter}`
                : "Enter project"}
            <ArrowRight size={15} />
          </button>
          {complete && (
            <Link
              className={`${s.caseButton} ${s.caseSecondary}`}
              href={`/app/projects/debrief/${complete.id}`}
            >
              View last debrief
            </Link>
          )}
          <button
            className={`${s.caseButton} ${s.caseSecondary}`}
            disabled={bookmarkBusy}
            onClick={async () => {
              if (!profile) return;
              setBookmarkBusy(true);
              try {
                await toggleProjectBookmark(profile.id, p.id);
                setError("");
              } catch {
                setError(
                  "The project could not be bookmarked. Retry; your campaign is unchanged.",
                );
              } finally {
                setBookmarkBusy(false);
              }
            }}
            aria-pressed={saved}
          >
            <Bookmark size={15} />
            {saved ? "Saved" : "Save project"}
          </button>
        </div>
        <div className={s.detailMeta}>
          <span>
            <Clock size={14} aria-hidden="true" />
            45–75 minutes
          </span>
          <span>Pause anytime</span>
        </div>
        <details className={s.campaignInfo}>
          <summary>
            <Info size={14} aria-hidden="true" />
            How the campaign works
          </summary>
          <p>
            Three chapters, with no forced decision timer. The entrance lasts
            about 8.5 seconds and can be skipped after 2.5. Reduced motion uses
            a short fade. Your choices persist between chapters; alternate
            timelines preserve the original.
          </p>
        </details>
        <div className={s.chapterHeading}>
          <h2>Your three-chapter path</h2>
          <span>{progress?.decisions.length || 0} of 3 completed</span>
        </div>
        <div className={s.chapterMap} aria-label="Campaign chapter progress">
          {p.chapters.map((ch, i) => {
            const completed = isChapterComplete(i + 1);
            const unlocked = i === 0 || isChapterComplete(i);
            const status = completed
              ? "completed"
              : unlocked
                ? "available"
                : "locked";
            return (
              <div
                key={ch.title}
                className={s.chapterCard}
                data-status={status}
              >
                <div className={s.chapterCardTop}>
                  <span>Chapter 0{i + 1}</span>
                  <span className={s.chapterStatus}>
                    {completed ? (
                      <Check size={12} aria-hidden="true" />
                    ) : !unlocked ? (
                      <LockKeyhole size={12} aria-hidden="true" />
                    ) : (
                      <i aria-hidden="true" />
                    )}
                    {completed
                      ? "Completed"
                      : unlocked
                        ? "Available"
                        : "Locked"}
                  </span>
                </div>
                <h2>{ch.title}</h2>
                <p>{unlocked ? ch.brief : chapterTeasers[p.id][i - 1]}</p>
                {unlocked && (
                  <Link
                    className={s.chapterLink}
                    href={`/app/projects/${p.id}/c/${i + 1}`}
                  >
                    {completed ? "Review chapter" : "Read chapter brief"}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {chapterPreview && (
        <section className={u.panel} style={{ marginTop: 24 }}>
          <span className={u.eyebrow}>
            Chapter {chapterPreview} / brief preview
          </span>
          <h2>{p.chapters[chapterPreview - 1].title}</h2>
          {chapterPreview === 1 || isChapterComplete(chapterPreview - 1) ? (
            <>
              <p className={u.prose}>{p.chapters[chapterPreview - 1].brief}</p>
              <p className={u.finePrint}>
                Use Resume to return to your actual saved chapter. A preview
                never advances or resets a campaign.
              </p>
            </>
          ) : (
            <p>Finish the earlier chapter before opening this brief.</p>
          )}
        </section>
      )}
      <section className={u.panel} style={{ marginTop: 25 }}>
        <h2>A campaign, not an interview score.</h2>
        <p className={u.prose}>
          The outcome follows your decisions and explicit state rules. There is
          no single winning path, leaderboard, or numeric grade. The debrief
          explains the trail and lets you branch from any completed chapter
          without replacing the original run.
        </p>
        <p className={u.finePrint}>
          All data, organisations and reactions are simulated. The founder’s
          narrative blueprint is expanded into authored choices and deltas;
          expert calibration and participant review remain pending.
        </p>
      </section>
    </>
  );
}
export function ProjectActivity({
  mode = "progress",
}: {
  mode?: "progress" | "history" | "bookmarks";
}) {
  const runs = useProjectRuns();
  const { bookmarks } = useWorkspaceData();
  const saved = bookmarks.filter((b) => b.questionId.startsWith("project:"));
  const complete = runs.filter((r) => r.phase === "debrief");
  return (
    <section className={s.projectLayer}>
      <div className={u.panelHead}>
        <h2>
          {mode === "bookmarks"
            ? "Saved project decision points"
            : mode === "history"
              ? "Project campaigns"
              : "Your project constellation"}
        </h2>
        <Link href="/app/projects" className={u.textButton}>
          All 12 projects →
        </Link>
      </div>
      {mode === "bookmarks" ? (
        <div className={s.projectNodes}>
          {saved.length ? (
            saved.map((b) => {
              const [, id, chapter] = b.questionId.split(":"),
                p = getProject(id);
              return (
                p && (
                  <Link
                    key={b.id}
                    href={`/app/projects/${id}${chapter ? `/c/${chapter.slice(1)}` : ""}`}
                    style={palette(p)}
                  >
                    <Bookmark size={15} />
                    {p.title}
                    {chapter ? ` · Chapter ${chapter.slice(1)}` : ""}
                  </Link>
                )
              );
            })
          ) : (
            <EmptyState
              kind="saved"
              title="Keep a decision point for later."
              href="/app/projects"
              action="Browse projects"
            >
              Save a project or chapter to return to the same decision.
            </EmptyState>
          )}
        </div>
      ) : (
        <>
          <p className={u.finePrint}>
            {complete.length} completed campaigns ·{" "}
            {new Set(runs.map((r) => r.projectId)).size} of 12 explored.
            Projects end with an archetype and a trace of your decisions.
          </p>
          {mode === "progress" && (
            <RouteMap
              states={Object.fromEntries(
                runs.map((r) => [r.projectId, r.decisions.length || 1]),
              )}
            />
          )}
          <div className={s.projectNodes}>
            {(mode === "progress" ? complete : runs).map((r) => {
              const p = getProject(r.projectId)!;
              return (
                <Link
                  key={r.id}
                  style={palette(p)}
                  href={
                    r.phase === "debrief"
                      ? `/app/projects/debrief/${r.id}`
                      : `/app/projects/${p.id}/run/${r.id}`
                  }
                >
                  <span
                    className={s.chapterTrail}
                    aria-label={`${r.decisions.length} of three chapters complete`}
                  >
                    {[1, 2, 3].map((ch) => (
                      <span
                        key={ch}
                        data-done={r.decisions.some((d) => d.chapter === ch)}
                        title={
                          r.decisions.find((d) => d.chapter === ch)?.label ||
                          `Chapter ${ch}, not completed`
                        }
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                  {p.title} · {r.decisions.length}/3 chapters ·{" "}
                  {r.phase === "debrief"
                    ? projectArchetype(r).label
                    : r.status === "paused"
                      ? "Paused"
                      : "In progress"}
                </Link>
              );
            })}
          </div>
          {!runs.length && (
            <p className={u.prose}>
              A campaign leaves a different kind of trail. Your decisions become
              the next chapter’s constraints.
            </p>
          )}
        </>
      )}
    </section>
  );
}
