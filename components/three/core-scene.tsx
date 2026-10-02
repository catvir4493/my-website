"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  Color,
  Object3D,
  Vector3,
  type Group,
  type Mesh,
  type InstancedMesh,
  type MeshStandardMaterial,
} from "three";
import type { VisualQuality } from "@/lib/visual-quality";
import { coreGlassFragment, coreGlassVertex } from "@/lib/core-material";

function createLabel() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = "#304149";
  ctx.lineWidth = 3;
  ctx.strokeRect(25, 25, 462, 462);
  ctx.strokeStyle = "#c5e6eb";
  ctx.lineWidth = 12;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(204, 236);
  ctx.lineTo(204, 179);
  ctx.lineTo(256, 224);
  ctx.lineTo(308, 179);
  ctx.lineTo(308, 236);
  ctx.stroke();
  ctx.fillStyle = "#d7f6fa";
  ctx.textAlign = "center";
  ctx.font = "22px monospace";
  ctx.fillText("MARCELL.OS", 256, 288);
  ctx.fillStyle = "#6f929d";
  ctx.font = "14px monospace";
  ctx.fillText("COMPUTE CORE / 01", 256, 323);
  ctx.fillText("INPUT → PROCESS → OUTPUT", 256, 459);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#668c96";
  for (let side = 0; side < 4; side++) {
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate((side * Math.PI) / 2);
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(-150 + i * 48, -225);
      ctx.lineTo(-150 + i * 48, -181);
      ctx.lineTo(-132 + i * 48, -163);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = "#bdff85";
  ctx.fillRect(50, 436, 37, 4);
  return new CanvasTexture(canvas);
}

function Pins() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let side = 0; side < 4; side++) {
      for (let pin = 0; pin < 18; pin++) {
        const angle = (side * Math.PI) / 2;
        const x = -0.94 + pin * 0.11;
        dummy.position.set(
          x * Math.cos(angle) - 1.17 * Math.sin(angle),
          x * Math.sin(angle) + 1.17 * Math.cos(angle),
          -0.08,
        );
        dummy.rotation.set(0, 0, angle);
        dummy.updateMatrix();
        ref.current?.setMatrixAt(side * 18 + pin, dummy.matrix);
      }
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 72]}>
      <boxGeometry args={[0.045, 0.23, 0.065]} />
      <meshStandardMaterial color="#879da3" metalness={0.72} roughness={0.48} />
    </instancedMesh>
  );
}

function ProcessingTiles({ alternate }: { alternate: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    for (let instance = 0; instance < 8; instance++) {
      const index = instance * 2 + Number(alternate);
      dummy.position.set(((index % 4) - 1.5) * 0.35, (Math.floor(index / 4) - 1.5) * 0.35, 0.31);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(instance, dummy.matrix);
      ref.current?.setColorAt(instance, color.set(index % 3 === 0 ? "#34505a" : "#1e303b"));
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [alternate]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 8]}>
      <boxGeometry args={[0.32, 0.32, 0.05]} />
      <meshStandardMaterial metalness={0.55} roughness={alternate ? 0.64 : 0.43} />
    </instancedMesh>
  );
}

// All pulse positions share the printed circuit frame. Three sparse paths, no screensaver.
const pulsePaths = [
  [
    new Vector3(-1.02, 0.73, 0.41),
    new Vector3(-0.61, 0.73, 0.41),
    new Vector3(-0.4, 0.52, 0.41),
    new Vector3(-0.4, 0.1, 0.41),
  ],
  [
    new Vector3(1.02, -0.64, 0.41),
    new Vector3(0.62, -0.64, 0.41),
    new Vector3(0.4, -0.42, 0.41),
    new Vector3(0.4, -0.08, 0.41),
  ],
  [
    new Vector3(-0.1, -0.05, 0.41),
    new Vector3(-0.1, -0.5, 0.41),
    new Vector3(0.1, -0.7, 0.41),
    new Vector3(0.1, -1.02, 0.41),
  ],
];
const modePaths: Record<string, number[][][]> = {
  "vision-navigation": [
    [
      [-1.02, 0.65],
      [-0.65, 0.65],
      [-0.4, 0.4],
      [-0.4, 0],
    ],
    [
      [-0.4, 0],
      [0.4, 0],
      [0.65, -0.25],
      [1.02, -0.25],
    ],
    [
      [0.4, 0],
      [0.4, -0.55],
      [0.65, -0.8],
      [0.65, -1.02],
    ],
  ],
  airpocket: [
    [
      [-1.02, 0.65],
      [-0.6, 0.65],
      [-0.25, 0.3],
      [0, 0],
    ],
    [
      [0, 0],
      [0.35, 0.35],
      [0.7, 0.35],
      [1.02, 0.65],
    ],
    [
      [0, 0],
      [0.35, -0.35],
      [0.7, -0.35],
      [1.02, -0.65],
    ],
  ],
  "swordsmith-notebook": [
    [
      [-1.02, -0.65],
      [-0.6, -0.65],
      [-0.6, 0.6],
      [0, 0.6],
    ],
    [
      [0, 0.6],
      [0.6, 0.6],
      [0.6, -0.6],
      [1.02, -0.6],
    ],
    [
      [-0.6, 0],
      [0, 0],
      [0, -0.6],
      [0, -1.02],
    ],
  ],
  "gomoku-ai": [
    [
      [0, 1.02],
      [0, 0.65],
      [-0.3, 0.35],
      [-0.3, 0],
    ],
    [
      [-0.3, 0],
      [-0.55, -0.25],
      [-0.55, -0.65],
      [-1.02, -0.65],
    ],
    [
      [0, 0.65],
      [0.4, 0.25],
      [0.4, -0.65],
      [1.02, -0.65],
    ],
  ],
};

