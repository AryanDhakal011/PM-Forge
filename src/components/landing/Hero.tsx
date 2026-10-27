"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, BookOpen, BriefcaseBusiness, Target } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { scrollState } from "@/lib/scrollState";
import { markLandingSceneReady } from "@/lib/landingSceneReadiness";
import { useSceneActivity } from "@/three/sceneLifecycle";
import { track } from "@/lib/analytics";
import { Magnetic } from "@/components/ui/Magnetic";
import { HeroPoster } from "./HeroPoster";
import styles from "./Hero.module.css";

const HeroScene = dynamic(
  () => import("@/three/DecisionEngine").then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => <HeroPoster />,
  },
);

type Inspected = { label: string; body: string; source: string } | null;

export function Hero() {
  const { reducedMotion } = useSettings();
  const webgl = useWebGLSupport();
  const scene = useSceneActivity("hero", reducedMotion, true);
  const sectionRef = useRef<HTMLElement>(null);
  const [justified, setJustified] = useState(false);
  const [inspected, setInspected] = useState<Inspected>(null);
  const router = useRouter();
  const markHeroReady = useCallback(
    () => markLandingSceneReady("hero"),
    [],
  );

  useEffect(() => {
    if (webgl === false) markHeroReady();
  }, [markHeroReady, webgl]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (reducedMotion) {
      scrollState.hero = 0.86;
      setJustified(true);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollState.hero = self.progress;
        const next = self.progress > 0.88;
        setJustified((current) => {
          if (current === next) return current;
          return next;
        });
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  const handleEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    track("hero_enter_click");
    const signedIn = window.localStorage.getItem("pmforge.user");
    if (signedIn) {
      event.preventDefault();
      router.push("/dashboard");
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={styles.hero}
      aria-labelledby="hero-title"
      data-justified={justified}
    >
      <div className={styles.sticky}>
        <div className={styles.copy}>
          <p className={styles.eyebrow + " eyebrow"}>
            Product manager learning platform
          </p>
          <h1 id="hero-title" className={`${styles.headline} display`}>
            <span>Master the mess.</span>
            <span>Turn chaotic signals</span>
            <span>
              into <em>justified decisions.</em>
            </span>
          </h1>
          <p className={styles.lede}>
            Real-world scenarios. Interactive practice. Structured feedback.
            Everything you need to become a world-class Product Manager.
          </p>
          <div className={styles.actions}>
            <Magnetic strength={6}>
              <Link
                href="/signup?intent=enter"
                className={`${styles.enter} btn btnPrimary`}
                onClick={handleEnter}
              >
                Enter
                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </Magnetic>
            <a href="#signal" className={styles.scrollCue}>
              <span className={styles.cueLine} />
              Scroll to explore
              <ArrowDown size={13} strokeWidth={1.6} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className={styles.scene}>
          <p className="srOnly">
            A decision engine made of brass rings holds a chrome core above a
            wooden workbench. Pinned evidence cards move from a scattered state
            into an ordered one as the page scrolls; an indicator lamp turns on
            when a decision is justified.
          </p>

          <div className={styles.canvasWrap}>
            {webgl === false ? (
              <HeroPoster note />
            ) : (
              <HeroScene
                reducedMotion={reducedMotion}
                frameloop={scene.frameloop}
                onInspect={setInspected}
                onReady={markHeroReady}
              />
            )}
          </div>

          <div className={styles.annotations} aria-hidden="true">
            <span className={`${styles.annotation} ${styles.annA}`}>
              Users
              <svg viewBox="0 0 90 54" className={styles.arrow}>
                <path d="M4 48C28 50 58 38 74 13" />
                <path d="M62 13l13-3-3 14" />
              </svg>
            </span>
            <span className={`${styles.annotation} ${styles.annB}`}>
              Metrics
              <svg viewBox="0 0 90 54" className={styles.arrow}>
                <path d="M6 8c26 2 48 16 60 34" />
                <path d="M54 34l13 9-14 2" />
              </svg>
            </span>
            <span className={`${styles.annotation} ${styles.annC}`}>
              Strategy
              <svg viewBox="0 0 90 54" className={styles.arrow}>
                <path d="M8 10c22 8 38 24 44 38" />
                <path d="M39 40l14 9-14 1" />
              </svg>
            </span>
            <span className={`${styles.annotation} ${styles.annD}`}>
              Constraints
              <svg viewBox="0 0 90 54" className={styles.arrow}>
                <path d="M2 46c28-4 48-18 62-38" />
                <path d="M51 9l13-3-2 14" />
              </svg>
            </span>
          </div>

          {inspected ? (
            <div className={styles.inspectCard} role="status">
              <span>{inspected.label}</span>
              <p>{inspected.body}</p>
              <em>{inspected.source}</em>
            </div>
          ) : null}

          <div
            className={`${styles.statusChip} ${justified ? styles.statusOn : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.statusDot} />
            <span>
              <strong>Example decision</strong>
              <small>Evidence strength High · Impact High</small>
            </span>
          </div>
        </div>

        <div className={styles.trust}>
          <a href="#learning" className={styles.trustItem}>
            <BookOpen size={28} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Learn
              <small>at your pace</small>
            </span>
          </a>
          <a href="#interview" className={styles.trustItem}>
            <Target size={28} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Practice
              <small>real PM scenarios</small>
            </span>
          </a>
          <a href="#career" className={styles.trustItem}>
            <BriefcaseBusiness size={28} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Build a portfolio
              <small>that gets you hired</small>
            </span>
          </a>
        </div>

        <div className={styles.deskEdge} aria-hidden="true" />
      </div>
    </section>
  );
}
