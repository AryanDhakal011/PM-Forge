import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { ModuleGrid } from "@/components/site/ModuleGrid";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Modules",
  description:
    "Ten product-management modules built around practice drills, artifacts, and decisions you can defend.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return (
    <PageShell>
      <PageHero
        kicker="The curriculum"
        title={
          <>
            A curriculum for
            <br />{" "}
            <em>judgment.</em>
          </>
        }
        lede="Ten modules, each ending in an artifact rather than a quiz. Work the drills against a product you actually use, then carry the thinking into a project, an interview, or a decision blueprint."
        aside={
          <>
            <strong>At your pace</strong>
            No cohort, no expiry. Progress is held in this browser, and every
            module stays open.
          </>
        }
      >
        <Link href="/learn/foundation-and-product-strategy" className="btn btnPrimary">
          Start module 01
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/practice" className="btn btnOutline">
          Skip to interview practice
        </Link>
      </PageHero>

      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <ModuleGrid />
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionWarm}`}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Apply</span>
                <span className={styles.cardNumber}>01</span>
              </p>
              <h2 className={styles.cardTitle}>Test a signal</h2>
              <p className={styles.cardBody}>
                Ten inputs, one hour. Find the evidence that is measured,
                recent, broad, and tied to the business.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/#signal" className={styles.cardLink}>
                  Open the signal test
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Apply</span>
                <span className={styles.cardNumber}>02</span>
              </p>
              <h2 className={styles.cardTitle}>Work a project</h2>
              <p className={styles.cardBody}>
                Choose a scenario, move through four phases, then decide what
                ships when new evidence lands.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/projects" className={styles.cardLink}>
                  Open the workbench
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Apply</span>
                <span className={styles.cardNumber}>03</span>
              </p>
              <h2 className={styles.cardTitle}>Defend the call</h2>
              <p className={styles.cardBody}>
                A two-minute interview, a deterministic rubric, and the one
                missing piece that would make the answer stronger.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/practice" className={styles.cardLink}>
                  Open the interview lab
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
