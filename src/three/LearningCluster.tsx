"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { modules } from "@/lib/content";
import type { SceneFrameloop } from "./sceneLifecycle";
import {
  AdaptiveDpr,
  FrameLoopBridge,
  SceneInvalidationBridge,
  SceneMetricsProbe,
  resolveDprBounds,
  resolveDprCeiling,
  useInitialDpr,
} from "./sceneRuntime";

type ModuleState = {
  state: "not-started" | "in-progress" | "complete";
  progress: number;
};

type ClusterProps = {
  reducedMotion: boolean;
  hovered: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  states: ModuleState[];
  pulls: [number, number, number][];
  /** Section story state; a ref keeps scroll out of React. */
  progressRef?: RefObject<number>;
};

const CARD_POSITIONS: [number, number, number][] = [
  [0.25, 2.1, -0.1],
  [1.49, 1.7, 0],
  [2.15, 0.65, 0.1],
  [2.15, -0.65, -0.1],
  [1.49, -1.7, 0],
  [0.25, -2.1, 0.1],
  [-0.99, -1.7, -0.1],
  [-1.65, -0.65, 0],
  [-1.65, 0.65, 0.1],
  [-0.99, 1.7, -0.1],
];

const BLOCK_POSITIONS: [number, number, number, number][] = [
  [-2.75, 0.15, -1.1, 0.42],
  [-1.75, 2.45, -1.5, 0.3],
  [0.15, 2.65, -1.2, 0.36],
  [1.65, 2.35, -1.4, 0.28],
  [2.65, 1.3, -0.9, 0.34],
  [-2.7, -1.35, -0.7, 0.3],
  [-1.7, -2.35, -1.1, 0.36],
  [0.25, -2.55, -0.6, 0.28],
  [1.7, -2.35, -1.0, 0.32],
  [2.65, -1.55, -0.5, 0.26],
  [-2.85, 0.9, -1.7, 0.24],
  [-2.65, -0.45, -1.6, 0.34],
  [2.65, 0.35, -1.9, 0.28],
  [2.55, -0.45, -1.8, 0.3],
  [-2.15, -0.05, -2.0, 0.22],
  [0.35, 2.8, -2.2, 0.24],
  [-0.85, 2.65, -2.3, 0.2],
  [2.0, 1.75, -2.4, 0.22],
];

/*
 * Where the 18 loose blocks settle once the section is understood: a stable
 * three-tier curriculum. The widest, quietest tier at the base carries the
 * foundations; each tier above is shorter, larger, and settles later, so the
 * hierarchy literally builds upward.
 */
const ORGANIZED_ROWS = [
  { count: 8, y: -1.52, z: -1.0, spacing: 0.78, scale: 0.25, delay: 0 },
  { count: 6, y: -0.06, z: -1.32, spacing: 0.9, scale: 0.29, delay: 0.1 },
  { count: 4, y: 1.12, z: -1.5, spacing: 1.1, scale: 0.33, delay: 0.22 },
];

const ORGANIZED_BLOCKS: [number, number, number, number][] = ORGANIZED_ROWS.flatMap(
  (row) =>
    Array.from({ length: row.count }, (_, column) => [
      (column - (row.count - 1) / 2) * row.spacing,
      row.y,
      row.z,
      row.scale,
    ] as [number, number, number, number]),
);

const BLOCK_DELAYS: number[] = ORGANIZED_ROWS.flatMap((row) =>
  Array.from({ length: row.count }, (_, column) => row.delay + column * 0.015),
);

const MODULE_COLORS = [
  "#b99a4a",
  "#899477",
  "#8e9b9d",
  "#b8734a",
  "#58654e",
  "#b18a50",
  "#a9725b",
  "#6e743f",
  "#9a8f77",
  "#8c6447",
];

