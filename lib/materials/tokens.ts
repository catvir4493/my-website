import type { VisualQuality } from "@/lib/visual-quality";

export const BLACK_LEVELS = {
  BACKGROUND: "#080d11",
  DEEP_PANEL: "#0d141b",
  PCB: "#142222",
  METAL: "#303a42",
  RAISED: "#3b4851",
  HIGHLIGHT: "#59636b",
} as const;

export const MATERIAL_TOKENS = {
  METAL_ROUGHNESS: 0.46,
  METALNESS: 0.86,
  GLASS_TRANSMISSION: 0.96,
  GLASS_IOR: 1.45,
  GLASS_THICKNESS: 0.035,
  GLASS_ROUGHNESS: 0.025,
  CLEARCOAT: 0.12,
  CLEARCOAT_ROUGHNESS: 0.32,
  EMISSIVE_INTENSITY: 0.2,
  ENV_INTENSITY: 0.48,
  EDGE_FRESNEL: 0.16,
  MICRO_NORMAL_STRENGTH: 0.0002,
} as const;

export const MATERIAL_PRESETS = {
  INDUSTRIAL_METAL: {
    color: BLACK_LEVELS.METAL,
    metalness: MATERIAL_TOKENS.METALNESS,
    roughness: MATERIAL_TOKENS.METAL_ROUGHNESS,
    envMapIntensity: 0.58,
  },
  SMOKED_GLASS: {
    color: "#d0dce0",
    metalness: 0,
    roughness: MATERIAL_TOKENS.GLASS_ROUGHNESS,
    envMapIntensity: 0.22,
  },
  TECH_ACRYLIC: { color: "#55666d", metalness: 0, roughness: 0.38, envMapIntensity: 0.22 },
  DARK_PCB: { color: BLACK_LEVELS.PCB, metalness: 0.12, roughness: 0.86, envMapIntensity: 0.07 },
  CERAMIC_DIE: { color: "#343a42", metalness: 0.06, roughness: 0.66, envMapIntensity: 0.14 },
  GRAPHITE: { color: "#202a32", metalness: 0.16, roughness: 0.78, envMapIntensity: 0.1 },
  EMISSIVE_TRACE: { color: "#78969c", metalness: 0.3, roughness: 0.44, envMapIntensity: 0.08 },
  MATTE_PANEL: {
    color: BLACK_LEVELS.DEEP_PANEL,
    metalness: 0.04,
    roughness: 0.92,
    envMapIntensity: 0.02,
  },
} as const;

export function materialQuality(quality: VisualQuality) {
  return {
    // True transmission was removed after measured startup regressions; retain its target token.
    transmission: 0,
    microNormal:
      quality === "high"
        ? MATERIAL_TOKENS.MICRO_NORMAL_STRENGTH
        : quality === "medium"
          ? 0.00006
          : 0,
    roughnessVariation: quality === "high" ? 0.035 : quality === "medium" ? 0.015 : 0,
    anisotropy: quality === "high" ? 0.16 : 0,
    iridescence: 0,
    filmStrength: quality === "high" ? 0.025 : 0,
    clearcoat: quality === "low" ? 0 : MATERIAL_TOKENS.CLEARCOAT,
  };
}
