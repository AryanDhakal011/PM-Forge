import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { projects } from "@/lib/projects/content";
import s from "@/components/projects/Projects.module.css";
import u from "@/components/product/Product.module.css";
export const metadata: Metadata = {
  title: "Real World Projects · 12 living case studies",
  description:
    "Three-chapter product campaigns with persistent decisions, authored consequences, traceable debriefs and alternate timelines.",
};
export default function Page() {
  return (
    <PageShell>
      <div className={u.product} style={{ minHeight: 0 }}>
        <main
          className={u.content}
          style={{ maxWidth: 1350, margin: "0 auto", paddingTop: 70 }}
        >
          <header className={s.galleryHead}>
            <span className={u.eyebrow}>
              Real World Projects / from practice to consequence
            </span>
            <h1>
              The map draws itself
              <br />
              <em>while you walk.</em>
            </h1>
            <p>
              Twelve fictional companies. Three chapters each. Make an
              irreversible tradeoff, watch the operating state change, and enter
              the next chapter with that commitment still on the table.
            </p>
            <Link href="/app/projects" className={u.primary}>
              Explore all 12 campaigns →
            </Link>
            <p className={u.finePrint}>
              45–75 minutes per campaign, with pause/resume. Guest work is saved
              on this device. Configured accounts can sync. All data is
              simulated; authored content awaits expert review.
            </p>
          </header>
          <div className={s.grid}>
            {projects.map((p, i) => (
              <article
                key={p.id}
                className={s.card}
                style={
                  {
                    "--case-bg": p.palette.bg,
                    "--case-ink": p.palette.ink,
                    "--case-accent": p.palette.accent,
                  } as CSSProperties
                }
              >
                <div className={s.cardTop}>
                  <span>Case {String(i + 1).padStart(2, "0")}</span>
                  <span>3 chapters</span>
                </div>
                <h2>{p.title}</h2>
                <p>{p.skill}.</p>
                <div className={s.cardFoot}>
                  <span>45–75 min · {p.tags[0]}</span>
                  <Link href={`/app/projects/${p.id}`}>Read the brief →</Link>
                </div>
              </article>
            ))}
          </div>
          <section className={u.panel} style={{ margin: "40px 0 70px" }}>
            <h2>What happens inside?</h2>
            <p className={u.prose}>
              Enter an authored setting, inspect conflicting evidence, choose a
              commitment, and review its known cost before locking it. State
              changes become the next chapter’s constraints. Finish with a
              consequence trace, an archetype description, exports, and a branch
              from any completed chapter. No single score and no generated plot.
            </p>
            <Link className={u.textButton} href="/app/projects">
              Find your first recurring battle →
            </Link>
          </section>
        </main>
      </div>
    </PageShell>
  );
}
