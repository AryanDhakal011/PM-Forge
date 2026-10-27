"use client";

import { useCallback, useRef } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";

export function Magnetic({
  children,
  strength = 7,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useSettings();

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      node.style.transform = `translate3d(${x * strength}px, ${y * strength * 0.7}px, 0)`;
    },
    [reducedMotion, strength],
  );

  const onLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.transition = "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    node.style.transform = "translate3d(0,0,0)";
    window.setTimeout(() => {
      if (node) node.style.transition = "";
    }, 430);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ display: "inline-flex", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
