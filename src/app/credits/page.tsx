import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Credits",
  description:
    "Photography, textures, fonts, icons, and software used to build PMForge, with licences and honest notes on what was authored in code.",
  alternates: { canonical: "/credits" },
};

export default function CreditsPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Credits & attribution"
        title={
          <>
            Borrowed with
            <br />
            <em>thanks.</em>
          </>
        }
        lede="Every external asset is listed here with its source and licence. Everything else — the 3D scenes, the plates, the diagrams, the interface — was authored for this build."
        aside={
          <>
            <strong>Plain text copy</strong>
            The same attribution list is available at{" "}
            <a href="/credits.txt" download>
              /credits.txt
            </a>
            .
          </>
        }
      />

      <section className={styles.section}>
        <div className={styles.innerNarrow}>
          <div className={styles.prose}>
            <h2>Photography</h2>
            <p>
              <strong>Mountain landscape plate</strong> — “Final mountains”,
              photographed by{" "}
              <a
                href="https://www.pexels.com/@eberhardgross/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Eberhard Grossgasteiger
              </a>{" "}
              and used under the{" "}
              <a
                href="https://www.pexels.com/license/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Pexels license
              </a>
              . The image is bundled locally at{" "}
              <code>/assets/images/plates/final-mountains.webp</code> and is not
              hotlinked. The photographer's profile is the canonical source; the
              exact item identifier was not retained in the delivered file
              metadata.
            </p>
            <p>
              Pexels permits free use and modification. Attribution is not
              required by the licence, but it is given here because the work
              deserves it.
            </p>

            <h2>Textures</h2>
            <p>
              <strong>Wood table base colour and roughness maps</strong> — from{" "}
              <a
                href="https://polyhaven.com/a/wood_table_001"
                target="_blank"
                rel="noreferrer noopener"
              >
                Wood Table 001
              </a>{" "}
              by{" "}
              <a
                href="https://polyhaven.com/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Poly Haven
              </a>
              , released under{" "}
              <a
                href="https://polyhaven.com/license"
                target="_blank"
                rel="noreferrer noopener"
              >
                CC0
              </a>
              . Files are bundled locally at{" "}
              <code>/assets/textures/wood-table-diffuse.webp</code> and{" "}
              <code>/assets/textures/wood-table-rough.webp</code>.
            </p>

            <h2>Typefaces</h2>
            <ul>
              <li>
                <strong>DM Serif Display</strong> by Colophon Foundry, via
                Fontsource. SIL Open Font License 1.1.{" "}
                <a
                  href="https://fonts.google.com/specimen/DM+Serif+Display"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Source
                </a>
                .
              </li>
              <li>
                <strong>Inter</strong> by Rasmus Andersson, via Fontsource. SIL
                Open Font License 1.1.{" "}
                <a
                  href="https://rsms.me/inter/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Source
                </a>
                .
              </li>
              <li>
                <strong>Caveat</strong> by Impallari Type, via Fontsource. SIL
                Open Font License 1.1.{" "}
                <a
                  href="https://fonts.google.com/specimen/Caveat"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Source
                </a>
                .
              </li>
            </ul>
            <p>
              Fonts are self-hosted through Fontsource packages. The site makes
              no request to Google Fonts at runtime.
            </p>

            <h2>Icons and software</h2>
            <ul>
              <li>
                <strong>Lucide</strong> icon set — ISC license.{" "}
                <a
                  href="https://lucide.dev/license"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  License
                </a>
                . Brand glyphs for LinkedIn, X, Discord, and GitHub are authored
                inline as simple monochrome marks.
              </li>
              <li>
                <strong>Next.js</strong> and <strong>React</strong> — MIT.
              </li>
              <li>
                <strong>Three.js</strong>, <strong>React Three Fiber</strong>,
                and <strong>@react-three/drei</strong> — MIT.
              </li>
              <li>
                <strong>GSAP</strong> and ScrollTrigger — used under the GSAP
                standard “no charge” license for this prototype.
              </li>
              <li>
                <strong>Lenis</strong> — MIT.
              </li>
              <li>
                <strong>Zod</strong> — MIT.
              </li>
              <li>
                <strong>Fontsource</strong> — MIT.
              </li>
            </ul>

            <h2>What was authored in code</h2>
            <p>
              The Decision Engine, the learning cluster, the wooden desk
              surfaces, the annotated evidence cards, the certificate/blueprint
              line art, the career profile illustration, the architectural
              maquette, and all section plates are procedural Three.js geometry,
              CSS, or inline SVG authored for this project. No Blender source
              files or GLB exports were delivered with this build.
            </p>
            <p>
              The landing page uses the mountain plate above, CSS gradients,
              textures and SVG noise. The Deadlock’s illustrated cast was
              created with OpenAI image generation and optimized as a local
              WebP expression atlas.
            </p>

            <h2>The Deadlock prototype</h2>
            <p>
              The boiler room plates, gauges and TERN-1 arm
              are original vector artwork. Effects and ambience use procedural
              WebAudio. Dialogue uses pre-rendered Kokoro-82M v1.0 neural
              voices, with a distinct voice for each character. The model is
              Apache-2.0 licensed; model weights and synthesis code are not
              shipped to the browser. All cast
              members and organizations are fictional.
            </p>
            <p>
              Self-hosted Barlow Condensed and IBM Plex Mono use the SIL Open
              Font License 1.1.{" "}
              <a href="/deadlock/fonts/Barlow-OFL.txt">Barlow license</a> ·{" "}
              <a href="/deadlock/fonts/IBMPlex-OFL.txt">IBM Plex license</a>.
            </p>
            <h2>What is fictional</h2>
            <p>
              The project scenarios, evidence cards, interview case, profile
              card, company names, and metrics are fictional teaching material.
              Any resemblance to a real company's internal data is coincidental.
              There are no customer testimonials, logos, or claims of outcomes
              on this site.
            </p>

            <div className={styles.note} style={{ marginTop: "1.6rem" }}>
              Found an attribution error or a missing credit?{" "}
              <Link href="/help">Use the help page</Link> to see how to reach
              the maintainer.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
