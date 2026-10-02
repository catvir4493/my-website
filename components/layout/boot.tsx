"use client";
import { useEffect } from "react";

export function Boot({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.intro = "starting";
    const skip = () => onComplete();
    window.addEventListener("scroll", skip, { once: true, passive: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    // Safety only: animationend normally completes the nonblocking 1.3s sequence.
    const finish = setTimeout(onComplete, 1800);
    return () => {
      root.dataset.intro = "stable";
      clearTimeout(finish);
      window.removeEventListener("scroll", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onComplete]);
  return (
    <div
      className="hero-startup"
      role="status"
      aria-live="polite"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onComplete();
      }}
    >
      <span className="mono">INITIALIZING VISUAL CORE</span>
      <button onClick={onComplete} aria-label="Enter system, skip boot sequence">
        ENTER SYSTEM <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
