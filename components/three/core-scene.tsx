"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  CanvasTexture,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  Color,
  Object3D,
  Vector3,
  type Group,
  PerspectiveCamera,
  MathUtils,
  type InstancedMesh,
  type DirectionalLight,
  type BufferAttribute,
} from "three";
import type { VisualQuality } from "@/lib/visual-quality";
import { createCoreMaterials, type CoreMaterials } from "@/lib/materials/library";
import { AcrylicSupports, BeveledPlate, PCBContacts } from "./core-surfaces";
import { MaterialRenderer } from "./material-renderer";
import { CoreFallback } from "./core-fallback";
import {
  cameraDistance,
  OPTICS,
  type OpticsDebugSettings,
  type OpticsTelemetry,
  type OpticsFocus,
} from "@/lib/optics";

const OpticsDebug =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./optics-debug"), { ssr: false })
    : null;
const subscribeQuery = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};
const querySnapshot = () => (process.env.NODE_ENV === "development" ? window.location.search : "");

function createLabel(layer: "pcb" | "etch") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 512);
  if (layer === "etch") {
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
  } else {
    ctx.strokeStyle = "#304149";
    ctx.lineWidth = 3;
    ctx.strokeRect(25, 25, 462, 462);
    ctx.fillStyle = "#6f929d";
    ctx.textAlign = "center";
    ctx.font = "14px monospace";
    ctx.fillText("INPUT → PROCESS → OUTPUT", 256, 459);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#496168";
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
    ctx.fillStyle = "#718184";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("A14", 63, 105);
    ctx.fillText("P03", 404, 383);
    ctx.fillText("DATA_BUS", 63, 391);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function Pins({ materials }: { materials: CoreMaterials }) {
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
      <primitive object={materials.contacts} attach="material" dispose={null} />
    </instancedMesh>
  );
}

