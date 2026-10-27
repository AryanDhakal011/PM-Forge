"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import styles from "./PencilCursor.module.css";

export function PencilCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useSettings();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine && !reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!dot || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const points: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      const target = event.target as HTMLElement | null;
      const isField = target?.closest("input, textarea, select, [contenteditable='true']");
      dot.dataset.hidden = isField ? "true" : "false";
      points.push({ x: targetX, y: targetY, t: performance.now() });
      if (points.length > 44) points.shift();
    };

    const render = () => {
      frame += 1;
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      dot.style.transform = `translate3d(${currentX - 3}px, ${currentY - 3}px, 0)`;

      if (frame % 2 === 0) {
        const now = performance.now();
        while (points.length && now - points[0].t > 620) points.shift();
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (points.length > 1) {
          ctx.beginPath();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "rgba(143, 70, 53, 0.34)";
          ctx.lineWidth = 1.1;
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i += 1) {
            const previous = points[i - 1];
            const point = points[i];
            const midX = (previous.x + point.x) / 2;
            const midY = (previous.y + point.y) / 2;
            ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
          }
          ctx.stroke();
        }
      }

      raf = window.requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} className={styles.trail} aria-hidden="true" />
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
    </>
  );
}
