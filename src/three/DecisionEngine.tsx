"use client";

import {
  memo,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import {
  createCardTexture,
  createShaftTexture,
  createStickyTexture,
  createWhyTexture,
} from "./textures";
import { DecisionInstrument } from "./DecisionInstrument";
import type { SceneFrameloop } from "./sceneLifecycle";
import {
  AdaptiveDpr,
  FirstFrameReady,
  FrameLoopBridge,
  SceneInvalidationBridge,
  SceneMetricsProbe,
  resolveDprBounds,
  resolveDprCeiling,
  useInitialDpr,
} from "./sceneRuntime";

export type HeroSceneProps = {
  reducedMotion: boolean;
  frameloop: SceneFrameloop;
  onInspect: (item: { label: string; body: string; source: string } | null) => void;
  onReady?: () => void;
};

type CardKind = "paper" | "sticky";

type EvidenceSpec = {
  id: string;
  kind: CardKind;
  spec?: Parameters<typeof createCardTexture>[0];
  stickyText?: string;
  stickyColor?: string;
  size: [number, number];
  chaos: [number, number, number];
  slot: [number, number, number];
  chaosRotation: [number, number, number];
  slotRotation: [number, number, number];
  inspect: { label: string; body: string; source: string };
  falls?: boolean;
};

const EVIDENCE: EvidenceSpec[] = [
  {
    id: "conversion",
    kind: "paper",
    spec: {
      kicker: "Revenue signal",
      title: "Mobile conversion",
      value: "−22%",
      sub: "Analytics / last 14 days",
      accent: "#8f4635",
      chart: "line",
    },
    size: [0.5, 0.66],
    chaos: [-2.0, 2.05, 0.4],
    slot: [-1.5, 0.72, 0.65],
    chaosRotation: [0.14, 0.3, -0.42],
    slotRotation: [0.04, 0.18, -0.06],
    inspect: {
      label: "Mobile conversion",
      body: "Measured, recent, broad, and tied directly to revenue. This is the strongest signal on the desk.",
      source: "Analytics / last 14 days",
    },
  },
  {
    id: "nps",
    kind: "paper",
    spec: {
      kicker: "Sentiment",
      title: "NPS dropped",
      value: "−4 pts",
      sub: "Quarterly survey",
      accent: "#58654e",
      chart: "bars",
    },
    size: [0.46, 0.6],
    chaos: [-2.55, 1.2, -0.2],
    slot: [-2.05, 1.42, 0.18],
    chaosRotation: [0.2, -0.3, -0.18],
    slotRotation: [0.04, -0.18, -0.02],
    inspect: {
      label: "NPS",
      body: "Sentiment is a lagging indicator. Something changed before the survey did.",
      source: "Quarterly survey",
    },
  },
  {
    id: "support",
    kind: "paper",
    spec: {
      kicker: "Support",
      title: "Login tickets doubled",
      value: "×2",
      sub: "Support / last 7 days",
      accent: "#b8734a",
      chart: "line",
    },
    size: [0.46, 0.58],
    chaos: [-2.2, 0.1, 0.9],
    slot: [-1.9, -0.35, 0.86],
    chaosRotation: [0.1, 0.5, 0.3],
    slotRotation: [0.02, 0.12, 0.03],
    inspect: {
      label: "Support tickets",
      body: "Strong, and probably related. Find where in the journey the pain concentrates.",
      source: "Support / last 7 days",
    },
  },
  {
    id: "screen",
    kind: "paper",
    spec: {
      kicker: "Evidence / screenshot",
      title: "Payment failed",
      sub: "Synthetic checkout screen",
      screen: true,
    },
    size: [0.48, 0.62],
    chaos: [2.5, 1.75, -0.4],
    slot: [1.72, 0.96, 0.5],
    chaosRotation: [0.3, -0.5, 0.32],
    slotRotation: [0.03, -0.16, 0.02],
    inspect: {
      label: "Checkout screen",
      body: "A dead end at the final step. The retry returns the buyer to the same broken state.",
      source: "Synthetic product screen",
    },
  },
  {
    id: "quote",
    kind: "paper",
    spec: {
      kicker: "Customer quote",
      title: "I tried to pay twice, then I gave up.",
      sub: "Interview 06 / Android buyer",
      quote: true,
    },
    size: [0.5, 0.58],
    chaos: [2.15, -0.25, 1.3],
    slot: [1.62, -0.6, 1.02],
    chaosRotation: [0.12, 0.35, 0.36],
    slotRotation: [0.02, -0.1, -0.02],
    inspect: {
      label: "Customer quote",
      body: "The language tells you how to frame the fix: recovery, not a redesign.",
      source: "Interview 06 / Android buyer",
    },
  },
  {
    id: "chart",
    kind: "paper",
    spec: {
      kicker: "Behaviour",
      title: "Session length",
      value: "+7%",
      sub: "Analytics / last 30 days",
      accent: "#58654e",
      chart: "line",
    },
    size: [0.42, 0.54],
    chaos: [2.8, 0.9, 1.6],
    slot: [2.35, -0.05, 1.28],
    chaosRotation: [0.22, -0.24, -0.28],
    slotRotation: [0.02, 0.12, 0.04],
    inspect: {
      label: "Session length",
      body: "Up is not automatically good. Are people engaged, or simply stuck?",
      source: "Analytics / last 30 days",
    },
  },
  {
    id: "ceo",
    kind: "paper",
    spec: {
      kicker: "Stakeholder",
      title: "CEO wants a redesign",
      sub: "Leadership thread",
      accent: "#6b655b",
      chart: "none",
    },
    size: [0.48, 0.32],
    chaos: [-2.7, 0.4, 1.5],
    slot: [-2.15, 0.02, 1.35],
    chaosRotation: [0.18, 0.4, 0.46],
    slotRotation: [0.08, 0.2, 0.3],
    inspect: {
      label: "CEO message",
      body: "A strong opinion is still an opinion. What evidence sits underneath it?",
      source: "Leadership thread",
    },
    falls: true,
  },
  {
    id: "needs",
    kind: "sticky",
    stickyText: "User Needs",
    stickyColor: "#dcc07a",
    size: [0.34, 0.34],
    chaos: [-1.2, 2.2, 0.9],
    slot: [-1.05, 1.82, 0.55],
    chaosRotation: [0.1, 0.4, 0.2],
    slotRotation: [0.02, 0.05, -0.08],
    inspect: {
      label: "User needs",
      body: "The user's job, not the feature they asked for.",
      source: "Synthesis note",
    },
  },
  {
    id: "market",
    kind: "sticky",
    stickyText: "Market Trends",
    stickyColor: "#d8a791",
    size: [0.34, 0.34],
    chaos: [1.3, 2.25, -0.6],
    slot: [0.7, 2.0, 0.25],
    chaosRotation: [0.2, -0.3, -0.24],
    slotRotation: [0.02, -0.1, 0.06],
    inspect: {
      label: "Market trends",
      body: "Context, not proof. A competitor shipping something does not make it your priority.",
      source: "Market scan",
    },
  },
  {
    id: "constraints",
    kind: "sticky",
    stickyText: "Constraints",
    stickyColor: "#a8b598",
    size: [0.34, 0.34],
    chaos: [2.9, 2.1, 0.2],
    slot: [2.45, 1.7, 0.6],
    chaosRotation: [0.16, 0.44, 0.3],
    slotRotation: [0.02, 0.12, -0.05],
    inspect: {
      label: "Constraints",
      body: "Two sprints, one demo, one team. The constraint is part of the decision.",
      source: "Delivery note",
    },
  },
];

function easeInOut(value: number) {
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function Scene({
  reducedMotion,
  onInspect,
  onReady,
}: {
  reducedMotion: boolean;
  onInspect: HeroSceneProps["onInspect"];
  onReady?: HeroSceneProps["onReady"];
}) {
  const { pointer, camera, gl, size } = useThree();
  const worldRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<Record<string, THREE.Group | null>>({});
  const cardMaterialRefs = useRef<Record<string, THREE.MeshStandardMaterial | null>>({});
  const dialNeedleRef = useRef<THREE.Mesh>(null);
  const lampMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampLightRef = useRef<THREE.PointLight>(null);
  const whyRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const wiresRef = useRef<THREE.InstancedMesh>(null);
  const smoothed = useRef(0);
  const calm = useRef(reducedMotion ? 0.86 : 0);
  const smoothedPointer = useRef({ x: 0, y: 0 });
  const shadowProgress = useRef(-1);
  const [coreHover, setCoreHover] = useState(false);
  const mobile = size.width < 768;

  const wood = useTexture("/assets/textures/wood-table-diffuse.webp");
  const woodRough = useTexture("/assets/textures/wood-table-rough.webp");

  useMemo(() => {
    [wood, woodRough].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2.2, 2.2);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
    });
  }, [wood, woodRough]);

  const textures = useMemo(
    () =>
      Object.fromEntries(
        EVIDENCE.map((item) => [
          item.id,
          item.kind === "paper" && item.spec
            ? createCardTexture(item.spec)
            : createStickyTexture(item.stickyText ?? "", item.stickyColor ?? "#dcc07a"),
        ]),
      ),
    [],
  );

  const whyTexture = useMemo(() => createWhyTexture(), []);
  const shaftTexture = useMemo(() => createShaftTexture(), []);

  useEffect(() => {
    const currentTextures = Object.values(textures);
    return () => {
      currentTextures.forEach((texture) => texture.dispose());
      whyTexture.dispose();
      shaftTexture.dispose();
    };
  }, [textures, whyTexture, shaftTexture]);

  // Static repeated geometry is instanced once instead of costing one draw
  // call per leaf/wire. Neither group animates independently.
  const leafDummy = useMemo(() => new THREE.Object3D(), []);
  const wireDummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = leavesRef.current;
    if (!mesh) return;
    const dark = new THREE.Color("#687a58");
    const light = new THREE.Color("#7f8c6a");
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      leafDummy.position.set(
        Math.cos(angle) * 0.16,
        0.34 + (index % 3) * 0.11,
        Math.sin(angle) * 0.16,
      );
      leafDummy.rotation.set(
        0.7 + (index % 2) * 0.2,
        angle,
        0.4 + index * 0.1,
      );
      leafDummy.scale.set(0.35, 1.4, 0.12);
      leafDummy.updateMatrix();
      mesh.setMatrixAt(index, leafDummy.matrix);
      mesh.setColorAt(index, index % 2 === 0 ? light : dark);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leafDummy]);

  useLayoutEffect(() => {
    const mesh = wiresRef.current;
    if (!mesh) return;
    EVIDENCE.slice(0, 7).forEach((item, index) => {
      const height = 2.9 - item.slot[1];
      wireDummy.position.set(item.slot[0], (item.slot[1] + 2.9) / 2, item.slot[2] - 0.05);
      wireDummy.rotation.set(0, 0, 0);
      wireDummy.scale.set(1, height, 1);
      wireDummy.updateMatrix();
      mesh.setMatrixAt(index, wireDummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [wireDummy]);

  const dustPositions = useMemo(() => {
    const positions = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i += 1) {
      positions[i * 3] = -2.9 + Math.random() * 2.6;
      positions[i * 3 + 1] = -1 + Math.random() * 3.6;
      positions[i * 3 + 2] = -0.4 + Math.random() * 2.4;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const target = reducedMotion ? 0.82 : scrollState.hero;
    const targetCalm = reducedMotion ? 0.86 : scrollState.heroCalm;
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 3.2);
    calm.current += (targetCalm - calm.current) * Math.min(1, delta * 3.2);
    const p = smoothed.current;
    const eased = easeInOut(p);
    const resolved = calm.current;
    // As the decision resolves, the evidence stops drifting. This is the
    // physical read of "the desk settling", not an extra idle animation.
    const unrest = 1 - resolved;

    if (!reducedMotion) {
      smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * 0.06;
      smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * 0.06;
    } else {
      smoothedPointer.current.x += (0 - smoothedPointer.current.x) * 0.06;
      smoothedPointer.current.y += (0 - smoothedPointer.current.y) * 0.06;
    }

    const px = smoothedPointer.current.x;
    const py = smoothedPointer.current.y;

    if (worldRef.current) {
      worldRef.current.rotation.y = px * 0.028;
      worldRef.current.rotation.x = -py * 0.015;
    }

    // The view settles toward a more frontal, centred composition as the
    // instrument resolves. Pointer parallax stays the dominant offset.
    camera.position.z = 7.45 - eased * 0.22;
    camera.position.x = px * 0.1 + resolved * 0.07;
    camera.position.y = 1.04 + py * 0.06 + resolved * 0.04;
    camera.lookAt(0.25 - resolved * 0.05, 0.15 + resolved * 0.02, 0);

    if (dialNeedleRef.current) {
      const tremor = reducedMotion ? 0 : Math.sin(time * 2.1) * 0.026;
      dialNeedleRef.current.rotation.z = -0.72 + eased * 0.78 + tremor;
    }

    const lampOn = p > 0.82;
    if (lampMaterialRef.current) {
      const targetIntensity = lampOn ? 2.6 : 0.05;
      lampMaterialRef.current.emissiveIntensity +=
        (targetIntensity - lampMaterialRef.current.emissiveIntensity) * Math.min(1, delta * 4);
    }
    if (lampLightRef.current) {
      const targetIntensity = lampOn ? 1.2 : 0;
      lampLightRef.current.intensity +=
        (targetIntensity - lampLightRef.current.intensity) * Math.min(1, delta * 4);
    }

    EVIDENCE.forEach((item, index) => {
      const node = cardRefs.current[item.id];
      if (!node) return;
      const delay = index * 0.02;
      const local = Math.min(1, Math.max(0, (eased - delay) / (1 - delay || 1)));
      const drift = reducedMotion ? 0 : 1 + unrest * 0.75;
      const sway = reducedMotion ? 0 : Math.sin(time * 0.45 + index * 1.7) * 0.014 * drift;
      const swaySlow = reducedMotion ? 0 : Math.cos(time * 0.31 + index * 0.9) * 0.008 * drift;
      node.position.set(
        THREE.MathUtils.lerp(item.chaos[0], item.slot[0], local) + sway,
        THREE.MathUtils.lerp(item.chaos[1], item.slot[1], local) + swaySlow,
        THREE.MathUtils.lerp(item.chaos[2], item.slot[2], local),
      );
      node.rotation.x = THREE.MathUtils.lerp(item.chaosRotation[0], item.slotRotation[0], local);
      node.rotation.y = THREE.MathUtils.lerp(item.chaosRotation[1], item.slotRotation[1], local);
      node.rotation.z =
        THREE.MathUtils.lerp(item.chaosRotation[2], item.slotRotation[2], local) +
        (reducedMotion ? 0 : Math.sin(time * 0.34 + index) * 0.01 * drift);

      if (item.falls && p > 0.55) {
        const fall = Math.min(1, (p - 0.55) / 0.2);
        node.position.y -= fall * 1.9;
        node.rotation.z += fall * 0.7;
        const material = cardMaterialRefs.current[item.id];
        if (material) material.opacity = THREE.MathUtils.lerp(0.96, 0, fall);
      }
    });

    if (whyRef.current) {
      const fade = p > 0.85 ? Math.max(0, 1 - (p - 0.85) / 0.12) : 1;
      const material = whyRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = fade;
      whyRef.current.visible = fade > 0.01;
      if (!reducedMotion) {
        whyRef.current.rotation.z = 0.22 + Math.sin(time * 0.3) * 0.02;
      }
    }

    if (dustRef.current && !reducedMotion) {
      const attribute = dustRef.current.geometry.attributes.position;
      const array = attribute.array as Float32Array;
      for (let i = 0; i < 48; i += 1) {
        array[i * 3 + 1] += delta * (0.02 + (i % 5) * 0.004);
        array[i * 3] += delta * 0.008;
        if (array[i * 3 + 1] > 2.8) array[i * 3 + 1] = -1.1;
        if (array[i * 3] > -0.2) array[i * 3] = -3.1;
      }
      attribute.needsUpdate = true;
    }

    // Shadows only need to follow the scroll choreography. The rings'/core's
    // own rotation does not change the readable shadow shape enough to justify
    // re-rendering the depth map every frame.
    if (gl.shadowMap.enabled && Math.abs(p - shadowProgress.current) > 0.002) {
      shadowProgress.current = p;
      gl.shadowMap.needsUpdate = true;
    }
  });

  return (
    <group ref={worldRef}>
      <FrameLoopBridge watch={reducedMotion ? coreHover : undefined} />
      <SceneInvalidationBridge id="hero" />
      <FirstFrameReady onReady={onReady} />
      <SceneMetricsProbe id="hero" />
      <fog attach="fog" args={["#f3ebdd", 8.5, 16]} />

      <ambientLight intensity={0.52} color="#fff1d8" />
      <hemisphereLight args={["#fff2da", "#8c6447", 0.5]} />
      <directionalLight
        position={[-4.2, 6.4, 4.2]}
        intensity={2.35}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[mobile ? 512 : 1024, mobile ? 512 : 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[5, 2.6, -2.5]} intensity={0.5} color="#d6ddd2" />
      <spotLight
        position={[3.8, 4.4, 3.2]}
        angle={0.5}
        penumbra={1}
        intensity={0.45}
        color="#ffd7a0"
      />

      <Environment resolution={128} frames={1} background={false}>
        <Lightformer
          form="rect"
          intensity={2.8}
          color="#fff0d4"
          position={[-4, 4, 3]}
          rotation={[0, 0.5, 0]}
          scale={[4, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.85}
          color="#cfd9cd"
          position={[4.5, 2, 2]}
          rotation={[0, -0.7, 0]}
          scale={[3, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          color="#b18a50"
          position={[0, -2, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5, 1.6, 1]}
        />
      </Environment>

      {/* Desk */}
      <mesh
        position={[0.2, -1.42, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[13, 8]} />
        <meshStandardMaterial
          map={wood}
          roughnessMap={woodRough}
          color="#a87a58"
          roughness={0.66}
          metalness={0.02}
        />
      </mesh>

      {/* Dark table edge, grounded below the desk plane to avoid z-fighting */}
      <mesh position={[0.2, -1.75, 0.5]} rotation={[0, 0, 0]}>
        <boxGeometry args={[13, 0.6, 0.3]} />
        <meshStandardMaterial color="#5a4030" roughness={0.7} />
      </mesh>

      <ContactShadows
        position={[0.3, -1.405, 0.4]}
        opacity={0.52}
        scale={7}
        blur={2.6}
        far={2.8}
        resolution={256}
        frames={1}
        color="#3f2d1c"
      />

      {/* Decision engine */}
      <group position={[0.42, 0.08, 0.12]} rotation={[0, -0.14, 0]}>
        <mesh position={[0, -1.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.52, 0.6, 0.09, 48]} />
          <meshStandardMaterial color="#7a573e" roughness={0.58} metalness={0.05} />
        </mesh>
        <mesh position={[0, -1.21, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 0.22, 32]} />
          <meshStandardMaterial color="#b18a50" roughness={0.3} metalness={0.82} />
        </mesh>
        <mesh position={[0, -0.94, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.52, 16]} />
          <meshStandardMaterial color="#8a6a3f" roughness={0.34} metalness={0.75} />
        </mesh>

        <group
          onPointerOver={(event) => {
            event.stopPropagation();
            setCoreHover(true);
          }}
          onPointerOut={() => setCoreHover(false)}
        >
          <DecisionInstrument
            reducedMotion={reducedMotion}
            progressRef={calm}
            hovering={coreHover}
          />
        </group>

        {/* Brass dial */}
        <group position={[0, 1.17, 0]} rotation={[0.15, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.035, 40]} />
            <meshStandardMaterial color="#b18a50" roughness={0.24} metalness={0.86} />
          </mesh>
          <mesh position={[0, 0.024, 0]}>
            <cylinderGeometry args={[0.145, 0.145, 0.008, 40]} />
            <meshStandardMaterial color="#e9dfce" roughness={0.55} metalness={0.1} />
          </mesh>
          <mesh ref={dialNeedleRef} position={[0, 0.04, 0]} rotation={[0, 0, -0.72]}>
            <boxGeometry args={[0.012, 0.12, 0.008]} />
            <meshStandardMaterial color="#8f4635" roughness={0.44} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.016, 16, 16]} />
            <meshStandardMaterial color="#5a4030" roughness={0.4} />
          </mesh>
        </group>

        {/* Indicator lamp */}
        <group position={[0.78, -1.17, 0.28]}>
          <mesh>
            <sphereGeometry args={[0.045, 24, 24]} />
            <meshStandardMaterial
              ref={lampMaterialRef}
              color="#4c4a43"
              emissive="#7fa35d"
              emissiveIntensity={0.05}
              roughness={0.28}
            />
          </mesh>
          <pointLight
            ref={lampLightRef}
            color="#9dbb72"
            intensity={0}
            distance={1.4}
            position={[0, 0.15, 0.2]}
          />
        </group>

        {/* Ceramic decision block on the base */}
        <mesh position={[-0.35, -1.19, 0.42]} rotation={[0.1, 0.4, 0.04]} castShadow>
          <boxGeometry args={[0.22, 0.16, 0.18]} />
          <meshStandardMaterial color="#e6ded0" roughness={0.48} metalness={0.04} />
        </mesh>
      </group>

      {/* Pinned evidence */}
      {EVIDENCE.map((item) => (
        <group
          key={item.id}
          ref={(node) => {
            cardRefs.current[item.id] = node;
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            onInspect(item.inspect);
          }}
          onPointerOut={() => {
            onInspect(null);
          }}
        >
          <mesh castShadow>
            <planeGeometry args={[item.size[0] * 1.34, item.size[1] * 1.34]} />
            <meshStandardMaterial
              ref={(node) => {
                cardMaterialRefs.current[item.id] = node;
              }}
              map={textures[item.id]}
              emissive="#fff7e7"
              emissiveMap={textures[item.id]}
              emissiveIntensity={0.12}
              roughness={0.86}
              metalness={0}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
          {/* Pin */}
          <mesh position={[0, (item.size[1] * 1.34) / 2 - 0.04, 0.012]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <meshStandardMaterial color="#b18a50" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Wires suggesting the pinned evidence network */}
      <instancedMesh ref={wiresRef} args={[undefined, undefined, 7]}>
        <cylinderGeometry args={[0.0018, 0.0018, 1, 4]} />
        <meshStandardMaterial
          color="#8a6a4a"
          roughness={0.7}
          transparent
          opacity={0.34}
        />
      </instancedMesh>

      {/* "why?" sticky on the desk */}
      <mesh
        ref={whyRef}
        position={[-0.9, -1.395, 1.86]}
        rotation={[-Math.PI / 2 + 0.08, 0, 0.22]}
      >
        <planeGeometry args={[0.44, 0.44]} />
        <meshStandardMaterial
          map={whyTexture}
          roughness={0.85}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Desk props */}
      <group position={[-2.3, -1.16, 1.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.13, 0.24, 32]} />
          <meshStandardMaterial color="#e8dfd0" roughness={0.42} />
        </mesh>
        <mesh position={[0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.08, 0.016, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#e8dfd0" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.008, 32]} />
          <meshStandardMaterial color="#6b4a32" roughness={0.5} />
        </mesh>
      </group>

      <group position={[-1.55, -1.4, 2.15]} rotation={[0, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.06, 0.65]} />
          <meshStandardMaterial color="#f6f0e3" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <boxGeometry args={[0.8, 0.006, 0.6]} />
          <meshStandardMaterial color="#fbf8f0" roughness={0.9} />
        </mesh>
        <mesh position={[0.34, 0.07, 0.12]} rotation={[0, -0.3, 0.12]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
          <meshStandardMaterial color="#b99a4a" roughness={0.5} />
        </mesh>
      </group>

      <group position={[2.55, -1.38, -0.35]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.19, 0.28, 24]} />
          <meshStandardMaterial color="#a8765a" roughness={0.62} />
        </mesh>
        <instancedMesh ref={leavesRef} args={[undefined, undefined, 7]}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
      </group>

      {/* Light shaft + dust */}
      <mesh position={[-2.05, 1.3, 1.1]} rotation={[0, 0.15, -0.42]}>
        <planeGeometry args={[2.1, 6.2]} />
        <meshBasicMaterial
          map={shaftTexture}
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.014}
          color="#ffe9c2"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export const HeroScene = memo(function HeroScene({
  reducedMotion,
  frameloop,
  onInspect,
  onReady,
}: HeroSceneProps) {
  const [failed, setFailed] = useState(false);
  const mobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;
  const bounds = resolveDprBounds(mobile, reducedMotion);
  const maxDpr = resolveDprCeiling(bounds.max);
  const [dpr, setDpr] = useInitialDpr(maxDpr, bounds.min);

  if (failed) {
    return <SceneFallback />;
  }

  return (
    <Canvas
      dpr={dpr}
      frameloop={frameloop}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 1.04, 7.45], fov: 40, near: 0.5, far: 40 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        // The desk shadows only need to change while the scroll choreography
        // moves the evidence. Idle frames skip the depth pass entirely.
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          setFailed(true);
        });
      }}
      role="img"
      aria-label="Interactive decision engine with evidence cards and a rotating brass instrument"
    >
      <AdaptiveDpr
        value={dpr}
        min={bounds.min}
        max={maxDpr}
        onChange={setDpr}
        enabled={!reducedMotion}
      />
      <Suspense fallback={null}>
        <Scene
          reducedMotion={reducedMotion}
          onInspect={onInspect}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
});

export function SceneFallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
        fontSize: "0.85rem",
      }}
    >
      Preparing the workspace…
    </div>
  );
}
