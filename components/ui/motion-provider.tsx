"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
import { getVisualQuality, subscribeVisualQuality, type VisualQuality } from "@/lib/visual-quality";
import { motionTiming, systemEase } from "@/lib/motion";

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const visibilitySnapshot = () => document.hidden;
const reducedSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MotionContext = createContext({
  paused: false,
  lite: true,
  quality: "low" as VisualQuality,
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
  const quality = useSyncExternalStore(
    subscribeVisualQuality,
    getVisualQuality,
    () => "low" as VisualQuality,
  );
  const hidden = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, () => false);
  const [commandMode, setCommandMode] = useState(false);
  const [shellMode, setShellMode] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeVisualQuality, reducedSnapshot, () => false);
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
  const lite = quality === "low";
  const dormant = paused || hidden;
  return (
    <MotionContext.Provider
      value={{
        paused,
        lite,
        quality,
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
        reducedMotion={paused || lite ? "always" : "user"}
        transition={{ duration: motionTiming.standard, ease: systemEase }}
      >
        <div
          className="system-root"
          data-motion={paused ? "paused" : "active"}
          data-lite={lite}
          data-quality={quality}
          data-dormant={dormant}
          data-command-mode={commandMode}
          data-shell-mode={shellMode}
          data-quiet={quiet}
          data-reduced-motion={reducedMotion}
          data-system-state={commandMode || shellMode ? "FOCUS" : quiet ? "IDLE" : "ACTIVE"}
        >
          {children}
        </div>
      </MotionConfig>
    </MotionContext.Provider>
  );
}
export const useMotionPreferences = () => useContext(MotionContext);
