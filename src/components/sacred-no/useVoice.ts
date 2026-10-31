"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import manifest from "../../../content/projects/sacred-no/audio-manifest.json";
type Clip = { file: string; signature: string };
export function useVoice(sound: boolean, paused: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null),
    generation = useRef(0);
  const [status, setStatus] = useState(""),
    [playing, setPlaying] = useState(false);
  const stop = useCallback(() => {
    generation.current++;
    if (audio.current) {
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    setPlaying(false);
  }, []);
  const play = useCallback(
    (id: string, onEnded?: () => void) => {
      stop();
      if (!sound) {
        setStatus("Sound is off. Captions remain available.");
        return;
      }
      const clip = (manifest.lines as Record<string, Clip>)[id];
      if (!clip) {
        setStatus("Recording unavailable. Read the caption and continue.");
        return;
      }
      const g = generation.current,
        a = new Audio(clip.file + "?v=" + clip.signature.slice(0, 12));
      audio.current = a;
      a.onended = () => {
        if (g === generation.current) {
          setPlaying(false);
          setStatus("");
          onEnded?.();
        }
      };
      a.onerror = () => {
        if (g === generation.current) {
          setPlaying(false);
          setStatus(
            "Recording unavailable. Captions remain available; try Replay.",
          );
        }
      };
      a.onplaying = () => {
        if (g === generation.current) setPlaying(true);
      };
      void a.play().catch(() => {
        if (g === generation.current) {
          setPlaying(false);
          setStatus(
            "Tap Replay to hear the recording. You can continue reading.",
          );
        }
      });
    },
    [sound, stop],
  );
  useEffect(() => {
    if (paused || !sound) stop();
  }, [paused, sound, stop]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      generation.current++;
      audio.current?.pause();
      document.removeEventListener("visibilitychange", hide);
    };
  }, [stop]);
  return { play, stop, status, playing };
}