function ProcessingTiles({
  alternate,
  materials,
}: {
  alternate: boolean;
  materials: CoreMaterials;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    for (let instance = 0; instance < 8; instance++) {
      const index = instance * 2 + Number(alternate);
      dummy.position.set(((index % 4) - 1.5) * 0.35, (Math.floor(index / 4) - 1.5) * 0.35, 0.31);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(instance, dummy.matrix);
      ref.current?.setColorAt(instance, color.set(index % 3 === 0 ? "#84939b" : "#61747e"));
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [alternate]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 8]}>
      <boxGeometry args={[0.32, 0.32, 0.05]} />
      <primitive
        object={alternate ? materials.graphite : materials.ceramic}
        attach="material"
        dispose={null}
      />
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

function RenderResolution() {
  const gl = useThree((state) => state.gl);
  const dpr = useThree((state) => state.viewport.dpr);
  useLayoutEffect(() => {
    gl.domElement.setAttribute("data-actual-render-dpr", String(gl.getPixelRatio()));
  }, [gl, dpr]);
  return null;
}

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
  staticMotion,
  signal,
  tint,
  quality,
  commandMode,
  advanced,
  shaderFault,
  debug,
  telemetryRef,
}: {
  paused: boolean;
  staticMotion: boolean;
  signal: string | null;
  tint: string;
  quality: VisualQuality;
  commandMode: boolean;
  advanced: boolean;
  shaderFault: boolean;
  debug: OpticsDebugSettings;
  telemetryRef: React.RefObject<OpticsTelemetry>;
}) {
  const group = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const processing = useRef<Group>(null);
  const keyLight = useRef<DirectionalLight>(null);
  const pulses = useRef<InstancedMesh>(null);
  const pulseDummy = useMemo(() => new Object3D(), []);
  const clickUntil = useRef(0);
  const activeTime = useRef(0);
  const activity = useRef(Array.from({ length: 3 }, () => ({ next: 0, start: -10 })));
  const lightSweep = useRef({ next: 0, start: -10 });
  const materials = useMemo(
    () => createCoreMaterials(quality, advanced, shaderFault),
    [quality, advanced, shaderFault],
  );
  const animatedMaterials = useRef<CoreMaterials | null>(null);
  useLayoutEffect(() => {
    animatedMaterials.current = materials;
  }, [materials]);
  useEffect(() => () => materials.dispose(), [materials]);
  const [active, setActive] = useState(false);
  const paths = useMemo(
    () =>
      signal && modePaths[signal]
        ? modePaths[signal].map((points) => points.map(([x, y]) => new Vector3(x, y, 0.41)))
        : pulsePaths,
    [signal],
  );
  const tracePositions = useMemo(() => new Float32Array(54), []);
  const traceAttribute = useRef<BufferAttribute>(null);
  useLayoutEffect(() => {
    if (!traceAttribute.current) return;
    traceAttribute.current.array.set(
      paths.flatMap((points) =>
        points
          .slice(0, -1)
          .flatMap((point, index) => [...point.toArray(), ...points[index + 1].toArray()]),
      ),
    );
    traceAttribute.current.needsUpdate = true;
  }, [paths]);
  const label = useMemo(() => createLabel("pcb"), []);
  const etching = useMemo(() => createLabel("etch"), []);
  useEffect(() => () => label.dispose(), [label]);
  useEffect(() => () => etching.dispose(), [etching]);
  useLayoutEffect(() => {
    materials.marking.setValues({ map: label });
    materials.etching.setValues({ map: etching });
  }, [materials, label, etching]);
  const color = useMemo(() => new Color(tint), [tint]);
  useEffect(() => {
    materials.trace.emissive.copy(color);
  }, [materials, color]);
  const energized = active || !!signal;
  useLayoutEffect(() => {
    const materials = animatedMaterials.current;
    if (!materials) return;
    materials.optics.bounceTint.value.copy(color);
    materials.optics.cameraDepth.value = cameraDistance(debug.fov);
    const channels = materials.optics.lightChannels.value;
    channels.set(
      ...(["key", "rim", "fill", "internal"].map((name) =>
        debug.light === "all" || debug.light === name ? 1 : 0,
      ) as [number, number, number, number]),
    );
    const solos = {
      metal: [materials.metal, materials.contacts, materials.matte],
      glass: [materials.glass, materials.acrylic],
      pcb: [
        materials.pcb,
        materials.marking,
        materials.ceramic,
        materials.graphite,
        materials.contactShadow,
        materials.dieShadow,
      ],
      emissive: [materials.trace, materials.pulse],
    };
    for (const material of Object.values(materials)) {
      if (material && typeof material === "object" && "isMaterial" in material)
        material.visible =
          debug.material === "all" || solos[debug.material].includes(material as never);
    }
    if (!pulses.current) return;
    for (let index = 0; index < 9; index++) {
      const strength = [1, 0.36, 0.1][index % 3];
      pulses.current.setColorAt(index, new Color().setRGB(strength, strength, strength));
      pulseDummy.scale.setScalar(0);
      pulseDummy.updateMatrix();
      pulses.current.setMatrixAt(index, pulseDummy.matrix);
    }
    pulses.current.instanceMatrix.needsUpdate = true;
  }, [materials, color, debug, pulseDummy]);
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
  useFrame(({ pointer, camera, size }, delta) => {
    const materials = animatedMaterials.current;
    if (!group.current || !materials) return;
    const focus: OpticsFocus = commandMode
      ? "COMMAND_FOCUS"
      : signal
        ? "PROJECT_FOCUS"
        : active
          ? "CORE_FOCUS"
          : "OVERVIEW";
    const distance = cameraDistance(debug.fov);
    if (camera instanceof PerspectiveCamera) {
      const targetDistance =
        distance *
        (1 -
          (!debug.freeze && !staticMotion && (focus === "CORE_FOCUS" || focus === "PROJECT_FOCUS")
            ? OPTICS.breathing
            : 0));
      const blend = debug.freeze || staticMotion ? 1 : Math.min(delta * 2.5, 1);
      camera.position.z += (targetDistance - camera.position.z) * blend;
      camera.position.x +=
        ((debug.freeze || staticMotion || commandMode ? 0 : pointer.x * OPTICS.cameraParallax) -
          camera.position.x) *
        blend;
      camera.position.y +=
        ((debug.freeze || staticMotion || commandMode ? 0 : pointer.y * OPTICS.cameraParallax) -
          camera.position.y) *
        blend;
      camera.lookAt(0, 0, 0);
      if (camera.fov !== debug.fov) {
        camera.fov = debug.fov;
        camera.updateProjectionMatrix();
      }
    }
    const pixelScale =
      size.height / (2 * Math.tan((debug.fov * Math.PI) / 360) * camera.position.z);
    // Preserve material identity in compact compositions; only genuinely tiny cores
    // need to suppress subpixel surface detail. Resolution is controlled by DPR.
    const detail = MathUtils.smoothstep(pixelScale, 40, 70);
    materials.optics.cameraDepth.value = camera.position.z;
    materials.optics.internalWorldPosition.value
      .set(0, 0, 0.41)
      .applyMatrix4(group.current.matrixWorld);
    const elapsed = activeTime.current;
    const gain =
      debug.freeze || staticMotion || !advanced ? 1 : MathUtils.smoothstep(elapsed, 0.25, 1.15);
    materials.optics.opticalGain.value = gain;
    materials.optics.materialDetailLevel.value =
      detail * (debug.freeze || staticMotion ? 1 : MathUtils.smoothstep(elapsed, 0.55, 1.35));
    materials.etching.opacity = 0.86 * (0.65 + detail * 0.35);
    materials.marking.color.setScalar(0.75 + detail * 0.25);
    telemetryRef.current = {
      fov: debug.fov,
      position: camera.position.toArray(),
      focus,
      detail,
      stage: gain,
    };
    if (debug.freeze || staticMotion) {
      group.current.rotation.set(0.15, -0.34, -0.16);
      group.current.position.y = 0;
      rings.current?.rotation.set(0.35, 0, -0.2);
      if (staticMotion) {
        materials.sweep.value = 0;
        materials.trace.emissiveIntensity = energized ? 0.48 : 0.2;
        if (pulses.current) pulses.current.visible = false;
        if (keyLight.current) keyLight.current.position.set(2.5, 4, 5);
      }
    }
    if (paused || debug.freeze) return;
    // Advance only while rendering. Resuming a quiet/hidden scene cannot jump its timeline.
    activeTime.current += Math.min(delta, 0.1);
    const t = activeTime.current;
    const speed = commandMode ? 0.25 : 1;
    const clicked = performance.now() < clickUntil.current;
    group.current.rotation.y +=
      (pointer.x * 0.055 - 0.34 - group.current.rotation.y) * Math.min(delta * 3, 1);
    group.current.rotation.x +=
      (pointer.y * -0.035 + 0.15 - group.current.rotation.x) * Math.min(delta * 3, 1);
    group.current.position.y = Math.sin(t * 0.35) * 0.035;
    if (rings.current)
      rings.current.rotation.z += Math.min(delta, 0.1) * (energized ? 0.035 : 0.012) * speed;
    if (processing.current) processing.current.rotation.z = Math.sin(t * 0.045) * 0.012;
    const fluctuation = Math.sin(t * 0.31) * 0.012 + Math.sin(t * 0.173 + 1.7) * 0.008;
    materials.trace.emissiveIntensity +=
      ((clicked ? 0.75 : energized ? 0.48 : 0.2 + fluctuation) -
        materials.trace.emissiveIntensity) *
      Math.min(delta * 4, 1);
    if (!lightSweep.current.next) lightSweep.current.next = t + 8 + Math.random() * 12;
    if (quality === "high" && !commandMode && t >= lightSweep.current.next) {
      lightSweep.current.start = t;
      lightSweep.current.next = t + 8 + Math.random() * 12;
    }
    const sweepProgress = (t - lightSweep.current.start) / 2.2;
    materials.sweep.value =
      quality === "high" && !commandMode && sweepProgress >= 0 && sweepProgress < 1
        ? Math.sin(sweepProgress * Math.PI)
        : 0;
    if (keyLight.current) {
      keyLight.current.position.x = 2.5 + pointer.x * 0.22 + materials.sweep.value * 0.28;
      keyLight.current.position.y = 4 + pointer.y * 0.14;
    }
    let anyPulse = false;
    activity.current.forEach((schedule, index) => {
      if (!pulses.current) return;
      if (!schedule.next) schedule.next = t + 2 + Math.random() * 5;
      if (t >= schedule.next && !commandMode) {
        schedule.start = t;
        schedule.next = t + 2 + Math.random() * 5;
      }
      const duration = [OPTICS.dataDuration, OPTICS.controlDuration, OPTICS.statusDuration][index];
      const progress = (t - schedule.start) / (duration * (energized || clicked ? 0.88 : 1));
      const visible = progress >= 0 && progress < 1 && !commandMode;
      anyPulse ||= visible;
      const points = paths[index];
      for (let tail = 0; tail < 3; tail++) {
        const sample = Math.max(0, progress - tail * 0.034);
        const segment = Math.max(0, Math.min(2, Math.floor(sample * 3)));
        pulseDummy.position.lerpVectors(
          points[segment],
          points[segment + 1],
          Math.min(1, sample * 3 - segment),
        );
        pulseDummy.scale.setScalar(visible && sample < 1 ? [1, 0.68, 0.44][tail] : 0);
        pulseDummy.updateMatrix();
        pulses.current.setMatrixAt(index * 3 + tail, pulseDummy.matrix);
      }
    });
    if (pulses.current) {
      pulses.current.visible = anyPulse;
      pulses.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      <FrameCadence
        paused={paused || debug.freeze}
        interval={commandMode ? 100 : quality === "high" && energized ? 33 : 50}
      />
      <hemisphereLight
        args={["#adbcc8", "#111920", debug.light === "all" || debug.light === "fill" ? 0.6 : 0]}
      />
      <directionalLight
        ref={keyLight}
        position={[2.5, 4, 5]}
        intensity={debug.light === "all" || debug.light === "key" ? OPTICS.key : 0}
        color="#cadfe4"
      />
      <directionalLight
        position={[-4, -1, 3]}
        intensity={debug.light === "all" || debug.light === "fill" ? OPTICS.fill : 0}
        color="#a6b1c0"
      />
      <directionalLight
        position={[3, -2, -1]}
        intensity={debug.light === "all" || debug.light === "rim" ? OPTICS.rim : 0}
        color="#9487b1"
      />
      <group
        ref={group}
        rotation={[0.15, -0.34, -0.16]}
        onPointerOver={() => setActive(true)}
        onPointerOut={() => setActive(false)}
        onClick={() => {
          clickUntil.current = performance.now() + 450;
        }}
      >
        <pointLight
          position={[0, 0, 0.41]}
          intensity={
            debug.light === "all" || debug.light === "internal"
              ? OPTICS.internal * (energized ? 1.25 : 1)
              : 0
          }
          distance={1.5}
          decay={2}
          color={color}
        />
        <BeveledPlate width={2.2} height={2.2} depth={0.22} material={materials.metal} />
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[2.03, 2.03, 0.05]} />
          <primitive object={materials.matte} attach="material" dispose={null} />
        </mesh>
        <mesh position={[0, 0, 0.23]}>
          <boxGeometry args={[1.89, 1.89, 0.08]} />
          <primitive object={materials.pcb} attach="material" dispose={null} />
        </mesh>
        <mesh position={[0, 0, 0.275]}>
          <planeGeometry args={[1.91, 1.91]} />
          <primitive object={materials.contactShadow} attach="material" dispose={null} />
        </mesh>
        <group ref={processing}>
          <ProcessingTiles alternate={false} materials={materials} />
          <ProcessingTiles alternate materials={materials} />
        </group>
        <mesh position={[0, 0, 0.35]}>
          <planeGeometry args={[0.94, 0.91]} />
          <primitive object={materials.dieShadow} attach="material" dispose={null} />
        </mesh>
        <BeveledPlate
          width={0.83}
          height={0.8}
          depth={0.075}
          z={0.44}
          material={materials.ceramic}
        />
        <PCBContacts materials={materials} />
        <AcrylicSupports materials={materials} />
        <mesh position={[0, 0, 0.395]} rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.61, 0.618, 4]} />
          <primitive object={materials.trace} attach="material" dispose={null} />
        </mesh>
        <mesh position={[0, 0, 0.53]} renderOrder={1}>
          <boxGeometry args={[1.96, 1.96, 0.06]} />
          <primitive object={materials.glass} attach="material" dispose={null} />
        </mesh>
        <mesh position={[0, 0, 0.492]}>
          <planeGeometry args={[1.87, 1.87]} />
          <primitive object={materials.marking} attach="material" dispose={null} />
        </mesh>
        <mesh position={[0, 0, 0.572]} renderOrder={2}>
          <planeGeometry args={[1.87, 1.87]} />
          <primitive object={materials.etching} attach="material" dispose={null} />
        </mesh>
        <Pins materials={materials} />
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              ref={traceAttribute}
              attach="attributes-position"
              args={[tracePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            depthWrite={false}
            opacity={energized ? 0.55 : 0.25}
          />
        </lineSegments>
        <instancedMesh ref={pulses} args={[undefined, undefined, 9]} frustumCulled={false}>
          <sphereGeometry args={[0.023, 8, 8]} />
          <primitive object={materials.pulse} attach="material" dispose={null} />
        </instancedMesh>
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((y) => (
            <mesh
              key={`${x}${y}`}
              position={[x * 0.89, y * 0.89, 0.58]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.028, 0.028, 0.018, 8]} />
              <primitive object={materials.contacts} attach="material" dispose={null} />
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
              <primitive
                object={i === 0 ? materials.orbitNear : materials.orbitFar}
                attach="material"
                dispose={null}
              />
            </mesh>
            <mesh position={[radius, 0, 0]}>
              <sphereGeometry args={[0.029, 8, 8]} />
              <primitive object={materials.orbitNear} attach="material" dispose={null} />
            </mesh>
          </group>
        ))}
      </group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.013}
          color="#8db6c1"
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}

