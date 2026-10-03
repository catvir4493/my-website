// One-shot, local capability probe. No rendering, telemetry or persistent storage.
let gl;
try {
  if (typeof OffscreenCanvas === "undefined") {
    globalThis.postMessage({ unsupported: true });
  } else {
    gl = new OffscreenCanvas(1, 1).getContext("webgl2", {
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) globalThis.postMessage({ unsupported: true });
    else
      globalThis.postMessage({
        webgl2: true,
        contextSuccess: true,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        shaderPrecision:
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ?? null,
      });
  }
} catch {
  globalThis.postMessage({ unsupported: true });
} finally {
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
}
