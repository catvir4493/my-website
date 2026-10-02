import {
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector3,
  Vector4,
} from "three";
import type { VisualQuality } from "@/lib/visual-quality";
import { cameraDistance, OPTICS, opticsQuality } from "@/lib/optics";
import { MATERIAL_PRESETS, MATERIAL_TOKENS, materialQuality } from "./tokens";
import {
  microSurfaceVertex,
  microSurfaceFragment,
  microRoughness,
  microNormal,
} from "./shaders/micro-surface";
import { glassVertex, glassFragment, legacyGlassFragment } from "./shaders/glass";
import { studioReflection, studioResponse } from "./shaders/studio";
import { legacyStudioReflection, legacyStudioResponse } from "./shaders/legacy-studio";
import { contactVertex, contactFragment } from "./shaders/contact";
import { depthVertex, depthFragment, signalVertex, signalFragment } from "./shaders/depth";

function createOpticsUniforms(quality: VisualQuality) {
  const mode = opticsQuality(quality);
  return {
    lightChannels: { value: new Vector4(1, 1, 1, 1) },
    bounceTint: { value: new Color("#80ddeb") },
    bounceStrength: { value: mode.bounce },
    materialDetailLevel: { value: 0 },
    depthHaze: { value: mode.haze },
    cameraDepth: { value: cameraDistance(OPTICS.fov) },
    opticalGain: { value: 0 },
    internalWorldPosition: { value: new Vector3(0, 0, 0.41) },
  };
}
type OpticsUniforms = ReturnType<typeof createOpticsUniforms>;

type Surface = "brushed" | "matte";
function finishSurface(
  material: MeshStandardMaterial,
  quality: VisualQuality,
  surface: Surface,
  optics: OpticsUniforms | null,
  sweep?: { value: number },
) {
  const mode = materialQuality(quality);
  material.onBeforeCompile = (shader) => {
    if (optics) Object.assign(shader.uniforms, optics);
    shader.uniforms.microNormalStrength = {
      value: mode.microNormal,
    };
    shader.uniforms.roughnessVariation = {
      value: mode.roughnessVariation,
    };
    shader.uniforms.surfaceDirection = { value: surface === "brushed" ? 0 : 0.5 };
    shader.uniforms.studioIntensity = {
      value: material.envMapIntensity * (quality === "high" ? 1 : 0.65),
    };
    shader.vertexShader =
      microSurfaceVertex +
      (optics ? "varying vec3 vMaterialWorldPosition;\n" : "") +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvMaterialPosition = position;\n#ifdef USE_INSTANCING\nvMaterialPosition = (instanceMatrix * vec4(position, 1.0)).xyz;\n#endif\n" +
          (optics
            ? "vMaterialWorldPosition = (modelMatrix * vec4(vMaterialPosition, 1.0)).xyz;"
            : ""),
      );
    shader.fragmentShader =
      microSurfaceFragment +
      (optics ? "varying vec3 vMaterialWorldPosition;\n" : "") +
      "\nuniform float studioIntensity;\n" +
      (optics ? studioReflection : legacyStudioReflection) +
      "\n" +
      shader.fragmentShader
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>\n${optics ? "if (materialDetailLevel > 0.01) { roughnessFactor = clamp(roughnessFactor + surfaceNoise(vMaterialPosition.xy) * roughnessVariation * materialDetailLevel, 0.065, 0.98); }" : microRoughness}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>\n${optics ? (quality === "high" ? `if (materialDetailLevel > 0.01) { ${microNormal.replace("* microNormalStrength", "* microNormalStrength * materialDetailLevel")} }` : "") : microNormal}`,
        )
        .replace(
          "#include <opaque_fragment>",
          `${optics ? studioResponse : legacyStudioResponse}\n#include <opaque_fragment>`,
        );
    if (sweep) {
      shader.uniforms.materialSweep = sweep;
      shader.fragmentShader =
        "uniform float materialSweep;\n" +
        shader.fragmentShader.replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor -= materialSweep * 0.035;",
        );
    }
  };
  material.customProgramCacheKey = () =>
    `marcell-material-${optics ? "1.5" : "1.4-recovery"}-${quality}-${surface}-${Boolean(sweep)}`;
  return material;
}

