"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

const CoreScene = dynamic(() => import("./core-scene"), {
  ssr: false,
  loading: () => <CoreFallback />,
});
function CoreFallback() {
  return (
    <div className="core-fallback" aria-hidden="true">
      <div className="fallback-orbit" />
      <div className="fallback-orbit second" />
      <div className="fallback-circuit" />
      <div className="fallback-chip">
        <span>M</span>
        <strong>MARCELL.OS</strong>
        <small>COMPUTE CORE / 01</small>
      </div>
    </div>
  );
}
class CoreBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <CoreFallback /> : this.props.children;
  }
}
export function Core({ signal, color }: { signal: string | null; color: string }) {
  const { dormant, lite, quality, commandMode, shellMode, quiet } = useMotionPreferences();
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "80px",
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={container}
      className="core-canvas"
      data-signal={signal || "idle"}
      data-system-state={commandMode || shellMode ? "FOCUS" : signal ? "ACTIVE" : "IDLE"}
      style={{ "--core-color": color } as React.CSSProperties}
      role="img"
      aria-label="Floating interactive processor surrounded by orbital data paths"
    >
      <CoreBoundary>
        {lite ? (
          <CoreFallback />
        ) : (
          <CoreScene
            paused={dormant || quiet || !visible || !inView}
            signal={signal}
            color={color}
            quality={quality}
            commandMode={commandMode || shellMode}
          />
        )}
      </CoreBoundary>
    </div>
  );
}
