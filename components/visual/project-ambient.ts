import type { CSSProperties } from "react";
import type { Project } from "@/data/projects";

export function projectAmbient(project: Project): CSSProperties {
  return {
    "--ambient-primary": project.ambientPrimary,
    "--ambient-secondary": project.ambientSecondary,
    "--glow-strength": project.glowStrength,
    "--accent": project.ambientPrimary,
  } as CSSProperties;
}
