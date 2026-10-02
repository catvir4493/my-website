"use client";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { useMotionPreferences } from "@/components/ui/motion-provider";
const regions = ["LEFT", "CENTER", "RIGHT"] as const;
export function Architecture({ project }: { project: Project }) {
  const { paused, lite } = useMotionPreferences();
  const [region, setRegion] = useState<(typeof regions)[number]>("CENTER");
  return (
    <div className="system-architecture" data-motion={!paused && !lite}>
      <ol className="architecture-pipeline">
        {project.architecture.map((node, index) => (
          <li key={node.title} style={{ "--stage": index } as React.CSSProperties}>
            <span className="mono">{String(index + 1).padStart(2, "0")} / STAGE</span>
            <h3>{node.title}</h3>
            <p>{node.detail}</p>
          </li>
        ))}
      </ol>
      {project.kind === "vision" && (
        <div className="corridor-panel">
          <p className="mono text-cyan">RISK CORRIDOR / ENGINEERING ILLUSTRATION</p>
          <div
            className="corridor-regions"
            role="group"
            aria-label="Explore directional corridor regions"
          >
            {regions.map((name) => (
              <button key={name} aria-pressed={region === name} onClick={() => setRegion(name)}>
                <span>{name}</span>
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
          <p role="status">
            {region === "CENTER"
              ? "CENTER: relate detections to the forward movement corridor before deciding whether to warn."
              : `${region}: communicate relative direction while evaluating corridor relevance.`}
          </p>
          <small>Conceptual signal flow, not a live camera feed or a distance measurement.</small>
        </div>
      )}
    </div>
  );
}
