"use client";
import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  OPTICS,
  opticsQuality,
  type LightSolo,
  type MaterialSolo,
  type OpticsDebugSettings,
  type OpticsTelemetry,
} from "@/lib/optics";
import type { VisualQuality } from "@/lib/visual-quality";

// Imported only by the development branch. No production query enables controls.
export default function OpticsDebug({
  settings,
  onChange,
  telemetry,
  quality,
  mode,
}: {
  settings: OpticsDebugSettings;
  onChange: (value: OpticsDebugSettings) => void;
  telemetry: RefObject<OpticsTelemetry>;
  quality: VisualQuality;
  mode: string;
}) {
  const [snapshot, setSnapshot] = useState(telemetry.current);
  useEffect(() => {
    const timer = setInterval(() => setSnapshot({ ...telemetry.current }), 300);
    return () => clearInterval(timer);
  }, [telemetry]);
  const optics = opticsQuality(quality);
  return createPortal(
    <aside className="optics-debug" aria-label="Optics development controls">
      <strong>OPTICS / DEVELOPMENT ONLY</strong>
      <p>
        Quality {quality} · {mode} · {snapshot.focus}
      </p>
      <output>
        Camera {snapshot.fov}° / [{snapshot.position.map((n) => n.toFixed(3)).join(", ")}]<br />
        Key {OPTICS.key} · Rim {OPTICS.rim} · Fill {OPTICS.fill} · Internal {OPTICS.internal}
        <br />
        Haze {optics.haze} · LOD {snapshot.detail.toFixed(2)} · Optical response{" "}
        {snapshot.stage.toFixed(2)}
        <br />
        Lobes: top softbox / left strip / right rim
      </output>
      <label>
        Camera FOV
        <select
          value={settings.fov}
          onChange={(e) => onChange({ ...settings, fov: Number(e.target.value) })}
        >
          {[35, 40, 45, 50].map((fov) => (
            <option key={fov} value={fov}>
              {fov}°
            </option>
          ))}
        </select>
      </label>
      <label>
        Light solo
        <select
          value={settings.light}
          onChange={(e) => onChange({ ...settings, light: e.target.value as LightSolo })}
        >
          {["all", "key", "rim", "fill", "internal"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Material solo
        <select
          value={settings.material}
          onChange={(e) => onChange({ ...settings, material: e.target.value as MaterialSolo })}
        >
          {["all", "metal", "glass", "pcb", "emissive"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.freeze}
          onChange={(e) => onChange({ ...settings, freeze: e.target.checked })}
        />{" "}
        Fixed overview pose
      </label>
    </aside>,
    document.body,
  );
}
