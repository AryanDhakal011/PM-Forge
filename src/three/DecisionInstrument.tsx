"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FrameLoopBridge } from "./sceneRuntime";

const RING_START = [
  new THREE.Euler(0.34, 0.12, 0.18),
  new THREE.Euler(-0.42, 0.18, -0.31),
  new THREE.Euler(0.12, -0.36, 0.48),
];

const RING_END = [
  new THREE.Euler(0.18, 0.08, 0.08),
  new THREE.Euler(-0.26, 0.16, -0.2),
  new THREE.Euler(0.08, -0.22, 0.32),
];

const RING_SPEEDS = [0.12, -0.09, 0.06];
const RING_RADII = [0.7, 0.86, 1.02];
const RING_TUBES = [0.011, 0.009, 0.007];
const RING_COLORS = ["#a58152", "#96744c", "#b08c5e"];

export type DecisionInstrumentProps = {
  reducedMotion: boolean;
  progress?: number;
  hovering?: boolean;
};

export function DecisionInstrument({
  reducedMotion,
  progress = 0,
  hovering = false,
}: DecisionInstrumentProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringRefs = useRef<Array<THREE.Group | null>>([]);
  const ringSpinRefs = useRef<Array<THREE.Group | null>>([]);
  const coreGeometry = useMemo(() => {
    // The silhouette still reads as smooth at this density; the previous
    // 64×48 budget was invisible at the on-screen size and cost extra vertex
    // work during start-up.
    const geometry = new THREE.SphereGeometry(0.43, 48, 36);
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index);
      normal.copy(vertex).normalize();
      const wave =
        Math.sin(normal.x * 7.1 + normal.y * 2.7) *
          Math.cos(normal.z * 6.4 - normal.x * 1.8) +
        Math.sin(normal.y * 9.3 + normal.z * 3.6) * 0.42;
      vertex.addScaledVector(normal, wave * 0.0025);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useEffect(() => () => coreGeometry.dispose(), [coreGeometry]);

  useFrame((_, delta) => {
    const resolved = THREE.MathUtils.clamp(progress, 0, 1);
    const smoothing = 1 - Math.exp(-delta * 2.2);

    if (coreRef.current) {
      const targetScale = 1 + resolved * 0.025 + (hovering ? 0.018 : 0);
      if (reducedMotion) {
        coreRef.current.scale.setScalar(targetScale);
      } else {
        coreRef.current.scale.setScalar(
          THREE.MathUtils.damp(coreRef.current.scale.x, targetScale, 3.2, delta),
        );
        coreRef.current.rotation.y += delta * 0.18;
      }
    }

    if (coreMaterialRef.current) {
      const highlight = 0.1 + resolved * 0.05 + (hovering ? 0.025 : 0);
      coreMaterialRef.current.emissiveIntensity = reducedMotion
        ? highlight
        : THREE.MathUtils.damp(
            coreMaterialRef.current.emissiveIntensity,
            highlight,
            3,
            delta,
          );
    }

    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;
      const start = RING_START[index];
      const end = RING_END[index];
      const targetX = THREE.MathUtils.lerp(start.x, end.x, resolved);
      const targetY = THREE.MathUtils.lerp(start.y, end.y, resolved);
      const targetZ = THREE.MathUtils.lerp(start.z, end.z, resolved);
      if (reducedMotion) {
        ring.rotation.set(targetX, targetY, targetZ);
      } else {
        ring.rotation.x += (targetX - ring.rotation.x) * smoothing;
        ring.rotation.y += (targetY - ring.rotation.y) * smoothing;
        ring.rotation.z += (targetZ - ring.rotation.z) * smoothing;
        const spin = ringSpinRefs.current[index];
        if (spin) spin.rotation.z += delta * RING_SPEEDS[index];
      }
    });
  });

  return (
    <group>
      <FrameLoopBridge
        watch={reducedMotion ? `${progress}:${hovering}:${reducedMotion}` : undefined}
      />
      <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 72]} />
        <meshBasicMaterial
          color="#a68b64"
          transparent
          opacity={0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {RING_RADII.map((radius, index) => (
        <group
          key={radius}
          ref={(node) => {
            ringRefs.current[index] = node;
          }}
          rotation={[
            RING_START[index].x,
            RING_START[index].y,
            RING_START[index].z,
          ]}
        >
          <group
            ref={(node) => {
              ringSpinRefs.current[index] = node;
            }}
          >
            <mesh scale={[1, index === 1 ? 0.7 : 0.76, 1]}>
              <torusGeometry args={[radius, RING_TUBES[index], 8, 96]} />
              <meshStandardMaterial
                color={RING_COLORS[index]}
                metalness={0.88}
                roughness={0.24}
              />
            </mesh>
          </group>
        </group>
      ))}

      <mesh ref={coreRef} geometry={coreGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={coreMaterialRef}
          color="#dce3e5"
          metalness={0.42}
          roughness={0.18}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
          emissive="#829198"
          emissiveIntensity={0.1}
          envMapIntensity={1.55}
        />
      </mesh>

      <mesh position={[0, 0, 0.44]} scale={0.018}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial
          color="#e1c48c"
          metalness={0.72}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}
