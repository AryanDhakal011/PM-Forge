import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { interviewQuestionBank } from "@/lib/questions";
import { rubricBands, rubricSummary } from "@/lib/rubric";
import { modules } from "@/lib/content";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Interview questions, the seven-criterion interview rubric, reading paths, and decision templates.",
  alternates: { canonical: "/resources" },
};

const READING = [
  {
    number: "02",
    title: "Customer Discovery",
    reason:
      "The difference between a request and a behaviour, and how to run an interview that can change your mind.",
    slug: "customer-discovery",
  },
  {
    number: "04",
    title: "Prioritization & Decision Making",
    reason:
      "How to make a call with incomplete evidence, price the alternative, and set a review trigger.",
    slug: "prioritization-and-decision-making",
  },
  {
    number: "08",
    title: "Stakeholder Leadership",
    reason:
      "Pre-wiring a decision, handling a late scope request, and saying no without losing the relationship.",
    slug: "stakeholder-leadership",
  },
  {
    number: "09",
    title: "AI Product Management",
    reason:
      "Quality as a distribution, eval sets, escalation states, and honest confidence language.",
    slug: "ai-product-management",
  },
];

export default function ResourcesPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Resources"
        title={
          <>
            The reference
            <br />
            <em>desk.</em>
          </>
        }
        lede="Question prompts, the exact interview rubric, focused reading paths, and the templates behind every artifact. No gated PDF, no email wall."
        aside={
          <>
            <strong>On this page</strong>
            <div>
              <Link href="#questions">Question bank</Link> ·{" "}
              <Link href="#rubric">Rubric</Link> ·{" "}
              <Link href="#reading">Reading</Link> ·{" "}
              <Link href="#templates">Templates</Link>
            </div>
          </>
        }
      >
        <Link href="/practice" className="btn btnPrimary">
          Put it into practice
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/learn" className="btn btnOutline">
          Browse the curriculum
        </Link>
      </PageHero>

      <section className={styles.section} id="questions">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>Question bank</p>
              <h2 className={styles.sectionTitle}>Prompts that expose reasoning.</h2>
            </div>
            <p className={styles.sectionIntro}>
              Say the answer out loud before reading the note. A strong answer is
              specific, ordered, and willing to name a trade-off.
            </p>
          </div>
          <div className={styles.questionList}>
            {interviewQuestionBank.map((item) => (
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
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionWarm}`} id="rubric">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>The rubric</p>
              <h2 className={styles.sectionTitle}>Seven criteria, scored 0–4 each.</h2>
            </div>
            <p className={styles.sectionIntro}>
              The lab is deterministic: it looks for evidence of each criterion
              in your answer, then returns specific missing pieces. It does not
              pretend to understand meaning the way a human interviewer does.
            </p>
          </div>

          <div className={styles.grid}>
            {rubricSummary.map((criterion, index) => (
              <article key={criterion.id} className={styles.card}>
                <p className={styles.cardMeta}>
                  <span>{criterion.shortLabel}</span>
                  <span className={styles.cardNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </p>
                <h3 className={styles.cardTitle}>{criterion.label}</h3>
                <p className={styles.cardBody}>{criterion.prompt}</p>
              </article>
            ))}
            <article className={styles.card} style={{ background: "var(--warm)" }}>
              <p className={styles.cardMeta}>
                <span>How to score</span>
                <span className={styles.cardNumber}>04</span>
              </p>
              <h3 className={styles.cardTitle}>The answer is the artifact</h3>
              <p className={styles.cardBody}>
                There is no hidden pass mark. The score tells you where the
                reasoning thins out, and the outline shows a stronger structure.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/practice" className={styles.cardLink}>
                  Run the rubric
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>

          <div className={styles.grid} style={{ marginTop: "1.5rem" }}>
            {rubricBands.map((band) => (
              <div key={band.label} className={styles.panel}>
                <p className={styles.cardMeta}>
                  <span>Band</span>
                  <span className={styles.cardNumber}>{band.min}+</span>
                </p>
                <h3 className={styles.cardTitle} style={{ marginTop: "0.35rem" }}>
                  {band.label}
                </h3>
                <p className={styles.cardBody}>{band.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="reading">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>Reading room</p>
              <h2 className={styles.sectionTitle}>Four modules worth a second pass.</h2>
            </div>
            <p className={styles.sectionIntro}>
              Short, applied reading with drills. Each one ends in an artifact,
              not a completion badge.
            </p>
          </div>
          <div className={styles.gridTwo}>
            {READING.map((item) => {
              const module = modules.find((entry) => entry.slug === item.slug);
              return (
                <article key={item.slug} className={styles.card}>
                  <p className={styles.cardMeta}>
                    <span>Module {item.number}</span>
                    <span className={styles.cardNumber}>{item.number}</span>
                  </p>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardBody}>{item.reason}</p>
                  <div className={styles.cardFoot}>
                    <Link href={`/learn/${item.slug}`} className={styles.cardLink}>
                      {module ? "Read the module" : "Open the module"}
                      <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionWarm}`} id="templates">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>Templates</p>
              <h2 className={styles.sectionTitle}>Write the decision down.</h2>
            </div>
            <p className={styles.sectionIntro}>
              The same eight fields appear in the blueprint. Use them for a real
              decision this week.
            </p>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.panel}>
              <p className={styles.eyebrowRow}>Decision memo</p>
              <ol style={{ display: "grid", gap: "0.55rem", listStyle: "decimal", paddingLeft: "1.2rem" }}>
                {[
                  "Problem: the user, behaviour, and time window.",
                  "Evidence: what is measured, and by what definition.",
                  "Assumptions: what you believe but have not checked.",
                  "Options: at least two credible paths, including do nothing.",
                  "Trade-offs: what each option costs and who absorbs it.",
                  "Decision: the call, the owner, and the date.",
                  "Success metric: baseline, target, guardrail, window.",
                  "Next check: the evidence that would make you revisit.",
                ].map((item) => (
                  <li key={item} className={styles.cardBody}>
                    {item}
                  </li>
                ))}
              </ol>
              <div className={styles.formActions}>
                <Link href="/#blueprint" className="btn btnPrimary btnSm">
                  Generate the blueprint
                  <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className={styles.panel} style={{ background: "#2a2119", color: "var(--paper)" }}>
              <p className={styles.eyebrowRow} style={{ color: "rgba(255,248,235,0.62)" }}>
                Interview answer
              </p>
              <h3 className={styles.cardTitle} style={{ color: "var(--paper)" }}>
                Four beats, two minutes.
              </h3>
              <ol style={{ display: "grid", gap: "0.6rem", listStyle: "decimal", paddingLeft: "1.2rem", color: "rgba(255,248,235,0.78)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                <li>Frame the problem and the segment.</li>
                <li>Name the evidence and the first check.</li>
                <li>Make the call and price the trade-off.</li>
                <li>Give the metric, the risk, and the review point.</li>
              </ol>
              <p className={styles.formNote} style={{ color: "rgba(255,248,235,0.6)" }}>
                The lab gives you a strength quote, the missing criterion, and a
                stronger outline. It does not write the answer for you.
              </p>
              <div className={styles.formActions}>
                <Link href="/practice" className="btn btnOutlineLight btnSm">
                  Rehearse it
                  <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
