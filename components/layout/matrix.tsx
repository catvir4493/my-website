"use client";
import { useEffect, useRef } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

export function Matrix({ onStop }: { onStop: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { lite, dormant } = useMotionPreferences();
  useEffect(() => {
    const el = canvas.current;
    if (!el || lite || dormant) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;
    };
    resize();
    const drops = Array.from({ length: Math.ceil(el.width / 24) }, (_, i) => -(i % 19));
    const timer = setInterval(() => {
      ctx.fillStyle = "rgba(5,8,9,.07)";
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.font = "13px monospace";
      ctx.fillStyle = "#94e7af";
      drops.forEach((drop, i) => {
        ctx.fillText(Math.random() > 0.5 ? "1" : "0", i * 24, drop * 21);
        drops[i] = drop * 21 > el.height && Math.random() > 0.97 ? 0 : drop + 1;
      });
    }, 85);
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", resize);
    };
  }, [lite, dormant]);
  return (
    <div className="matrix-effect">
      <canvas ref={canvas} aria-hidden="true" />
      <button onClick={onStop} className="mono">
        DATA STREAM ACTIVE / STOP ×
      </button>
    </div>
  );
}
