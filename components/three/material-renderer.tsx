"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { VisualQuality } from "@/lib/visual-quality";

export function MaterialRenderer({
  quality,
  onReady,
}: {
  quality: VisualQuality;
  onReady: () => void;
}) {
  const get = useThree((state) => state.get);
  const ready = useRef(false);
  useEffect(() => {
    let disposed = false;
    ready.current = false;
    const { gl, scene, camera, invalidate } = get();
    // KHR_parallel_shader_compile avoids blocking the UI on first use. Three also
    // handles browsers without the extension and materials disposed during compilation.
    void gl.compileAsync(scene, camera).then(() => {
      if (disposed) return;
      ready.current = true;
      onReady();
      invalidate();
    });
    return () => {
      disposed = true;
      ready.current = false;
    };
  }, [get, quality, onReady]);
  // Positive priority takes ownership of the single renderer. Cadence remains
  // demand-driven; no second canvas, postprocessing pass or continuous RAF.
  useFrame(({ gl, scene, camera }) => {
    if (ready.current) gl.render(scene, camera);
  }, 1);
  return null;
}
