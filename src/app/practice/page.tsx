import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { InterviewLab } from "@/components/landing/InterviewLab";
import { interviewCase } from "@/lib/content";
import { interviewQuestionBank } from "@/lib/questions";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Interview practice",
  description:
    "A two-minute product interview with optional browser speech dictation, keyboard answer mode, and a deterministic seven-criterion rubric. No model call.",
  alternates: { canonical: "/practice" },
};

const BANK = interviewQuestionBank;

export default function PracticePage() {
  return (
    <PageShell>
      <PageHero
        kicker="Interview lab"
        title={
          <>
            Say it better,
            <br />
            <em>under pressure.</em>
          </>
        }
        lede="A two-minute case with optional browser speech dictation and keyboard mode. Your answer is scored locally by a deterministic rubric. Speech recognition may send audio to your browser's provider; PMForge does not record or store audio."
        aside={
          <>
            <strong>{interviewCase.label}</strong>
            {interviewCase.prompt}
            <div style={{ marginTop: "0.8rem" }}>
              <Link href="/resources#questions">
                Browse the question bank
              </Link>
            </div>
          </>
        }
      >
        <Link href="#interview" className="btn btnPrimary">
          Start the simulation
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/resources" className="btn btnOutline">
          Read the rubric guide
        </Link>
      </PageHero>

      <InterviewLab />

      <section className={`${styles.section} ${styles.sectionWarm}`} id="questions">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>Question bank</p>
              <h2 className={styles.sectionTitle}>Six prompts worth rehearsing.</h2>
            </div>
            <p className={styles.sectionIntro}>
              The simulator uses one live case. These prompts are for repetition:
              say the answer out loud, then cut the first and last sentence.
            </p>
          </div>
          <div className={styles.questionList}>
            {BANK.map((item) => (
              <article key={item.prompt} className={styles.question}>
                <div>
                  <h3>{item.prompt}</h3>
                  <p>
                    <strong>Strong answers include:</strong> {item.strong}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.formNote}>
            Want the scoring logic?{" "}
            <Link href="/resources#rubric" className={styles.inlineLink}>
              Read how the seven criteria work
            </Link>
            , or{" "}
            <Link href="/learn/prioritization-and-decision-making" className={styles.inlineLink}>
              take the prioritisation module
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
