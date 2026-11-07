"use client";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { segmentInfo, segments, type Run, type Segment } from "@/lib/trojan-horse/simulation";
import s from "./TrojanHorseSceneRunner.module.css";

export const timelines = new Map<string, gsap.core.Timeline>();
const names: Record<number, string[]> = { 0: ["entrance", "partyOpen"], 1: ["drift"], 2: ["dragSample"], 3: ["roleCard"], 4: ["messageStamp"], 5: ["drawerOpen"], 6: ["lensUse"], 7: ["valveTurn"], 8: ["advanceWeek"], 9: ["messageStamp"], 10: ["tomasCall"], 11: ["segmentDrop"], 12: ["graceGate"], 13: ["composer"], 14: ["screenshot"], 15: ["hangover", "revolt"], 16: ["funding"], 17: ["chip"], 18: ["ledgerWipe", "gardener"] };
export function useSceneMotion(root: React.RefObject<HTMLElement | null>, step: number, still: boolean, paused: boolean, revision: string) {
  useLayoutEffect(() => {
    if (!root.current) return;
    const owned: string[] = [];
    const ctx = gsap.context(() => {
      for (const name of step === -1 ? ["entrance"] : names[step] || []) {
        const targets = root.current!.querySelectorAll(`[data-motion="${name}"]`);
        if (!targets.length) continue;
        const tl = gsap.timeline({ paused, defaults: { ease: "power3.out" } });
        owned.push(name); timelines.set(name, tl);
        if (name === "hangover") tl.to(root.current, { "--gold": "#b6a9b6", "--pink": "#8e7a90", duration: still ? 0 : 1.6, ease: "power2.inOut" });
        else if (name === "partyOpen" || name === "gardener") tl.from(targets, { scale: still ? 1 : .82, opacity: 0, duration: still ? .16 : 1.2, stagger: still ? 0 : .025, ease: "back.out(1.2)" });
        else tl.from(targets, { y: still ? 0 : 14, opacity: 0, duration: still ? .16 : .4, stagger: still ? 0 : .06, clearProps: "transform,opacity" });
      }
    }, root);
    return () => { ctx.revert(); owned.forEach(name => timelines.delete(name)); };
  }, [root, step, still, revision]); // Pause resumes the same timelines instead of rebuilding them.
  useEffect(() => { const update = () => timelines.forEach(tl => paused || document.hidden ? tl.pause() : tl.resume()); update(); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, [paused]);
  useEffect(() => {
    const api = { names: () => [...timelines.keys()], finish: (name: string) => timelines.get(name)?.progress(1), active: () => [...timelines.values()].filter(t => t.isActive()).length };
    Object.assign(window, { __trojanMotion: api });
    return () => { delete (window as unknown as Record<string, unknown>).__trojanMotion; };
  }, []);
}
export function NumberReadout({ value, digits = 0, still = false }: { value: number; digits?: number; still?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null), previous = useRef(value);
  useLayoutEffect(() => {
    const data = { value: previous.current };
    const ctx = gsap.context(() => { gsap.to(data, { value, duration: still ? 0 : .6, ease: "power2.inOut", onUpdate: () => { if (ref.current) ref.current.textContent = data.value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }); } }); });
    previous.current = value; return () => ctx.revert();
  }, [value, digits, still]);
  return <span aria-label={value.toFixed(digits)}><span aria-hidden="true" ref={ref}>{value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}</span></span>;
}
export function Confetti({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    if (!active || !canvas.current || seen.current) return;
    seen.current = true;
    const el = canvas.current, ctx = el.getContext("2d"); if (!ctx) return;
    const { width, height } = el.getBoundingClientRect(); el.width = width; el.height = height;
    let frame = 0, start = 0;
    const draw = (now: number) => {
      if (document.hidden) { frame = 0; return; }
      start ||= now; const t = (now - start) / 1000; ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < 80; i++) { const vx = Math.sin(i * 12.9) * width * .4, vy = -90 - i % 11 * 19; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 2.6); ctx.fillStyle = ["#e9c776", "#f088bd", "#a49aaa"][i % 3]; ctx.translate(width / 2 + vx * t, height * .15 + vy * t + 145 * t * t); ctx.rotate(i + t * 2); ctx.fillRect(0, 0, 3, 6); ctx.restore(); }
      if (t < 2.6) frame = requestAnimationFrame(draw); else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);
    const hide = () => { if (document.hidden) { cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height); } };
    document.addEventListener("visibilitychange", hide);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", hide); ctx.clearRect(0, 0, width, height); };
  }, [active]);
  return <canvas className={s.confetti} ref={canvas} aria-hidden="true" />;
}
export function Graph({ run, still, paused, signal, before = false, focus, applySignal }: { run: Run; still: boolean; paused: boolean; signal: string; before?: boolean; focus?: Segment; applySignal?: (v: string) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const lens = useRef<SVGGElement>(null), move = useRef<(x: number, y: number) => void>(() => {}), point = useRef({ x: 300, y: 215 });
  const halo = useId().replaceAll(":", "");
  const known = before ? false : run.lenses.length >= 3;
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!still && run.step === 0) gsap.from("[data-node]", { scale: 0, transformOrigin: "center", opacity: 0, stagger: .012, duration: .8 });
      if (!still) gsap.from("[data-cluster]", { opacity: 0, duration: .6, clearProps: "opacity" });
      if (lens.current) {
        gsap.set(lens.current, { x: point.current.x, y: point.current.y });
        const x = gsap.quickTo(lens.current, "x", { duration: still ? 0 : .06 }), y = gsap.quickTo(lens.current, "y", { duration: still ? 0 : .06 });
        move.current = (px, py) => { point.current = { x: Math.max(65, Math.min(535, px)), y: Math.max(65, Math.min(365, py)) }; x(point.current.x); y(point.current.y); };
      }
    }, ref);
    return () => ctx.revert();
  }, [run.step, signal, still]);
  return <svg ref={ref} className={s.constellation} viewBox="0 0 600 430" role={applySignal ? "group" : "img"} tabIndex={applySignal ? 0 : undefined} aria-label={applySignal ? "Loop Lens graph. Drag a signal onto the graph or activate its chip. Arrow keys move the lens; Enter reapplies the selected signal." : known ? "Circular payouts: fraud 62 percent, gamers 18 percent, Guilds 20 percent. See the matching segment legend and policy forecast." : "Unclassified referral loops. Apply device, purchase, and location signals to identify the groups."} data-paused={paused || still}
    onPointerMove={e => { if (!applySignal || paused) return; const matrix = ref.current?.getScreenCTM(); if (matrix) { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse()); move.current(p.x, p.y); } }}
    onDragOver={e => { if (applySignal) e.preventDefault(); }} onDrop={e => { if (!applySignal) return; e.preventDefault(); const v = e.dataTransfer.getData("text/plain"); if (["Devices", "Age", "Purchases", "Location"].includes(v)) applySignal(v); }}
    onKeyDown={e => { if (!applySignal || paused) return; const delta: Record<string, number[]> = { ArrowLeft: [-20,0], ArrowRight: [20,0], ArrowUp: [0,-20], ArrowDown: [0,20] }; if (delta[e.key]) { e.preventDefault(); move.current(point.current.x + delta[e.key][0], point.current.y + delta[e.key][1]); } if (e.key === "Enter" && signal) { e.preventDefault(); applySignal(signal); } if (e.key === "Escape") ref.current?.blur(); }}>
    <defs><radialGradient id={halo}><stop stopColor="#e9c776" stopOpacity=".12"/><stop offset="1" stopColor="#e9c776" stopOpacity="0"/></radialGradient></defs>
    <ellipse cx="300" cy="215" rx="285" ry="200" fill={`url(#${halo})`}/>
    <path d="M160 180Q300 35 440 180M160 180Q250 370 310 300M440 180Q430 330 310 300" fill="none" stroke="#615064" strokeDasharray="4 10" opacity=".6"/>
    {segments.map((seg, si) => {
      const [cx, cy] = [[160, 160], [440, 160], [305, 310]][si];
      const policy = !before && run.step >= 11 ? run.placements[seg] : "";
      const color = known || signal === "Devices" && seg === "fraud" || signal === "Purchases" && seg !== "fraud" || signal === "Location" && seg === "guilds" ? segmentInfo[seg].color : "#81738c";
      const count = [31, 9, 10][si];
      return <g key={seg} data-cluster={seg} opacity={focus && focus !== seg ? .22 : policy === "cut" ? .15 : 1} style={{ transition: still ? "none" : "opacity 500ms" }}>
        <circle cx={cx} cy={cy} r="69" fill={policy === "formalize" ? "#e9c77612" : "#ffffff03"} stroke={color} strokeWidth={policy === "formalize" ? 3 : 1} strokeDasharray={seg === "fraud" ? "3 8" : undefined}/>
        {Array.from({ length: count }, (_, i) => { const a = i / count * Math.PI * 2, x = cx + Math.cos(a) * (48 + i % 3 * 7), y = cy + Math.sin(a) * (48 + i % 3 * 7); return <g key={i} data-node><line x1={x} y1={y} x2={cx + Math.cos(a + .6) * 52} y2={cy + Math.sin(a + .6) * 52} stroke={color} opacity=".3"/><circle cx={x} cy={y} r={seg === "guilds" ? 4 : 3} fill={color}/></g>; })}
        <text x={cx} y={cy - 3} textAnchor="middle" fill={color} fontSize="14">{known ? segmentInfo[seg].name : "Unclassified"}</text><text x={cx} y={cy + 20} textAnchor="middle" fill="#d4c7d8" fontSize="12">{known ? `${segmentInfo[seg].share}% · ${policy || "not assigned"}` : "Follow the evidence"}</text>
      </g>;
    })}
    {applySignal && <g ref={lens} aria-hidden="true" pointerEvents="none"><circle r="62" fill="#e9c77606" stroke="#e9c776" strokeWidth="1.5" strokeDasharray="4 5"/><path d="M43 43l22 22" stroke="#e9c776" strokeWidth="4" strokeLinecap="round"/></g>}
  </svg>;
}
