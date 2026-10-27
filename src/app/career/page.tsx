import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CareerBoard } from "@/components/landing/CareerBoard";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Career tools",
  description:
    "Turn practice into portfolio evidence: set a target role, add a LinkedIn profile, benchmark your evidence, and copy a shareable summary.",
  alternates: { canonical: "/career" },
};

export default function CareerPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Career tools"
        title={
          <>
            Show the work,
            <br />
            <em>not the buzzwords.</em>
          </>
        }
        lede="A profile card built from the decisions you have documented. Set a target role, add a profile link, and see which evidence is still missing. The card is labelled as an example until you have practice saved."
        aside={
          <>
            <strong>Privacy first</strong>
            Your role, link, and practice stay in this browser. No recruiter
            database, no network request.
          </>
        }
      >
        <Link href="#career" className="btn btnPrimary">
          Open career tools
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/projects" className="btn btnOutline">
          Document another decision
        </Link>
      </PageHero>

      <CareerBoard />

      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Evidence</span>
                <span className={styles.cardNumber}>01</span>
              </p>
              <h2 className={styles.cardTitle}>A decision record</h2>
              <p className={styles.cardBody}>
                Context, evidence, options, call, trade-off, next check. The
                project workbench writes this shape for you.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/projects" className={styles.cardLink}>
                  Create one
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Evidence</span>
                <span className={styles.cardNumber}>02</span>
              </p>
              <h2 className={styles.cardTitle}>A clear rationale</h2>
              <p className={styles.cardBody}>
                The blueprint turns a decision into a one-page artifact with
                assumptions and remaining risks named.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/#blueprint" className={styles.cardLink}>
                  Build a blueprint
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Evidence</span>
                <span className={styles.cardNumber}>03</span>
              </p>
              <h2 className={styles.cardTitle}>A rehearsed story</h2>
              <p className={styles.cardBody}>
                The interview lab quotes your own strongest line and names the
                missing piece. Use it to tighten the 90-second version.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/practice" className={styles.cardLink}>
                  Rehearse the story
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
