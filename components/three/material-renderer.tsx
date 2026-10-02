"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { VisualQuality } from "@/lib/visual-quality";

export function MaterialRenderer({
  quality,
  onReady,
  onFault,
  mode,
}: {
  quality: VisualQuality;
  onReady: () => void;
  onFault: () => void;
  mode: string;
}) {
  const get = useThree((state) => state.get);
  const ready = useRef(false);
  useEffect(() => {
    let disposed = false;
    ready.current = false;
    const { gl, scene, camera, invalidate } = get();
    let failed = false;
    const previous = gl.debug.onShaderError;
    const handleError = () => {
      failed = true;
      if (ready.current) {
        ready.current = false;
        queueMicrotask(() => {
          if (!disposed) onFault();
        });
      }
    };
    gl.debug.onShaderError = handleError;
    // KHR_parallel_shader_compile avoids blocking the UI on first use. Three also
    // handles browsers without the extension and materials disposed during compilation.
    void gl
      .compileAsync(scene, camera)
      .then(() => {
        if (disposed) return;
        // compileAsync waits for parallel completion, but link errors are normally
        // reported on first render. Inspect them before revealing the canvas.
        const context = gl.getContext();
        failed ||= (gl.info.programs || []).some(
          (program) =>
            !context.getProgramParameter(program.program as WebGLProgram, context.LINK_STATUS),
        );
        if (failed) {
          onFault();
          return;
        }
        ready.current = true;
        onReady();
        invalidate();
      })
      .catch(() => {
        if (!disposed) onFault();
      });
    return () => {
      disposed = true;
      ready.current = false;
      if (gl.debug.onShaderError === handleError) gl.debug.onShaderError = previous;
    };
  }, [get, quality, mode, onReady, onFault]);
  // Positive priority takes ownership of the single renderer. Cadence remains
  // demand-driven; no second canvas, postprocessing pass or continuous RAF.
  useFrame(({ gl, scene, camera }) => {
    if (ready.current) gl.render(scene, camera);
  }, 1);
  return null;
}
