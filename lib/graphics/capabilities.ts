export type GraphicsQuality = "high" | "medium" | "low";
export interface GraphicsCapabilities {
  probeMethod?: "worker" | "main-thread" | "deferred";
  webgl2: boolean;
  contextSuccess: boolean | null;
  maxTextureSize: number | null;
  maxRenderbufferSize: number | null;
  shaderPrecision: number | null;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
}
export const unknownCapabilities: GraphicsCapabilities = {
  webgl2: false,
  contextSuccess: null,
  maxTextureSize: null,
  maxRenderbufferSize: null,
  shaderPrecision: null,
  hardwareConcurrency: null,
  deviceMemory: null,
};
export function deferredCapabilities(): GraphicsCapabilities {
  const hardware = navigator as Navigator & { deviceMemory?: number };
  return {
    ...unknownCapabilities,
    webgl2: typeof WebGL2RenderingContext !== "undefined",
    probeMethod: "deferred",
    hardwareConcurrency: hardware.hardwareConcurrency || null,
    deviceMemory: hardware.deviceMemory || null,
  };
}
// One local probe per document. No rendering benchmark, storage or network requests.
function probeOnMainThread(): GraphicsCapabilities {
  const canvas = document.createElement("canvas");
  canvas.dataset.graphicsProbe = "true";
  const hardware = navigator as Navigator & { deviceMemory?: number };
  const result: GraphicsCapabilities = {
    ...unknownCapabilities,
    probeMethod: "main-thread",
    hardwareConcurrency: hardware.hardwareConcurrency || null,
    deviceMemory: hardware.deviceMemory || null,
  };
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", { powerPreference: "low-power", antialias: false });
    if (!gl) {
      result.contextSuccess = false;
      return result;
    }
    result.webgl2 = true;
    result.contextSuccess = true;
    return {
      ...result,
      webgl2: true,
      contextSuccess: true,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      shaderPrecision:
        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ?? null,
    };
  } catch {
    if (!gl) result.contextSuccess = false;
    return result;
  } finally {
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
export async function probeCapabilities(): Promise<GraphicsCapabilities> {
  const hardware = navigator as Navigator & { deviceMemory?: number };
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    const data = await new Promise<Partial<GraphicsCapabilities> | null>((resolve) => {
      let worker: Worker | undefined;
      const finish = (value: Partial<GraphicsCapabilities> | null) => {
        clearTimeout(timer);
        worker?.terminate();
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 1800);
      try {
        worker = new Worker("/graphics-capabilities.worker.js");
        worker.onmessage = (event) => finish(event.data?.webgl2 ? event.data : null);
        worker.onerror = () => finish(null);
      } catch {
        finish(null);
      }
    });
    if (data)
      return {
        ...unknownCapabilities,
        ...data,
        probeMethod: "worker",
        hardwareConcurrency: hardware.hardwareConcurrency || null,
        deviceMemory: hardware.deviceMemory || null,
      };
  }
  // Compatibility fallback is separated from hydration and follows the first paint.
  await new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === "function")
      requestIdleCallback(() => resolve(), { timeout: 500 });
    else setTimeout(resolve, 0);
  });
  return probeOnMainThread();
}
export function decideQuality(caps: GraphicsCapabilities): {
  quality: GraphicsQuality;
  reason: string[];
} {
  if (!caps.webgl2 || caps.contextSuccess === false)
    return { quality: "low", reason: ["WebGL2 context unavailable; static material composition."] };
  if (caps.contextSuccess === null)
    return {
      quality: "medium",
      reason: [
        "GPU context limits are unprobed; conservative MEDIUM for uncertain capabilities.",
        "No WebGL feature is requested by the static Core policy, so GPU initialization is deferred. Debug mode requests the full probe.",
      ],
    };
  if (
    (caps.maxTextureSize !== null && caps.maxTextureSize < 2048) ||
    (caps.maxRenderbufferSize !== null && caps.maxRenderbufferSize < 2048) ||
    (caps.shaderPrecision !== null && caps.shaderPrecision < 16)
  )
    return {
      quality: "low",
      reason: ["WebGL limits or fragment precision are below the supported material budget."],
    };
  const sufficient =
    caps.maxTextureSize !== null &&
    caps.maxTextureSize >= 8192 &&
    caps.maxRenderbufferSize !== null &&
    caps.maxRenderbufferSize >= 8192 &&
    caps.shaderPrecision !== null &&
    caps.shaderPrecision >= 23;
  const cpu = caps.hardwareConcurrency !== null && caps.hardwareConcurrency > 4;
  const memory = caps.deviceMemory === null || caps.deviceMemory >= 4;
  return sufficient && cpu && memory
    ? {
        quality: "high",
        reason: [
          "WebGL2 context succeeded.",
          "Texture/renderbuffer limits ≥ 8192; high float precision ≥ 23.",
          "CPU concurrency > 4; available memory hint supports this budget.",
        ],
      }
    : {
        quality: "medium",
        reason: [
          "WebGL2 supports the material system.",
          "Conservative MEDIUM: capability or CPU/memory hints are limited or uncertain.",
        ],
      };
}
