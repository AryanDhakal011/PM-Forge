import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { EvidenceCheck } from "@/components/site/EvidenceCheck";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Working PM tools: an evidence strength check, signal test, project workbench, interview lab, decision blueprint, and career board.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  {
    number: "01",
    title: "Signal test",
    body: "Ten conflicting inputs. Isolate the one that is measured, recent, broad, and tied to revenue.",
    href: "/#signal",
    cta: "Open the signal test",
    meta: "4 minutes",
  },
  {
    number: "02",
    title: "Project workbench",
    body: "Move through research, define, build, and launch. Document a decision when the pressure event changes the evidence.",
    href: "/projects",
    cta: "Open the workbench",
    meta: "15 minutes",
  },
  {
    number: "03",
    title: "Interview lab",
    body: "A two-minute case with optional browser speech dictation and a deterministic seven-criterion rubric. Type mode included; speech recognition may send audio to the browser's provider.",
    href: "/practice",
    cta: "Run an interview",
    meta: "5 minutes",
  },
  {
    number: "04",
    title: "Decision blueprint",
    body: "Turn a decision into a one-page artifact: problem, evidence, assumptions, options, trade-offs, metric, next check.",
    href: "/#blueprint",
    cta: "Build a blueprint",
    meta: "8 minutes",
  },
  {
    number: "05",
    title: "Career board",
    body: "See how practice becomes portfolio evidence. Set a target role, add a profile link, and copy a summary.",
    href: "/career",
    cta: "Open career tools",
    meta: "3 minutes",
  },
  {
    number: "06",
    title: "Curriculum",
    body: "Ten modules with three drills and one artifact each. Start at strategy, or jump to the module you need.",
    href: "/learn",
    cta: "Browse modules",
    meta: "Self-paced",
  },
];

export default function ToolsPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Working tools"
        title={
          <>
            Thinking aids,
            <br />
            <em>not dashboards.</em>
          </>
        }
        lede="Six small instruments for the moments that decide a product: sorting evidence, making a call, explaining the trade-off, and rehearsing the story. Every tool is usable now and saves locally."
        aside={
          <>
            <strong>No lock-in</strong>
            Every artifact can be copied or downloaded. Practice stays in this
            browser.
          </>
        }
      >
        <Link href="#evidence-check" className="btn btnPrimary">
          Try the evidence check
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link href="/help" className="btn btnOutline">
          How the tools work
        </Link>
      </PageHero>

      <section className={styles.section} id="evidence-check">
        <div className={styles.inner}>
          <div className={styles.gridTwo} style={{ alignItems: "start" }}>
            <EvidenceCheck />
            <div>
              <p className={styles.eyebrowRow}>How to read it</p>
              <h2 className={styles.sectionTitle}>
                Strong evidence is boring. That is the point.
              </h2>
              <p className={styles.sectionIntro} style={{ marginTop: "0.9rem" }}>
                “Everyone is asking for it” is not evidence. Neither is one
                enterprise deal, a competitor's release note, or a CEO's
                preference. Evidence earns its weight by being measured,
                current, broad, and connected to value.
              </p>
              <p className={styles.sectionIntro} style={{ marginTop: "0.8rem" }}>
                Use the check to decide how much certainty you have — then choose
                the size of the bet accordingly. A reversible experiment can
                tolerate weaker evidence than a platform migration.
              </p>
              <div className={styles.actions}>
                <Link href="/#signal" className="btn btnOutline btnSm">
                  Test it on a live set
                  <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
                <Link href="/learn/data-and-experimentation" className="btn btnText btnSm">
                  Read the metrics module
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionWarm}`}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrowRow}>The toolkit</p>
              <h2 className={styles.sectionTitle}>Six ways into the work.</h2>
            </div>
            <p className={styles.sectionIntro}>
              Use one, or run the full loop: signal → project → interview →
              blueprint → portfolio.
            </p>
          </div>
          <div className={styles.grid}>
            {TOOLS.map((tool) => (
              <article key={tool.title} className={styles.card}>
                <p className={styles.cardMeta}>
                  <span>{tool.meta}</span>
                  <span className={styles.cardNumber}>{tool.number}</span>
                </p>
                <h3 className={styles.cardTitle}>{tool.title}</h3>
                <p className={styles.cardBody}>{tool.body}</p>
                <div className={styles.cardFoot}>
                  <Link href={tool.href} className={styles.cardLink}>
                    {tool.cta}
                    <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.innerNarrow}>
          <div className={styles.note}>
            <strong>A note on honesty.</strong> These tools do not call a model
            or send practice data to a PMForge server. Optional interview dictation
            uses your browser&apos;s speech service, which may send audio to its
            provider; PMForge does not record or store it. The interview rubric
            is deterministic keyword-and-structure scoring.
          </div>
        </div>
      </section>
    </PageShell>
  );
}
