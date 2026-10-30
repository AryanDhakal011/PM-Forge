"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, DeadlockState, Metrics } from "@/lib/deadlock/types";
import s from "./Deadlock.module.css";
export type SceneProps = {
  state: DeadlockState;
  dispatch: (a: Action) => void;
  busy: boolean;
  paused: boolean;
  calm: boolean;
  caption: (id: string, onEnd?: () => void) => void;
  preview: (m?: Metrics) => void;
};
export type Preferences = {
  mode: "silent" | "sound" | "listen";
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
  voice: "device",
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
  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("pmforge.deadlock.settings.v1") || "null",
      );
      if (p) setPrefs({ ...defaultPreferences, ...p });
    } catch {}
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
  return { prefs, update };
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
  lever = false,
  disabled = false,
  onCommit,
}: {
  label: string;
  lever?: boolean;
  disabled?: boolean;
  onCommit: () => void;
}) {
  const [armed, setArmed] = useState(false),
    [distance, setDistance] = useState(0);
  const y = useRef(0),
    timer = useRef(0),
    done = useRef(false);
  const commitButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (armed) commitButton.current?.focus();
  }, [armed]);
  const commit = () => {
    if (done.current || disabled) return;
    done.current = true;
    clearTimeout(timer.current);
    setArmed(false);
    setDistance(0);
    onCommit();
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className={s.row}>
      <button
        className={s.button}
        disabled={disabled}
        aria-pressed={armed}
        onClick={() => {
          setArmed(!armed);
          done.current = false;
        }}
      >
        {" "}
        {armed ? "GUARD OPEN" : "FLIP GUARD"}
      </button>
      {armed && (
        <button
          ref={commitButton}
          className={s.guardButton}
          disabled={disabled}
          aria-label={label}
          style={
            lever
              ? { transform: `translateY(${Math.min(distance, 20)}px)` }
              : undefined
          }
          onClick={(e) => {
            if (!lever || e.detail === 0) commit();
          }}
          onPointerDown={(e) => {
            if (!lever) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            y.current = e.clientY;
            done.current = false;
            if (e.pointerType === "touch")
              timer.current = window.setTimeout(commit, 600);
          }}
          onPointerMove={(e) => {
            if (!lever || !e.currentTarget.hasPointerCapture(e.pointerId))
              return;
            const d = Math.max(0, e.clientY - y.current);
            setDistance(d);
            if (d >= 80) commit();
          }}
          onPointerUp={() => {
            clearTimeout(timer.current);
            setDistance(0);
          }}
          onPointerCancel={() => {
            clearTimeout(timer.current);
            setDistance(0);
          }}
        >
          {label}
          {lever && <small> ↓ pull · hold · Enter</small>}
        </button>
      )}
    </div>
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
  const nodes = useRef<AudioNodes | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoices(speechSynthesis.getVoices());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      speechSynthesis.cancel();
    };
  }, []);
  const unlock = () => {
    if (nodes.current) {
      void nodes.current.context.resume().catch(() => {});
      return;
    }
    try {
      const context = new AudioContext();
      const ambient = context.createGain(),
        fx = context.createGain();
      ambient.gain.value = 0;
      fx.gain.value = 0.04;
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
    } catch {
      /* Captions remain the primary playback path. */
    }
  };
  useEffect(() => {
    const n = nodes.current;
    if (n) {
      n.ambient.gain.setTargetAtTime(
        paused || prefs.mode === "silent"
          ? 0
          : prefs.music *
              (pressure >= 60 ? 0.013 : pressure >= 40 ? 0.009 : 0.006),
        n.context.currentTime,
        0.4,
      );
      n.fx.gain.value = prefs.effects * (prefs.calm ? 0.035 : 0.06);
      if (paused) void n.context.suspend().catch(() => {});
      else void n.context.resume().catch(() => {});
    }
    if ("speechSynthesis" in window) {
      if (paused) speechSynthesis.pause();
      else speechSynthesis.resume();
    }
  }, [paused, prefs, pressure]);
  useEffect(
    () => () => {
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
    onEnd?: () => void,
  ) => {
    if (
      (prefs.mode === "silent" && !force) ||
      prefs.voice === "off" ||
      (!prefs.characters && speaker !== "CONTROL") ||
      !("speechSynthesis" in window)
    ) {
      onEnd?.();
      return;
    }
    speechSynthesis.cancel();
    // A voice test or explicit replay is allowed while the room is paused.
    if (force && speechSynthesis.paused) speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance(
      speaker === "CONTROL" ? text : `${speaker}. ${text}`,
    );
    u.rate = Math.max(0.8, Math.min(1.4, prefs.rate));
    u.volume = Math.max(0, Math.min(1, prefs.narration));
    u.voice =
      voices.find((v) => v.voiceURI === prefs.voice) ||
      voices.find((v) =>
        /zira|aria|jenny|samantha|victoria|karen|moira|female/i.test(v.name),
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    const n = nodes.current;
    if (n) n.ambient.gain.setTargetAtTime(0.001, n.context.currentTime, 0.1);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (n)
        n.ambient.gain.setTargetAtTime(
          prefs.mode === "silent" || paused ? 0 : prefs.music * 0.008,
          n.context.currentTime,
          0.4,
        );
      if (force && paused) {
        speechSynthesis.pause();
        if (n) void n.context.suspend().catch(() => {});
      }
      onEnd?.();
    };
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
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
  return { unlock, speak, effect, voices };
}
