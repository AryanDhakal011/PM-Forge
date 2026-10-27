import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for using the PMForge prototype: local accounts, acceptable use, educational content, and limitations.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Terms of use"
        title={
          <>
            A practice ground,
            <br />
            <em>not a promise.</em>
          </>
        }
        lede="PMForge is an educational product prototype. These terms set expectations for the preview: what it does, what it does not do, and how to use it responsibly."
        aside={
          <>
            <strong>Last updated</strong>
            25 October 2026. This is a prototype notice, not legal advice or a
            substitute for a reviewed production agreement.
          </>
        }
      />

      <section className={styles.section}>
        <div className={`${styles.inner} ${styles.legalLayout}`}>
          <div className={styles.prose}>
            <h2 id="what">1. What PMForge is</h2>
            <p>
              PMForge is a local-first practice environment for product-management
              reasoning. It includes fictional project scenarios, an interview
              rubric, a decision blueprint, and career-reflection tools. It is
              provided for education and practice.
            </p>
            <p>
              It is not a job placement service, a certification, a substitute for
              professional advice, or a guarantee of any hiring outcome.
            </p>

            <h2 id="accounts">2. Local profiles</h2>
            <p>
              The preview does not create a hosted account. A “profile” is a record
              in your browser's <code>localStorage</code>. There is no password,
              recovery flow, or server-side identity check. You are responsible for
              the device and browser profile where you use PMForge.
            </p>
            <p>
              Do not use a shared or public device for confidential practice
              material. Browser storage is not encrypted.
            </p>

            <h2 id="acceptable">3. Acceptable use</h2>
            <ul>
              <li>Use the site for lawful learning and practice.</li>
              <li>Do not attempt to disrupt, scrape at volume, or reverse engineer the service to harm others.</li>
              <li>Do not upload or enter personal data about other people, confidential employer information, or content you do not have the right to use.</li>
              <li>Do not present PMForge output as a professional certification or as evidence of a real employer's endorsement.</li>
            </ul>

            <h2 id="content">4. Educational content</h2>
            <p>
              Scenarios, metrics, companies, people, and outcomes are fictional.
              The rubric is deterministic keyword-and-structure scoring, not a
              judgement by a human interviewer or a language model. It can be
              wrong, incomplete, or gamed. Treat feedback as a prompt for
              reflection, not an authoritative assessment.
            </p>

            <h2 id="ip">5. Intellectual property</h2>
            <p>
              The PMForge interface, written curriculum, scenarios, and authored
              visual assets are part of this prototype. External assets remain the
              property of their creators and are used under the licences listed on
              the <Link href="/credits">credits page</Link>. You may copy your own
              generated decision records and blueprints for personal or
              professional use.
            </p>

            <h2 id="availability">6. Availability and changes</h2>
            <p>
              The preview may change, break, or be withdrawn without notice. Local
              data may be lost when you clear storage, change browsers, use private
              browsing, or encounter a browser storage limit. There is no backup and
              no service-level commitment.
            </p>

            <h2 id="disclaimer">7. Disclaimers</h2>
            <p>
              PMForge is provided “as is” and “as available”, without warranties of
              any kind, express or implied, including fitness for a particular
              purpose, accuracy, or non-infringement. You use the practice material
              and any decisions you make from it at your own discretion.
            </p>

            <h2 id="liability">8. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by applicable law, the maintainers of
              this prototype are not liable for indirect, incidental, special, or
              consequential losses arising from use of the site, including lost
              data, lost opportunities, or decisions made from fictional practice
              content. Nothing here excludes liability that cannot lawfully be
              excluded.
            </p>

            <h2 id="external">9. External links</h2>
            <p>
              Links to LinkedIn, X, Discord, GitHub, Pexels, Poly Haven, and other
              sites are provided for convenience and attribution. Those services
              have their own terms and privacy practices. PMForge does not control
              them.
            </p>

            <h2 id="contact">10. Questions</h2>
            <p>
              Start with the <Link href="/help">help page</Link>. If these terms
              ever become part of a hosted production service, they must be
              reviewed and replaced with an agreement that reflects that service,
              its jurisdiction, and its data practices.
            </p>

            <div className={styles.note} style={{ marginTop: "1.4rem" }}>
              By using this preview, you accept these prototype terms. If you do not
              accept them, do not use the site.
            </div>
          </div>

          <div className={styles.toc}>
            <strong>On this page</strong>
            <a href="#what">What PMForge is</a>
            <a href="#accounts">Local profiles</a>
            <a href="#acceptable">Acceptable use</a>
            <a href="#content">Educational content</a>
            <a href="#ip">Intellectual property</a>
            <a href="#availability">Availability</a>
            <a href="#disclaimer">Disclaimers</a>
            <a href="#liability">Liability</a>
            <a href="#external">External links</a>
            <a href="#contact">Questions</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
