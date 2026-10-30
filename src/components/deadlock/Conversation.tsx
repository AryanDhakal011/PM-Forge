"use client";
import { useEffect, useRef, useState } from "react";
import { cast, line } from "@/lib/deadlock/content";
import type { SceneProps } from "./runtime";
import { Avatar } from "./Stage";
import s from "./Deadlock.module.css";

/** The index is the only source of truth. No duration estimate advances dialogue. */
export function Conversation({
  ids,
  caption,
  paused = false,
  autoAdvance = false,
  sound = false,
  toggleSound,
  voiceRevision = 0,
  onDone,
  finishLabel = "Continue",
  title = "Team conversation",
}: Pick<
  SceneProps,
  | "caption"
  | "paused"
  | "autoAdvance"
  | "sound"
  | "toggleSound"
  | "voiceRevision"
> & {
  ids: string[];
  onDone: () => void;
  finishLabel?: string;
  title?: string;
}) {
  const [index, setIndex] = useState(0),
    [replay, setReplay] = useState(0),
    [ended, setEnded] = useState(false);
  const active = useRef(0),
    presented = useRef(""),
    advanceLock = useRef(false),
    onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const id = ids[Math.min(index, ids.length - 1)],
    current = line(id),
    person = cast.find((p) => p.id === current.speaker);
  const next = () => {
    if (advanceLock.current || paused) return;
    advanceLock.current = true;
    active.current++;
    setEnded(false);
    if (index < ids.length - 1) setIndex((i) => i + 1);
    else onDoneRef.current();
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (paused) return;
    const key = id + ":" + replay + ":" + voiceRevision;
    if (presented.current === key) return;
    presented.current = key;
    advanceLock.current = false;
    setEnded(false);
    const ticket = ++active.current;
    caption(id, (played) => {
      if (active.current === ticket && played) setEnded(true);
    });
  }, [id, replay, caption, paused, voiceRevision]);
  useEffect(
    () => () => {
      active.current++;
    },
    [],
  );
  useEffect(() => {
    if (!autoAdvance || !sound || !ended || paused) return;
    const timer = setTimeout(() => nextRef.current(), 600);
    return () => clearTimeout(timer);
  }, [ended, autoAdvance, sound, paused, id]);
  return (
    <section
      className={s.conversation}
      aria-label={title}
      data-dialogue-id={id}
    >
      <div className={s.speakerPortrait}>
        <Avatar
          person={person?.id || "Mara"}
          expression={
            current.expression as
              "neutral" | "thinking" | "annoyed" | "approving"
          }
        />
        <span className={s.kicker}>
          {index + 1} / {ids.length}
        </span>
      </div>
      <div className={s.conversationBody}>
        <div className={s.speakerTag} key={current.speaker}>
          {person?.name || current.speaker}
          <span>{person?.role || "Northgate"}</span>
        </div>
        <p className={s.dialogueText} aria-live="polite" aria-atomic="true">
          {current.text}
        </p>
        <div className={s.dialogueActions}>
          <button className={s.brassButton} disabled={paused} onClick={next}>
            {index === ids.length - 1 ? finishLabel : "Next →"}
          </button>
          <button
            className={s.button}
            disabled={paused}
            onClick={() => setReplay((n) => n + 1)}
            aria-label="Replay this line"
          >
            ↻ Replay
          </button>
          {toggleSound && (
            <button
              className={s.linkButton}
              onClick={() => {
                toggleSound?.();
                if (!sound) setReplay((n) => n + 1);
              }}
            >
              {sound ? "Mute" : "Sound on"}
            </button>
          )}
        </div>
        <small className={s.muted}>
          {autoAdvance && sound
            ? "Auto-advance waits until the recording finishes."
            : "Your pace. Nothing advances until you choose Next."}
        </small>
      </div>
    </section>
  );
}
