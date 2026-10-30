import { reviewStatus } from "@/lib/product/readiness";
import Link from "next/link";
import { ArrowRight, Clock, Search } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  CATEGORIES,
  categoryOf,
  questions,
  REFERENCE_NOTE,
} from "@/lib/product/content";
import styles from "@/components/product/Product.module.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "63 product management scenarios",
  description:
    "Browse seven categories and three levels of draft, evidence-driven PM interview scenarios.",
  robots: { index: false, follow: true },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const category = value("category"),
    level = value("level"),
    query = value("q").slice(0, 200),
    time = value("time");
  const filtered = questions.filter(
    (q) =>
      (!category || q.category === category) &&
      (!level || q.level === level) &&
      (!query ||
        `${q.title} ${q.scenario}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!time ||
        (time === "short"
          ? q.minutes < 10
          : time === "medium"
            ? q.minutes >= 10 && q.minutes < 20
            : q.minutes >= 20)),
  );
  return (
    <PageShell>
      <div className={styles.product}>
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <div>
              <span className={styles.eyebrow}>
                The public scenario library
              </span>
              <h1>Find your next challenge.</h1>
              <p>
                63 specific situations. Seven ways to exercise your judgment.
                Browse freely; bring the work into your own workspace when
                you’re ready.
              </p>
            </div>
            <Link href="/app/practice" className={styles.secondary}>
              Open my practice desk
              <ArrowRight size={14} />
            </Link>
          </div>
          <form action="/questions" method="get" className={styles.filters}>
            <label className={styles.searchField}>
              <span className="srOnly">Search scenarios</span>
              <Search size={15} />
              <input
                name="q"
                defaultValue={query}
                placeholder="A situation, skill, or question…"
                maxLength={200}
              />
            </label>
            <select
              aria-label="Category"
              name="category"
              defaultValue={category}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select aria-label="Level" name="level" defaultValue={level}>
              <option value="">All levels</option>
              {["easy", "medium", "hard"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select aria-label="Time available" name="time" defaultValue={time}>
              <option value="">Any length</option>
              <option value="short">Under 10 min</option>
              <option value="medium">10–20 min</option>
              <option value="long">20+ min</option>
            </select>
            <button className={styles.primary} type="submit">
              Apply filters
            </button>
          </form>
          <p
            className={`${styles.small} ${styles.muted}`}
            style={{ marginBottom: 20 }}
          >
            {filtered.length} scenarios · Review status on each brief
          </p>
          <div className={styles.grid3}>
            {filtered.map((q) => (
              <article className={styles.questionCard} key={q.id}>
                <span
                  className={styles.badge}
                  style={{ color: categoryOf(q.category).color }}
                >
                  {categoryOf(q.category).label}
                </span>
                <span className={styles.badge}>{reviewStatus(q)}</span>
                <h3>
                  <Link href={`/questions/${q.slug}`}>{q.title}</Link>
                </h3>
                <p>{q.primer[1]}</p>
                <div className={styles.cardFoot}>
                  <span className={styles.row} style={{ gap: 8 }}>
                    <Clock size={12} />
                    <span style={{ textTransform: "capitalize" }}>
                      {q.level}
                    </span>{" "}
                    · {q.minutes} min
                  </span>
                  <Link href={`/questions/${q.slug}`}>
                    Open brief
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className={styles.empty}>
              <h2>No scenarios match that combination.</h2>
              <p>Try a broader search or clear the filters.</p>
              <Link href="/questions" className={styles.secondary}>
                Show all 63
              </Link>
            </div>
          )}
          <p className={styles.finePrint} style={{ marginTop: 26 }}>
            {REFERENCE_NOTE}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
