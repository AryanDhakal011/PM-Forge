import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { LocalDataControls } from "@/components/site/LocalDataControls";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Getting started, microphone troubleshooting, keyboard access, local data controls, and the honest limits of the PMForge preview.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Help & documentation"
        title={
          <>
            How this
            <br />
            <em>works.</em>
          </>
        }
        lede="A short manual for the preview: getting started, using the tools without a mouse, what the microphone does, and how to remove your data."
        aside={
          <>
            <strong>Quick links</strong>
            <div>
              <Link href="#start">Getting started</Link> ·{" "}
              <Link href="#keyboard">Keyboard</Link> ·{" "}
              <Link href="#mic">Microphone</Link> ·{" "}
              <Link href="#data">Your data</Link>
            </div>
          </>
        }
      />

      <section className={styles.section}>
        <div className={`${styles.inner} ${styles.legalLayout}`}>
          <div className={styles.prose}>
            <h2 id="start">Getting started</h2>
            <ol>
              <li>
                <strong>Create a local profile</strong> or use the demo profile on
                the <Link href="/signup">sign-up page</Link>. No password is
                required because there is no server account.
              </li>
              <li>
                <strong>Take the signal test.</strong> Ten inputs, one call. You
                can drag a card to the tray or select it with the keyboard.
              </li>
              <li>
                <strong>Work a module.</strong> Each has three drills and an
                artifact. Check the drills, then mark the module complete.
              </li>
              <li>
                <strong>Open the project workbench.</strong> Inspect the artifacts,
                complete the sprint, then decide what ships when new evidence
                arrives.
              </li>
              <li>
                <strong>Rehearse the interview.</strong> Voice or keyboard. The
                rubric runs locally and gives you the missing piece.
              </li>
              <li>
                <strong>Build the blueprint.</strong> Eight fields, prefilled where
                possible. Copy or download the result.
              </li>
            </ol>

            <h2 id="keyboard">Keyboard and screen readers</h2>
            <p>
              The interface is built with native buttons, inputs, links, and
              landmarks. A “Skip to content” link is the first focusable element.
              The signal cards form a group of buttons: use{" "}
              <kbd>Arrow Right</kbd> / <kbd>Arrow Down</kbd> and{" "}
              <kbd>Arrow Left</kbd> / <kbd>Arrow Up</kbd> to move between them,{" "}
              <kbd>Enter</kbd> or <kbd>Space</kbd> to select. Results are announced
              through a polite live region.
            </p>
            <p>
              Dialogs trap focus and return it to the trigger on close. Press{" "}
              <kbd>Escape</kbd> to close a dialog or the mobile menu. Fields keep
              their values when validation fails, and the first invalid field is
              focused.
            </p>
            <p>
              Motion can be reduced from the footer or through your operating
              system setting. When reduced motion is on, Lenis smooth scrolling and
              the 3D scene's scroll choreography are disabled; the poster fallback
              is used.
            </p>

            <h2 id="mic">Microphone: what happens</h2>
            <ul>
              <li>
                Permission is requested only after you press a clearly labelled
                start button and acknowledge the speech-service notice.
              </li>
              <li>
                The browser's speech recognition transcribes your speech. Its
                service may send audio to the browser vendor or its provider;
                PMForge does not record or store audio.
              </li>
              <li>
                <strong>Stop dictation</strong> ends recognition. Finishing,
                timing out, leaving the route, or hiding the page also stops it.
              </li>
              <li>
                If permission is denied or no microphone exists, the lab explains
                the state and keeps the keyboard answer mode available.
              </li>
              <li>
                A written answer is always required for scoring, even in voice
                mode. The rubric scores text, not audio.
              </li>
            </ul>
            <p>
              If dictation is unavailable, check the browser's microphone
              permission and use Type mode. Web Speech support and the speech
              service vary by browser; Firefox may not provide this API. Dictation
              requires a secure HTTPS context (or localhost).
            </p>

            <h2 id="data">Your data</h2>
            <p>
              The profile, practice, and preferences live in this browser's{" "}
              <code>localStorage</code>. There is no server copy. See the{" "}
              <Link href="/privacy">privacy note</Link> for the exact keys.
            </p>
            <LocalDataControls />

            <h2 id="troubleshooting">Troubleshooting</h2>
            <p>
              <strong>Nothing saves between visits.</strong> Private browsing,
              blocked storage, or clearing site data can cause this. The tools still
              work for the session, but progress disappears when you close the tab.
            </p>
            <p>
              <strong>The page feels heavy.</strong> The hero and learning cluster
              load Three.js after first paint. On a low-power device, the poster
              fallback is used if WebGL is unavailable. Reducing motion also removes
              the scroll-linked 3D work.
            </p>
            <p>
              <strong>The blueprint will not generate.</strong> Each field needs at
              least eight characters. Errors appear under the field, and focus moves
              to the first invalid one. Your text is preserved.
            </p>
            <p>
              <strong>A link goes to the wrong place.</strong> Section links use
              hashes such as <code>/#signal</code>. From another route, the browser
              navigates home and then scrolls. If it does not, reload with the hash
              in the URL and the page will retry the scroll.
            </p>

            <h2 id="limits">What this preview does not do</h2>
            <ul>
              <li>No hosted account, password reset, OAuth, or cross-device sync.</li>
              <li>No AI grading or interview recording. Voice transcription is provided by your browser's speech service and may involve its provider.</li>
              <li>No recruiter marketplace, job application, or employer verification.</li>
              <li>No team workspace or collaboration.</li>
              <li>No Blender/GLB asset pipeline; the scenes are procedural Three.js.</li>
            </ul>

            <h2 id="contact">Contact and corrections</h2>
            <p>
              This prototype does not ship with a monitored support inbox. If you
              are running the build, add a real support address before launch and
              update this page. For an attribution correction, start with the{" "}
              <Link href="/credits">credits page</Link>.
            </p>

            <div className={styles.note} style={{ marginTop: "1.4rem" }}>
              <strong>For operators.</strong> Before treating this as a live
              service, connect a real auth provider, a privacy-reviewed analytics
              sink, and a support channel. The current build is deliberately
              local-first and does none of those things.
            </div>
          </div>

          <div className={styles.toc}>
            <strong>On this page</strong>
            <a href="#start">Getting started</a>
            <a href="#keyboard">Keyboard &amp; screen readers</a>
            <a href="#mic">Microphone</a>
            <a href="#data">Your data</a>
            <a href="#troubleshooting">Troubleshooting</a>
            <a href="#limits">What this does not do</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
