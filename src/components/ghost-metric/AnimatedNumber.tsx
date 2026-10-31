"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import s from "./GhostMetric.module.css";
export default function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  calm = false,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  calm?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null),
    counter = useRef({ value });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const draw = () => {
      if (ref.current)
        ref.current.textContent =
          counter.current.value.toFixed(decimals) + suffix;
    };
    if (calm || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      counter.current.value = value;
      draw();
      return;
    }
    draw();
    const tween = gsap.to(counter.current, {
      value,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: draw,
      onComplete: draw,
    });
    return () => {
      tween.kill();
    };
  }, [value, decimals, suffix, calm]);
  return (
    <span
      className={s.animatedNumber}
      role="status"
      aria-label={value.toFixed(decimals) + suffix}
      data-number-value={value}
    >
      <span ref={ref} aria-hidden="true">
        {value.toFixed(decimals) + suffix}
      </span>
    </span>
  );
}
