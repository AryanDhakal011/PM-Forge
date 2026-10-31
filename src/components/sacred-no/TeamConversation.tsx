"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { content } from "@/lib/sacred-no/engine";
import type { ConversationPlan } from "@/lib/sacred-no/conversations";
import { useVoice } from "./useVoice";
import s from "./SacredNo.module.css";
export default function TeamConversation({
  plan,
  sound,
  autoAdvance,
  paused,
  calm,
  busy,
  onSound,
  onAutoAdvance,
  onDone,
  onPause,
  onReply,
}: {
  plan: ConversationPlan;
  sound: boolean;
  autoAdvance: boolean;
  paused: boolean;
  calm: boolean;
  busy: boolean;
  onSound: () => void;
  onAutoAdvance: (value: boolean) => void;
  onDone: () => void;
  onPause: () => void;
  onReply: (reply: "on" | "ask" | "call") => void;
}) {
  const [index, setIndex] = useState(0),
    [replay, setReplay] = useState(0),
    [ended, setEnded] = useState(false);
  const ticket = useRef(0),
    lock = useRef(false),
    root = useRef<HTMLDivElement>(null),
    done = useRef(onDone);
  done.current = onDone;
  const voice = useVoice(sound, paused),
    id = plan.ids[index],
    line = content.lines.find((l) => l.id === id)!,
    person = content.people.find((p) => p.id === line.speaker)!,
    row = content.people.indexOf(person);
  const expression =
    line.emotion === "concerned" || line.emotion === "pressured"
      ? 2
      : line.emotion === "approving" || line.emotion === "reassured"
        ? 3
        : 1;
  const next = () => {
    if (paused || busy || lock.current) return;
    lock.current = true;
    ticket.current++;
    voice.stop();
    setEnded(false);
    if (index < plan.ids.length - 1) setIndex((i) => i + 1);
    else done.current();
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (paused) return;
    const frame = requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>("[data-conversation-next]")
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [id, paused]);
  useEffect(() => {
    if (paused) return;
    lock.current = false;
    setEnded(false);
    const t = ++ticket.current;
    if (sound)
      voice.play(id, () => {
        if (ticket.current === t) setEnded(true);
      });
    return () => {
      ticket.current++;
      voice.stop();
    };
  }, [id, replay, sound, paused, voice.play, voice.stop]);
  useEffect(() => {
    if (
      !ended ||
      !autoAdvance ||
      !sound ||
      paused ||
      busy ||
      (plan.reply && index === plan.ids.length - 1)
    )
      return;
    const t = setTimeout(() => nextRef.current(), 600);
    return () => clearTimeout(t);
  }, [ended, autoAdvance, sound, paused, busy, index, plan.reply]);
  useEffect(() => {
    if (paused || calm) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { opacity: 0.3, y: 18 },
        { opacity: 1, y: 0, duration: 0.32, clearProps: "transform,opacity" },
      );
    }, root);
    return () => ctx.revert();
  }, [id, paused, calm]);
  return (
    <Dialog
      open={!paused}
      onClose={onPause}
      title={plan.title}
      dismissible={false}
      initialFocus="[data-conversation-next]"
      size="lg"
    >
      <div
        ref={root}
        className={`${s.sheet} ${s.teamConversation}`}
        data-team-conversation=""
        data-line-id={id}
        data-speaking={voice.playing}
      >
        <div className={s.conversationHead}>
          <span className={s.eyebrow}>
            {plan.reply
              ? "INCOMING / THE MIDNIGHT REQUEST"
              : "LIVE CONVERSATION / YOUR TEAM"}
          </span>
          <button className={s.textButton} onClick={onPause}>
            Pause / leave
          </button>
        </div>
        <div className={s.conversationLine}>
          <span
            className={s.portrait}
            data-large="true"
            role="img"
            aria-label={`${person.name}, ${expression === 2 ? "concerned" : expression === 3 ? "approving" : "thinking"}`}
            style={
              {
                backgroundPosition: `${(expression * 100) / 3}% ${row * 25}%`,
              } as CSSProperties
            }
          />
          <div>
            <h2>{person.name}</h2>
            <small>
              {person.role} · {index + 1} of {plan.ids.length}
            </small>
            <p className={s.spokenLine} aria-live="polite" aria-atomic="true">
              {line.text}
            </p>
          </div>
        </div>
        <div
          className={s.conversationProgress}
          aria-label={`Dialogue ${index + 1} of ${plan.ids.length}`}
        >
          {plan.ids.map((x, i) => (
            <i key={x} data-done={i <= index} />
          ))}
        </div>
        {index === plan.ids.length - 1 && (
          <div className={s.nextTask}>
            <small>YOUR NEXT MOVE</small>
            <p>{plan.task}</p>
          </div>
        )}
        <div className={s.conversationControls}>
          {plan.reply && index === plan.ids.length - 1 ? (
            <div className={s.quickReplies}>
              {(
                [
                  ["on", "On it."],
                  ["ask", "Walk me through what you promised."],
                  ["call", "Call me."],
                ] as const
              ).map(([reply, label]) => (
                <button
                  className={reply === "ask" ? s.primary : s.button}
                  data-conversation-next=""
                  key={reply}
                  disabled={busy}
                  onClick={() => {
                    voice.stop();
                    onReply(reply);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button
              data-conversation-next=""
              className={s.primary}
              disabled={busy}
              onClick={next}
            >
              {index === plan.ids.length - 1 ? plan.finish : "Next →"}
            </button>
          )}
          <button
            className={s.button}
            onClick={() => setReplay((n) => n + 1)}
            disabled={busy}
          >
            ↻ Replay line
          </button>
          <button className={s.button} onClick={onSound}>
            {sound ? "Mute" : "Sound on"}
          </button>
        </div>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => onAutoAdvance(e.target.checked)}
          />
          Advance dialogue after the recording ends
        </label>
        <small>
          {sound
            ? voice.playing
              ? "Speaking · you can replay or move on whenever you are ready."
              : "Your pace. Next is always available."
            : "Captions only. Choose Sound on to hear the team."}{" "}
          No task or decision is made for you.
        </small>
        {voice.status && (
          <p role="status" className={s.muted}>
            {voice.status}
          </p>
        )}
      </div>
    </Dialog>
  );
}
