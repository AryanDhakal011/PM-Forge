"use client";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
const vertex = `varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}`;
const fragment = `uniform float time;uniform float proved;uniform float pop;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(-vP))),1.8);float w=sin(vN.y*14.+vN.x*8.+time*.3)*(1.+proved*3.);vec3 thin=.78+.20*cos(vec3(0.,2.1,4.2)+f*11.+w*.6);vec3 c=mix(vec3(.98,.97,.94),thin,.25+f*.75);float a=(.12+f*.66)*(1.-pop);gl_FragColor=vec4(c,a);}`;
function Film({
  proved,
  reveal,
  active,
  mobile,
  animateReveal,
}: {
  proved: number;
  reveal: boolean;
  active: boolean;
  mobile: boolean;
  animateReveal: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null),
    mesh = useRef<THREE.Mesh>(null),
    core = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();
  const uniforms = useRef({
    time: { value: 0 },
    proved: { value: 0 },
    pop: { value: reveal && !animateReveal ? 1 : 0 },
  });
  useEffect(() => {
    if (!active) return;
    const t = setInterval(invalidate, mobile ? 34 : 25);
    return () => clearInterval(t);
  }, [active, mobile, invalidate]);
  useEffect(() => {
    const tween = gsap.to(uniforms.current.proved, {
      value: proved,
      duration: 0.8,
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [proved, invalidate]);
  useEffect(() => {
    const tween = gsap.to(uniforms.current.pop, {
      value: reveal ? 1 : 0,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [reveal, invalidate]);
  useFrame((state, delta) => {
    uniforms.current.time.value += Math.min(delta, 0.05);
    if (material.current) {
      material.current.uniforms.time.value = uniforms.current.time.value;
      material.current.uniforms.proved.value = uniforms.current.proved.value;
      material.current.uniforms.pop.value = uniforms.current.pop.value;
    }
    if (mesh.current) {
      mesh.current.visible = uniforms.current.pop.value < 0.999;
      mesh.current.rotation.y += Math.min(delta, 0.05) * 0.09;
      const scale =
        (1 + Math.sin(state.clock.elapsedTime * 0.55) * 0.075) *
        (1 + uniforms.current.pop.value * 0.12);
      mesh.current.scale.setScalar(scale);
    }
    if (core.current) core.current.scale.setScalar(reveal ? 0.49 : 0.06);
  });
  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.55, mobile ? 32 : 64, mobile ? 24 : 48]} />
        <shaderMaterial
          ref={material}
          transparent
          depthWrite={false}
          uniforms={uniforms.current}
          vertexShader={vertex}
          fragmentShader={fragment}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[1.55, 32, 24]} />
        <meshStandardMaterial
          color="#b45f06"
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0.2]} scale={reveal ? 1.25 : 1}>
        <torusGeometry args={[1.7, 0.008, 8, 100]} />
        <meshBasicMaterial
          color={reveal ? "#b45f06" : "#c4bcc9"}
          transparent
          opacity={0.5}
        />
      </mesh>
      {!mobile && <Shards trigger={proved} reveal={reveal && animateReveal} />}
    </group>
  );
}
function Shards({ trigger, reveal }: { trigger: number; reveal: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null),
    age = useRef(2),
    dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (trigger > 0 || reveal) age.current = 0;
  }, [trigger, reveal]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    age.current += Math.min(delta, 0.05);
    mesh.current.visible = age.current < 1.2;
    if (!mesh.current.visible) return;
    for (let i = 0; i < 180; i++) {
      const angle = i * 2.39996,
        y = 1 - i / 90,
        r = Math.sqrt(Math.max(0, 1 - y * y)),
        distance = 1.6 + age.current * 0.7;
      dummy.position.set(
        Math.cos(angle) * r * distance,
        y * distance,
        Math.sin(angle) * r * distance,
      );
      dummy.rotation.set(i * 0.2, age.current + i, 0);
      dummy.scale.setScalar(0.025 * (1 - age.current / 1.2));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 180]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#c9b4a0" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
function StaticBubble({ proved, reveal }: { proved: number; reveal: boolean }) {
  return (
    <svg
      viewBox="0 0 360 310"
      role="img"
      aria-label={
        reveal
          ? "The inflated shell is gone. A smaller real-growth core remains."
          : `${proved.toFixed(1)} million daily events proved not to be new demand.`
      }
    >
      <defs>
        <radialGradient id="ghost-film">
          <stop stopColor="#faf9f6" />
          <stop offset=".65" stopColor="#dcf2e9" />
          <stop offset=".83" stopColor="#e7d4ef" />
          <stop offset="1" stopColor="#cfe3ff" />
        </radialGradient>
      </defs>
      <ellipse cx="180" cy="274" rx="90" ry="9" fill="#1b1b1f" opacity=".05" />
      <circle
        cx="180"
        cy="147"
        r={reveal ? 52 : 117}
        fill={reveal ? "#b45f06" : "url(#ghost-film)"}
        stroke="#bdb5c3"
        strokeWidth=".7"
      />
      {!reveal && (
        <>
          <ellipse
            cx="180"
            cy="147"
            rx="119"
            ry="31"
            fill="none"
            stroke="#b45f06"
            opacity=".45"
            transform="rotate(-23 180 147)"
          />
          <path
            d="M110 74q43-30 85-21"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function MetricBubble({
  proved,
  reveal = false,
  calm = false,
  animateReveal = false,
}: {
  proved: number;
  reveal?: boolean;
  calm?: boolean;
  animateReveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false),
    [mobile, setMobile] = useState(false),
    [supported, setSupported] = useState(false);
  useEffect(() => {
    setMobile(matchMedia("(max-width: 700px)").matches);
    setSupported(!!window.WebGLRenderingContext);
    const o = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const fallback = <StaticBubble proved={proved} reveal={reveal} />;
  return (
    <div
      ref={ref}
      style={{ height: 290, position: "relative" }}
      data-metric-bubble=""
      data-reveal={reveal ? "real-core" : "audit-shell"}
      aria-label={
        reveal
          ? "Complete audit: one million real daily growth remains after removing seven point five million counting noise."
          : `${proved.toFixed(1)} million daily events confirmed as counting noise`
      }
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: !calm && supported ? "none" : undefined,
        }}
      >
        {fallback}
      </div>
      {!calm && supported && (
        <div style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <Boundary fallback={fallback}>
            <Canvas
              frameloop="demand"
              dpr={[1, mobile ? 1 : 1.5]}
              camera={{ position: [0, 0, 5.4], fov: 45 }}
              gl={{
                alpha: true,
                antialias: !mobile,
                powerPreference: "low-power",
              }}
              fallback={fallback}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[3, 4, 4]} intensity={3} />
              <Suspense fallback={null}>
                <Film
                  proved={proved / 7.5}
                  reveal={reveal}
                  active={active}
                  mobile={mobile}
                  animateReveal={animateReveal}
                />
              </Suspense>
            </Canvas>
          </Boundary>
        </div>
      )}
    </div>
  );
}
