"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  Suspense,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  getGraphicsProfile,
  getServerGraphicsProfile,
  subscribeGraphicsProfile,
  refreshGraphicsProfile,
  serverProfile,
} from "@/lib/graphics/profile";
import { motionTiming, systemEase } from "@/lib/motion";

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const visibilitySnapshot = () => document.hidden;
const GraphicsDebug = dynamic(() => import("@/components/visual/graphics-debug"), { ssr: false });
function GraphicsQuerySync() {
  const search = useSearchParams();
  useEffect(() => {
    refreshGraphicsProfile();
  }, [search]);
  return null;
}
const MotionContext = createContext({
  paused: false,
  lite: true,
  quality: serverProfile.quality,
  graphics: serverProfile,
  dormant: false,
  commandMode: false,
  shellMode: false,
  quiet: false,
  reducedMotion: false,
  setCommandMode: (() => {}) as (value: boolean) => void,
  setShellMode: (() => {}) as (value: boolean) => void,
  toggle: () => {},
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const graphics = useSyncExternalStore(
    subscribeGraphicsProfile,
    getGraphicsProfile,
    getServerGraphicsProfile,
  );
  const quality = graphics.quality;
  const hidden = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, () => false);
  const [commandMode, setCommandMode] = useState(false);
  const [shellMode, setShellMode] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const reducedMotion = graphics.reducedMotion;
  useEffect(() => {
    let last = 0;
    let timer: ReturnType<typeof setTimeout>;
    const activity = () => {
      const now = performance.now();
      if (now - last < 800) return;
      last = now;
      setQuiet(false);
      clearTimeout(timer);
      timer = setTimeout(() => setQuiet(true), 12000);
    };
    timer = setTimeout(() => setQuiet(true), 12000);
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener("visibilitychange", activity);
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, activity));
      document.removeEventListener("visibilitychange", activity);
    };
  }, []);
  // Legacy motion consumers use lite only for motion preference/product policy.
  const lite = reducedMotion || graphics.mobileStaticCorePolicy;
  const dormant = paused || hidden;
  return (
    <MotionContext.Provider
      value={{
        paused,
        lite,
        quality,
        graphics,
        dormant,
        commandMode,
        shellMode,
        quiet,
        reducedMotion,
        setCommandMode,
        setShellMode,
        toggle: () => setPaused((value) => !value),
      }}
    >
      <MotionConfig
        reducedMotion={paused || reducedMotion ? "always" : "user"}
        transition={{ duration: motionTiming.standard, ease: systemEase }}
      >
        <div
          className="system-root"
          data-motion={paused ? "paused" : "active"}
          data-lite={lite}
          data-quality={quality}
          data-layout={graphics.layoutClass}
          data-pointer={graphics.pointerType}
          data-hover={graphics.hoverCapable}
          data-mobile-static-core={graphics.mobileStaticCorePolicy}
          data-graphics-ready={graphics.ready}
          data-graphics-probe={graphics.capabilities.probeMethod || "pending"}
          data-dormant={dormant}
          data-command-mode={commandMode}
          data-shell-mode={shellMode}
          data-quiet={quiet}
          data-reduced-motion={reducedMotion}
          data-system-state={commandMode || shellMode ? "FOCUS" : quiet ? "IDLE" : "ACTIVE"}
        >
          <Suspense fallback={null}>
            <GraphicsQuerySync />
          </Suspense>
          {children}
          {graphics.debug && <GraphicsDebug />}
        </div>
      </MotionConfig>
    </MotionContext.Provider>
  );
}
export const useMotionPreferences = () => useContext(MotionContext);
