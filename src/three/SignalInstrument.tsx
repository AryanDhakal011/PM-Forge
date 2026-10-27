"use client";

import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { DecisionInstrument } from "./DecisionInstrument";
import type { SceneFrameloop } from "./sceneLifecycle";
import {
  AdaptiveDpr,
  FirstFrameReady,
  FrameLoopBridge,
  SceneMetricsProbe,
  resolveDprBounds,
  resolveDprCeiling,
  useInitialDpr,
} from "./sceneRuntime";

type SignalInstrumentCanvasProps = {
  reducedMotion: boolean;
  frameloop: SceneFrameloop;
  progress: number;
  hovering: boolean;
  onReady?: () => void;
  onFail?: () => void;
};

export function SignalInstrumentCanvas({
  reducedMotion,
  frameloop,
  progress,
  hovering,
  onReady,
  onFail,
}: SignalInstrumentCanvasProps) {
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
      frameloop={frameloop}
      camera={{ position: [0, 0, 3], fov: 40, near: 0.1, far: 20 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: "low-power",
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          setFailed(true);
          onFail?.();
        });
      }}
      role="img"
      aria-label="A reflective mercury-silver orb held within three brushed brass orbital rings"
    >
      <AdaptiveDpr
        value={dpr}
        min={bounds.min}
        max={maxDpr}
        onChange={setDpr}
        enabled={!reducedMotion}
      />
      <FrameLoopBridge
        watch={reducedMotion ? `${progress}:${hovering}:${reducedMotion}` : undefined}
      />
      <FirstFrameReady onReady={onReady} />
      <SceneMetricsProbe id="signal" />
      <ambientLight intensity={0.55} color="#f5f7f5" />
      <hemisphereLight args={["#f5f7f8", "#655b4e", 0.82]} />
      <directionalLight
        position={[-3.5, 4.2, 4]}
        intensity={2.5}
        color="#fff9ee"
      />
      <directionalLight
        position={[3.5, 2.2, -2.5]}
        intensity={0.88}
        color="#dce7ec"
      />
      <pointLight
        position={[0, -2, 2]}
        intensity={0.16}
        color="#c5a678"
      />
      <Environment resolution={128} frames={1} background={false}>
        <Lightformer
          form="rect"
          intensity={2.5}
          color="#fffdf8"
          position={[-3.5, 3.5, 2]}
          rotation={[0, 0.45, 0]}
          scale={[3.5, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#dce8ed"
          position={[3.5, 1.5, 2]}
          rotation={[0, -0.6, 0]}
          scale={[2.5, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.35}
          color="#d5bd98"
          position={[0, -2, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[4, 1.2, 1]}
        />
      </Environment>
      <DecisionInstrument
        reducedMotion={reducedMotion}
        progress={progress}
        hovering={hovering}
      />
    </Canvas>
  );
}
