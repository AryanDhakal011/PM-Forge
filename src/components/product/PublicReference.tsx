import Link from "next/link";
import { ArrowRight, BookOpen, Compass, FileText } from "lucide-react";
import { modules } from "@/lib/content";
import { lessonNotes } from "@/lib/lessons";
import { PageShell } from "@/components/site/PageShell";
import styles from "./Product.module.css";

export function FrameworkIndex() {
  return (
    <PageShell>
      <div className={styles.product}>
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <div>
              <span className={styles.eyebrow}>The reference shelf</span>
              <h1>Useful thinking. No scripts.</h1>
              <p>
                Short references for the moments when you need a sharper
                question. Apply them in a real scenario.
              </p>
            </div>
            <Link href="/questions" className={styles.primary}>
              Browse the scenario bank
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className={styles.grid3}>
            {modules.map((module) => (
              <article className={styles.questionCard} key={module.slug}>
                <span className={styles.badge}>Field note {module.number}</span>
                <h3>
                  <Link href={`/frameworks/${module.slug}`}>
                    {module.title}
                  </Link>
                </h3>
                <p>{module.short}</p>
                <div className={styles.cardFoot}>
                  <span>Reference · not a scored lesson</span>
                  <Link href={`/frameworks/${module.slug}`}>
                    Read note
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
export function FrameworkDetail({ slug }: { slug: string }) {
  const module = modules.find((m) => m.slug === slug)!;
  const note = lessonNotes[slug];
  return (
    <PageShell>
      <div className={styles.product}>
        <div className={styles.content} style={{ maxWidth: 900 }}>
          <Link href="/frameworks" className={styles.textButton}>
            ← Back to the reference shelf
          </Link>
          <span className={styles.eyebrow} style={{ marginTop: 25 }}>
            Field note / {module.number}
          </span>
          <h1>{module.title}</h1>
          <p className={styles.prose} style={{ marginTop: 20 }}>
            {module.description}
          </p>
          <article className={styles.panel} style={{ marginTop: 30 }}>
            <div className={styles.prose}>
              <h2 style={{ marginTop: 0 }}>The useful principle</h2>
              <p>{note?.principle || module.outcome}</p>
              <h2>The common failure</h2>
              <p>
                {note?.failure ||
                  "Naming a framework without showing the evidence behind the choice."}
              </p>
              <h2>Try it in the room</h2>
              <p>{note?.field || module.practice.join(" ")}</p>
            </div>
          </article>
          <div className={styles.notice} style={{ marginTop: 24 }}>
            A reference helps you think; it is not a fixed answer. The interview
            engine evaluates recorded decisions and evidence.
          </div>
          <Link
            href="/questions"
            className={styles.primary}
            style={{ marginTop: 24 }}
          >
            Put it into practice
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
const info: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; text: string }[];
  }
> = {
  help: {
    eyebrow: "A useful place to get unstuck",
    title: "Your work has a way back.",
    intro:
      "PMForge’s complete guest practice loop works on this device. Accounts are optional and appear only when the server is configured.",
    sections: [
      {
        title: "How do I start?",
        text: "Open the workspace, choose Try without an account, and complete or skip the three setup choices. Browse a scenario, read the preflight cards, and pin the goal before proposing a solution.",
      },
      {
        title: "Where is my paused session?",
        text: "Home shows Resume for unfinished sessions. You can also find every saved session in History. Use the same browser and origin/port: browser storage is specific to each origin.",
      },
      {
        title: "How do I keep a backup?",
        text: "Open Settings and choose Export my workspace. JSON backups can be imported with your consent. Decision records also export as Markdown or a print view. Resetting a device profile does not delete a server account.",
      },
      {
        title: "Why is voice typing unavailable?",
        text: "Voice is optional in behavioral stories and depends on browser support, a secure connection, and your microphone permission. It may use the browser provider’s speech service. Type into the same fields if it is unavailable; PMForge never stores audio.",
      },
      {
        title: "Why is the expert trace locked?",
        text: "Your first guided run goes from feedback to reflection. Full runs include a replay. Give one self-grade or reflect for two minutes to open expert reasoning. A timed release does not count as completed reflection. No single sample answer is treated as the only defensible choice.",
      },
      {
        title: "What if I lose the connection?",
        text: "Previously visited production app pages and their static assets are cached. Your saved runs stay in IndexedDB. Reconnect once if a page was never cached, and retry account sync in Settings. Failed sync never silently deletes the device copy.",
      },
    ],
  },
  "how-it-works": {
    eyebrow: "The practice loop",
    title: "Step into a situation. Leave with a clearer next move.",
    intro:
      "A rehearsal for product judgment—not a bank of model answers to memorise.",
    sections: [
      {
        title: "1. Choose a room",
        text: "Browse 63 draft scenarios across seven categories and three open difficulty levels. Start as a guest without an email, then choose your role, level, and timeline.",
      },
      {
        title: "2. Work the evidence",
        text: "Read three preflight cards. Pin the goal. Spend a limited evidence budget, manipulate the category workbench, and respond to a simulated interviewer. Optional pressure mode can always be extended.",
      },
      {
        title: "3. Reflect before reading the expert",
        text: "Get deterministic feedback, replay the trap and pivot moment, then self-grade to unlock the expert trace. More than one decision can be defensible.",
      },
      {
        title: "4. Keep the reasoning",
        text: "Retry the weakest dimension on another variant, save a decision record, and come back to your exact saved state. Export your workspace for a portable backup.",
      },
    ],
  },
  "content-policy": {
    eyebrow: "Trust is a product feature",
    title: "Clear about what we know. Clear about what we don’t.",
    intro:
      "All 63 scenarios in this preview are draft content from the founder’s handoff. No question is labelled human-reviewed or published.",
    sections: [
      {
        title: "Draft, not verified",
        text: "AI-assisted material requires qualified human review before publication. Reviewers must check arithmetic, source dates, realistic choices, scoring paths, and accessibility. This preview does not imply reviewer approval.",
      },
      {
        title: "Simulated companies and honest provenance",
        text: "Internal company metrics are simulated for practice. Fictional company names avoid suggesting access to real private data. Public statistics supplied in the handoff are labelled unverified references until source verification is complete.",
      },
      {
        title: "Deterministic, inspectable feedback",
        text: "The engine scores structured choices, requested evidence, rankings, assumption bands, and verification checks. General free text is not scored. Behavioral stories receive a clearly labelled structure-based estimate, never a truthfulness verdict.",
      },
      {
        title: "No single right script",
        text: "Each scenario keeps at least two alternate defensible paths. Expert reasoning opens after feedback and one self-grade or two minutes of reflection. Provisional bands describe recorded actions and are not predictions of hiring outcomes.",
      },
      {
        title: "Report a content issue",
        text: "Include the question ID, content version, the exact claim, and an explanation or primary source. The Contribute page provides a local report template you can copy; reports are not silently sent anywhere.",
      },
    ],
  },
  changelog: {
    eyebrow: "The workshop log",
    title: "What changed in this build.",
    intro: "MVP preview · 29 October 2026",
    sections: [
      {
        title: "The full practice loop",
        text: "Added guest onboarding, a dedicated product shell, 63 draft scenario briefs, category workbenches, saved runs, staged debriefs, calibration, progress, history, bookmarks, and decision records.",
      },
      {
        title: "A considered motion system",
        text: "The landing retains its scroll storytelling. The product uses native scrolling, short GSAP transitions, an on-demand decision instrument on capable desktops, and still diagrams on small screens or reduced motion.",
      },
      {
        title: "Honest account integration",
        text: "Google and GitHub use Better Auth when credentials are configured. Guest work uses IndexedDB. Account sign-in, cross-device sync, and deployment require configured infrastructure; local profiles are never presented as OAuth sessions.",
      },
    ],
  },
  contribute: {
    eyebrow: "Make the questions better",
    title: "A useful correction starts with evidence.",
    intro:
      "Content in this preview awaits human subject-matter review. You can prepare a precise review note without submitting personal data.",
    sections: [
      {
        title: "A report you can copy",
        text: "Question ID and version: ___. Claim or behavior: ___. Why it is incorrect or misleading: ___. Primary source and retrieval date: ___. A defensible alternative: ___. Reproduction steps: ___.",
      },
      {
        title: "Review dimensions",
        text: "Check arithmetic and unit consistency, whether two genuinely different paths can score well, whether the trap is observable in the replay, whether a scenario matches its level, and whether the language is fair and accessible.",
      },
      {
        title: "Privacy first",
        text: "Do not include confidential employer information or other people’s personal data. There is no connected submission inbox in this local preview; keep the note and send it through the project’s chosen review channel once that channel is configured.",
      },
    ],
  },
  offline: {
    eyebrow: "A slower connection, the same workspace",
    title: "Your saved thinking is still here.",
    intro:
      "Guest runs and records live in this browser. Pages and assets visited after offline support activates are cached for your next visit.",
    sections: [
      {
        title: "Return to a saved session",
        text: "Open Home, then Resume. If a page was never visited while online, reconnect once to load it. Your answers remain in IndexedDB.",
      },
      {
        title: "Account work",
        text: "An expired or offline account session does not erase the device copy. Reconnect and retry sync from Settings. Conflicting server versions are rejected rather than overwritten silently.",
      },
    ],
  },
  maintenance: {
    eyebrow: "The workbench is being maintained",
    title: "A short pause. Your saved work stays yours.",
    intro:
      "If an account service is unavailable, guest practice and device exports remain available.",
    sections: [
      {
        title: "What you can do now",
        text: "Open the device workspace, export a backup from Settings, or return to a previously cached run. Retry the connection later without deleting your local data.",
      },
    ],
  },
  privacy: {
    eyebrow: "A plain-language privacy note",
    title: "Your practice deserves a private room.",
    intro:
      "Guest data stays on your device. Connected account data is stored on the configured PMForge server. This preview has not completed legal review.",
    sections: [
      {
        title: "Guest work",
        text: "A random device profile, structured run decisions, written notes, bookmarks, records, and settings are stored locally in IndexedDB or browser preferences. No email is needed for guest mode. Export, import, and reset are available in Settings.",
      },
      {
        title: "Configured accounts",
        text: "Google or GitHub sign-in shares the basic provider identity needed for authentication. Better Auth stores account and session records on the configured server. Your workspace syncs only with an authenticated session. Provider credentials are never sent to the client.",
      },
      {
        title: "Voice typing",
        text: "Voice typing is optional. Your browser’s speech service may send audio to its provider. PMForge does not record or store audio. Only recognised text you keep is saved with your story.",
      },
      {
        title: "Your controls",
        text: "Download your device workspace, delete individual decision records, reset the current local profile, sign out, or delete a configured server account. Account deletion and local device reset are distinct operations. Clear a shared device’s profile separately after export.",
      },
    ],
  },
  terms: {
    eyebrow: "Using this practice space",
    title: "A rehearsal. Not a hiring promise.",
    intro:
      "PMForge is an educational MVP preview. These starter terms need legal review before a public account launch.",
    sections: [
      {
        title: "Practice content",
        text: "All scenarios are draft educational material. Simulated data and fictional company situations are not claims about real organisations. Do not rely on a scenario for medical, financial, legal, or operational decisions.",
      },
      {
        title: "Scores and outcomes",
        text: "Deterministic rubric feedback describes a particular practice run. It is not a validated hiring assessment or a promise of interview success. Behavioral scores estimate structure; they do not verify whether a story is true.",
      },
      {
        title: "Your responsibility and control",
        text: "Do not enter confidential information or personal data about others. Guest storage can be cleared by your browser, so export important work. You retain control of your local records and can delete configured account data through Account settings.",
      },
    ],
  },
};
export function PublicInfo({ kind }: { kind: string }) {
  const page = info[kind];
  return (
    <PageShell>
      <div className={styles.product}>
        <div className={styles.content} style={{ maxWidth: 920 }}>
          <span className={styles.eyebrow}>{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p className={styles.prose} style={{ marginTop: 22 }}>
            {page.intro}
          </p>
          <div className={styles.prose}>
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
          <div className={styles.row} style={{ marginTop: 32 }}>
            <Link href="/app" className={styles.primary}>
              Open your workspace
              <ArrowRight size={14} />
            </Link>
            <Link href="/questions" className={styles.secondary}>
              Browse scenarios
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
export function ResourcesIndex() {
  return (
    <PageShell>
      <div className={styles.product}>
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <div>
              <span className={styles.eyebrow}>The reading room</span>
              <h1>Keep your questions sharp.</h1>
              <p>
                A small set of useful places to go before and after you
                practise.
              </p>
            </div>
          </div>
          <div className={styles.grid3}>
            {[
              {
                href: "/questions",
                icon: Compass,
                title: "63 scenario briefs",
                text: "Browse all seven categories. Practice a specific decision, not a generic prompt.",
              },
              {
                href: "/frameworks",
                icon: BookOpen,
                title: "The reference shelf",
                text: "Ten short field notes on evidence, trade-offs, metrics, and product judgment.",
              },
              {
                href: "/content-policy",
                icon: FileText,
                title: "How content earns trust",
                text: "Draft status, source provenance, deterministic scoring, and human review.",
              },
            ].map((item) => (
              <Link
                href={item.href}
                className={styles.categoryCard}
                key={item.href}
              >
                <item.icon size={24} color="var(--p-brass)" />
                <h2>{item.title}</h2>
                <p>{item.text}</p>
                <span className={styles.textButton}>
                  Explore
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
          <div className={styles.panel} style={{ marginTop: 28 }}>
            <h2>Feedback comes from your moves.</h2>
            <p className={styles.prose} style={{ marginTop: 14 }}>
              The full interview engine scores structured evidence requests,
              decisions, assumption checks, rankings, and guardrails. Read your
              feedback, replay the reasoning pivot, and self-grade before
              opening an expert trace. There is no hint button or instant model
              answer.
            </p>
            <Link href="/how-it-works" className={styles.textButton}>
              See the practice loop
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