// Created once per quality change; the owner disposes the whole library on unmount.
export function createCoreMaterials(quality: VisualQuality, advanced = true, shaderFault = false) {
  const mode = materialQuality(quality);
  const optics = createOpticsUniforms(quality);
  const response = advanced ? optics : null;
  const sweep = { value: 0 };
  const metal =
    quality === "high"
      ? new MeshPhysicalMaterial({
          ...MATERIAL_PRESETS.INDUSTRIAL_METAL,
          anisotropy: mode.anisotropy,
          clearcoat: 0.06,
          clearcoatRoughness: 0.4,
        })
      : new MeshStandardMaterial(MATERIAL_PRESETS.INDUSTRIAL_METAL);
  finishSurface(metal, quality, "brushed", response, sweep);
  const contacts = finishSurface(
    new MeshStandardMaterial({
      color: "#90948c",
      metalness: 0.8,
      roughness: 0.43,
      envMapIntensity: 0.4,
    }),
    quality,
    "brushed",
    response,
  );
  const pcb = finishSurface(
    new MeshStandardMaterial(MATERIAL_PRESETS.DARK_PCB),
    quality,
    "matte",
    response,
  );
  const ceramic = finishSurface(
    new MeshStandardMaterial(MATERIAL_PRESETS.CERAMIC_DIE),
    quality,
    "matte",
    response,
  );
  const graphite = finishSurface(
    new MeshStandardMaterial(MATERIAL_PRESETS.GRAPHITE),
    quality,
    "matte",
    response,
  );
  const acrylic =
    quality !== "low"
      ? new MeshPhysicalMaterial({
          ...MATERIAL_PRESETS.TECH_ACRYLIC,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          clearcoat: mode.clearcoat,
          clearcoatRoughness: MATERIAL_TOKENS.CLEARCOAT_ROUGHNESS,
          ior: 1.49,
        })
      : new MeshStandardMaterial({
          ...MATERIAL_PRESETS.TECH_ACRYLIC,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        });
  finishSurface(acrylic, quality, "matte", response);
  const glass = new ShaderMaterial({
    vertexShader: glassVertex,
    fragmentShader:
      (advanced ? glassFragment : legacyGlassFragment) +
      (process.env.NODE_ENV === "development" && advanced && shaderFault
        ? "\nMARCELL_INTENTIONAL_SHADER_FAILURE"
        : ""),
    uniforms: {
      ...optics,
      tint: { value: new Color("#8aafbd") },
      edgeStrength: { value: MATERIAL_TOKENS.EDGE_FRESNEL },
      glassIor: { value: MATERIAL_TOKENS.GLASS_IOR },
      glassThickness: { value: MATERIAL_TOKENS.GLASS_THICKNESS },
      filmStrength: { value: mode.filmStrength },
    },
    transparent: true,
    depthWrite: false,
  });
  const trace = new MeshStandardMaterial({
    ...MATERIAL_PRESETS.EMISSIVE_TRACE,
    emissive: "#80ddeb",
    emissiveIntensity: MATERIAL_TOKENS.EMISSIVE_INTENSITY,
  });
  const matte = new MeshStandardMaterial(MATERIAL_PRESETS.MATTE_PANEL);
  const marking = new MeshStandardMaterial({
    color: "#ffffff",
    alphaTest: 0.06,
    metalness: 0.12,
    roughness: 0.78,
    envMapIntensity: 0.08,
  });
  const etching = new MeshStandardMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    metalness: 0.08,
    roughness: 0.58,
    envMapIntensity: 0.1,
  });
  const contactShadow = new ShaderMaterial({
    vertexShader: contactVertex,
    fragmentShader: contactFragment,
    uniforms: { contactGap: { value: 0.12 } },
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const dieShadow = contactShadow.clone();
  dieShadow.uniforms.contactGap.value = 0.035;
  const pulse = advanced
    ? new ShaderMaterial({
        vertexShader: signalVertex,
        fragmentShader: signalFragment,
        uniforms: optics,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      })
    : trace.clone();
  const orbitNear = new ShaderMaterial({
    vertexShader: depthVertex,
    fragmentShader: depthFragment,
    uniforms: {
      cameraDepth: optics.cameraDepth,
      orbitTint: { value: new Color("#62bed0") },
      orbitOpacity: { value: 0.38 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
  const orbitFar = orbitNear.clone();
  // Cloning separates local opacity/tint; both still follow the shared camera distance.
  orbitFar.uniforms.cameraDepth = optics.cameraDepth;
  orbitFar.uniforms.orbitOpacity.value = 0.18;
  const materials = {
    metal,
    contacts,
    pcb,
    ceramic,
    graphite,
    acrylic,
    glass,
    trace,
    matte,
    marking,
    etching,
    contactShadow,
    dieShadow,
    pulse,
    orbitNear,
    orbitFar,
  };
  Object.entries(materials).forEach(([name, material]) => {
    material.name = `MARCELL.${name}`;
  });
  return {
    ...materials,
    sweep,
    optics,
    dispose: () => Object.values(materials).forEach((material) => material.dispose()),
  };
}
export type CoreMaterials = ReturnType<typeof createCoreMaterials>;
