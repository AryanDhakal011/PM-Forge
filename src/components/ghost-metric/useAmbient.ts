"use client";
import { useEffect, useRef, useState } from "react";
import { ghostSpeakers } from "./useVoice";
export function useAmbient(enabled: boolean, paused: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null),
    [status, setStatus] = useState<"ready" | "playing" | "unavailable">(
      "ready",
    );
  useEffect(() => {
    if (!enabled || paused) return;
    const a = new Audio("/ghost-metric/audio/lab-ambient.wav");
    a.loop = true;
    a.volume = 0.045;
    audio.current = a;
    let live = true;
    const duck = () => {
      a.volume = ghostSpeakers.size ? 0.009 : 0.045;
    };
    const voice = () => duck();
    duck();
    const start = () => {
      if (document.hidden) return;
      void a
        .play()
        .then(() => {
          if (live) setStatus("playing");
        })
        .catch(() => {
          if (live) setStatus("ready");
        });
    };
    const visibility = () => {
      if (document.hidden) {
        a.pause();
        setStatus("ready");
      } else start();
    };
    a.onerror = () => {
      if (live) setStatus("unavailable");
    };
    document.addEventListener("pointerdown", start, { once: true });
    document.addEventListener("keydown", start, { once: true });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pmforge:ghost-voice", voice);
    start();
    return () => {
      live = false;
      a.pause();
      a.src = "";
      audio.current = null;
      setStatus("ready");
      window.removeEventListener("pmforge:ghost-voice", voice);
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled, paused]);
  return status;
}
