"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSettings } from "@/components/providers/SettingsProvider";
import { setScrollInstance, scrollToSection } from "@/lib/scrollTo";

/**
 * One scroll authority for the whole site: Lenis for input smoothing and
 * GSAP ScrollTrigger for the scroll-linked scenes. Both are skipped when the
 * visitor asks for reduced motion.
 */
export function SmoothScroll() {
  const { reducedMotion } = useSettings();
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (reducedMotion) {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      setScrollInstance(null);
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      anchors: false,
    });

    setScrollInstance(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    const refreshSoon = window.setTimeout(refresh, 600);

    // Dialog and menu locking already set this class; keep Lenis in sync.
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("no-scroll")) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.clearTimeout(refreshSoon);
      observer.disconnect();
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setScrollInstance(null);
    };
  }, [reducedMotion]);

  useEffect(() => {
    // Same-page anchors use Lenis instead of a native jump.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      if (href.startsWith("/#") && window.location.pathname === "/") {
        const id = href.slice(2);
        if (!id) return;
        event.preventDefault();
        scrollToSection(id, reducedMotion ? "auto" : "smooth");
        return;
      }

      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      if (!id) return;
      event.preventDefault();
      scrollToSection(id, reducedMotion ? "auto" : "smooth");
      if (id === "main") {
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reducedMotion]);

  const pendingHash = pathname;

  useEffect(() => {
    // Route changes to a hash (for example /#blueprint from another page)
    // need a moment for the target section to paint.
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    let attempts = 0;
    let timer = 0;
    let initialScroll: number | null = null;
    let cancelled = false;
    const tryScroll = () => {
      const exists = document.getElementById(hash === "top" ? "hero" : hash);
      if (exists) {
        scrollToSection(hash, "auto");
        initialScroll = window.scrollY;
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = window.setTimeout(tryScroll, 80);
    };
    timer = window.setTimeout(tryScroll, 120);

    // Late-loading fonts and images can move a deep-linked section. Re-anchor
    // once, but only if the visitor has not started scrolling themselves.
    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (cancelled || initialScroll === null) return;
        if (Math.abs(window.scrollY - initialScroll) > 80) return;
        ScrollTrigger.refresh();
        scrollToSection(hash, "auto");
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingHash, reducedMotion]);

  return null;
}
