import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { ProjectsWorkbench } from "@/components/landing/ProjectsWorkbench";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Project workbench",
  description:
    "Work a full-cycle product project: select a phase, inspect artifacts, complete the sprint, then make and document a decision under pressure.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Project workbench"
        title={
          <>
            Work the mess,
            <br />
            <em>not a case study.</em>
          </>
        }
        lede="Two live scenarios, each with a phase timeline, artifacts, a sprint checklist, and a pressure event that changes the evidence. Your decision and rationale are saved in this browser."
        aside={
          <>
            <strong>Two scenarios</strong>
            Marketplace Checkout Recovery and Growth Onboarding. Same interface,
            different constraints.
          </>
        }
      >
        <Link href="#projects" className="btn btnPrimary">
          Open the workbench
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/#blueprint" className="btn btnOutline">
          Turn a decision into a blueprint
        </Link>
      </PageHero>

      <ProjectsWorkbench />

      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Habit</span>
                <span className={styles.cardNumber}>01</span>
              </p>
              <h2 className={styles.cardTitle}>Inspect before deciding</h2>
              <p className={styles.cardBody}>
                Open the artifacts for the phase you are in. A decision made from
                the brief alone is a guess with better formatting.
              </p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Habit</span>
                <span className={styles.cardNumber}>02</span>
              </p>
              <h2 className={styles.cardTitle}>Name the trade-off</h2>
              <p className={styles.cardBody}>
                Every pressure choice costs something. The record asks what you
                gave up, not just what you chose.
              </p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Habit</span>
                <span className={styles.cardNumber}>03</span>
              </p>
              <h2 className={styles.cardTitle}>Set the next check</h2>
              <p className={styles.cardBody}>
                A decision without a review trigger is a belief. Write the
                evidence that would make you reassess.
              </p>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
