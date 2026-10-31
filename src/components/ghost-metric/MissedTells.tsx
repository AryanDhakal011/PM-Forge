"use client";
import { useEffect, useState } from "react";
import type { DrawerId } from "@/lib/ghost-metric/content";
import { conversation } from "@/lib/ghost-metric/dialogue";
import { useVoice } from "./useVoice";
import s from "./GhostMetric.module.css";
const tells = [
  {
    id: "billing",
    title: "The commercial mismatch",
    tag: "BILLING",
    line: "billing",
    text: "Revenue per call fell while the call count rose; this discrepancy deserved a definition check.",
    callback: "Calls +340% / revenue per call −71%",
  },
  {
    id: "sdk",
    title: "A chunk became a call",
    tag: "SDK RELEASE NOTE",
    line: "sdk",
    text: "A small release changed the counted unit: pieces of one response became separate calls.",
    callback: "request 6b1 → chunk 1 · chunk 2 · chunk 3",
  },
  {
    id: "tickets",
    title: "Waiting looked like growth",
    tag: "SUPPORT",
    line: "tickets",
    text: "Timeout complaints explained how a worse customer experience could produce a higher activity number.",
    callback: "“Still waiting. The client retried automatically.”",
  },
  {
    id: "joyce",
    title: "“Probably nothing”",
    tag: "THE ORIGINAL DM",
    line: "invitation",
    text: "Joyce was asking for a safe investigation, not certifying that the number was fine.",
    callback: "“Now, can you look at something? It’s probably nothing.”",
  },
] as const;
export default function MissedTells({
  opened,
  sound,
  paused,
}: {
  opened: DrawerId[];
  sound: boolean;
  paused: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const voice = useVoice(sound, paused),
    tell = active === null ? null : tells[active],
    line = tell ? conversation(tell.line)[0] : undefined;
  useEffect(() => {
    if (line && !paused && sound) voice.play(line.id);
    return () => voice.stop();
  }, [line?.id, sound, paused, voice.play, voice.stop]);
  return (
    <section className={s.missedTells} aria-labelledby="missed-tells-title">
      <div className={s.sectionEnd}>
        <div>
          <p className={s.eyebrow}>THE SIGNALS THAT WERE THERE</p>
          <h3 id="missed-tells-title">What I could have noticed</h3>
        </div>
        <button
          onClick={() =>
            setActive(
              Math.max(
                0,
                tells.findIndex(
                  (t) => t.id !== "joyce" && !opened.includes(t.id as DrawerId),
                ),
              ),
            )
          }
        >
          Show me the strongest missed signal
        </button>
      </div>
      <div className={s.tellGrid}>
        {tells.map((t, i) => (
          <button
            key={t.id}
            aria-expanded={active === i}
            aria-controls={"tell-" + t.id}
            data-reviewed={
              t.id === "joyce" || opened.includes(t.id as DrawerId)
            }
            onClick={() => setActive(active === i ? null : i)}
          >
            <span className={s.eyebrow}>{t.tag}</span>
            <strong>{t.title}</strong>
            <small>
              {t.id === "joyce"
                ? "Available from the start"
                : opened.includes(t.id as DrawerId)
                  ? "You opened this source"
                  : "Not investigated in this run"}
            </small>
            <span>
              {active === i ? "Close callback −" : "Inspect the tell +"}
            </span>
          </button>
        ))}
      </div>
      {tell && (
        <div
          id={"tell-" + tell.id}
          className={s.tellCallback}
          role="region"
          aria-label={tell.title}
        >
          <span className={s.eyebrow}>REWIND / {tell.tag}</span>
          <code>{tell.callback}</code>
          {tell.id === "billing" && (
            <svg
              viewBox="0 0 300 70"
              aria-label="Call volume rose while revenue per call fell"
              role="img"
            >
              <path d="M10 55L290 10" stroke="#a45205" strokeWidth="3" />
              <path
                d="M10 15L290 58"
                stroke="#77737d"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          )}
          <p>{tell.text}</p>
          {line && (
            <>
              <blockquote>{line.text}</blockquote>
              <button onClick={() => voice.play(line.id)}>
                Replay callback
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
