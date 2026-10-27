import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "PMForge is local-first: what is stored in your browser, how browser speech recognition may process audio, and how to remove your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Privacy"
        title={
          <>
            Your practice
            <br />
            <em>stays here.</em>
          </>
        }
        lede="PMForge is a local-first prototype. There is no account server or analytics network. Voice typing uses the browser's speech service and may send audio to its provider; PMForge does not record or store audio."
        aside={
          <>
            <strong>Last updated</strong>
            25 October 2026. This is a prototype privacy note, not legal advice.
          </>
        }
      />

      <section className={styles.section}>
        <div className={`${styles.inner} ${styles.legalLayout}`}>
          <div className={styles.prose}>
            <h2 id="stored">What is stored in your browser</h2>
            <p>
              PMForge uses <code>localStorage</code> under the{" "}
              <code>pmforge.</code> prefix. PMForge has no server that receives
              practice data. Browser-provided speech recognition is the separate
              audio-processing exception described below. The table lists keys
              this build writes.
            </p>
            <div
              className={styles.tableWrap}
              role="region"
              aria-label="localStorage keys used by PMForge"
              tabIndex={0}
            >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">What it contains</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>pmforge.user</code>
                  </td>
                  <td>Name, email, goal, created and last-seen timestamps.</td>
                  <td>Labels the local workspace and personalises the dashboard.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.signal.v1</code>
                  </td>
                  <td>Selected evidence card, verdict, strength, impact, time.</td>
                  <td>Restores your signal test result.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.learning.v1</code>
                  </td>
                  <td>Completed module slugs and checked drill indexes.</td>
                  <td>Tracks curriculum progress.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.projects.v1</code>
                  </td>
                  <td>Sprint checks and project decision ids.</td>
                  <td>Restores the project workbench.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.interview.v1</code>
                  </td>
                  <td>Overall score, band, missing criterion, word count, time.</td>
                  <td>Shows your last rubric result. The answer text is not stored.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.career.v1</code>
                  </td>
                  <td>Target role and a LinkedIn URL you choose to add.</td>
                  <td>Builds the local profile card.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.blueprint.v1</code>
                  </td>
                  <td>The eight blueprint fields you submit.</td>
                  <td>Keeps your decision artifact available.</td>
                </tr>
                <tr>
                  <td>
                    <code>pmforge.reducedMotion</code>, <code>pmforge.sound</code>,{" "}
                    <code>pmforge.haptics</code>
                  </td>
                  <td>Accessibility and feedback preferences.</td>
                  <td>Remembers your settings between visits.</td>
                </tr>
              </tbody>
            </table>
            </div>

            <h2 id="not-collected">What is not collected</h2>
            <ul>
              <li>No server account, password, session cookie, or authentication token.</li>
              <li>No analytics or advertising network requests. Events are dispatched inside the page as a local <code>CustomEvent</code> and, in development only, logged to the browser console.</li>
              <li>PMForge does not record or store audio. If you explicitly enable voice typing, your browser's speech recognition service processes audio and may send it to the browser vendor or its provider.</li>
              <li>No precise location, contact list, or device fingerprint.</li>
              <li>No third-party font or image requests. Fonts and the mountain plate are bundled with the site.</li>
            </ul>

            <h2 id="microphone">The microphone</h2>
            <p>
              Before voice typing starts, PMForge asks you to acknowledge that
              speech recognition is provided by your browser. The browser handles
              microphone permission and speech recognition. Depending on the
              browser, audio may be sent to its speech service provider for
              transcription; Chrome's web speech service may use cloud processing.
              PMForge does not record or store audio.
            </p>
            <p>
              Dictated words are inserted into the answer field and evaluated
              locally by the deterministic rubric. PMForge does not store the
              answer text. Stop dictation, finish the answer, time out, or leave
              the page to end speech recognition. You can use Type mode without
              granting microphone access.
            </p>

            <h2 id="storage-limits">Storage limits and security</h2>
            <p>
              Browser storage is not encrypted. Anyone with access to this browser
              profile may be able to read it. Do not enter confidential employer
              information, personal data about other people, or anything you would
              not want on a shared device.
            </p>
            <p>
              Clearing site data, using a private window, or changing browsers will
              remove or hide your progress. There is no server copy to restore.
            </p>

            <h2 id="control">Your controls</h2>
            <p>
              The <Link href="/help#data">help page</Link> includes controls to
              clear practice data, delete the local profile, or clear everything
              under the <code>pmforge.</code> prefix. You can also clear site data
              in your browser settings.
            </p>

            <h2 id="third-parties">Third-party links</h2>
            <p>
              The site links to external destinations such as LinkedIn, X, Discord,
              GitHub, Pexels, Poly Haven, and font projects. Following those links
              takes you to services with their own privacy policies. PMForge does
              not embed their scripts or trackers.
            </p>

            <h2 id="changes">Changes</h2>
            <p>
              If a hosted account system, model-graded feedback, or analytics
              provider is added later, this page must be updated before that
              feature ships. The current build does none of those things.
            </p>

            <div className={styles.note} style={{ marginTop: "1.4rem" }}>
              Questions or a correction? Start with the{" "}
              <Link href="/help">help page</Link>. Do not send confidential
              information through any external channel.
            </div>
          </div>

          <div className={styles.toc}>
            <strong>On this page</strong>
            <a href="#stored">What is stored</a>
            <a href="#not-collected">What is not collected</a>
            <a href="#microphone">The microphone</a>
            <a href="#storage-limits">Storage limits</a>
            <a href="#control">Your controls</a>
            <a href="#third-parties">Third-party links</a>
            <a href="#changes">Changes</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
