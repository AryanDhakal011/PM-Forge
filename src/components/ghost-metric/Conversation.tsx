"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { people } from "@/lib/ghost-metric/content";
import type { Line } from "@/lib/ghost-metric/dialogue";
import type { guideCard } from "@/lib/ghost-metric/presentation";
import Portrait from "./Portrait";
import AudioControls from "./AudioControls";
import { useVoice } from "./useVoice";
import s from "./GhostMetric.module.css";
export type ConversationPlan = {
  key: string;
  lines: Line[];
  kind?: "story" | "intro" | "guide";
  guideKey?: string;
};
export default function Conversation({
  plan,
  sound,
  auto,
  ambient,
  paused,
  calm,
  guidance,
  guide,
  onDone,
  onPause,
  onSound,
  onAuto,
  onAmbient,
  onGuidance,
}: {
  plan: ConversationPlan;
  sound: boolean;
  auto: boolean;
  ambient: boolean;
  paused: boolean;
  calm: boolean;
  guidance: boolean;
  guide?: ReturnType<typeof guideCard>;
  onDone: () => void;
  onPause: () => void;
  onSound: () => void;
  onAuto: (value: boolean) => void;
  onAmbient: () => void;
  onGuidance: (value: boolean) => void;
}) {
  const [index, setIndex] = useState(0),
    [ended, setEnded] = useState(false),
    [replay, setReplay] = useState(0);
  const voice = useVoice(sound, paused),
    line = plan.lines[index],
    lock = useRef(false),
    serial = useRef(0);
  const person = people.find((p) => p.id === line.speaker)!;
  const last = index === plan.lines.length - 1;
  function next() {
    if (lock.current || paused) return;
    lock.current = true;
    voice.stop();
    setEnded(false);
    if (!last) setIndex((v) => v + 1);
    else onDone();
  }
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    lock.current = false;
    setEnded(false);
    const ticket = ++serial.current;
    if (!paused && sound)
      voice.play(line.id, () => {
        if (serial.current === ticket) setEnded(true);
      });
    return () => {
      serial.current++;
      voice.stop();
    };
  }, [line.id, sound, paused, replay, voice.play, voice.stop]);
  useEffect(() => {
    if (!ended || !auto || !sound || paused) return;
    const t = setTimeout(() => nextRef.current(), 600);
    return () => clearTimeout(t);
  }, [ended, auto, sound, paused]);
  useEffect(() => {
    if (paused) return;
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>("[data-ghost-next]")
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [line.id, paused]);
  const title =
    plan.kind === "intro"
      ? "Meet the team · your case briefing"
      : plan.kind === "guide"
        ? "Your next move"
        : "Live team conversation";
  return (
    <Dialog
      open={!paused}
      onClose={onPause}
      title={title}
      dismissible={false}
      initialFocus="[data-ghost-next]"
      size="lg"
    >
      <div
        className={`${s.sheet} ${s.conversationSheet}`}
        data-ghost-conversation=""
        data-kind={plan.kind || "story"}
        data-line-id={line.id}
        data-calm={calm}
      >
        <header className={s.speakerRow}>
          <Portrait id={line.speaker} mood={line.emotion} />
          <div>
            <p className={s.eyebrow}>
              {person.role} · {index + 1}/{plan.lines.length}
            </p>
            <h3>{person.name}</h3>
          </div>
        </header>
        <blockquote className={s.spokenLine}>{line.text}</blockquote>
        {plan.kind === "guide" && guide && (
          <dl className={s.guideReference}>
            <div>
              <dt>Goal</dt>
              <dd>{guide.goal}</dd>
            </div>
            <div>
              <dt>Do this</dt>
              <dd>{guide.do}</dd>
            </div>
            <div>
              <dt>Watch for</dt>
              <dd>{guide.watch}</dd>
            </div>
          </dl>
        )}
        <div className={s.conversationPrimary}>
          <button data-ghost-next="" className={s.primary} onClick={next}>
            {!last
              ? "Next →"
              : plan.kind === "guide"
                ? "Got it"
                : plan.kind === "intro"
                  ? "Try the sample request →"
                  : "Back to the task →"}
          </button>
        </div>
        <div className={s.conversationSecondary}>
          <button onClick={() => setReplay((v) => v + 1)}>Replay line</button>
          <button onClick={onPause}>Pause / leave</button>
          <span role="status">
            {voice.playing
              ? "Recording playing"
              : voice.status || "Caption stays until you continue."}
          </span>
        </div>
        <footer className={s.conversationFooter}>
          <AudioControls
            ambient={ambient}
            onAmbient={onAmbient}
            sound={sound}
            auto={auto}
            onSound={onSound}
            onAuto={onAuto}
          />
          <div className={s.conversationUtilities}>
            {plan.kind === "guide" && (
              <label>
                <input
                  type="checkbox"
                  checked={!guidance}
                  onChange={(e) => onGuidance(!e.target.checked)}
                />
                Don’t show guides again
              </label>
            )}
            <button
              onClick={() => {
                voice.stop();
                onDone();
              }}
            >
              {plan.kind === "intro"
                ? "Skip introduction"
                : plan.kind === "guide"
                  ? "Skip this guide"
                  : "Skip this conversation"}
            </button>
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
