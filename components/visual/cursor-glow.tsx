"use client";
import { useEffect } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

// Event-driven, one frame per pointer update, with no React renders or idle loop.
export function CursorGlow() {
  const { quality, dormant, commandMode, shellMode, quiet } = useMotionPreferences();
  useEffect(() => {
    if (
      quality === "low" ||
      dormant ||
      quiet ||
      commandMode ||
      shellMode ||
      !matchMedia("(pointer: fine)").matches
    )
      return;
    let frame = 0;
    let previous: HTMLElement | null = null;
    const move = (event: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const surface =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>("[data-cursor-glow]")
            : null;
        if (previous !== surface) previous?.style.removeProperty("--cursor-strength");
        previous = surface;
        if (!surface) return;
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
        surface.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
        surface.style.setProperty("--cursor-strength", "1");
      });
    };
    const clear = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous?.style.removeProperty("--cursor-strength");
      previous = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      clear();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
      window.removeEventListener("scroll", clear);
    };
  }, [quality, dormant, quiet, commandMode, shellMode]);
  return null;
}
