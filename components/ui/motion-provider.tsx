"use client";
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { getVisualQuality, subscribeVisualQuality, type VisualQuality } from "@/lib/visual-quality";
import { motionTiming, systemEase } from "@/lib/motion";

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const visibilitySnapshot = () => document.hidden;
const MotionContext = createContext({
  paused: false,
  lite: true,
  quality: "low" as VisualQuality,
  dormant: false,
  commandMode: false,
  setCommandMode: (() => {}) as (value: boolean) => void,
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
        setCommandMode,
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
        >
          {children}
        </div>
      </MotionConfig>
    </MotionContext.Provider>
  );
}
export const useMotionPreferences = () => useContext(MotionContext);
