import { Color, MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial } from "three";
import type { VisualQuality } from "@/lib/visual-quality";
import { MATERIAL_PRESETS, MATERIAL_TOKENS, materialQuality } from "./tokens";
import {
  microSurfaceVertex,
  microSurfaceFragment,
  microRoughness,
  microNormal,
} from "./shaders/micro-surface";
import { glassVertex, glassFragment } from "./shaders/glass";
import { studioReflection, studioResponse } from "./shaders/studio";
import { contactVertex, contactFragment } from "./shaders/contact";

type Surface = "brushed" | "matte";
function finishSurface(
  material: MeshStandardMaterial,
  quality: VisualQuality,
  surface: Surface,
  sweep?: { value: number },
) {
  const mode = materialQuality(quality);
  material.onBeforeCompile = (shader) => {
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
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvMaterialPosition = position;",
      );
    shader.fragmentShader =
      microSurfaceFragment +
      "\nuniform float studioIntensity;\n" +
      studioReflection +
      "\n" +
      shader.fragmentShader
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>\n${microRoughness}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>\n${microNormal}`,
        )
        .replace("#include <opaque_fragment>", `${studioResponse}\n#include <opaque_fragment>`);
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
    `marcell-material-1.4-${quality}-${surface}-${Boolean(sweep)}`;
  return material;
}

// Created once per quality change; the owner disposes the whole library on unmount.
export function createCoreMaterials(quality: VisualQuality) {
  const mode = materialQuality(quality);
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
  finishSurface(metal, quality, "brushed", sweep);
  const contacts = finishSurface(
    new MeshStandardMaterial({
      color: "#90948c",
      metalness: 0.8,
      roughness: 0.43,
      envMapIntensity: 0.4,
    }),
    quality,
    "brushed",
  );
  const pcb = finishSurface(new MeshStandardMaterial(MATERIAL_PRESETS.DARK_PCB), quality, "matte");
  const ceramic = finishSurface(
    new MeshStandardMaterial(MATERIAL_PRESETS.CERAMIC_DIE),
    quality,
    "matte",
  );
  const graphite = finishSurface(
    new MeshStandardMaterial(MATERIAL_PRESETS.GRAPHITE),
    quality,
    "matte",
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
  finishSurface(acrylic, quality, "matte");
  const glass = new ShaderMaterial({
    vertexShader: glassVertex,
    fragmentShader: glassFragment,
    uniforms: {
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
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
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
  };
  Object.entries(materials).forEach(([name, material]) => {
    material.name = `MARCELL.${name}`;
  });
  return {
    ...materials,
    sweep,
    dispose: () => Object.values(materials).forEach((material) => material.dispose()),
  };
}
export type CoreMaterials = ReturnType<typeof createCoreMaterials>;
