"use client";
import { useEffect, useRef, useState } from "react";
import { content, projection, type State } from "@/lib/sacred-no/engine";
import s from "./SacredNo.module.css";
export default function BlastField({
  state,
  calm,
}: {
  state: State;
  calm: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(state),
    draw = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  latest.current = state;
  useEffect(() => {
    let disposed = false,
      cleanup = () => {};
    const el = host.current;
    if (!el) return;
    void import("three")
      .then((T) => {
        if (disposed) return;
        let renderer: InstanceType<typeof T.WebGLRenderer>;
        try {
          renderer = new T.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
          });
        } catch {
          return;
        }
        if (disposed) {
          renderer.dispose();
          return;
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        const scene = new T.Scene(),
          camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 8;
        const n = matchMedia("(max-width:700px)").matches ? 3000 : 12000,
          positions = new Float32Array(n * 3),
          groups = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const group = i % 6,
            col = group % 3,
            row = Math.floor(group / 3);
          const f = (i * 0.61803398875) % 1,
            g = (i * 0.41421356237) % 1;
          positions[i * 3] = (col - 1) * 2.2 + (f - 0.5) * 1.7;
          positions[i * 3 + 1] = (0.5 - row) * 1.8 + (g - 0.5) * 1.2;
          positions[i * 3 + 2] = Math.sin(i * 1.31) * 0.5;
          groups[i] = group;
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
        geometry.setAttribute("segment", new T.BufferAttribute(groups, 1));
        const material = new T.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            selected: { value: [0, 0, 0, 0, 0, 0] },
            risk: { value: 0 },
            dpr: { value: renderer.getPixelRatio() },
          },
          vertexShader: `attribute float segment; varying float vSegment; uniform float dpr; void main(){ vSegment=segment; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=2.2*dpr;}`,
          fragmentShader: `uniform float selected[6];uniform float risk;varying float vSegment;void main(){if(length(gl_PointCoord-.5)>.5)discard;float on=0.;for(int i=0;i<6;i++){if(abs(vSegment-float(i))<.1)on=selected[i];}vec3 green=vec3(.42,1.,.61),amber=vec3(1.,.78,.34),red=vec3(1.,.3,.3);vec3 cohortColor=risk>1.5?red:risk>.5?amber:green;gl_FragColor=vec4(mix(vec3(.2,.29,.24),cohortColor,on),mix(.25,.85,on));}`,
        });
        const points = new T.Points(geometry, material);
        scene.add(points);
        el.appendChild(renderer.domElement);
        let visible = true;
        const render = () => {
          if (!visible || document.hidden || disposed) return;
          const p = projection(latest.current);
          material.uniforms.selected.value = content.segments.map((x) =>
            latest.current.segments.includes(x.id) ? 1 : 0,
          );
          material.uniforms.risk.value =
            p.risk === "failure" ? 2 : p.risk === "risky" ? 1 : 0;
          renderer.render(scene, camera);
        };
        draw.current = render;
        const resize = new ResizeObserver(() => {
          const w = el.clientWidth;
          renderer.setSize(w, 280);
          camera.aspect = w / 280;
          camera.updateProjectionMatrix();
          render();
        });
        resize.observe(el);
        const observer = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          render();
        });
        observer.observe(el);
        const move = (e: PointerEvent) => {
          if (calm || matchMedia("(max-width:700px)").matches) return;
          points.rotation.y = (e.offsetX / el.clientWidth - 0.5) * 0.12;
          render();
        };
        el.addEventListener("pointermove", move);
        document.addEventListener("visibilitychange", render);
        const lost = (e: Event) => {
          e.preventDefault();
          setReady(false);
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        setReady(true);
        render();
        cleanup = () => {
          resize.disconnect();
          observer.disconnect();
          document.removeEventListener("visibilitychange", render);
          el.removeEventListener("pointermove", move);
          renderer.domElement.removeEventListener("webglcontextlost", lost);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => setReady(false));
    return () => {
      disposed = true;
      cleanup();
      draw.current = () => {};
    };
  }, [calm]);
  useEffect(() => draw.current(), [state]);
  return (
    <figure className={s.blast}>
      <div ref={host} aria-hidden="true" data-ready={ready} />
      {!ready && (
        <svg viewBox="0 0 600 240" aria-hidden="true">
          {Array.from({ length: 180 }, (_, i) => (
            <circle
              key={i}
              cx={16 + (i % 30) * 19}
              cy={20 + Math.floor(i / 30) * 38}
              r="3"
              fill={
                state.segments.includes(content.segments[Math.floor(i / 30)].id)
                  ? "#6cff9b"
                  : "#31473b"
              }
            />
          ))}
        </svg>
      )}
      <figcaption>
        Sampled audience ·{" "}
        {ready ? "single particle field" : "static coverage view"} · controls
        and figures below are authoritative.
      </figcaption>
    </figure>
  );
}
