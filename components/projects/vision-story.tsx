"use client";
import { useEffect, useRef } from "react";
import { ProjectVisual } from "./project-visual";

const phases = ["RAW DETECTION", "SPATIAL INTERPRETATION", "RISK CORRIDOR", "ACTIONABLE FEEDBACK"];

// The existing case-study sections drive this small sidebar continuation. No pinned scrolling.
export function VisionStory() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    // Scope to this case study: streamed, not-yet-mounted segments may coexist in DOM.
    const sections = [
      ...(element
        ?.closest(".project-detail-grid")
        ?.querySelectorAll<HTMLElement>("[data-vision-phase]") || []),
    ];
    if (!element || !sections.length) return;
    let frame = 0;
    let phase = -1;
    let positions: number[] = [];
    const draw = () => {
      frame = 0;
      const marker = scrollY + innerHeight * 0.45;
      const next = Math.max(
        0,
        positions.findLastIndex((top) => top <= marker),
      );
      if (phase === next) return;
      phase = next;
      element.dataset.phase = String(phase);
      const label = element.querySelector(".vision-story-phase");
      if (label) label.textContent = phases[phase];
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const measure = () => {
      positions = sections.map((section) => section.getBoundingClientRect().top + scrollY);
      queue();
    };
    const observer = new ResizeObserver(measure);
    sections.forEach((section) => observer.observe(section));
    measure();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <div ref={ref} className="vision-story" data-phase="0">
      <p className="mono vision-story-phase" aria-live="polite">
        RAW DETECTION
      </p>
      <ProjectVisual kind="vision" shared={false} />
      <p className="vision-story-note">
        Detection → spatial context → risk → feedback. Synthetic system visualization.
      </p>
    </div>
  );
}
