"use client";
import { useEffect, useState } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

// Explicit URL opt-in only. Hardware hints stay in this browser's memory.
export default function GraphicsDebug() {
  const { graphics: g, paused, dormant, quiet, commandMode, shellMode } = useMotionPreferences();
  const [core, setCore] = useState({ mode: "absent", material: "none", optics: "none", dpr: "—" });
  useEffect(() => {
    const read = () => {
      const canvas = document.querySelector<HTMLElement>(".core-canvas");
      const scene = canvas?.querySelector<HTMLElement>("[data-optics-mode]");
      const ready = scene?.dataset.materialReady === "true";
      const next = {
        mode: canvas
          ? ready
            ? canvas.dataset.coreMode || "active"
            : canvas.querySelector(".core-fallback")
              ? "static"
              : "loading"
          : "absent",
        material: ready
          ? scene!.dataset.materialQuality || "unknown"
          : canvas
            ? "static approximation"
            : "none",
        optics: ready ? scene!.dataset.opticsMode || "unknown" : "static",
        dpr: ready
          ? canvas?.querySelector<HTMLCanvasElement>("canvas")?.dataset.actualRenderDpr || "unknown"
          : "—",
      };
      setCore((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    const observer = new MutationObserver(read);
    const root = document.querySelector(".system-root");
    if (root)
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "data-core-mode",
          "data-material-ready",
          "data-optics-mode",
          "data-render-dpr",
          "data-actual-render-dpr",
          "data-material-quality",
        ],
      });
    read();
    return () => observer.disconnect();
  }, []);
  const frozen = paused || dormant || quiet || g.reducedMotion;
  const fps =
    !g.coreWebgl || frozen || core.mode !== "active"
      ? "0 continuous (demand)"
      : commandMode || shellMode
        ? "10"
        : g.quality === "high"
          ? "20 idle / 30 active"
          : "20";
  const rows = {
    LAYOUT: g.layoutClass.toUpperCase().replaceAll("-", "_"),
    QUALITY: g.quality.toUpperCase(),
    "AUTO QUALITY": g.autoQuality.toUpperCase(),
    "CSS VIEWPORT": g.viewport.join(" × "),
    "SCREEN (CSS PX)": g.screen.join(" × "),
    "DEVICE DPR": String(g.dpr),
    "WEBGL DPR (ACTUAL)": core.dpr,
    "DPR CAP / SCALE": `${g.renderDpr} / ${g.renderScale.toFixed(3)}`,
    WEBGL: !g.ready
      ? "PENDING"
      : g.capabilities.contextSuccess === null
        ? "NOT PROBED"
        : g.webgl2
          ? "WEBGL2"
          : "UNAVAILABLE",
    "CAPABILITY PROBE": g.capabilities.probeMethod || "PENDING",
    POINTER: g.pointerType.toUpperCase(),
    HOVER: g.hoverCapable ? "YES" : "NO",
    "TOUCH POINTS": String(g.touchPoints),
    "REDUCED MOTION": String(g.reducedMotion),
    "CORE MODE": core.mode.toUpperCase(),
    "STATIC PHONE POLICY": String(g.mobileStaticCorePolicy),
    MATERIAL: core.material.toUpperCase(),
    OPTICS: core.optics.toUpperCase(),
    FRESNEL: core.optics === "optics" ? "ON" : core.optics === "legacy" ? "LEGACY" : "STATIC",
    "MICRO SURFACE":
      core.optics === "optics" && core.material === "high"
        ? "ON (SIZE LOD)"
        : "SIMPLIFIED / STATIC",
    "SIGNAL OPTICS": core.optics === "optics" && !frozen ? "ON" : "STATIC / OFF",
    "TARGET FPS (CAP)": fps,
    "TEXTURE / BUFFER MAX": `${g.capabilities.maxTextureSize} / ${g.capabilities.maxRenderbufferSize}`,
    "FRAGMENT PRECISION": String(g.capabilities.shaderPrecision),
    "CPU THREAD HINT": String(g.capabilities.hardwareConcurrency ?? "unavailable"),
    "MEMORY HINT (GB)": String(g.capabilities.deviceMemory ?? "unavailable"),
  };
  return (
    <aside className="graphics-debug" aria-label="Graphics diagnostics">
      <details open>
        <summary>MARCELL.OS / GRAPHICS DEBUG</summary>
        <dl>
          {Object.entries(rows).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p>WHY THIS QUALITY?</p>
        <ul>
          {g.reason.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p>
          Local diagnostics only. Screen values are CSS pixels; physical panel resolution is not
          inferred. FPS is the configured cap, not measured throughput.
        </p>
      </details>
    </aside>
  );
}
