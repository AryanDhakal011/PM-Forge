import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why PMForge exists: a practice ground for product judgment, built around evidence, decisions, and artifacts you can defend.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        kicker="About PMForge"
        title={
          <>
            The job is
            <br />{" "}
            <em>judgment.</em>
          </>
        }
        lede="Product management is not a library of frameworks. It is the repeated act of making a call with incomplete evidence, explaining what you gave up, and noticing when the world has changed. PMForge is a place to practise that act without burning a real team."
        aside={
          <>
            <strong>What this is</strong>
            An independent, local-first product prototype. Not a bootcamp, not a
            hiring marketplace, and not a substitute for shipping real work.
          </>
        }
      >
        <Link href="/learn" className="btn btnPrimary">
          Start with the curriculum
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/credits" className="btn btnOutline">
          Assets and credits
        </Link>
      </PageHero>

      <section className={styles.section}>
        <div className={styles.innerNarrow}>
          <div className={styles.prose}>
            <h2>Why practice, not content</h2>
            <p>
              Most product education is consumption: a video, a framework, a
              certificate. The hard part is not knowing what a decision record is.
              The hard part is writing one when the evidence is thin, a
              stakeholder is pushing, and the deadline is today.
            </p>
            <p>
              PMForge makes you do the smaller version of that work. You sort ten
              inputs and defend a signal. You inspect project artifacts and make a
              call when new evidence arrives. You answer a case out loud against a
              rubric. You leave with an artifact, not a completion badge.
            </p>

            <h2>Four principles</h2>
            <ul>
              <li>
                <strong>Evidence over volume.</strong> A measured signal beats ten
                loud opinions, including yours.
              </li>
              <li>
                <strong>Decisions over deliverables.</strong> The output is a
                record of reasoning, not a screen with a nice gradient.
              </li>
              <li>
                <strong>Legibility over certainty.</strong> A good decision can be
                challenged by someone else. That is a feature.
              </li>
              <li>
                <strong>Local over performative.</strong> Your practice is yours.
                No feed, no leaderboard, no growth loop on your attention.
              </li>
            </ul>

            <h2>The loop</h2>
            <p>
              <strong>Signal.</strong> Sort evidence from noise.{" "}
              <strong>Decision.</strong> Work a project and document the
              trade-off. <strong>Impact.</strong> Rehearse the story and turn the
              reasoning into portfolio evidence. Then reassess when the world
              moves.
            </p>
            <p>
              The product is deliberately finite. Ten modules, two project
              scenarios, one interview case, and one blueprint format. Depth comes
              from repetition with real products, not from an infinite content
              library.
            </p>

            <h2>Who it is for</h2>
            <p>
              Aspiring PMs who need evidence of judgment, practising PMs who want
              a sharper decision habit, career switchers translating prior work
              into product language, and founders making product calls without a
              product function.
            </p>

            <h2>What is honest about this build</h2>
            <p>
              There is no hosted account system, no model-graded feedback, and no
              voice transcription. The profile and practice live in your browser.
              The interview rubric is deterministic. The 3D scenes are authored
              procedurally in Three.js rather than delivered as Blender assets.
              The{" "}
              <Link href="/credits">credits page</Link> and{" "}
              <Link href="/help">help page</Link> document the limits in detail.
            </p>

            <div className={styles.note} style={{ marginTop: "1.6rem" }}>
              <strong>Built independently.</strong> PMForge is a product prototype
              and design exercise, not a claim about a company, a team, or a
              customer base. There are no invented testimonials on this site.
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionWarm}`}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Start</span>
                <span className={styles.cardNumber}>01</span>
              </p>
              <h2 className={styles.cardTitle}>Take the signal test</h2>
              <p className={styles.cardBody}>
                Four minutes. No sign-up needed. Find out whether you reach for
                the loudest input or the strongest one.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/#signal" className={styles.cardLink}>
                  Open the test
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Build</span>
                <span className={styles.cardNumber}>02</span>
              </p>
              <h2 className={styles.cardTitle}>Work the curriculum</h2>
              <p className={styles.cardBody}>
                Ten modules with three drills each. Use a product you actually
                use, not a hypothetical.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/learn" className={styles.cardLink}>
                  Browse modules
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={styles.card}>
              <p className={styles.cardMeta}>
                <span>Show</span>
                <span className={styles.cardNumber}>03</span>
              </p>
              <h2 className={styles.cardTitle}>Leave with evidence</h2>
              <p className={styles.cardBody}>
                A decision record, an interview score, and a blueprint you can
                copy or download.
              </p>
              <div className={styles.cardFoot}>
                <Link href="/career" className={styles.cardLink}>
                  Open career tools
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
