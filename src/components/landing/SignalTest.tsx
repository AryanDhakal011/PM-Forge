"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  RotateCcw,
  X,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  evidenceCards,
  evidenceScore,
  evidenceStrength,
  relatedEvidenceIds,
  strongestEvidenceId,
  type EvidenceCard,
} from "@/lib/content";
import { track } from "@/lib/analytics";
import { markLandingSceneReady } from "@/lib/landingSceneReadiness";
import { cancelSmoothScroll, scrollToElement } from "@/lib/scrollTo";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useNearViewport, useSceneActivity } from "@/three/sceneLifecycle";
import styles from "./SignalTest.module.css";

type Verdict = "idle" | "strong" | "related" | "weak";

type CardSlot = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

const CARD_SLOTS: Record<number, CardSlot> = {
  1: { x: 436, y: 236, width: 232, height: 130, rotation: -3 },
  2: { x: 625, y: 72.5, width: 228, height: 137, rotation: -1 },
  3: { x: 865, y: 196.5, width: 202, height: 127, rotation: 9 },
  4: { x: 898.5, y: 360, width: 219, height: 122, rotation: -3 },
  5: { x: 428, y: 405, width: 200, height: 110, rotation: -6 },
  6: { x: 930, y: 522, width: 212, height: 114, rotation: 0 },
  7: { x: 419.5, y: 554, width: 217, height: 130, rotation: -7 },
  8: { x: 954.5, y: 665, width: 205, height: 121, rotation: -4 },
  9: { x: 483, y: 711.5, width: 210, height: 123, rotation: -2 },
  10: { x: 709.5, y: 706, width: 195, height: 124, rotation: -2 },
};

const CARD_TAGS: Record<number, [string, string]> = {
  1: ["Product", "UX"],
  2: ["Analytics", "Growth"],
  3: ["Customer", "Support"],
  4: ["Competitive", "Market"],
  5: ["Leadership", "Strategy"],
  6: ["Revenue", "Analytics"],
  7: ["Community", "Power users"],
  8: ["Customer", "Sentiment"],
  9: ["Sales", "Enterprise"],
  10: ["Analytics", "Engagement"],
};

const CARD_NOTES = [
  { id: 1, text: "High user sentiment", x: 455, y: 205, rotation: -8 },
  { id: 2, text: "Could be a UX issue…", x: 745, y: 48, rotation: -5 },
  { id: 3, text: "Is this a bug?", x: 1085, y: 175, rotation: -7 },
  { id: 4, text: "Timing matters.", x: 1125, y: 488, rotation: -5 },
  { id: 5, text: "High user pressure.", x: 412, y: 378, rotation: -8 },
  { id: 6, text: "Big impact.", x: 1150, y: 510, rotation: -5 },
  { id: 7, text: "Could drive advocacy.", x: 405, y: 691, rotation: -8 },
  { id: 8, text: "Check recent changes.", x: 1050, y: 835, rotation: 4 },
  { id: 9, text: "Enterprise opportunity?", x: 500, y: 875, rotation: -6 },
  { id: 10, text: "Maybe a positive sign?", x: 900, y: 875, rotation: -5 },
];

const FACTOR_LABELS = [
  ["Evidence strength", "measured"],
  ["Impact", "impact"],
  ["Corroboration", "scope"],
  ["Recency", "recency"],
] as const satisfies ReadonlyArray<
  readonly [string, "measured" | "impact" | "scope" | "recency"]
>;

function getFactorValue(
  card: EvidenceCard,
  factor: (typeof FACTOR_LABELS)[number][1],
) {
  if (factor === "impact") {
    return card.impact === "High" ? 2 : card.impact === "Medium" ? 1 : 0;
  }
  return card.factors[factor];
}

