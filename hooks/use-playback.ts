"use client";
import { useEffect, useState } from "react";
import { useMotionPreferences } from "@/components/ui/motion-provider";

export function usePlayback(total: number, delay: number) {
  const [state, setState] = useState({ index: 0, running: false });
  const { dormant } = useMotionPreferences();
  useEffect(() => {
    if (!state.running || dormant) return;
    const timer = setTimeout(
      () =>
        setState((value) => {
          const index = Math.min(value.index + 1, Math.max(0, total - 1));
          return { index, running: index < total - 1 };
        }),
      delay,
    );
    return () => clearTimeout(timer);
  }, [state, total, delay, dormant]);
  return {
    ...state,
    reset: () => setState({ index: 0, running: false }),
    play: () =>
      setState((value) => ({ index: value.index >= total - 1 ? 0 : value.index, running: true })),
    pause: () => setState((value) => ({ ...value, running: false })),
    seek: (index: number) => setState({ index: Math.max(0, index), running: false }),
    step: () =>
      setState((value) => ({
        index: Math.min(value.index + 1, Math.max(0, total - 1)),
        running: false,
      })),
  };
}
