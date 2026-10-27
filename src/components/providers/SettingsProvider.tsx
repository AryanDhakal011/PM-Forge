"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MOTION_STORAGE_KEY,
  resolveMotionPrefs,
  writeStoredMotion,
  type StoredMotion,
} from "@/lib/motionPrefs";

type Settings = {
  reducedMotion: boolean;
  osReducedMotion: boolean;
  sound: boolean;
  haptics: boolean;
  hapticsSupported: boolean;
  toggleReducedMotion: () => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  playCue: (cue: "tick" | "paper" | "chime" | "error") => void;
  vibrate: (pattern?: number | number[]) => void;
};

const SettingsContext = createContext<Settings | null>(null);

const STORAGE = {
  sound: "pmforge.sound",
  haptics: "pmforge.haptics",
};

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is an enhancement; private mode must not break settings.
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [osReducedMotion, setOsReducedMotion] = useState(false);
  const [storedMotion, setStoredMotion] = useState<StoredMotion>(null);
  const [sound, setSound] = useState(false);
  const [haptics, setHaptics] = useState(false);
  const [hapticsSupported, setHapticsSupported] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // Either source can reduce motion. A stored "full" never overrides the OS.
  const reducedMotion = osReducedMotion || storedMotion === "reduce";

  useEffect(() => {
    const prefs = resolveMotionPrefs();
    setOsReducedMotion(prefs.osReduced);
    setStoredMotion(prefs.stored);
    if (prefs.stored && readStorage(MOTION_STORAGE_KEY) === null) {
      writeStoredMotion(prefs.stored);
    }

    setSound(readStorage(STORAGE.sound) === "on");
    setHaptics(readStorage(STORAGE.haptics) === "on");
    setHapticsSupported(
      typeof navigator !== "undefined" && "vibrate" in navigator,
    );

    const prefers = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => {
      setOsReducedMotion(event.matches);
    };
    prefers.addEventListener("change", onChange);
    return () => prefers.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  const toggleReducedMotion = useCallback(() => {
    // The system preference is the floor; the footer switch cannot turn it off.
    if (osReducedMotion) return;
    setStoredMotion((prev) => {
      const next: Exclude<StoredMotion, null> =
        prev === "reduce" ? "full" : "reduce";
      writeStoredMotion(next);
      return next;
    });
  }, [osReducedMotion]);

  const toggleSound = useCallback(() => {
    setSound((prev) => {
      const next = !prev;
      writeStorage(STORAGE.sound, next ? "on" : "off");
      if (next) {
        // Create the audio context inside the user gesture that enabled it.
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (Ctx && !audioRef.current) audioRef.current = new Ctx();
        void audioRef.current?.resume();
      }
      return next;
    });
  }, []);

  const toggleHaptics = useCallback(() => {
    setHaptics((prev) => {
      const next = !prev;
      writeStorage(STORAGE.haptics, next ? "on" : "off");
      return next;
    });
  }, []);

  const playCue = useCallback(
    (cue: "tick" | "paper" | "chime" | "error") => {
      if (!sound) return;
      try {
        const ctx =
          audioRef.current ??
          new AudioContext({
            latencyHint: "interactive",
          });
        audioRef.current = ctx;
        void ctx.resume();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        const frequencies = {
          tick: [1180, 0.035, 0.035],
          paper: [320, 0.07, 0.05],
          chime: [523.25, 0.42, 0.06],
          error: [196, 0.18, 0.045],
        } as const;
        const [freq, duration, volume] = frequencies[cue];
        const osc = ctx.createOscillator();
        osc.type = cue === "paper" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now);
        if (cue === "chime") {
          const second = ctx.createOscillator();
          second.type = "sine";
          second.frequency.setValueAtTime(freq * 1.5, now + 0.06);
          const secondGain = ctx.createGain();
          secondGain.gain.setValueAtTime(0, now);
          secondGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.06);
          secondGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
          second.connect(secondGain).connect(ctx.destination);
          second.start(now + 0.06);
          second.stop(now + duration);
        }
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + duration);
      } catch {
        // Sound is an enhancement; never block an interaction.
      }
    },
    [sound],
  );

  const vibrate = useCallback(
    (pattern: number | number[] = 24) => {
      if (!haptics) return;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    },
    [haptics],
  );

  const value = useMemo(
    () => ({
      reducedMotion,
      osReducedMotion,
      sound,
      haptics,
      hapticsSupported,
      toggleReducedMotion,
      toggleSound,
      toggleHaptics,
      playCue,
      vibrate,
    }),
    [
      reducedMotion,
      osReducedMotion,
      sound,
      haptics,
      hapticsSupported,
      toggleReducedMotion,
      toggleSound,
      toggleHaptics,
      playCue,
      vibrate,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return value;
}
