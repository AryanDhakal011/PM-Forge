"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useSettings } from "@/components/providers/SettingsProvider";
/** Card remains a native link, including new-tab and modified-click behavior. */
export function ProjectEntryLink({ href, className, children, label, animate }: { href: string; className: string; children: ReactNode; label: string; animate: boolean }) {
  const router = useRouter(), { reducedMotion } = useSettings();
  const owned = useRef<{ ctx: gsap.Context; clone: HTMLElement } | null>(null);
  useEffect(() => () => { owned.current?.ctx.revert(); owned.current?.clone.remove(); }, []);
  return <Link href={href} className={className} aria-label={label} onClick={e => {
    if (!animate || reducedMotion || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    try { if (localStorage.getItem("pmforge.trojan.calm") === "on") return; } catch { /* Optional setting. */ }
    const card = e.currentTarget.closest<HTMLElement>("article"); if (!card || owned.current) return;
    e.preventDefault(); gsap.registerPlugin(Flip);
    const rect = card.getBoundingClientRect(), clone = card.cloneNode(true) as HTMLElement;
    clone.removeAttribute("id"); clone.setAttribute("aria-hidden", "true"); clone.dataset.trojanTransition = "true";
    Object.assign(clone.style, { position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", zIndex: "3000", pointerEvents: "none", overflow: "hidden", borderRadius: "16px" });
    document.body.appendChild(clone);
    const ctx = gsap.context(() => { const snapshot = Flip.getState(clone); Object.assign(clone.style, { left: "0px", top: "0px", width: "100vw", height: "100dvh", borderRadius: "0" }); Flip.from(snapshot, { duration: .7, scale: true, ease: "power2.inOut", onComplete: () => router.push(href) }); gsap.to(clone, { backgroundColor: "#140d1d", color: "#f6eef4", duration: .6 }); });
    owned.current = { ctx, clone };
  }}>{children}</Link>;
}
