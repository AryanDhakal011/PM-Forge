import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { DashboardView } from "@/components/site/DashboardView";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Your workspace",
  description:
    "Your PMForge practice snapshot: modules, signal strength, project decisions, interview score, and the next useful action.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Practice workspace"
        title={
          <>
            Judgment, made
            <br />{" "}
            <em>visible.</em>
          </>
        }
        lede="A live snapshot of what you have practised and what to do next. The numbers come from this browser, not a demo chart."
        aside={
          <>
            <strong>One loop, four artifacts</strong>
            A signal call, a project decision, an interview answer, and a
            blueprint. Each one can stand on its own.
          </>
        }
      />
      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <DashboardView />
        </div>
      </section>
    </PageShell>
  );
}
