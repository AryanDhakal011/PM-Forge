"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import styles from "./Product.module.css";

import { InstrumentDrawing } from "./InstrumentDrawing";
function Instrument({ calm, visible }: { calm: number; visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const beads = useRef<THREE.InstancedMesh>(null);
  const { invalidate } = useThree();
  const state = useRef({ calm: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!beads.current) return;
    for (let i = 0; i < 63; i++) {
      const angle = (i / 63) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * 1.6, Math.sin(angle) * 1.6, 0);
      const done = i < Math.round(calm * 63);
      dummy.scale.setScalar(done ? 0.03 : 0.018);
      dummy.updateMatrix();
      beads.current.setMatrixAt(i, dummy.matrix);
      beads.current.setColorAt(
        i,
        new THREE.Color(done ? "#e3cc83" : "#6c816c"),
      );
    }
    beads.current.instanceMatrix.needsUpdate = true;
    if (beads.current.instanceColor)
      beads.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [dummy, invalidate, calm]);
  useEffect(() => {
    if (!visible) {
      state.current.calm = calm;
      return;
    }
    const tween = gsap.to(state.current, {
      calm,
      duration: 0.85,
      ease: "power2.out",
      onUpdate: () => invalidate(),
    });
    return () => {
      tween.kill();
    };
  }, [calm, visible, invalidate]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = state.current.calm;
    g.rotation.set(0.16 * (1 - p), -0.22 * (1 - p), -0.12 * (1 - p));
    g.children.slice(0, 3).forEach((ring, i) => {
      ring.rotation.x = (0.4 + i * 0.58) * (1 - p * 0.42);
      ring.rotation.y = (i - 1) * 0.63 * (1 - p * 0.5);
      ring.rotation.z = i * 0.9;
    });
  });
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-3, 4, 5]} intensity={4} color="#fff1c2" />
      <directionalLight position={[3, -2, 2]} intensity={2} color="#9ab5a5" />
      <group ref={group}>
        {[1.22, 1.4, 1.58].map((r, i) => (
          <mesh key={r} rotation={[0.4 + i * 0.58, (i - 1) * 0.63, i * 0.9]}>
            <torusGeometry args={[r, 0.018, 8, 80]} />
            <meshStandardMaterial
              color={i === 1 ? "#c8b176" : "#ad8e48"}
              metalness={0.76}
              roughness={0.28}
            />
          </mesh>
        ))}
        <mesh>
          <icosahedronGeometry args={[0.64, 3]} />
          <meshStandardMaterial
            color="#cdd5bf"
            metalness={0.65}
            roughness={0.23}
          />
        </mesh>
        <instancedMesh ref={beads} args={[undefined, undefined, 63]}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="white" />
        </instancedMesh>
      </group>
    </>
  );
}
export default function WorkspaceInstrument({
  calm = 0.25,
}: {
  calm?: number;
}) {
  const { reducedMotion } = useSettings();
  const webgl = useWebGLSupport();
  const [desktop, setDesktop] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(min-width: 901px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={styles.instrument}>
      {desktop && !reducedMotion && webgl ? (
        <Canvas
          frameloop={visible ? "demand" : "never"}
          dpr={[1, 1.25]}
          camera={{ position: [0, 0, 4.6], fov: 48 }}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          aria-hidden="true"
        >
          <Instrument calm={calm} visible={visible} />
        </Canvas>
      ) : (
        <InstrumentDrawing coverage={calm} />
      )}
    </div>
  );
}
