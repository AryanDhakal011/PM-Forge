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
        text: "Voice is optional in behavioral stories and depends on browser support, a secure connection, and your microphone permission. It may use the browser provider’s speech service. Type into the same fields if it is unavailable; local audio recording requires a separate opt-in and stays on this device.",
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
  "eyebrow": "Feedback policy · updated 8 November 2026",
  "title": "Evidence before verdicts.",
  "intro": "Practice feedback should help you inspect a decision, not pretend to certify your ability. Draft content and provisional evaluations stay visibly labeled.",
  "sections": [
    {
      "title": "What the rubric evaluates",
      "text": "The application calculates rubric results from recorded choices, evidence requests, rankings, assumptions and verification checks. AI conversation cannot change scores, evidence costs or stage permissions. General prose is not silently assigned a hiring score. Behavioral structure estimates are labeled and never claim to verify truthfulness."
    },
    {
      "title": "AI interviewer limits",
      "text": "AI may phrase a question, probe a candidate point, offer a grounded challenge and provide qualitative reflection with traceable quotes. It must not invent scenario metrics, expose locked evidence, fabricate something you said, publish your work or claim hiring readiness. Unsupported output is rejected and can lead to guided continuation. Automated validation reduces errors but does not guarantee every answer is correct."
    },
    {
      "title": "Practice, assessment and delivery diagnostics",
      "text": "Assessment-style runs do not reveal ideal answers during the attempt. Optional thinking prompts belong to explicitly selected practice. Timing is a soft learning aid and does not lower the rubric. Approximate speech pace, fillers and delivery observations are separate from reasoning quality; they do not judge accent, disability, personality, originality, truthfulness or employability."
    },
    {
      "title": "Honest provenance and human review",
      "text": "Simulated practice is labeled Strategic Teardown & Stress Test. Production Impact means candidate-reported real work with an ownership confirmation, not independent verification. AI prompt/scenario tuning is not model fine-tuning. Evaluation examples are fictional and separate from prompt examples; user transcripts are not silently repurposed as training data. Content receives human-reviewed status only when qualified review is actually recorded."
    },
    {
      "title": "Inspect, challenge and correct",
      "text": "Review your original transcript, evidence, decision trail and rubric explanation. When reporting an issue, include the scenario ID/version, affected step, expected behavior and a primary source where relevant. The Contribute page creates a local report template; it does not silently send feedback. Omit personal or confidential material. Corrections should retain version history and should not silently rewrite past user words or results."
    },
    {
      "title": "Fairness, accessibility and appropriate use",
      "text": "Practice supports typing, keyboard access, reduced motion and optional speech. Do not use provisional results to rank job applicants or make employment decisions. Cross-browser and physical-device coverage, bias review and expert calibration must be measured rather than assumed. Feedback labels will describe those limits until evidence supports stronger claims."
    }
  ]
},  changelog: {
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
  "privacy": {
  "eyebrow": "Privacy · updated 8 November 2026",
  "title": "Your practice deserves a private room.",
  "intro": "This notice describes what PMForge currently stores and sends. Private means not published to other users; it does not always mean data never leaves your device.",
  "sections": [
    {
      "title": "Who operates this service",
      "text": "PMForge is operated by the owner identified in the live service contact details. Operator identity, jurisdiction and a working privacy contact must be supplied before public launch. Until then, this is a local testing service."
    },
    {
      "title": "Device storage and essential cookies",
      "text": "Guest profiles, decisions, notes, settings, case drafts, applications and approved local media use IndexedDB and browser storage. Authentication and verified guest-AI sessions use essential cookies; these are not advertising cookies. We do not use third-party advertising trackers in Career Studio. Browser clearing, device loss or storage limits can remove local work. Export private backups; Studio backups include local evidence files and publishing keys."
    },
    {
      "title": "Accounts and workspace synchronization",
      "text": "An account stores identity, verification, hashed credentials, sessions and synced workspace text on the PMForge server. Email delivery uses the configured email provider; optional OAuth providers supply basic identity when you choose them. Account workspace synchronization may include private case and application text. Interview transcripts and outlines follow the separate transcript-sync choice. Local audio and evidence images are not automatically included in account sync."
    },
    {
      "title": "AI interviews and provider processing",
      "text": "Hot Seat is a separate fictional-company conversation. Committed answers and recent relevant turns are sent to Google in AI mode; unsent drafts stay local. On-device neural speech downloads Kokoro model assets from Hugging Face after consent, then synthesizes locally. Synthetic speech is cached for replay. Browser dictation may use the browser vendor’s service; PMForge does not retain microphone recordings. Guided practice makes no generative-AI inference calls. The fictional free pilot sends approved case positions and unlocked scenario facts to Google Gemini; it excludes arbitrary scratch notes and personal career stories. Google unpaid-service terms permit service improvement and human review. Do not submit personal, sensitive, confidential or employer-private material to the free pilot. Personal behavioral practice stays local/guided unless an appropriate production data configuration is explicitly approved. Provider processing and portfolio publication are separate choices."
    },
    {
      "title": "Microphone, transcription and speech",
      "text": "Typing is complete without a microphone. Browser dictation or speech synthesis may use the browser vendor and is not guaranteed private or universally available. Microphone access, retaining local audio, and transcript synchronization are separate controls. Configured paid transcription or voice providers require explicit operational approval and never activate automatically in $0 mode. Switching to typing stops microphone capture and preserves captured work."
    },
    {
      "title": "Portfolio publishing and visitors",
      "text": "PDF profile parsing and image flattening/redaction run locally. Evidence files upload only when you publish an approved snapshot. A public link can be opened by anyone; an unlisted signed link can be opened by anyone possessing it until expiry or revocation. Pages default to noindex, which requests search engines not index them but is not access control. Published snapshots may contain your chosen contact details and case evidence. Revocation deletes that publication and uploaded assets, not copies a visitor already saved. Aggregate reading events are off unless the owner enables them for a published snapshot; those counts are events, not unique visitors, and use no tracking cookies."
    },
    {
      "title": "Operational records and retention",
      "text": "Private AI recovery state is encrypted on the server for up to 24 hours and removed on the next scheduled or admission cleanup; expired sessions are inaccessible. Operational AI usage counters are retained for up to 90 days and do not contain full answers. Account data remains until account deletion or the operator retention policy applies. Published snapshots expire on their configured date. Private host backups have a separate operator-managed retention schedule and must be covered in the live service notice; removal from backups is not promised to be immediate."
    },
    {
      "title": "Your choices, deletion and requests",
      "text": "Use Settings to export or reset device work, delete a server account, or manage sync. Use interview Practice settings to delete private server AI sessions while keeping the local transcript. Hot Seat has separate conversation export and deletion controls; its transcripts and synthetic speech are not included in workspace cloud sync or the general workspace backup. Use Share to revoke published links and assets. Account deletion, device reset and publication revocation are distinct operations; use each control that applies. You may request access, correction, deletion or other rights available in your jurisdiction through the live privacy contact. Never send passwords, full backups or confidential transcripts in a support request."
    },
    {
      "title": "Security, transfers and changes",
      "text": "PMForge uses origin checks, bounded requests, HttpOnly authentication cookies, server-side ownership checks and configurable HTTPS. No system can guarantee absolute security. Hosting, email, AI or browser services may process data outside your country under their own terms. Check this notice and the chosen provider disclosures before using an external mode. Material changes should be dated and disclosed before new processing is enabled."
    }
  ]
},  "terms": {
  "eyebrow": "Terms · updated 8 November 2026",
  "title": "A rehearsal. Not a hiring promise.",
  "intro": "Use PMForge to practice product decisions and document your own work honestly. These terms describe the current preview and must be reviewed with the operator details before public launch.",
  "sections": [
    {
      "title": "Eligibility and account responsibility",
      "text": "Provider-backed AI practice is intended for adults 18 or older using it for professional product practice in supported regions. Do not misrepresent your eligibility. Keep credentials, signed links and publishing keys secure. You are responsible for activity you authorize and for the data you choose to sync or publish."
    },
    {
      "title": "Educational content and feedback",
      "text": "Scenarios, companies and operating metrics are fictional unless a source is explicitly identified. Draft references and provisional rubrics are labeled. Feedback is educational, may be incomplete or wrong, and is not a validated hiring assessment, credential, employment guarantee, or professional medical, financial, legal or operational advice. Review decisions in their real context."
    },
    {
      "title": "Your content and permission to share",
      "text": "You retain rights in your original content. You grant only the permissions needed to store, synchronize, process and display it according to the features you choose. Do not upload material you cannot lawfully use. Confirm ownership and confidentiality before publishing real work. Imported practice stays simulated; do not present fictional practice results as production impact or verified employment."
    },
    {
      "title": "Acceptable use",
      "text": "Do not harass people, upload unlawful content, disclose another person’s private information, misuse confidential employer material, impersonate others, bypass ownership or security checks, abuse infrastructure, evade quotas, or attempt to extract protected evidence or credentials. Candidate messages cannot grant the AI additional permissions. Report vulnerabilities privately through the operator’s security contact when configured."
    },
    {
      "title": "Free practice, quotas and availability",
      "text": "Guided practice remains useful without AI. AI availability depends on the configured mode, provider capacity, eligibility and operational limits; unlimited or permanently free AI is not promised. Reaching an AI turn cap does not reduce the rubric result. Provider failures preserve committed work where storage is available and offer retry or guided continuation. PMForge never automatically enables billing or substitutes a paid speech service in $0 mode."
    },
    {
      "title": "Publishing, backups and removal",
      "text": "Publishing is a separate deliberate action. Expiring or revoking a link stops future access through PMForge but cannot retract copies already downloaded. Keep private backups of important device work and treat backups as sensitive. Features may change, be suspended for abuse or outages, or be discontinued; reasonable notice should be provided where practical and required."
    },
    {
      "title": "Service limitations and disputes",
      "text": "The preview is supplied as available, with no promise of uninterrupted access or a particular career outcome. Liability, consumer protections and mandatory rights depend on applicable law; nothing here removes rights that cannot lawfully be excluded. Operator identity, governing jurisdiction, a dispute contact and any future paid-service cancellation terms must be completed before offering the corresponding public service."
    }
  ]
},};
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
          {kind==='privacy'&&<p className={styles.prose}><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Google Gemini processing terms ↗</a> · <a href="https://ai.google.dev/gemini-api/docs/available-regions" target="_blank" rel="noreferrer">Supported regions ↗</a></p>}<div className={styles.prose}>
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
