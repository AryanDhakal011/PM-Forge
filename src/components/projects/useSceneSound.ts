"use client";
import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
export function useSceneSound(enabled: boolean, paused: boolean, speaking: boolean, track: "terminal" | "heartbeat" | "quiet") {
  const bed = useRef<HTMLAudioElement | null>(null), effect = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!enabled || track === "quiet") return;
    const a = new Audio(`/projects/invisible-wall/audio/${track === "heartbeat" ? "heartbeat" : "party"}-bed.wav`); a.loop = true; a.volume = .12; bed.current = a;
    const start = () => { if (!document.hidden && !paused) void a.play().catch(() => {}); };
    start(); window.addEventListener("pointerdown", start, { once: true }); window.addEventListener("keydown", start, { once: true });
    return () => { a.pause(); a.removeAttribute("src"); a.load(); bed.current = null; window.removeEventListener("pointerdown", start); window.removeEventListener("keydown", start); };
  }, [enabled, track]);
  useEffect(() => {
    const a = bed.current; if (!a) return;
    const update = () => { if (paused || document.hidden) a.pause(); else void a.play().catch(() => {}); };
    update(); document.addEventListener("visibilitychange", update);
    const ctx = gsap.context(() => { gsap.to(a, { volume: speaking ? .025 : .12, duration: .3 }); });
    return () => { ctx.revert(); document.removeEventListener("visibilitychange", update); };
  }, [enabled, speaking, paused, track]);
  useEffect(() => { if (!enabled || paused) { const a = effect.current; if (a) { a.onended = null; a.pause(); a.removeAttribute("src"); a.load(); } effect.current = null; } }, [enabled, paused]);
  useEffect(() => () => { const a = effect.current; if (a) { a.onended = null; a.pause(); a.removeAttribute("src"); a.load(); } effect.current = null; }, []);
  const cue = useCallback((name: "tick" | "paper" | "chime" | "error" | "shatter" | "footsteps" | "hum") => {
    if (!enabled || paused) return;
    const old = effect.current; if (old) { old.onended = null; old.pause(); old.removeAttribute("src"); old.load(); }
    const a = new Audio(`/projects/invisible-wall/audio/${name}.wav`); a.volume = .3; effect.current = a;
    const release = () => { a.onended = null; a.removeAttribute("src"); a.load(); if (effect.current === a) effect.current = null; };
    a.onended = release; void a.play().catch(release);
  }, [enabled, paused]);
  return cue;
}
