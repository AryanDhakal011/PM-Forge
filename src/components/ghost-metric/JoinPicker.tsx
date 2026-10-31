"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { drawers, type DrawerId } from "@/lib/ghost-metric/content";
import { sourceColumns } from "@/lib/ghost-metric/presentation";
import type { Action, State } from "@/lib/ghost-metric/engine";
import type { Line } from "@/lib/ghost-metric/dialogue";
import { useVoice } from "./useVoice";
import s from "./GhostMetric.module.css";
type JoinAction = Extract<Action, { type: "JOIN" }>;
const targets = [
  {
    right: "gateway",
    key: "request_id",
    title: "Gateway request list",
    detail: "Match request IDs to count each request once.",
  },
  {
    right: "billing",
    key: "request_id",
    title: "Billing events",
    detail: "Check which request IDs have a billing event.",
  },
  {
    right: "accounts",
    key: "account_id",
    title: "Reference account list",
    detail: "Check whether account IDs belong to real customers or tests.",
  },
] as const;
export default function JoinPicker({
  source,
  open,
  state,
  busy,
  error,
  calm,
  sound,
  ambient,
  reading,
  onSound,
  onAmbient,
  onClose,
  onGuide,
  onJoin,
}: {
  source: DrawerId;
  open: boolean;
  state: State;
  busy: boolean;
  error: string;
  calm: boolean;
  sound: boolean;
  ambient: boolean;
  reading?: Line;
  onSound: () => void;
  onAmbient: () => void;
  onClose: () => void;
  onGuide: () => void;
  onJoin: (action: JoinAction) => Promise<boolean | undefined>;
}) {
  const [key, setKey] = useState<JoinAction["key"]>(sourceColumns(source)[0]),
    [target, setTarget] = useState(0),
    [settledAttempt, setSettledAttempt] = useState(-1);
  const ref = useRef<HTMLDivElement>(null),
    feedbackRef = useRef<HTMLElement>(null),
    voice = useVoice(sound, !open),
    heard = useRef("");
  const attempt = state.joinsUsed.length,
    last = state.joinsUsed.at(-1),
    matchesSource = last?.split(":")[0] === source,
    receipt = state.receipts.filter((r) => r.id.startsWith("J")).at(-1),
    result = matchesSource ? receipt?.because : "",
    wrong = result?.startsWith("No valid");
  const settled = calm || settledAttempt === attempt;
  useEffect(() => {
    if (open && result && settled)
      feedbackRef.current?.scrollIntoView({
        block: "nearest",
        behavior: calm ? "instant" : "smooth",
      });
  }, [attempt, open, settled, result, calm]);
  useEffect(() => {
    setKey(sourceColumns(source)[0]);
    setTarget(source === "tags" ? 2 : 0);
  }, [source]);
  useEffect(() => {
    if (!open || !result || !ref.current) return;
    const ctx = gsap.context(() => {
      if (calm) return;
      gsap.fromTo(
        "[data-join-row]",
        { x: (i: number) => (i % 2 ? 22 : -22), opacity: 0.3 },
        {
          x: wrong ? (i: number) => (i % 2 ? 12 : -12) : 0,
          opacity: 1,
          duration: wrong ? 0.24 : 0.6,
          repeat: wrong ? 1 : 0,
          yoyo: !!wrong,
          ease: "power2.inOut",
        },
      );
    }, ref);
    const t = setTimeout(() => setSettledAttempt(attempt), calm ? 0 : 620);
    return () => {
      ctx.revert();
      clearTimeout(t);
    };
  }, [attempt, source, open, calm, result, wrong]);
  useEffect(() => {
    if (!open || !settled || !reading || !sound || !result) return;
    const token = attempt + ":" + reading.id;
    if (heard.current === token) return;
    heard.current = token;
    voice.play(reading.id);
    return () => voice.stop();
  }, [
    attempt,
    reading?.id,
    sound,
    open,
    settled,
    result,
    voice.play,
    voice.stop,
  ]);
  const chosen = targets[target],
    duplicate = state.joinsUsed.includes(`${source}:${chosen.right}:${key}`),
    canConfirm = !busy && state.AH >= 1 && !duplicate;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={"Join this with…"}
      size="lg"
      initialFocus="[data-source-column]"
      footer={
        <div className={`${s.sheet} ${s.joinStickyFooter}`}>
          <div className={s.joinFooterActions}>
            <button
              className={duplicate ? s.primary : undefined}
              onClick={onClose}
            >
              Return to the audit
            </button>
            <button
              className={duplicate ? undefined : s.primary}
              disabled={!canConfirm}
              onClick={() =>
                void onJoin({
                  type: "JOIN",
                  left: source,
                  right: chosen.right,
                  key,
                })
              }
            >
              Confirm join · 1 audit hour
            </button>
          </div>
          <div className={s.conversationSecondary}>
            <button
              onClick={() =>
                ref.current
                  ?.querySelector<HTMLElement>("[data-source-column]")
                  ?.focus()
              }
            >
              Change columns
            </button>
            <button onClick={onGuide}>Replay join guide</button>
            <button
              role="switch"
              aria-label="Dialogue sound"
              aria-checked={sound}
              onClick={onSound}
            >
              Sound: {sound ? "On" : "Off"}
            </button>
            <button
              role="switch"
              aria-label="Ambient sound"
              aria-checked={ambient}
              onClick={onAmbient}
            >
              Ambient: {ambient ? "On" : "Off"}
            </button>
          </div>
        </div>
      }
    >
      <div
        ref={ref}
        className={`${s.sheet} ${s.joinPicker}`}
        data-join-picker=""
      >
        <p className={s.eyebrow}>SOURCE → TARGET → REVIEW → CONFIRM</p>
        <p>
          Match rows that describe the same thing. Nothing is charged until you
          confirm.
        </p>
        <div className={s.joinPickerColumns}>
          <fieldset>
            <legend>
              {drawers.find((d) => d.id === source)!.title} · source column
            </legend>
            {sourceColumns(source).map((column) => (
              <button
                type="button"
                key={column}
                data-source-column=""
                draggable={!busy}
                aria-pressed={key === column}
                onClick={() => setKey(column)}
                onDragStart={(e) => {
                  setKey(column);
                  e.dataTransfer.setData("text/plain", column);
                }}
              >
                {column}
                <small>
                  {column === "request_id"
                    ? "One request"
                    : column === "account_id"
                      ? "One account"
                      : "One customer"}
                </small>
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Join to · target dataset / column</legend>
            {targets.map((t, i) => (
              <button
                type="button"
                key={t.right}
                disabled={
                  busy ||
                  (t.right === "billing" && !state.opened.includes("billing"))
                }
                aria-pressed={target === i}
                onClick={() => setTarget(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const column = e.dataTransfer.getData("text/plain");
                  if (sourceColumns(source).some((k) => k === column)) {
                    setKey(column as JoinAction["key"]);
                    setTarget(i);
                  }
                }}
              >
                <strong>{t.title}</strong>
                <code>{t.key}</code>
                <small>
                  {t.detail}
                  {t.right === "billing" && !state.opened.includes("billing")
                    ? " Open the billing drawer first."
                    : ""}
                </small>
              </button>
            ))}
          </fieldset>
        </div>
        <div className={s.joinReview}>
          <span>
            {source} · <b>{key}</b>
          </span>
          <span aria-hidden="true">→</span>
          <span>
            {chosen.right} · <b>{chosen.key}</b>
          </span>
          <p>
            {key === chosen.key
              ? "Do both columns identify the same entity? Confirm to test the match."
              : "These identifiers describe different entities. This check may return no shared key."}
          </p>
        </div>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        {duplicate && (
          <p className={s.muted}>
            Already checked. Review the reading below or choose different
            columns; no extra hour is needed.
          </p>
        )}
        {result && (
          <section
            className={s.joinFeedback}
            ref={feedbackRef}
            data-success={!wrong}
            role="status"
          >
            <div className={s.joinPickerColumns}>
              <div data-join-row="">
                <code>{last?.split(":")[2]}</code>
                <small>Source rows</small>
              </div>
              <div data-join-row="">
                <strong>
                  {wrong ? "No shared key" : "Matching rows aligned"}
                </strong>
                <small>
                  {wrong
                    ? "Identifiers refer to different entities."
                    : "A checkable link between the two datasets."}
                </small>
              </div>
            </div>
            <p>{settled ? result : "Aligning the rows…"}</p>
            {settled && reading && <blockquote>{reading.text}</blockquote>}
            <small>1 audit hour spent · {state.AH} hours remain.</small>
            {settled && reading && (
              <button onClick={() => voice.play(reading.id)}>
                Replay reading
              </button>
            )}
          </section>
        )}
      </div>
    </Dialog>
  );
}
