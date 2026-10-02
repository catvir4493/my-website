"use client";
import { useEffect, useRef } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const { lite, dormant } = useMotionPreferences();
  useEffect(() => {
    if (lite || dormant || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ring.current;
    const center = dot.current;
    if (!el || !center) return;
    let frame = 0;
    let x = -100;
    let y = -100;
    function move(event: PointerEvent) {
      x = event.clientX;
      y = event.clientY;
      const target =
        event.target instanceof Element
          ? event.target.closest("a, button, input, [data-cursor]")
          : null;
      el!.dataset.hover = target ? "true" : "false";
      el!.textContent = target?.getAttribute("data-cursor") || (target?.tagName === "A" ? "↗" : "");
      if (!frame)
        frame = requestAnimationFrame(() => {
          el!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          center!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          el!.style.opacity = "1";
          center!.style.opacity = "1";
          frame = 0;
        });
    }
    const hide = () => {
      el.style.opacity = "0";
      center.style.opacity = "0";
    };
    document.documentElement.classList.add("custom-cursor-enabled");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      document.documentElement.classList.remove("custom-cursor-enabled");
    };
  }, [lite, dormant]);
  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