function FrameCadence({ paused, interval }: { paused: boolean; interval: number }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    if (paused) return;
    const timer = setInterval(invalidate, interval);
    return () => clearInterval(timer);
  }, [paused, interval, invalidate]);
  return null;
}

function ComputeCore({
  paused,
  signal,
  tint,
  quality,
  commandMode,
}: {
  paused: boolean;
  signal: string | null;
  tint: string;
  quality: VisualQuality;
  commandMode: boolean;
}) {
  const group = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const glow = useRef<MeshStandardMaterial>(null);
  const pulses = useRef<(Mesh | null)[]>([]);
  const clickUntil = useRef(0);
  const [active, setActive] = useState(false);
  const paths = useMemo(
    () =>
      signal && modePaths[signal]
        ? modePaths[signal].map((points) => points.map(([x, y]) => new Vector3(x, y, 0.41)))
        : pulsePaths,
    [signal],
  );
  const tracePositions = useMemo(
    () =>
      new Float32Array(
        paths.flatMap((points) =>
          points
            .slice(0, -1)
            .flatMap((point, index) => [...point.toArray(), ...points[index + 1].toArray()]),
        ),
      ),
    [paths],
  );
  const label = useMemo(() => createLabel(), []);
  useEffect(() => () => label.dispose(), [label]);
  const color = useMemo(() => new Color(tint), [tint]);
  const glassUniforms = useMemo(() => ({ tint: { value: color } }), [color]);
  const energized = active || !!signal;
  const particles = useMemo(() => {
    const count = quality === "high" ? 48 : 16;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963;
      const r = 2.1 + (i % 13) * 0.09;
      positions.set(
        [Math.cos(angle) * r, ((i * 37) % 100) / 27 - 1.85, Math.sin(angle) * r * 0.45],
        i * 3,
      );
    }
    return positions;
  }, [quality]);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current || paused) return;
    const t = clock.elapsedTime;
    const speed = commandMode ? 0.25 : 1;
    const clicked = performance.now() < clickUntil.current;
    group.current.rotation.y +=
      (pointer.x * 0.055 - 0.34 - group.current.rotation.y) * Math.min(delta * 3, 1);
    group.current.rotation.x +=
      (pointer.y * -0.035 + 0.15 - group.current.rotation.x) * Math.min(delta * 3, 1);
    group.current.position.y = Math.sin(t * 0.35) * 0.035;
    if (rings.current)
      rings.current.rotation.z += Math.min(delta, 0.1) * (energized ? 0.035 : 0.012) * speed;
    if (glow.current)
      glow.current.emissiveIntensity +=
        ((clicked ? 1.1 : energized ? 0.65 : 0.22) - glow.current.emissiveIntensity) *
        Math.min(delta * 4, 1);
    pulses.current.forEach((pulse, index) => {
      if (!pulse) return;
      const progress = ((t * speed + index * 2.6) % 9) / (energized || clicked ? 2.8 : 2);
      pulse.visible = progress < 1;
      if (!pulse.visible) return;
      const points = paths[index];
      const segment = Math.min(2, Math.floor(progress * 3));
      pulse.position.lerpVectors(points[segment], points[segment + 1], progress * 3 - segment);
    });
  });
  return (
    <>
      <FrameCadence
        paused={paused}
        interval={commandMode ? 100 : quality === "high" && energized ? 33 : 50}
      />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#aacbd7", "#142028", 1]} />
      <directionalLight position={[2, 4, 5]} intensity={2.1} color="#d3e7ef" />
      <pointLight position={[-3, 1, 3]} intensity={active || signal ? 6 : 4} color={color} />
      <pointLight position={[3, -2, 1]} intensity={2.8} color="#8e83c9" />
      <group
        ref={group}
        rotation={[0.15, -0.34, -0.16]}
        onPointerOver={() => setActive(true)}
        onPointerOut={() => setActive(false)}
        onClick={() => {
          clickUntil.current = performance.now() + 450;
        }}
      >
        <mesh>
          <boxGeometry args={[2.2, 2.2, 0.22]} />
          <meshStandardMaterial color="#34444b" metalness={0.72} roughness={0.48} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[2.03, 2.03, 0.05]} />
          <meshStandardMaterial
            ref={glow}
            color="#1e343c"
            emissive={color}
            emissiveIntensity={0.22}
            metalness={0.5}
            roughness={0.55}
          />
        </mesh>
        <mesh position={[0, 0, 0.23]}>
          <boxGeometry args={[1.89, 1.89, 0.08]} />
          <meshStandardMaterial color="#0d191f" metalness={0.4} roughness={0.8} />
        </mesh>
        <ProcessingTiles alternate={false} />
        <ProcessingTiles alternate />
        <mesh position={[0, 0, 0.44]}>
          <boxGeometry args={[0.83, 0.8, 0.075]} />
          <meshStandardMaterial color="#15232b" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.53]}>
          <boxGeometry args={[1.96, 1.96, 0.06]} />
          {quality === "high" ? (
            <shaderMaterial
              vertexShader={coreGlassVertex}
              fragmentShader={coreGlassFragment}
              uniforms={glassUniforms}
              transparent
              depthWrite={false}
            />
          ) : (
            <meshStandardMaterial
              color="#47646c"
              transparent
              opacity={0.08}
              metalness={0.3}
              roughness={0.6}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh position={[0, 0, 0.569]}>
          <planeGeometry args={[1.87, 1.87]} />
          <meshStandardMaterial
            map={label}
            transparent
            depthWrite={false}
            metalness={0.25}
            roughness={0.7}
          />
        </mesh>
        <Pins />
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[tracePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={energized ? 0.55 : 0.25} />
        </lineSegments>
        {[0, 1, 2].map((index) => (
          <mesh
            key={`pulse-${index}`}
            ref={(element) => {
              pulses.current[index] = element;
            }}
          >
            <sphereGeometry args={[0.023, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((y) => (
            <mesh
              key={`${x}${y}`}
              position={[x * 0.89, y * 0.89, 0.58]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.028, 0.028, 0.018, 8]} />
              <meshStandardMaterial color="#96adb4" metalness={0.75} roughness={0.48} />
            </mesh>
          )),
        )}
      </group>
      <group ref={rings} rotation={[0.35, 0, -0.2]}>
        {[1.78, 2.26, 2.7].map((radius, i) => (
          <group key={radius} rotation={[Math.PI / 2 + i * 0.23, i * 0.5, 0]}>
            <mesh>
              <torusGeometry
                args={[radius, i === 0 ? 0.006 : 0.003, 4, 96, Math.PI * (i === 1 ? 1.65 : 1.9)]}
              />
              <meshBasicMaterial
                color={signal ? tint : i === 1 ? "#8992bb" : "#62bed0"}
                transparent
                opacity={i === 0 ? 0.4 : 0.18}
              />
            </mesh>
            <mesh position={[radius, 0, 0]}>
              <sphereGeometry args={[0.029, 8, 8]} />
              <meshBasicMaterial color="#b7f9ff" />
            </mesh>
          </group>
        ))}
      </group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.013} color="#8db6c1" transparent opacity={0.4} sizeAttenuation />
      </points>
    </>
  );
}

export default function CoreScene({
  paused,
  signal,
  color,
  quality,
  commandMode,
}: {
  paused: boolean;
  signal: string | null;
  color: string;
  quality: VisualQuality;
  commandMode: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 45 }}
      dpr={[1, quality === "high" ? 1.5 : 1.25]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <ComputeCore
        paused={paused}
        signal={signal}
        tint={color}
        quality={quality}
        commandMode={commandMode}
      />
    </Canvas>
  );
}
