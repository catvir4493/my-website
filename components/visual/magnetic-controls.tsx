"use client";
import { useEffect } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

// Delegated input updates only: a maximum 4px attraction, no idle animation loop.
export function MagneticControls() {
  const { quality, dormant, quiet, commandMode, shellMode } = useMotionPreferences();
  useEffect(() => {
    if (
      quality !== "high" ||
      dormant ||
      quiet ||
      commandMode ||
      shellMode ||
      !matchMedia("(pointer: fine)").matches
    )
      return;
    let current: HTMLElement | null = null;
    let frame = 0;
    let x = 0,
      y = 0;
    const reset = () => {
      current?.style.removeProperty("--magnetic-x");
      current?.style.removeProperty("--magnetic-y");
      current = null;
    };
    const move = (event: PointerEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-magnetic]")
          : null;
      if (target !== current) {
        reset();
        current = target;
      }
      if (!current) return;
      const box = current.getBoundingClientRect();
      x = Math.max(-4, Math.min(4, (event.clientX - box.left - box.width / 2) * 0.04));
      y = Math.max(-4, Math.min(4, (event.clientY - box.top - box.height / 2) * 0.06));
      if (!frame)
        frame = requestAnimationFrame(() => {
          current?.style.setProperty("--magnetic-x", `${x}px`);
          current?.style.setProperty("--magnetic-y", `${y}px`);
          frame = 0;
        });
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", reset, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      reset();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", reset);
      document.removeEventListener("pointerleave", reset);
    };
  }, [quality, dormant, quiet, commandMode, shellMode]);
  return null;
}
