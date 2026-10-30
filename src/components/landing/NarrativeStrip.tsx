"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useSettings } from "@/components/providers/SettingsProvider";
import { ensureScrollTrigger } from "@/lib/scrollStory";
import styles from "./NarrativeStrip.module.css";

type NarrativeStripProps = {
  left?: string;
  right?: string;
  statement?: string;
  variant?:
    "noise-to-signal" | "evidence-vs-assumptions" | "new-evidence" | "reassess";
  tone?: "cream" | "warm";
  id?: string;
};

function splitLetters(text: string) {
  return Array.from(text).map((letter, index) => {
    const seed = Math.sin(index * 12.9898) * 43758.5453;
    const x = ((seed - Math.floor(seed)) * 6 - 3).toFixed(1);
    const y = (Math.sin(index * 4.17) * 7).toFixed(1);
    const rotation = (Math.cos(index * 2.31) * 3).toFixed(1);
    return (
      <span
        key={`${letter}-${index}`}
        data-beat-letter
        data-scatter-x={x}
        data-scatter-y={y}
        data-scatter-rotation={rotation}
      >
        {letter === " " ? "\u00a0" : letter}
      </span>
    );
  });
}

export function NarrativeStrip({
  left,
  right,
  statement,
  variant,
  tone = "cream",
  id,
}: NarrativeStripProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useSettings();
  const resolvedVariant =
    variant ?? (left && right ? "noise-to-signal" : "reassess");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      section.style.setProperty("--beat-progress", "1");
      section.style.setProperty("--beat-line-progress", "1");
      section.style.setProperty("--beat-dot-x", "100%");
      section.style.setProperty("--beat-dot-y", "100%");
      section.style.setProperty("--beat-stamp-progress", "1");
      section.style.setProperty("--beat-stamp-scale", "1");
      section.style.setProperty("--beat-retract-progress", "0");
      section.style.setProperty("--beat-branch-progress", "1");
      section.style.setProperty("--beat-letter-spacing", "0em");
      section.style.setProperty("--beat-blur", "0px");
      section.style.setProperty("--beat-rise", "0px");
      section.style.setProperty("--beat-opacity", "1");
      section
        .querySelectorAll<HTMLElement>("[data-beat-letter]")
        .forEach((letter) => {
          letter.style.transform = "none";
        });
      return;
    }

    const letters = Array.from(
      section.querySelectorAll<HTMLElement>("[data-beat-letter]"),
    ).map((node) => ({
      node,
      x: Number(node.dataset.scatterX),
      y: Number(node.dataset.scatterY),
      rotation: Number(node.dataset.scatterRotation),
    }));
    let previous = -1;
    let previousScatter = -1;
    const update = (raw: number) => {
      const progress = Math.round(raw * 10000) / 10000;
      if (progress === previous) return;
      previous = progress;
      const lineProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.5));
      const stampProgress = Math.max(0, Math.min(1, (progress - 0.42) / 0.18));
      section.style.setProperty("--beat-progress", String(progress));
      section.style.setProperty("--beat-travel", `${progress * 560}%`);
      section.style.setProperty("--beat-rise", `${(1 - progress) * 8}px`);
      section.style.setProperty("--beat-opacity", `${0.78 + progress * 0.22}`);
      section.style.setProperty("--beat-blur", `${(1 - progress) * 5}px`);
      section.style.setProperty("--beat-line-progress", String(lineProgress));
      section.style.setProperty("--beat-dot-x", `${lineProgress * 100}%`);
      section.style.setProperty("--beat-dot-y", `${lineProgress * 100}%`);
      section.style.setProperty("--beat-stamp-progress", String(stampProgress));
      section.style.setProperty(
        "--beat-stamp-scale",
        String(1.08 - stampProgress * 0.08),
      );
      section.style.setProperty(
        "--beat-retract-progress",
        String(Math.max(0, 1 - progress * 2)),
      );
      section.style.setProperty(
        "--beat-branch-progress",
        String(Math.max(0, Math.min(1, (progress - 0.5) / 0.3))),
      );
      section.style.setProperty(
        "--beat-letter-spacing",
        `${(1 - progress) * 0.04}em`,
      );
      const scatter = Math.max(0, 1 - progress / 0.35);
      if (scatter !== previousScatter) {
        previousScatter = scatter;
        letters.forEach(({ node, x, y, rotation }) => {
          node.style.transform = `translate(${x * scatter}px, ${y * scatter}px) rotate(${rotation * scatter}deg)`;
        });
      }
    };
    // ScrollTrigger measures once at refresh and updates only while this strip
    // crosses the viewport. No per-strip read/write layout loop on every scroll.
    const ScrollTrigger = ensureScrollTrigger();
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 86%",
      end: "bottom 51%",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => trigger.kill();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.strip} ${styles[resolvedVariant]} ${tone === "warm" ? styles.warm : ""}`}
      aria-label={statement ?? `${left ?? ""} ${right ?? ""}`.trim()}
      data-variant={resolvedVariant}
      id={id}
    >
      {resolvedVariant === "noise-to-signal" ? (
        <Reveal className={styles.beatScene}>
          <p className={styles.scatterPhrase} aria-hidden="true">
            {splitLetters(left ?? "")}
          </p>
          <div className={styles.signalLine} aria-hidden="true">
            <span />
          </div>
          <p className={styles.signalPhrase} aria-hidden="true">
            {right}
          </p>
        </Reveal>
      ) : resolvedVariant === "evidence-vs-assumptions" ? (
        <Reveal className={styles.beatScene}>
          <p className={styles.evidencePhrase} aria-hidden="true">
            Separate <span>evidence</span> from <span>assumptions.</span>
          </p>
          <div className={styles.splitRules} aria-hidden="true">
            <span />
            <span />
          </div>
        </Reveal>
      ) : resolvedVariant === "new-evidence" ? (
        <Reveal className={styles.beatScene}>
          <div className={styles.newEvidenceLine} aria-hidden="true">
            <span />
          </div>
          <p className={styles.stampPhrase} aria-hidden="true">
            <i />
            {statement}
          </p>
        </Reveal>
      ) : resolvedVariant === "reassess" ? (
        <Reveal className={styles.beatScene}>
          <div className={styles.reassessLine} aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <p className={styles.reassessPhrase} aria-hidden="true">
            {statement}
          </p>
          <div className={styles.branches} aria-hidden="true">
            <span>Pivot</span>
            <span>Stay</span>
          </div>
        </Reveal>
      ) : statement ? (
        <Reveal className={styles.single}>
          <span className={styles.rule} aria-hidden="true" />
          <p>{statement}</p>
          <span className={styles.rule} aria-hidden="true" />
        </Reveal>
      ) : (
        <Reveal className={styles.pair}>
          <p>{left}</p>
          <span className={styles.line} aria-hidden="true" />
          <p>{right}</p>
        </Reveal>
      )}
    </section>
  );
}
