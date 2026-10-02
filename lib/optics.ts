import type { VisualQuality } from "./visual-quality";

// Preserve the v1.4 projected size while changing perspective compression.
export const cameraDistance = (fov: number) =>
  (6.6 * Math.tan(Math.PI / 8)) / Math.tan((fov * Math.PI) / 360);
export const OPTICS = {
  fov: 40,
  near: 0.1,
  far: 24,
  breathing: 0.008,
  cameraParallax: 0.018,
  key: 2.35,
  fill: 0.5,
  rim: 0.24,
  internal: 0.36,
  haze: 0.055,
  dataDuration: 1.65,
  controlDuration: 1.82,
  statusDuration: 2.02,
} as const;
export type OpticsFocus =
  "OVERVIEW" | "CORE_FOCUS" | "PROJECT_FOCUS" | "COMMAND_FOCUS" | "LAB_FOCUS";
export type LightSolo = "all" | "key" | "rim" | "fill" | "internal";
export type MaterialSolo = "all" | "metal" | "glass" | "pcb" | "emissive";
export type OpticsDebugSettings = {
  fov: number;
  light: LightSolo;
  material: MaterialSolo;
  freeze: boolean;
};
export type OpticsTelemetry = {
  fov: number;
  position: number[];
  focus: OpticsFocus;
  detail: number;
  stage: number;
};
export function opticsQuality(quality: VisualQuality) {
  return {
    micro: quality === "high",
    haze: quality === "high" ? OPTICS.haze : 0.025,
    reflection: quality === "high" ? 1 : 0.65,
    bounce: quality === "high" ? 0.028 : 0.016,
  };
}
