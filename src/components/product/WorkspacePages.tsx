"use client";
import {
  memo,
  useMemo,
  useCallback,
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DecisionDesk from "./DecisionDesk";
import ResumeInterview from "./interview/ResumeInterview";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Search,
  Shuffle,
  SlidersHorizontal,
} from "lucide-react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import {
  CATEGORIES,
  questions,
  getQuestion,
  categoryOf,
} from "@/lib/product/content";
import type { Question } from "@/lib/product/types";
import { stageLabel, scoreRun } from "@/lib/product/engine";
import { db, markDirty } from "@/lib/product/db";
import { entryHref } from "@/lib/product/routes";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceData } from "./useWorkspaceData";
import {
  CoverageTable,
  DraftDot,
  DRAFT_NOTICE,
  Emblem,
  EmptyState,
  Meter,
  Select,
} from "./WorkspaceUI";
import { ProjectActivity } from "@/components/projects/ProjectViews";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import u from "./Product.module.css";
import s from "./WorkspacePages.module.css";
const Instrument = dynamic(() => import("./CoverageInstrument"), {
  ssr: false,
});

export function HomeView(){return <DecisionDesk/>;}
type CardProps = {
  q: Question;
  saved: boolean;
  done: boolean;
  started: boolean;
  publicView: boolean;
  toggle: (id: string) => void;
};
const ScenarioCard = memo(function ScenarioCard({
  q,
  saved,
  done,
  started,
  publicView,
  toggle,
}: CardProps) {
  const c = categoryOf(q.category);
  return (
    <article
      className={s.scenarioCard}
      data-card={q.id}
      style={{ "--accent": c.color } as CSSProperties}
    >
      <div className={s.scenarioTop}>
        <Emblem category={q.category} />
        <span>{c.label}</span>
        <DraftDot />
      </div>
      <Link
        className={s.cardLink}
        href={`${publicView ? "/questions" : "/app/practice"}/${q.slug}`}
      >
        <h3>{q.title}</h3>
        <p>{q.primer[1]}</p>
        <footer>
          <span>
            <Meter
              value={["easy", "medium", "hard"].indexOf(q.level) + 1}
              label={q.level}
            />{" "}
            <span className={s.capitalize}>{q.level}</span> · {q.minutes} min
          </span>
          <span>
            {done ? "Completed" : started ? "In progress" : "Open brief"}{" "}
            <ArrowRight size={14} />
          </span>
        </footer>
      </Link>
      <button
        className={s.bookmark}
        onClick={() => toggle(q.id)}
        aria-label={`${saved ? "Remove bookmark for" : "Bookmark"} ${q.title}`}
        aria-pressed={saved}
      >
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
});
export function LibraryView({
  publicView = false,
  bookmarksOnly = false,
}: {
  publicView?: boolean;
  bookmarksOnly?: boolean;
}) {
  const { profile } = useWorkspace();
  const { runs, bookmarks } = useWorkspaceData();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { reducedMotion } = useSettings();
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ id: string; saved: boolean } | null>(
    null,
  );
  const [sheet, setSheet] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flip = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const prevIds = useRef<string[]>([]);
  const search = params.get("q") || "",
    categories = (params.get("category") || "").split(",").filter(Boolean),
    level = params.get("level") || "",
    length = params.get("time") || "",
    sort = params.get("sort") || "recommended",
    view = bookmarksOnly ? "saved" : params.get("view") || "all",
    layout = params.get("layout") || "cards",
    savedTab = params.get("savedTab") || "scenarios";
  const update = (key: string, value: string) => {
    if (!reducedMotion && grid.current && grid.current.children.length <= 40) {
      gsap.registerPlugin(Flip);
      flip.current = Flip.getState(grid.current.children);
    }
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() =>
      router.replace(`${pathname}${next.size ? "?" + next : ""}`, {
        scroll: false,
      }),
    );
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        e.key === "/" &&
        !el.isContentEditable &&
        !/INPUT|TEXTAREA|SELECT/.test(el.tagName) &&
        !el.closest("[role=dialog]")
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const saved = useMemo(
    () => new Set(bookmarks.map((b) => b.questionId)),
    [bookmarks],
  );
  const done = new Set(
    runs.filter((r) => r.completedAt).map((r) => r.questionId),
  );
  const started = new Set(
    runs.filter((r) => !r.completedAt).map((r) => r.questionId),
  );
  const status = params.get("status") || "";
  let filtered = questions.filter(
    (q) =>
      (!categories.length || categories.includes(q.category)) &&
      (!level || q.level === level) &&
      (!search ||
        `${q.title} ${q.scenario} ${categoryOf(q.category).label}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (view !== "saved" || saved.has(q.id)) &&
      (view !== "completed" || done.has(q.id)) &&
      (view !== "in-progress" || started.has(q.id)) &&
      (!status ||
        (status === "completed"
          ? done.has(q.id)
          : status === "bookmarked"
            ? saved.has(q.id)
            : status === "in-progress"
              ? started.has(q.id)
              : !done.has(q.id) && !started.has(q.id))) &&
      (!length ||
        (length === "short"
          ? q.minutes < 10
          : length === "medium"
            ? q.minutes >= 10 && q.minutes < 15
            : q.minutes >= 15)),
  );
  const levelRank = (q: Question) =>
    ["easy", "medium", "hard"].indexOf(q.level);
  if (sort !== "content") {
    const first = new Set(
      CATEGORIES.map(
        (c) =>
          questions.find((q) => q.category === c.id && q.level === "easy")?.id,
      ),
    );
    filtered = filtered
      .slice()
      .sort((a, b) =>
        sort === "duration"
          ? a.minutes - b.minutes
          : Number(done.has(a.id)) - Number(done.has(b.id)) ||
            (sort === "recommended"
              ? Number(first.has(b.id)) - Number(first.has(a.id))
              : 0) ||
            levelRank(a) - levelRank(b) ||
            CATEGORIES.findIndex((c) => c.id === a.category) -
              CATEGORIES.findIndex((c) => c.id === b.category),
      );
  }
  const ids = filtered.map((q) => q.id).join(",");
  useLayoutEffect(() => {
    const previous = prevIds.current;
    const next = ids.split(",");
    const changed =
      previous.filter((id) => !next.includes(id)).length +
      next.filter((id) => !previous.includes(id)).length;
    prevIds.current = next;
    const snapshot = flip.current;
    flip.current = null;
    if (!snapshot || reducedMotion || changed > 40 || !grid.current) return;
    const ctx = gsap.context(
      () =>
        Flip.from(snapshot, {
          duration: 0.45,
          ease: "power2.inOut",
          absolute: false,
          prune: true,
        }),
      grid,
    );
    return () => ctx.revert();
  }, [ids, reducedMotion]);
  const toggle = useCallback(
    async (id: string) => {
      if (!profile) {
        router.push(
          entryHref(`/app/practice/${getQuestion(id)!.slug}`, "bookmark"),
        );
        return;
      }
      try {
        const key = `${profile.id}:${id}`;
        if (saved.has(id)) await db.bookmarks.delete(key);
        else
          await db.bookmarks.put({
            id: key,
            ownerId: profile.id,
            questionId: id,
            updatedAt: new Date().toISOString(),
          });
        await markDirty(profile.id);
        setToast({ id, saved: !saved.has(id) });
      } catch {
        setError("Could not save the bookmark. Please retry.");
      }
    },
    [profile?.id, router, saved],
  );
  const hasFilters =
    view !== "saved" ||
    bookmarks.filter((b) => !b.questionId.startsWith("project:")).length >= 5;
  const resultControls = (
    <div className={s.resultRow}>
      <p role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "scenario" : "scenarios"}
      </p>
      <Select
        label="Sort scenarios"
        value={sort}
        onChange={(v) => update("sort", v)}
        options={[
          { value: "recommended", label: "Recommended" },
          { value: "level", label: "By level" },
          { value: "duration", label: "Shortest first" },
          { value: "content", label: "Content order" },
        ]}
      />
    </div>
  );
  const filters = (
    <>
      <div className={s.categoryFilters} role="group" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            aria-pressed={categories.includes(c.id)}
            style={{ "--accent": c.color } as CSSProperties}
            onClick={() =>
              update(
                "category",
                categories.includes(c.id)
                  ? categories.filter((x) => x !== c.id).join(",")
                  : [...categories, c.id].join(","),
              )
            }
          >
            <Emblem category={c.id} />
            {c.label}
            <small>{questions.filter((q) => q.category === c.id).length}</small>
          </button>
        ))}
      </div>
      <div className={s.filterRow}>
        <Select
          label="Level"
          value={level}
          onChange={(v) => update("level", v)}
          options={[
            { value: "", label: "All levels" },
            ...["easy", "medium", "hard"].map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            })),
          ]}
        />
        <Select
          label="Time available"
          value={length}
          onChange={(v) => update("time", v)}
          options={[
            { value: "", label: "Any length" },
            { value: "short", label: "Under 10 min" },
            { value: "medium", label: "10–15 min" },
            { value: "long", label: "15+ min" },
          ]}
        />
        {(categories.length > 0 || level || length || search || status) && (
          <Link
            className={u.textButton}
            href={`${pathname}?view=${view}&layout=${layout}`}
          >
            Clear all filters
          </Link>
        )}
      </div>
    </>
  );
  return (
    <>
      <ResumeInterview runs={runs}/>
      <div className={u.pageHead} data-enter>
        <div>
          <h1>
            {view === "saved"
              ? "Saved for later."
              : "Find your next challenge."}
          </h1>
          <p>63 specific situations. Seven ways to exercise your judgment.</p>
        </div>
      </div>
      <p className={s.draftNotice}>{DRAFT_NOTICE}</p>
      <nav className={u.tabs} aria-label="Practice views">
        {["all", "saved", "in-progress", "completed"].map((v) => (
          <button
            key={v}
            aria-pressed={view === v}
            onClick={() => update("view", v)}
          >
            {v === "all"
              ? "All"
              : v === "in-progress"
                ? "In progress"
                : v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </nav>
      {view === "saved" && (
        <div className={u.tabs} aria-label="Saved items">
          <button
            onClick={() => update("savedTab", "scenarios")}
            aria-pressed={savedTab === "scenarios"}
          >
            Scenarios
          </button>
          <button
            onClick={() => update("savedTab", "projects")}
            aria-pressed={savedTab === "projects"}
          >
            Project decision points
          </button>
        </div>
      )}
      {view === "saved" && savedTab === "projects" ? (
        <ProjectActivity mode="bookmarks" />
      ) : (
        <>
          {hasFilters && (
            <section className={s.toolbar} aria-label="Filter scenarios">
              <div className={s.searchRow}>
                <label className={u.searchField}>
                  <span className="srOnly">Search scenarios</span>
                  <Search size={18} />
                  <input
                    ref={ref}
                    value={search}
                    onChange={(e) => update("q", e.target.value)}
                    placeholder="Search a situation or skill…"
                  />
                  <kbd>/</kbd>
                </label>
                <button
                  className={`${u.secondary} ${s.mobileFilters}`}
                  onClick={() => setSheet(true)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
                <div
                  className={s.layoutSwitch}
                  role="group"
                  aria-label="Library display"
                >
                  {["cards", "list", "map"].map((v) => (
                    <button
                      key={v}
                      aria-pressed={layout === v}
                      onClick={() => update("layout", v)}
                    >
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={s.desktopFilters}>{filters}</div>
              {resultControls}
            </section>
          )}
          {!hasFilters && resultControls}
          {(categories.length > 0 || level || length) && (
            <div className={s.activeFilters}>
              {categories.map((id) => (
                <button
                  key={id}
                  onClick={() =>
                    update(
                      "category",
                      categories.filter((c) => c !== id).join(","),
                    )
                  }
                >
                  {categoryOf(id as Question["category"]).label} ×
                </button>
              ))}
              {level && (
                <button onClick={() => update("level", "")}>{level} ×</button>
              )}
              {length && (
                <button onClick={() => update("time", "")}>
                  {length === "short"
                    ? "Under 10 min"
                    : length === "medium"
                      ? "10–15 min"
                      : "15+ min"}{" "}
                  ×
                </button>
              )}
            </div>
          )}
          {error && <p role="alert">{error}</p>}
          {filtered.length ? (
            layout === "map" ? (
              <section className={u.panel}>
                <h2>Choose a point on your map</h2>
                <div className={s.scenarioMap}>
                  {CATEGORIES.map((c) => (
                    <div
                      key={c.id}
                      style={{ "--accent": c.color } as CSSProperties}
                    >
                      <Emblem category={c.id} />
                      <strong>{c.label}</strong>
                      <div>
                        {filtered
                          .filter((q) => q.category === c.id)
                          .map((q) => (
                            <Link
                              key={q.id}
                              href={`/app/practice/${q.slug}`}
                              aria-label={`${q.title}, ${q.level}, ${q.minutes} minutes`}
                              title={q.title}
                              data-done={done.has(q.id)}
                            >
                              {q.level[0].toUpperCase()}
                            </Link>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div ref={grid} className={s.scenarios} data-layout={layout}>
                {filtered.map((q) => (
                  <ScenarioCard
                    key={q.id}
                    q={q}
                    saved={saved.has(q.id)}
                    done={done.has(q.id)}
                    started={started.has(q.id)}
                    publicView={publicView}
                    toggle={toggle}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              kind={view === "saved" ? "saved" : "filter"}
              title={
                view === "saved"
                  ? "Bookmark a scenario and it waits here."
                  : "Nothing matches that mix."
              }
              href={pathname}
              action={view === "saved" ? "Browse library" : "Clear filters"}
            >
              {view !== "saved"
                ? "Loosen one filter."
                : "Keep a starting point for your next quiet hour."}
            </EmptyState>
          )}
        </>
      )}
      {toast && (
        <div className={s.toast} role="status">
          {toast.saved ? "Scenario saved." : "Bookmark removed."}
          <Link href="/app/practice?view=saved">View saved</Link>
          <button onClick={() => void toggle(toast.id)}>Undo</button>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
      <Dialog
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter scenarios"
        placement="bottom"
        size="sm"
      >
        <div className={u.product} style={{ minHeight: 0 }}>
          {filters}
          <button className={u.primary} onClick={() => setSheet(false)}>
            Show {filtered.length} scenarios
          </button>
        </div>
      </Dialog>
    </>
  );
}
