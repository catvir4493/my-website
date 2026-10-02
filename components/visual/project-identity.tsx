"use client";
import { ViewTransition } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

export const projectIdentifier = (id: string) => `PROJECT_${id.padStart(3, "0")}`;
export function ProjectIdentity({ id }: { id: string }) {
  const { quality, paused, reducedMotion } = useMotionPreferences();
  return (
    <ViewTransition
      name={`project-identity-${id}`}
      default="none"
      share={quality === "high" && !paused && !reducedMotion ? "identity-handoff" : "none"}
    >
      <span className="project-identity">{projectIdentifier(id)}</span>
    </ViewTransition>
  );
}
