"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "./state";

let lenis: Lenis | null = null;
let started = false;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;

export function startLandingTicker() {
  if (started || typeof window === "undefined") return () => {};
  started = true;
  gsap.registerPlugin(ScrollTrigger);
  motion.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  motion.tier = coarse || cores <= 4 || memory <= 4 ? "mid" : "high";
  if (motion.reduced) motion.tier = "low";

  const tickLenis=(time:number)=>lenis?.raf(time*1000);
  if (!motion.reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tickLenis);
  }
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lastScroll = window.scrollY;
  const update = () => {
    const nextScroll = lenis?.scroll ?? window.scrollY;
    const velocity = nextScroll - lastScroll;
    motion.scroll = nextScroll;
    motion.velocity = motion.velocity * 0.82 + velocity * 0.18;
    if (Math.abs(velocity) > 0.5) motion.direction = Math.sign(velocity);
    lastScroll = nextScroll;
  };
  gsap.ticker.add(update);

  const pointer = (event: PointerEvent) => {
    motion.mouse.x = event.clientX;
    motion.mouse.y = event.clientY;
    motion.mouse.nx = event.clientX / window.innerWidth * 2 - 1;
    motion.mouse.ny = event.clientY / window.innerHeight * 2 - 1;
  };
  window.addEventListener("pointermove", pointer, { passive: true });

  const resize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  window.addEventListener("resize", resize, { passive: true });

  const visibility = () => {
    document.title = document.hidden ? "Come back. A decision is waiting." : "PMForge - Practice product judgment";
  };
  document.addEventListener("visibilitychange", visibility);

  return () => {
    window.removeEventListener("pointermove", pointer);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    gsap.ticker.remove(update);
    gsap.ticker.remove(tickLenis);
    lenis?.destroy();
    lenis = null;
    started = false;
  };
}

