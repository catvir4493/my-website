"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotionPreferences } from "@/components/ui/motion-provider";

export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const { lite, dormant, shellMode } = useMotionPreferences();
  const pathname = usePathname();
  useEffect(() => {
    if (lite || dormant || shellMode || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ring.current;
    const center = dot.current;
    if (!el || !center) return;
    let frame = 0;
    let x = -100;
    let y = -100;
    const queue = () => {
      if (x < 0 || y < 0) return;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          const hit = document.elementFromPoint(x, y);
          if (hit?.closest("input, textarea, [contenteditable=true]")) {
            hide();
            return;
          }
          const target = hit?.closest("a, button, [data-cursor]");
          el!.dataset.hover = target ? "true" : "false";
          el!.textContent = target?.getAttribute("data-cursor") || "";
          el!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          center!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          el!.style.opacity = "1";
          center!.style.opacity = "1";
        });
    };
    function move(event: PointerEvent) {
      x = event.clientX;
      y = event.clientY;
      queue();
    }
    const hide = () => {
      el.style.opacity = "0";
      center.style.opacity = "0";
    };
    const leave = () => {
      x = y = -100;
      hide();
    };
    document.documentElement.classList.add("custom-cursor-enabled");
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", queue, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", queue);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("custom-cursor-enabled");
      hide();
    };
  }, [lite, dormant, shellMode, pathname]);
  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
