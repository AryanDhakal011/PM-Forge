"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, DeadlockState, Metrics } from "@/lib/deadlock/types";
import s from "./Deadlock.module.css";
import { audioManifest } from "@/lib/deadlock/content";
export type SceneProps = {
  state: DeadlockState;
  dispatch: (a: Action) => void;
  busy: boolean;
  paused: boolean;
  calm: boolean;
  caption: (id: string, onEnd?: (played?: boolean) => void) => void;
  autoAdvance?: boolean;
  sound?: boolean;
  toggleSound?: () => void;
  voiceRevision?: number;
  preview: (m?: Metrics) => void;
};
export type Preferences = {
  mode: "silent" | "sound" | "listen";
  autoAdvance: boolean;
  skipGuides: boolean;
  voice: string;
  characters: boolean;
  rate: number;
  narration: number;
  effects: number;
  music: number;
  calm: boolean;
  motion: boolean;
  contrast: boolean;
  haptics: boolean;
  captionSize: "normal" | "large";
  textSize: "normal" | "large";
  tier: "auto" | "A" | "B" | "C";
};
export const defaultPreferences: Preferences = {
  mode: "silent",
  autoAdvance: false,
  skipGuides: false,
  voice: "recorded",
  characters: true,
  rate: 1,
  narration: 1,
  effects: 0.7,
  music: 0.45,
  calm: false,
  motion: false,
  contrast: false,
  haptics: false,
  captionSize: "normal",
  textSize: "normal",
  tier: "auto",
};
export function usePreferences() {
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("pmforge.deadlock.settings.v1") || "null",
      );
      if (p)
        setPrefs({
          ...defaultPreferences,
          ...p,
          mode: p.mode === "listen" ? "sound" : p.mode,
        });
    } catch {}
    setReady(true);
  }, []);
  const update = useCallback(
    (p: Partial<Preferences>) =>
      setPrefs((current) => {
        const next = { ...current, ...p };
        try {
          localStorage.setItem(
            "pmforge.deadlock.settings.v1",
            JSON.stringify(next),
          );
        } catch {}
        return next;
      }),
    [],
  );
  return { prefs, update, ready };
}
export function useVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
export function useClock(
  duration: number,
  paused: boolean,
  onDone: () => void,
) {
  const callback = useRef(onDone),
    [elapsed, setElapsed] = useState(0),
    spent = useRef(0);
  callback.current = onDone;
  useEffect(() => {
    if (paused) return;
    let last = performance.now(),
      frame = 0,
      active = true;
    const tick = (now: number) => {
      // A rAF timestamp may precede performance.now() from this same frame.
      // Timers must remain monotonic, including their first painted sample.
      spent.current += Math.max(0, now - last);
      last = now;
      if (!active) return;
      setElapsed(Math.min(duration, Math.floor(spent.current / 100) * 100));
      if (spent.current >= duration) {
        callback.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [paused, duration]);
  return elapsed;
}
export function GuardControl({
  label,
  disabled = false,
  onCommit,
}: {
  label: string;
  lever?: boolean;
  disabled?: boolean;
  onCommit: () => void;
}) {
  return (
    <button className={s.brassButton} disabled={disabled} onClick={onCommit}>
      {label}
    </button>
  );
}
type AudioNodes = {
  context: AudioContext;
  ambient: GainNode;
  fx: GainNode;
  oscillators: OscillatorNode[];
};
export function useAudio(
  prefs: Preferences,
  paused: boolean,
  pressure: number,
) {
  const nodes = useRef<AudioNodes | null>(null),
    player = useRef<HTMLAudioElement | null>(null),
    generation = useRef(0);
  const [status, setStatus] = useState("");
  const latest = useRef({ prefs, paused });
  latest.current = { prefs, paused };
  const clearSpeaker = () => {
    delete document.documentElement.dataset.deadlockSpeaker;
  };
  const stop = () => {
    generation.current++;
    if (player.current) {
      player.current.pause();
      player.current.onended = null;
      player.current.onerror = null;
      player.current = null;
    }
    clearSpeaker();
  };
  const unlock = () => {
    if (nodes.current) {
      void nodes.current.context.resume().catch(() => {});
      return;
    }
    try {
      const context = new AudioContext(),
        ambient = context.createGain(),
        fx = context.createGain();
      ambient.gain.value = 0;
      fx.gain.value = 0.03;
      ambient.connect(context.destination);
      fx.connect(context.destination);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 180;
      filter.connect(ambient);
      const oscillators = [55, 55.6, 82.5].map((f) => {
        const o = context.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(filter);
        o.start();
        return o;
      });
      nodes.current = { context, ambient, fx, oscillators };
      void context.resume().catch(() => {});
    } catch {}
  };
  useEffect(() => {
    const n = nodes.current;
    if (n) {
      n.ambient.gain.setTargetAtTime(
        paused || prefs.mode === "silent" ? 0 : prefs.music * 0.005,
        n.context.currentTime,
        0.3,
      );
      n.fx.gain.value = prefs.effects * 0.035;
      if (paused) void n.context.suspend().catch(() => {});
      else void n.context.resume().catch(() => {});
    }
    const a = player.current;
    if (a) {
      a.volume =
        prefs.mode === "silent" || !prefs.characters ? 0 : prefs.narration;
      a.playbackRate = prefs.rate;
      if (paused) {
        a.pause();
        clearSpeaker();
      } else if (a.paused && !a.ended)
        void a
          .play()
          .catch(() => setStatus("Audio is paused. Use Replay to start it."));
    }
  }, [paused, prefs, pressure]);
  useEffect(
    () => () => {
      stop();
      const n = nodes.current;
      if (n) {
        n.oscillators.forEach((o) => o.stop());
        void n.context.close();
      }
    },
    [],
  );
  const speak = (
    text: string,
    speaker = "CONTROL",
    force = false,
    onEnd?: (played?: boolean) => void,
    id?: string,
  ) => {
    stop();
    setStatus("");
    const p = latest.current.prefs;
    if (!force && (p.mode === "silent" || !p.characters)) {
      onEnd?.(false);
      return;
    }
    const entry = id
      ? audioManifest.lines[id]
      : Object.values(audioManifest.lines).find(
          (l) => l.caption === text && l.speaker === speaker,
        );
    if (!entry?.file) {
      setStatus("This line is available as captions.");
      onEnd?.(false);
      return;
    }
    const ticket = generation.current,
      a = new Audio(
        entry.file +
          (entry.signature ? "?v=" + entry.signature.slice(0, 12) : ""),
      );
    player.current = a;
    a.preload = "auto";
    a.volume = p.narration;
    a.playbackRate = p.rate;
    let finished = false;
    const finish = (played: boolean) => {
      if (finished || ticket !== generation.current) return;
      finished = true;
      clearSpeaker();
      if (!played)
        setStatus(
          "Audio could not load. Your place is saved; read the caption or Replay.",
        );
      onEnd?.(played);
    };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    a.onplaying = () => {
      document.documentElement.dataset.deadlockSpeaker = speaker;
    };
    if (!latest.current.paused || force)
      void a.play().catch(() => finish(false));
  };
  const effect = (kind: "slam" | "tick" | "gold" | "alarm" = "slam") => {
    const n = nodes.current;
    if (!n || prefs.mode === "silent") return;
    const frequencies =
      kind === "gold"
        ? [880, 1320, 1760]
        : kind === "alarm"
          ? [660, 880]
          : kind === "tick"
            ? [2400]
            : [60, 110];
    for (const [i, f] of frequencies.entries()) {
      const o = n.context.createOscillator(),
        g = n.context.createGain();
      o.type = kind === "alarm" ? "square" : "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(n.fx);
      g.gain.setValueAtTime(0.2, n.context.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        n.context.currentTime + (kind === "gold" ? 1.4 : 0.15) + i * 0.02,
      );
      o.start();
      o.stop(n.context.currentTime + 1.5);
    }
    if (prefs.haptics && navigator.vibrate)
      navigator.vibrate(kind === "alarm" ? 24 : 12);
  };

  return { unlock, speak, effect, stop, status };
}
