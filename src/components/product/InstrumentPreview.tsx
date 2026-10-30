"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSettings } from "@/components/providers/SettingsProvider";
import { InstrumentDrawing } from "./InstrumentDrawing";
import styles from "./Product.module.css";
const Scene = dynamic(() => import("./WorkspaceInstrument"), { ssr: false });
export default function InstrumentPreview({ calm }: { calm: number }) {
  const { reducedMotion } = useSettings();
  const [desktop, setDesktop] = useState(false);
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(min-width:901px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "100px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={styles.instrument}>
      {desktop && near && !reducedMotion ? (
        <Scene calm={calm} />
      ) : (
        <InstrumentDrawing coverage={calm} />
      )}
    </div>
  );
}
