"use client";
import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
export function useAtmosphere(enabled: boolean, paused: boolean, speaking: boolean, hangover: boolean) {
  const bed = useRef<HTMLAudioElement | null>(null), effect = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const a = new Audio(`/trojan-horse/audio/${hangover ? "hangover" : "party"}-bed.wav`); a.loop = true; a.volume = .12; bed.current = a;
    const start = () => { if (!document.hidden && !paused) void a.play().catch(() => {}); };
    start(); window.addEventListener("pointerdown", start, { once: true }); window.addEventListener("keydown", start, { once: true });
    return () => { a.pause(); a.removeAttribute("src"); a.load(); bed.current = null; window.removeEventListener("pointerdown", start); window.removeEventListener("keydown", start); };
  }, [enabled, hangover]);
  useEffect(() => {
    const a = bed.current; if (!a) return;
    const update = () => { if (paused || document.hidden) a.pause(); else void a.play().catch(() => {}); };
    update(); document.addEventListener("visibilitychange", update);
    const ctx = gsap.context(() => { gsap.to(a, { volume: speaking ? .025 : .12, duration: .3 }); });
    return () => { ctx.revert(); document.removeEventListener("visibilitychange", update); };
  }, [enabled, speaking, paused, hangover]);
  useEffect(() => () => { const a = effect.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } effect.current = null; }, []);
  const cue = useCallback((name: "tick" | "paper" | "chime" | "error") => {
    if (!enabled || paused) return;
    effect.current?.pause(); const a = new Audio(`/trojan-horse/audio/${name}.wav`); a.volume = .3; effect.current = a; void a.play().catch(() => {});
  }, [enabled, paused]);
  return cue;
}
