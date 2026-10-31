"use client";
import { useCallback, useEffect, useRef, useState, useId } from "react";
import manifest from "../../../content/projects/ghost-metric/audio-manifest.json";
type Clip = { file: string; signature: string };
export const ghostSpeakers = new Set<string>();
export function useVoice(sound: boolean, paused: boolean) {
  const id = useId();
  const announce = useCallback(
    (playing: boolean) => {
      if (playing) ghostSpeakers.add(id);
      else ghostSpeakers.delete(id);
      window.dispatchEvent(
        new CustomEvent("pmforge:ghost-voice", { detail: { id, playing } }),
      );
    },
    [id],
  );
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
    announce(false);
  }, [announce]);
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
          announce(false);
          setStatus("");
          onEnded?.();
        }
      };
      a.onerror = () => {
        if (g === generation.current) {
          setPlaying(false);
          announce(false);
          setStatus(
            "Recording unavailable. Captions remain available; try Replay.",
          );
        }
      };
      a.onplaying = () => {
        if (g === generation.current) {
          setPlaying(true);
          announce(true);
        }
      };
      void a.play().catch(() => {
        if (g === generation.current) {
          setPlaying(false);
          announce(false);
          setStatus(
            "Tap Replay to hear the recording. You can continue reading.",
          );
        }
      });
    },
    [sound, stop, announce],
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
      announce(false);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [stop]);
  return { play, stop, status, playing };
}
