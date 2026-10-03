"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { CoreFallback } from "./core-fallback";

const CoreScene = dynamic(() => import("./core-scene"), {
  ssr: false,
  loading: () => <CoreFallback />,
});
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
  const { dormant, graphics, reducedMotion, quality, commandMode, shellMode, quiet } =
    useMotionPreferences();
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
      data-core-mode={
        graphics.coreWebgl
          ? reducedMotion || dormant || quiet || !visible || !inView
            ? "frozen"
            : "active"
          : "static"
      }
      data-static-policy={
        graphics.mobileStaticCorePolicy
          ? "touch-phone"
          : !graphics.webgl2
            ? "webgl-unavailable"
            : quality === "low"
              ? "low-quality"
              : "none"
      }
      data-system-state={commandMode || shellMode ? "FOCUS" : signal ? "ACTIVE" : "IDLE"}
      style={{ "--core-color": color } as React.CSSProperties}
      role="img"
      aria-label="Floating interactive processor surrounded by orbital data paths"
    >
      <CoreBoundary>
        {!graphics.ready || !graphics.coreWebgl ? (
          <CoreFallback />
        ) : (
          <CoreScene
            paused={dormant || reducedMotion || quiet || !visible || !inView}
            staticMotion={reducedMotion}
            renderDpr={graphics.renderDpr}
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
