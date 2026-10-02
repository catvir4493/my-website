"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { AmbientLight } from "./ambient-light";
import { DepthGrid } from "./depth-grid";
import { CursorGlow } from "./cursor-glow";

export function VisualEnvironment() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { quality, dormant, commandMode } = useMotionPreferences();
  useEffect(() => {
    const environment = ref.current;
    if (!environment || quality !== "high" || dormant || commandMode) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const draw = () => {
      frame = 0;
      environment.style.setProperty("--parallax-x", `${x}px`);
      environment.style.setProperty("--parallax-y", `${y}px`);
      environment.style.setProperty("--scroll-depth", `${Math.min(window.scrollY * 0.012, 60)}px`);
      // Local core atmosphere and HUD use the same coordinates, different multipliers.
      const hero = document.querySelector<HTMLElement>(".hero-visual");
      hero?.style.setProperty("--parallax-x", `${x}px`);
      hero?.style.setProperty("--parallax-y", `${y}px`);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth - 0.5) * 4;
      y = (event.clientY / window.innerHeight - 0.5) * 4;
      queue();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    queue();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", queue);
      environment.style.removeProperty("--parallax-x");
      environment.style.removeProperty("--parallax-y");
      environment.style.removeProperty("--scroll-depth");
      const hero = document.querySelector<HTMLElement>(".hero-visual");
      hero?.style.removeProperty("--parallax-x");
      hero?.style.removeProperty("--parallax-y");
    };
  }, [quality, dormant, commandMode, pathname]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.setAttribute("data-visual-visible", String(entry.isIntersecting));
          if (entry.isIntersecting && ref.current) {
            ref.current.dataset.section =
              entry.target.id || (pathname === "/lab" ? "lab" : "projects");
          }
        });
      },
      { rootMargin: "-15% 0px -25% 0px" },
    );
    document
      .querySelectorAll(
        "main section.section, .hero, .project-detail-visual, .route-hero, .project-visual, .system-architecture",
      )
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);
  return (
    <>
      <div ref={ref} className="visual-environment" aria-hidden="true">
        <div className="depth-background" data-depth="background" />
        <DepthGrid />
        <AmbientLight />
        <div className="digital-noise" />
      </div>
      <CursorGlow />
    </>
  );
}