function getSpokePath(id: number) {
  const slot = CARD_SLOTS[id];
  const centerX = slot.x + slot.width / 2;
  const centerY = slot.y + slot.height / 2;
  const deltaX = centerX - 765;
  const deltaY = centerY - 480;
  const distance = Math.hypot(deltaX, deltaY);
  const startX = 765 + (deltaX / distance) * 126;
  const startY = 480 + (deltaY / distance) * 126;
  const inset = Math.min(
    slot.width / 2 / Math.abs(deltaX / distance),
    slot.height / 2 / Math.abs(deltaY / distance),
  );
  const endX = centerX - (deltaX / distance) * inset;
  const endY = centerY - (deltaY / distance) * inset;

  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

function getNoteLeaderPath(note: (typeof CARD_NOTES)[number]) {
  const slot = CARD_SLOTS[note.id];
  const centerX = slot.x + slot.width / 2;
  const centerY = slot.y + slot.height / 2;
  const deltaX = centerX - note.x;
  const deltaY = centerY - note.y;
  const scale = Math.min(
    slot.width / 2 / (Math.abs(deltaX) || Number.EPSILON),
    slot.height / 2 / (Math.abs(deltaY) || Number.EPSILON),
  );
  const endX = centerX - deltaX * scale;
  const endY = centerY - deltaY * scale;
  const middleX = (note.x + endX) / 2;
  const middleY = (note.y + endY) / 2 - 12;

  return `M ${note.x} ${note.y} Q ${middleX} ${middleY} ${endX} ${endY}`;
}

const SignalInstrumentCanvas = dynamic(
  () =>
    import("@/three/SignalInstrument").then(
      (module) => module.SignalInstrumentCanvas,
    ),
  { ssr: false },
);

export function SignalTest() {
  const { reducedMotion, playCue, vibrate } = useSettings();
  const webglSupport = useWebGLSupport();
  const sectionRef = useRef<HTMLElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const scene = useSceneActivity("signal", reducedMotion);
  const trayNear = useNearViewport(trayRef);
  const [webglFailed, setWebglFailed] = useState(false);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [inspected, setInspected] = useState<Set<number>>(() => new Set());
  const [dragging, setDragging] = useState<{ id: number; x: number; y: number } | null>(null);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [skipMessage, setSkipMessage] = useState("");
  const [narrowed, setNarrowed] = useState(false);
  const [helped, setHelped] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const markSignalReady = useCallback(
    () => markLandingSceneReady("signal"),
    [],
  );

  useEffect(() => {
    if (webglSupport === false) markSignalReady();
  }, [markSignalReady, webglSupport]);

  const ranked = useMemo(
    () =>
      [...evidenceCards]
        .sort((a, b) => evidenceScore(b) - evidenceScore(a))
        .map((card) => card.id),
    [],
  );
  const topFour = useMemo(() => new Set(ranked.slice(0, 4)), [ranked]);

  const selected = evidenceCards.find((card) => card.id === selectedId) ?? null;
  const preview = selected
    ? null
    : evidenceCards.find((card) => card.id === hoveredId) ?? null;
  const instrumentProgress =
    selectedId === strongestEvidenceId ? 1 : selectedId !== null ? 0.62 : narrowed ? 0.3 : 0;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            track("signal_test_started", { source: "view" });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const choose = useCallback(
    (card: EvidenceCard, options?: { helped?: boolean }) => {
      setSelectedId(card.id);
      setInspected((current) => new Set(current).add(card.id));
      let next: Verdict = "weak";
      if (card.id === strongestEvidenceId) next = "strong";
      else if (relatedEvidenceIds.includes(card.id)) next = "related";
      setVerdict(next);
      playCue(next === "strong" ? "chime" : "tick");
      if (next === "strong" && !options?.helped) vibrate([18, 40, 18]);
      track("signal_selected", {
        id: card.id,
        verdict: next,
        strength: evidenceStrength(card),
        helped: Boolean(options?.helped),
      });
      if (next === "strong" && !options?.helped) {
        track("signal_justified", {
          id: card.id,
          strength: evidenceStrength(card),
        });
      }
      if (options?.helped) return;
      try {
        window.localStorage.setItem(
          "pmforge.signal.v1",
          JSON.stringify({
            id: card.id,
            verdict: next,
            strength: evidenceStrength(card),
            impact: card.impact,
            at: Date.now(),
          }),
        );
        window.dispatchEvent(new CustomEvent("pmforge:progress"));
      } catch {
        // Practice still works when storage is unavailable.
      }
    },
    [playCue, vibrate],
  );

  const reset = useCallback(() => {
    setSelectedId(null);
    setVerdict("idle");
    setDragging(null);
    setStarted(false);
    setSkipMessage("");
    setNarrowed(false);
    setHelped(false);
    setAnnouncement("");
    try {
      window.localStorage.removeItem("pmforge.signal.v1");
    } catch {
      // Storage is optional.
    }
  }, []);

  const isolate = useCallback(() => {
    setStarted(true);
    if (selectedId !== null) {
      reset();
      setNarrowed(true);
      setAnnouncement(
        "Reset. The field is narrowed to four strong candidates. Pick one.",
      );
      return;
    }
    if (!narrowed) {
      setNarrowed(true);
      setAnnouncement(
        "Field narrowed. Six weak cards dimmed. Four candidates ringed. Pick one.",
      );
      cardRefs.current[0]?.focus({ preventScroll: true });
      track("signal_isolate", { stage: "narrow" });
      return;
    }
    const strongest = evidenceCards.find((card) => card.id === ranked[0]);
    if (!strongest) return;
    setHelped(true);
    choose(strongest, { helped: true });
    setAnnouncement(
      "Isolated with help. The strongest card was selected for you, so this run does not count toward completion.",
    );
    track("signal_isolate", { stage: "auto" });
  }, [choose, narrowed, ranked, reset, selectedId]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (event.pointerType === "touch") return;
    const card = event.currentTarget;
    card.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    setDragging({ id, x: 0, y: 0 });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (!dragStart.current || dragging?.id !== id) return;
    const x = event.clientX - dragStart.current.x;
    const y = event.clientY - dragStart.current.y;
    if (Math.hypot(x, y) > 5) suppressClick.current = true;
    setDragging({ id, x, y });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>, card: EvidenceCard) => {
    if (!dragStart.current) return;
    const moved = Math.hypot(
      event.clientX - dragStart.current.x,
      event.clientY - dragStart.current.y,
    );
    dragStart.current = null;
    const tray = trayRef.current?.getBoundingClientRect();
    if (tray && moved > 5) {
      const inside =
        event.clientX > tray.left &&
        event.clientX < tray.right &&
        event.clientY > tray.top &&
        event.clientY < tray.bottom;
      if (inside) choose(card);
    }
    setDragging(null);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 40);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = (index + direction + evidenceCards.length) % evidenceCards.length;
    cardRefs.current[next]?.focus();
  };

  const jumpToLearning = (skipped: boolean) => {
    if (skipped) {
      setSkipMessage(
        "Signal test skipped. The rest of the story is still here — the learning path starts now.",
      );
      track("signal_skipped");
    }
    const target = document.getElementById("learning");
    if (!target) return;

    if (reducedMotion) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      document.getElementById("learning-title")?.focus({ preventScroll: true });
      return;
    }

    let done = false;
    const cancel = () => {
      if (done) return;
      done = true;
      cancelSmoothScroll();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });

    scrollToElement(target, { duration: 1.8, offset: -96 });
    window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      const heading = document.getElementById("learning-title");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }, 1900);
  };

  const strength = selected ? evidenceStrength(selected) : null;

  return (
    <section
      id="signal"
      ref={sectionRef}
      className={`${styles.section} ${started ? styles.started : ""} ${
        verdict === "strong" ? styles.resolved : ""
      }`}
      aria-labelledby="signal-title"
    >
      <div className={styles.sticky}>
        <div className={styles.inner}>
          <div className={styles.intro}>
            <p className="eyebrow">Quick signal test</p>
            <h2 id="signal-title" className={`${styles.title} display`}>
              Noises
              <br />
              everywhere.
              <br />
              Where is the
              <br />
              <span>signal?</span>
            </h2>
            <p className={styles.copy}>
              You have 10 conflicting data points and a deadline in an hour. What
              moves the needle?
            </p>
            <button
              type="button"
              className={`${styles.isolate} btn btnPrimary`}
              onClick={isolate}
            >
              {selectedId !== null
                ? "Reset and isolate again"
                : narrowed
                  ? "Signal narrowed. Pick one"
                  : "Isolate the signal"}
              <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <p className={styles.instruction}>
              <span>Separate evidence from assumptions.</span>
              <small>
                {inspected.size} of 10 inspected. Select a card to inspect it.
              </small>
            </p>

            <button
              type="button"
              className={styles.skip}
              onClick={() => jumpToLearning(true)}
            >
              Skip interaction
            </button>
          </div>

          <div className={styles.fieldWrap}>
            <div className={styles.table} role="group" aria-label="Ten pieces of evidence">
              <div className={styles.tableGlow} aria-hidden="true" />
              <div className={styles.orbShadow} aria-hidden="true" />
              <svg
                className={styles.spokes}
                viewBox="0 0 1536 1024"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <circle cx="765" cy="480" r="235" />
                <circle cx="765" cy="480" r="330" />
                {Array.from({ length: 16 }, (_, index) => {
                  const angle = (index / 16) * Math.PI * 2;
                  const innerRadius = 231;
                  const outerRadius = 239;
                  return (
                    <line
                      key={`tick-${index}`}
                      x1={765 + Math.cos(angle) * innerRadius}
                      y1={480 + Math.sin(angle) * innerRadius}
                      x2={765 + Math.cos(angle) * outerRadius}
                      y2={480 + Math.sin(angle) * outerRadius}
                    />
                  );
                })}
                {evidenceCards.map((card) => (
                  <path
                    key={card.id}
                    className={selectedId === card.id ? styles.spokeSelected : ""}
                    d={getSpokePath(card.id)}
                  />
                ))}
              </svg>
              <div className={styles.prints} aria-hidden="true">
                <span className={styles.sketchPrint} />
                <span className={styles.photoPrint} />
                <span className={styles.portraitPrint} />
              </div>
              <div
                ref={trayRef}
                className={styles.tray}
                data-armed={dragging ? "true" : "false"}
                aria-hidden="true"
              >
                <div className={styles.orbHalo} />
                <div className={styles.instrumentCanvas}>
                  {webglSupport === false || webglFailed ? (
                    <div className={styles.instrumentFallback} />
                  ) : trayNear ? (
                    <SignalInstrumentCanvas
                      reducedMotion={reducedMotion}
                      frameloop={scene.frameloop}
                      progress={instrumentProgress}
                      hovering={hoveredId !== null}
                      onReady={markSignalReady}
                      onFail={() => setWebglFailed(true)}
                    />
                  ) : (
                    <div className={styles.instrumentFallback} />
                  )}
                </div>
              </div>

              <div className={styles.cards} role="group" aria-label="Evidence cards">
                {evidenceCards.map((card, index) => {
                  const slot = CARD_SLOTS[card.id];
                  const isSelected = selectedId === card.id;
                  const isDimmed =
                    selectedId !== null && selectedId !== card.id;
                  const isDragging = dragging?.id === card.id;
                  const isRinged = narrowed && topFour.has(card.id);
                  const isWeak = narrowed && selectedId === null && !topFour.has(card.id);
                  return (
                    <button
                      key={card.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      type="button"
                      className={[
                        styles.card,
                        styles[`kind${card.id}`],
                        isSelected ? styles.selected : "",
                        isDimmed ? styles.dimmed : "",
                        isDragging ? styles.dragging : "",
                        isRinged ? styles.ringed : "",
                        isWeak ? styles.weak : "",
                        isSelected && verdict === "strong" ? styles.cardResolved : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={
                        {
                          left: `${((slot.x + slot.width / 2) / 1536) * 100}%`,
                          top: `${((slot.y + slot.height / 2) / 1024) * 100}%`,
                          width: `max(${(slot.width / 1536) * 100}%, 156px)`,
                          height: `max(${(slot.height / 1024) * 100}%, 104px)`,
                          transform: isDragging
                            ? `translate(calc(-50% + ${dragging.x}px), calc(-50% + ${dragging.y}px)) rotate(0deg) scale(1.04)`
                            : undefined,
                          "--card-rotation": `${slot.rotation}deg`,
                        } as React.CSSProperties
                      }
                      aria-pressed={isSelected}
                      aria-describedby={isSelected ? "signal-result" : undefined}
                      onPointerDown={(event) => onPointerDown(event, card.id)}
                      onPointerMove={(event) => onPointerMove(event, card.id)}
                      onPointerUp={(event) => onPointerUp(event, card)}
                      onPointerCancel={() => {
                        dragStart.current = null;
                        setDragging(null);
                      }}
                      onFocus={() => {
                        setHoveredId(card.id);
                        setInspected((current) => new Set(current).add(card.id));
                      }}
                      onBlur={() => setHoveredId(null)}
                      onMouseEnter={() => {
                        setHoveredId(card.id);
                        setInspected((current) => new Set(current).add(card.id));
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => {
                        if (suppressClick.current) return;
                        choose(card);
                      }}
                      onKeyDown={(event) => onKeyDown(event, index)}
                    >
                      <span className={styles.cardTop}>
                        <span className={styles.cardDot} aria-hidden="true" />
                        <span className={styles.cardNumber}>{card.number}</span>
                        <span className={styles.cardCategory}>{card.category}</span>
                      </span>
                      <span className={styles.pushpin} aria-hidden="true" />
                      <span className={styles.cardContent}>{card.content}</span>
                      <span className={styles.cardTags}>
                        {CARD_TAGS[card.id].map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
              <svg
                className={styles.selectedThread}
                viewBox="0 0 1536 1024"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {selectedId !== null ? (
                  <path d={getSpokePath(selectedId)} />
                ) : null}
              </svg>
              <svg
                className={styles.noteLeaders}
                viewBox="0 0 1536 1024"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {CARD_NOTES.map((note) => (
                  <path key={note.id} d={getNoteLeaderPath(note)} />
                ))}
              </svg>
              <div className={styles.annotations} aria-hidden="true">
                {CARD_NOTES.map((note) => (
                  <span
                    key={note.id}
                    className={styles.annotation}
                    data-note-id={note.id}
                    data-related={hoveredId === note.id ? "true" : "false"}
                    style={{
                      left: `${(note.x / 1536) * 100}%`,
                      top: `${(note.y / 1024) * 100}%`,
                      rotate: `${note.rotation}deg`,
                    }}
                  >
                    {note.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.decision} aria-live="polite">
            <div
              className={`${styles.decisionIcon} ${
                verdict === "strong" ? styles.decisionIconOn : ""
              }`}
            >
              {verdict === "strong" ? (
                <Check size={18} strokeWidth={2} aria-hidden="true" />
              ) : verdict === "weak" || verdict === "related" ? (
                <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <span />
              )}
            </div>

            <div className={styles.decisionHead}>
              <span className={styles.decisionKicker}>
                {verdict === "strong"
                  ? "Decision"
                  : verdict === "related"
                    ? "Plausible. Corroborate it first."
                    : verdict === "weak"
                      ? "Not the signal yet."
                      : preview
                        ? "Card preview"
                        : "Awaiting signal"}
              </span>
              <h3 id="signal-result" className={styles.decisionTitle}>
                {verdict === "strong"
                  ? "Decision justified."
                  : verdict === "related"
                    ? "A useful signal. What else agrees?"
                    : verdict === "weak"
                      ? "Interesting. What evidence supports that?"
                      : "What moves the needle?"}
              </h3>
            </div>

            <div key={selectedId ?? "empty"} className={styles.swapBody}>
              {selected ? (
                <>
                  <p className={styles.decisionBody}>
                    {verdict === "strong"
                      ? "Mobile conversion fell 22%. It is measured, recent, broad, and tied directly to revenue. The rest are requests, opinions, or lagging indicators."
                      : selected.prompt}
                  </p>
                  {verdict === "strong" ? (
                    <div className={styles.successFoot}>
                      <p>
                        Good PM work isn&apos;t knowing everything. It&apos;s knowing
                        what matters next.
                      </p>
                      {helped ? (
                        <p className={styles.helpNote}>
                          Isolated with help. This run did not earn completion credit.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {preview ? (
                    <p className={styles.previewMeta}>
                      {preview.number} · {preview.category} · {preview.source} ·{" "}
                      {preview.recency} — Press Enter to inspect.
                    </p>
                  ) : (
                    <p className={styles.decisionBody}>
                      Choose the evidence that most changes what you would do
                      next. The card you pick will be scored on four factors, not
                      on whether it sounds urgent.
                    </p>
                  )}
                </>
              )}
              <dl className={styles.scoreTracks}>
                {FACTOR_LABELS.map(([label, factor]) => {
                  const value = selected ? getFactorValue(selected, factor) : null;
                  return (
                    <div key={factor} data-factor={factor}>
                      <dt>{label}</dt>
                      <dd>
                        <span className={styles.track}>
                          <i
                            style={{ width: `${((value ?? 0) / 2) * 100}%` }}
                          />
                        </span>
                        {value !== null ? <span>{value}/2</span> : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {!selected ? (
                <p className={styles.decisionNote}>
                  Simulated scenario. The rationale shows how the evidence adds
                  up.
                </p>
              ) : null}
            </div>

            {selected ? (
              <div className={styles.decisionFoot}>
                <button
                  type="button"
                  className={`${styles.rationaleLink} btn btnText`}
                  onClick={() => setRationaleOpen(true)}
                >
                  View rationale
                  <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
                {verdict === "strong" ? (
                  <button
                    type="button"
                    className="btn btnPrimary btnSm"
                    onClick={() => jumpToLearning(false)}
                  >
                    Continue
                    <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.tryAgain} ${styles.clearBtn}`}
                    onClick={reset}
                  >
                    <RotateCcw size={14} strokeWidth={1.7} aria-hidden="true" />
                    Clear selection
                  </button>
                )}
              </div>
            ) : null}

            {verdict === "strong" ? (
              <button
                type="button"
                className={styles.resetLink}
                onClick={reset}
              >
                <RotateCcw size={12} strokeWidth={1.7} aria-hidden="true" />
                Reset the test
              </button>
            ) : null}
          </div>
          <p className={styles.worldLine}>
            <span />
            The world is noise. The signal is what moves you forward.
            <span />
          </p>
          <span className={styles.simulationNote}>Simulated scenario</span>
        </div>

        <p className={styles.live} aria-live="polite">
          {announcement ||
            skipMessage ||
            (verdict === "strong"
              ? "Decision justified. Evidence strength high, impact high."
              : verdict === "related"
                ? "That card is strong and probably related. A stronger signal exists."
                : verdict === "weak"
                  ? "That card is interesting, but the evidence is lighter than it looks."
                  : "")}
        </p>
      </div>

      <Dialog
        open={rationaleOpen}
        onClose={() => setRationaleOpen(false)}
        title="How the evidence scores"
        description="Each card is scored 0–2 on four factors. Evidence strength is the sum out of 8."
        size="lg"
        footer={
          <button
            type="button"
            className="btn btnOutline btnSm"
            onClick={() => setRationaleOpen(false)}
          >
            <X size={14} strokeWidth={1.8} aria-hidden="true" />
            Close
          </button>
        }
      >
        <div className={styles.rationaleLayout}>
          <div className={styles.factorKey}>
            <div>
              <strong>Measured</strong>
              <span>Instrumented data, not a request or opinion.</span>
            </div>
            <div>
              <strong>Recency</strong>
              <span>How close the evidence sits to the decision.</span>
            </div>
            <div>
              <strong>Scope</strong>
              <span>How much of the audience the signal covers.</span>
            </div>
            <div>
              <strong>Revenue link</strong>
              <span>Whether the signal connects to commercial impact.</span>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.rationaleTable}>
              <caption className="srOnly">
                Evidence scoring for all ten cards
              </caption>
              <thead>
                <tr>
                  <th scope="col">Card</th>
                  <th scope="col" title="Measured">M</th>
                  <th scope="col" title="Recency">R</th>
                  <th scope="col" title="Scope">S</th>
                  <th scope="col" title="Revenue link">$</th>
                  <th scope="col">Score</th>
                  <th scope="col">Strength</th>
                </tr>
              </thead>
              <tbody>
                {evidenceCards.map((card) => {
                  const score = evidenceScore(card);
                  return (
                    <tr
                      key={card.id}
                      className={selectedId === card.id ? styles.rowSelected : ""}
                    >
                      <th scope="row">
                        <span>{card.number}</span> {card.content}
                      </th>
                      <td>{card.factors.measured}</td>
                      <td>{card.factors.recency}</td>
                      <td>{card.factors.scope}</td>
                      <td>{card.factors.revenue}</td>
                      <td>{score}/8</td>
                      <td>
                        <span className={styles.strengthPill} data-level={evidenceStrength(card)}>
                          {evidenceStrength(card)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className={styles.dialogNote}>
          Low = 0–3, Medium = 4–6, High = 7–8. A high score does not
          automatically win; the strongest signal is the one that changes the
          next action.
        </p>
      </Dialog>
    </section>
  );
}