export default function CoreScene({
  paused,
  staticMotion,
  renderDpr,
  signal,
  color,
  quality,
  commandMode,
}: {
  paused: boolean;
  staticMotion: boolean;
  renderDpr: number;
  signal: string | null;
  color: string;
  quality: VisualQuality;
  commandMode: boolean;
}) {
  const [prepared, setPrepared] = useState(false);
  const [mode, setMode] = useState<"optics" | "legacy" | "static">("optics");
  const query = useSyncExternalStore(subscribeQuery, querySnapshot, () => "");
  const debugEnabled =
    process.env.NODE_ENV === "development" && /debug(?:Lighting|Materials)=1/.test(query);
  const [debug, setDebug] = useState<OpticsDebugSettings>({
    fov: OPTICS.fov,
    light: "all",
    material: "all",
    freeze: false,
  });
  const telemetry = useRef<OpticsTelemetry>({
    fov: OPTICS.fov,
    position: [0, 0, cameraDistance(OPTICS.fov)],
    focus: "OVERVIEW",
    detail: 0,
    stage: 0,
  });
  const markReady = useCallback(() => setPrepared(true), []);
  const recover = useCallback(() => {
    setPrepared(false);
    setMode((current) => (current === "optics" ? "legacy" : "static"));
  }, []);
  if (mode === "static") return <CoreFallback />;
  return (
    <>
      <Canvas
        style={{ opacity: prepared ? 1 : 0 }}
        data-material-ready={prepared}
        data-optics-mode={mode}
        data-camera-fov={debug.fov}
        data-render-dpr={renderDpr}
        data-material-quality={quality}
        camera={{
          position: [0, 0, cameraDistance(OPTICS.fov)],
          fov: OPTICS.fov,
          near: OPTICS.near,
          far: OPTICS.far,
        }}
        dpr={renderDpr}
        frameloop="demand"
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.outputColorSpace = SRGBColorSpace;
        }}
      >
        <RenderResolution />
        <ComputeCore
          paused={paused}
          staticMotion={staticMotion}
          signal={signal}
          tint={color}
          quality={quality}
          commandMode={commandMode}
          advanced={mode === "optics"}
          shaderFault={debugEnabled && query.includes("shaderFault=1")}
          debug={debug}
          telemetryRef={telemetry}
        />
        <MaterialRenderer quality={quality} mode={mode} onReady={markReady} onFault={recover} />
      </Canvas>
      {!prepared && <CoreFallback />}
      {debugEnabled && OpticsDebug && (
        <OpticsDebug
          settings={debug}
          onChange={setDebug}
          telemetry={telemetry}
          quality={quality}
          mode={mode}
        />
      )}
    </>
  );
}