function paperTexture(index: number, state: ModuleState) {
  if (typeof document === "undefined") return null;
  const module = modules[index];
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 330;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = index === 0 ? "#fbf4e2" : "#f7f0df";
  ctx.fillRect(0, 0, 512, 330);

  ctx.fillStyle = MODULE_COLORS[index] ?? "#b99a4a";
  ctx.fillRect(0, 0, 18, 330);

  ctx.strokeStyle = "rgba(58, 43, 28, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 328);

  ctx.fillStyle = "rgba(55, 43, 30, 0.78)";
  ctx.font = "600 19px Arial, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("MODULE", 34, 50);

  ctx.fillStyle = "rgba(55, 43, 30, 0.72)";
  ctx.font = "600 17px Arial, sans-serif";
  ctx.textAlign = "right";
  if (state.state !== "not-started") {
    ctx.fillText(
      state.state === "complete" ? "COMPLETE" : `${state.progress}%`,
      478,
      50,
    );
  }
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(58, 43, 28, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(34, 68);
  ctx.lineTo(478, 68);
  ctx.stroke();

  ctx.fillStyle = "#29251f";
  ctx.font = "400 118px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText(module.number, 256, 218);
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(58, 43, 28, 0.14)";
  ctx.beginPath();
  ctx.moveTo(34, 290);
  ctx.lineTo(478, 290);
  ctx.stroke();

  if (state.state !== "not-started") {
    ctx.fillStyle = "rgba(58, 43, 28, 0.12)";
    ctx.fillRect(34, 301, 444, 5);
    ctx.fillStyle = MODULE_COLORS[index] ?? "#b99a4a";
    ctx.fillRect(34, 301, 444 * (state.progress / 100), 5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function PaperCard({
  index,
  hovered,
  onHover,
  onSelect,
  reducedMotion,
  state,
}: {
  index: number;
  hovered: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
  state: ModuleState;
}) {
  const base = CARD_POSITIONS[index];
  const tilt = (index % 2 === 0 ? 1 : -1) * (0.06 + (index % 3) * 0.02);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const tiltRef = useRef(tilt);
  const parentQuaternion = useRef(new THREE.Quaternion());
  const facingQuaternion = useRef(new THREE.Quaternion());
  const tiltQuaternion = useRef(new THREE.Quaternion());
  const zAxis = useRef(new THREE.Vector3(0, 0, 1));
  const { camera } = useThree();
  const texture = useMemo(
    () => paperTexture(index, state),
    [index, state],
  );
  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.elapsedTime;
    const isHovered = hovered === index;
    const targetX = base[0] + (isHovered ? (base[0] > 0 ? 0.22 : -0.22) : 0);
    const targetY =
      base[1] +
      (isHovered ? 0.16 : 0) +
      (reducedMotion ? 0 : Math.sin(time * 0.55 + index * 1.3) * 0.045);
    mesh.position.x = THREE.MathUtils.damp(mesh.position.x, targetX, 6, delta);
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, targetY, 6, delta);
    mesh.position.z = THREE.MathUtils.damp(
      mesh.position.z,
      base[2] + (isHovered ? 0.75 : 0),
      8,
      delta,
    );
    mesh.scale.setScalar(
      THREE.MathUtils.damp(mesh.scale.x, isHovered ? 1.08 : 1, 8, delta),
    );
    mesh.renderOrder = isHovered ? 30 : 5;
    tiltRef.current = THREE.MathUtils.damp(
      tiltRef.current,
      isHovered ? tilt * 0.3 : tilt,
      5,
      delta,
    );
    if (mesh.parent) {
      mesh.parent.getWorldQuaternion(parentQuaternion.current);
      facingQuaternion.current
        .copy(parentQuaternion.current)
        .invert()
        .multiply(camera.quaternion);
      tiltQuaternion.current.setFromAxisAngle(
        zAxis.current,
        tiltRef.current,
      );
      mesh.quaternion
        .copy(facingQuaternion.current)
        .multiply(tiltQuaternion.current);
    }

    // Opaque paper: dim by tinting toward the card stock rather than fading the
    // material, which would let the scene show through the card face.
    if (materialRef.current) {
      const target = hovered === null ? 1 : isHovered ? 1 : 0.66;
      const current = materialRef.current.color.r;
      const next = THREE.MathUtils.damp(current, target, 7, delta);
      materialRef.current.color.setScalar(next);
    }
  });

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      position={[base[0], base[1], base[2]]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(index);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
    >
      <boxGeometry args={[0.94, 0.6, 0.028]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        opacity={1}
        transparent={false}
        roughness={0.88}
        metalness={0}
        color="#fffdf7"
        emissive={index === 0 ? "#7a6334" : "#000000"}
        emissiveIntensity={index === 0 ? 0.06 : 0}
      />
    </mesh>
  );
}

const ease = (t: number) => t * t * (3 - 2 * t);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

function ModuleBlocks({
  hovered,
  progressRef,
}: {
  hovered: number | null;
  progressRef?: RefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const applied = useRef(-1);

  // Writes matrices only when the story state actually changed, so an idle
  // section never touches the instanced buffer.
  const writeMatrices = useMemo(
    () => (calm: number) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      BLOCK_POSITIONS.forEach(([x, y, z, scale], index) => {
        const [targetX, targetY, targetZ, targetScale] =
          ORGANIZED_BLOCKS[index];
        const delay = BLOCK_DELAYS[index];
        const local = ease(
          Math.min(1, Math.max(0, (calm - delay) / (1 - delay))),
        );
        dummy.position.set(
          mix(x, targetX, local),
          mix(y, targetY, local),
          mix(z, targetZ, local),
        );
        dummy.rotation.set(
          mix(index * 0.6, ((index % 3) - 1) * 0.16, local),
          mix(index * 0.9, (index % 2 === 0 ? 1 : -1) * 0.12, local),
          mix(index * 0.3, 0, local),
        );
        dummy.scale.setScalar(mix(scale, targetScale, local));
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    [dummy],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    BLOCK_POSITIONS.forEach((_, index) => {
      mesh.setColorAt(
        index,
        new THREE.Color(MODULE_COLORS[index % MODULE_COLORS.length]),
      );
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const calm = progressRef?.current ?? 0;
    applied.current = calm;
    writeMatrices(calm);
  }, [progressRef, writeMatrices]);

  useFrame(() => {
    if (!progressRef) return;
    const calm = progressRef.current;
    if (Math.abs(calm - applied.current) < 0.001) return;
    applied.current = calm;
    writeMatrices(calm);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, BLOCK_POSITIONS.length]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.72}
        metalness={0.08}
        flatShading
        transparent
        opacity={hovered === null ? 0.94 : 0.5}
      />
    </instancedMesh>
  );
}

function Cluster({
  reducedMotion,
  hovered,
  onHover,
  onSelect,
  states,
  pulls,
  progressRef,
}: ClusterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardsRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const drag = useRef({ active: false, x: 0, rotation: 0, target: 0 });
  const { gl } = useThree();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = gl.domElement;
    const down = (event: PointerEvent) => {
      drag.current.active = true;
      drag.current.x = event.clientX;
      setDragging(true);
    };
    const move = (event: PointerEvent) => {
      if (!drag.current.active) return;
      const delta = event.clientX - drag.current.x;
      drag.current.x = event.clientX;
      drag.current.target += delta * 0.008;
    };
    const up = () => {
      drag.current.active = false;
      setDragging(false);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // Calm slows the whole assembly: once the curriculum has resolved it
    // drifts rather than spins, and the idle tilt flattens out.
    const calm = progressRef?.current ?? 0;
    if (!reducedMotion) {
      if (!drag.current.active) {
        drag.current.target += delta * 0.12 * (1 - calm * 0.72);
      }
      drag.current.rotation = THREE.MathUtils.damp(
        drag.current.rotation,
        drag.current.target,
        2.2,
        delta,
      );
      group.rotation.y = drag.current.rotation;
      group.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.22) * 0.035 * (1 - calm);
      group.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.05 * (1 - calm);
    } else {
      group.rotation.y = -0.16;
      group.rotation.x = 0.04;
    }
    group.scale.setScalar(dragging ? 0.995 : 1);
    if (cardsRef.current) {
      cardsRef.current.rotation.z = reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.12) * 0.012 * (1 - calm);
    }
    if (ballRef.current) {
      const [engineering, sales, ux] =
        hovered === null ? [0, 0, 0] : pulls[hovered];
      let targetX = (sales - engineering) * 0.045 * 0.906;
      let targetY = (ux - (engineering + sales) * 0.423) * 0.045;
      const offsetLength = Math.hypot(targetX, targetY);
      const clamp = offsetLength > 0.18 ? 0.18 / offsetLength : 1;
      targetX *= clamp;
      targetY *= clamp;
      ballRef.current.position.x = THREE.MathUtils.damp(
        ballRef.current.position.x,
        targetX,
        4,
        delta,
      );
      ballRef.current.position.y = THREE.MathUtils.damp(
        ballRef.current.position.y,
        targetY,
        4,
        delta,
      );
    }
  });

  return (
    <>
      <group ref={groupRef} rotation={[0.04, -0.16, 0]}>
        <mesh ref={ballRef} position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.72, 48, 48]} />
          <meshPhysicalMaterial
            color="#d9dfe6"
            roughness={0.38}
            metalness={0.5}
            clearcoat={0.3}
            clearcoatRoughness={0.35}
            envMapIntensity={0.9}
          />
        </mesh>

        <group ref={cardsRef} position={[-0.4, 0, 1.7]}>
          {modules.map((module, index) => (
            <PaperCard
              key={module.slug}
              index={index}
              hovered={hovered}
              onHover={onHover}
              onSelect={onSelect}
              reducedMotion={reducedMotion}
              state={states[index]}
            />
          ))}
        </group>

        <ModuleBlocks hovered={hovered} progressRef={progressRef} />

        <lineSegments>
          <icosahedronGeometry args={[3.12, 1]} />
          <lineBasicMaterial
            color="#a98d69"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </lineSegments>

        <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
          <torusGeometry args={[3.0, 0.008, 6, 96]} />
          <meshBasicMaterial color="#b99a4a" transparent opacity={0.34} />
        </mesh>

        <mesh rotation={[1.18, -0.55, 0.2]}>
          <torusGeometry args={[2.45, 0.006, 6, 96]} />
          <meshBasicMaterial color="#8c6447" transparent opacity={0.26} />
        </mesh>
      </group>
    </>
  );
}

