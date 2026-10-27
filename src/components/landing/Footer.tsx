"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, LockKeyhole, Volume2, VolumeX } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Reveal } from "@/components/ui/Reveal";
import { track } from "@/lib/analytics";
import styles from "./Footer.module.css";

const LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Practice",
    links: [
      { label: "Signal test", href: "/#signal" },
      { label: "Interview prep", href: "/practice" },
      { label: "Projects", href: "/projects" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Modules", href: "/learn" },
      { label: "Pressure test logic", href: "/#projects" },
    ],
  },
  {
    title: "Career and company",
    links: [
      { label: "Career tools", href: "/career" },
      { label: "Help", href: "/help" },
      { label: "About", href: "/about" },
    ],
  },
];

export function Footer() {
  const {
    reducedMotion,
    osReducedMotion,
    sound,
    haptics,
    hapticsSupported,
    toggleReducedMotion,
    toggleSound,
    toggleHaptics,
    playCue,
  } = useSettings();

  return (
    <footer className={styles.footer}>
      <div className={styles.woodEdge} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link href="/" aria-label="PMForge home" className={styles.brand}>
              <Logo />
            </Link>
            <p className={styles.tagline}>
              Better product managers.
              <br />
              A stronger tomorrow.
            </p>
            <p className={styles.about}>
              A practice ground for the judgment behind the job.
            </p>
          </div>

          <nav className={styles.linkCols} aria-label="Footer navigation">
            {LINK_GROUPS.map((group) => (
              <div key={group.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={styles.groupLink}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Reveal className={styles.journey} threshold={0.9}>
          <nav aria-label="Decision journey">
            <ol>
              <li><a href="#hero"><span className={styles.node} />Chaos</a></li>
              <li><a href="#signal"><span className={styles.node} />Signal</a></li>
              <li><a href="#decision-record"><span className={styles.node} />Decision</a></li>
              <li><a href="#blueprint"><span className={styles.node} />Impact</a></li>
            </ol>
            <Link href="/learn" className={styles.startLearning}>
              Start learning <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </nav>
        </Reveal>

        <fieldset className={styles.prefs}>
          <legend className={styles.prefsTitle}>Preferences</legend>
          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            disabled={osReducedMotion}
            className={styles.toggle}
            title={
              osReducedMotion
                ? "Your system's reduced-motion setting is on. Change it in your OS to re-enable animation."
                : "Uses your system preference until you change it."
            }
            onClick={() => {
              if (osReducedMotion) return;
              toggleReducedMotion();
              track("reduced_motion_toggle", { on: !reducedMotion });
            }}
          >
            <span className={styles.switch} data-on={reducedMotion} aria-hidden="true">
              <i />
            </span>
            Reduced motion
            {osReducedMotion ? (
              <span className={styles.srOnly}> (set by your system)</span>
            ) : null}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            className={styles.toggle}
            title="Subtle glass cues. Off by default."
            onClick={() => {
              toggleSound();
              if (!sound) playCue("tick");
            }}
          >
            <span className={styles.switch} data-on={sound} aria-hidden="true">
              <i />
            </span>
            {sound ? (
              <Volume2 size={15} strokeWidth={1.7} aria-hidden="true" />
            ) : (
              <VolumeX size={15} strokeWidth={1.7} aria-hidden="true" />
            )}
            Sound
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={haptics}
            className={styles.toggle}
            disabled={!hapticsSupported}
            title={
              hapticsSupported
                ? undefined
                : "Haptics are not available on this device"
            }
            onClick={() => {
              if (!hapticsSupported) return;
              toggleHaptics();
              track("haptics_toggle", { on: !haptics });
            }}
          >
            <span className={styles.switch} data-on={haptics} aria-hidden="true">
              <i />
            </span>
            Haptics
            {!hapticsSupported ? (
              <span className={styles.srOnly}> (not available on this device)</span>
            ) : null}
          </button>
          <p className={styles.prefsHelp}>
            {osReducedMotion
              ? "Reduced motion follows your system setting."
              : "Changes apply immediately and stay on this device."}
          </p>
        </fieldset>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span className={styles.copyright}>© 2026 PMForge</span>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/credits">Credits</Link>
          </div>
          <div className={styles.bottomAside}>
            <div className={styles.titleBlock} aria-label="Project PMForge, sheet 01 of 01, revision 2026.10, free practice">
              <span>PROJECT <b>PMForge</b></span>
              <span>SHEET <b>01 / 01</b></span>
              <span>REV <b>2026.10</b></span>
              <span>STATUS <b>Free practice</b></span>
            </div>
            <a href="#hero" className={styles.backToTop}>
              Back to top <ArrowUp size={14} aria-hidden="true" />
            </a>
            <p className={styles.localNote}>
              <LockKeyhole size={15} strokeWidth={1.7} aria-hidden="true" />
              Practice data stays in your browser. Voice typing uses your browser&apos;s
              speech service.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
