"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const ProjectFocusContext = createContext({
  signal: null as string | null,
  setSignal: (() => {}) as (slug: string | null) => void,
  clearSignal: (() => {}) as (slug: string) => void,
});

export function ProjectFocusProvider({ children }: { children: ReactNode }) {
  const [signal, setSignal] = useState<string | null>(null);
  const clearSignal = useCallback(
    (slug: string) => setSignal((current) => (current === slug ? null : current)),
    [],
  );
  return (
    <ProjectFocusContext.Provider value={{ signal, setSignal, clearSignal }}>
      {children}
    </ProjectFocusContext.Provider>
  );
}
export const useProjectFocus = () => useContext(ProjectFocusContext);