export function LearningCluster({
  reducedMotion,
  frameloop,
  hovered,
  onHover,
  onSelect,
  states,
  pulls,
  progressRef,
  onFail,
}: ClusterProps & { frameloop: SceneFrameloop; onFail?: () => void }) {
  const [failed, setFailed] = useState(false);
  const mobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;
  const bounds = resolveDprBounds(mobile, reducedMotion);
  const maxDpr = resolveDprCeiling(bounds.max);
  const [dpr, setDpr] = useInitialDpr(maxDpr, bounds.min);

  if (failed) {
    return <div style={{ width: "100%", height: "100%" }} aria-hidden="true" />;
  }

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0.15, 12.1], fov: 39 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      frameloop={frameloop}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          setFailed(true);
          onFail?.();
        });
      }}
      aria-hidden="true"
    >
      <AdaptiveDpr
        value={dpr}
        min={bounds.min}
        max={maxDpr}
        onChange={setDpr}
        enabled={!reducedMotion}
      />
      <FrameLoopBridge watch={reducedMotion ? `${hovered}:${reducedMotion}` : undefined} />
      <SceneInvalidationBridge id="learning" />
      <SceneMetricsProbe id="learning" />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff7eb" />
      <directionalLight position={[-5, -1, 3]} intensity={1.1} color="#d8e2ec" />
      <Environment resolution={64} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#ffffff"
          position={[-4, 3, 3]}
          rotation={[0, 0.6, 0]}
          scale={[4, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color="#dbe6f2"
          position={[4, 1, 2]}
          rotation={[0, -0.7, 0]}
          scale={[3, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#fff8ec"
          position={[0, -3, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5, 1.5, 1]}
        />
      </Environment>
      <Cluster
        reducedMotion={reducedMotion}
        hovered={hovered}
        onHover={onHover}
        onSelect={onSelect}
        states={states}
        pulls={pulls}
        progressRef={progressRef}
      />
    </Canvas>
  );
}
