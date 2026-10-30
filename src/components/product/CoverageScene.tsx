"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { CATEGORIES } from "@/lib/product/content";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { FirstFrameReady } from "@/three/sceneRuntime";
import { coverageQuestions } from "./CoverageInstrument";
import s from "./CoverageInstrument.module.css";
function Instrument({
  states,
  visible,
  onHover,
}: {
  states: number[];
  visible: boolean;
  onHover: (id: string) => void;
}) {
  const beads = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const router = useRouter();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(
    () =>
      CATEGORIES.flatMap((_, i) =>
        Array.from({ length: 9 }, (_, j) => {
          const a = (j / 9) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(a) * (1.4 + i * 0.05),
            Math.sin(a) * (1.4 + i * 0.05),
            0,
          ).applyEuler(
            new THREE.Euler(0.45 + i * 0.25, 0.25 + i * 0.18, i * 0.38),
          );
        }),
      ),
    [],
  );
  const key = states.join("");
  useEffect(() => {
    if (!beads.current) return;
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.setScalar(states[i] === 2 ? 0.065 : states[i] ? 0.05 : 0.036);
      dummy.updateMatrix();
      beads.current!.setMatrixAt(i, dummy.matrix);
      beads.current!.setColorAt(
        i,
        new THREE.Color(
          states[i] ? CATEGORIES[Math.floor(i / 9)].color : "#677d6b",
        ),
      );
    });
    beads.current.instanceMatrix.needsUpdate = true;
    if (beads.current.instanceColor)
      beads.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [key, dummy, positions, invalidate]);
  useEffect(() => {
    if (visible) invalidate();
  }, [visible, invalidate]);
  const hover = (x: number, y: number) => {
    if (!group.current || !visible) return;
    gsap.to(group.current.rotation, {
      x: y * 0.06,
      y: x * 0.06,
      duration: 0.6,
      ease: "power2.out",
      overwrite: true,
      onUpdate: invalidate,
    });
  };
  useEffect(() => {
    const node = group.current;
    return () => {
      if (node) {
        gsap.killTweensOf(node.rotation);
        gsap.killTweensOf(node.scale);
      }
    };
  }, []);
  return (
    <>
      <ambientLight intensity={0.7} />
      <Environment resolution={256} frames={1}>
        <mesh scale={12}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#607164" side={THREE.BackSide} />
        </mesh>
        <Lightformer position={[-3, 3, 3]} scale={[3, 5, 1]} intensity={3} />
        <Lightformer position={[3, 1, -2]} scale={[2, 4, 1]} intensity={4} />
        <Lightformer
          position={[0, -3, 2]}
          scale={[5, 1, 1]}
          intensity={2}
          color="#d0b482"
        />
      </Environment>
      <group
        ref={group}
        onPointerMove={(e) => hover(e.pointer.x, e.pointer.y)}
        onPointerLeave={() => hover(0, 0)}
      >
        {CATEGORIES.map((c, i) => (
          <mesh
            key={c.id}
            rotation={[0.45 + i * 0.25, 0.25 + i * 0.18, i * 0.38]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(coverageQuestions[i * 9].id);
            }}
            onPointerOut={() => onHover("")}
            onClick={() => router.push(`/app/practice?category=${c.id}`)}
          >
            <torusGeometry args={[1.4 + i * 0.05, 0.009, 6, 96]} />
            <meshStandardMaterial
              color={c.color}
              metalness={0.8}
              roughness={0.22}
            />
          </mesh>
        ))}
        <mesh
          onPointerEnter={() => {
            if (group.current)
              gsap.to(group.current.scale, {
                x: 1.06,
                y: 1.06,
                z: 1.06,
                duration: 0.6,
                overwrite: true,
                onUpdate: invalidate,
              });
          }}
          onPointerLeave={() => {
            if (group.current)
              gsap.to(group.current.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.6,
                overwrite: true,
                onUpdate: invalidate,
              });
          }}
        >
          <sphereGeometry args={[0.8, 48, 36]} />
          <meshPhysicalMaterial
            color="#d8e0db"
            metalness={1}
            roughness={0.04}
            clearcoat={1}
          />
        </mesh>
        <instancedMesh
          ref={beads}
          args={[undefined, undefined, 63]}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (e.instanceId !== undefined)
              onHover(coverageQuestions[e.instanceId].id);
          }}
          onPointerOut={() => onHover("")}
          onClick={(e) => {
            e.stopPropagation();
            if (e.instanceId !== undefined)
              router.push(
                `/app/practice/${coverageQuestions[e.instanceId].slug}`,
              );
          }}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial metalness={0.55} roughness={0.25} />
        </instancedMesh>
      </group>
    </>
  );
}
export default function CoverageScene({
  states,
  visible,
  onHover,
}: {
  states: number[];
  visible: boolean;
  onHover: (id: string) => void;
}) {
  const webgl = useWebGLSupport();
  const [ready, setReady] = useState(false);
  if (!webgl) return null;
  return (
    <div className={s.canvas} data-ready={ready}>
      <Canvas
        frameloop={visible ? "demand" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 48 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        aria-hidden="true"
      >
        <Suspense fallback={null}>
          <Instrument states={states} visible={visible} onHover={onHover} />
          <FirstFrameReady onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>
    </div>
  );
}
