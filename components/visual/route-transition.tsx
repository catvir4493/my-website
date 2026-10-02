"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/data/projects";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { projectAmbient } from "./project-ambient";

const TransitionContext = createContext<{
  select: (project: Project) => void;
  selectedSlug: string | null;
}>({ select: () => {}, selectedSlug: null });

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lite, paused } = useMotionPreferences();
  const [selection, setSelection] = useState<{ project: Project; from: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const select = useCallback(
    (project: Project) => {
      if (lite || paused) return;
      setSelection({ project, from: pathname });
    },
    [lite, paused, pathname],
  );
  useEffect(() => {
    if (!selection) return;
    // Keep the identifier through commit, with a fail-safe for cancelled navigation.
    timer.current = setTimeout(() => setSelection(null), pathname === selection.from ? 1800 : 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [selection, pathname]);
  useEffect(() => {
    document.documentElement.dataset.routeState =
      selection && pathname === selection.from ? "departing" : "ready";
    return () => {
      delete document.documentElement.dataset.routeState;
    };
  }, [selection, pathname]);
  return (
    <TransitionContext.Provider value={{ select, selectedSlug: selection?.project.slug || null }}>
      {children}
      {selection && (
        <div
          className="route-signal mono"
          style={projectAmbient(selection.project)}
          aria-hidden="true"
        >
          <span className="route-signal-line" />
          <span>PROJECT_{selection.project.id}</span>
          <strong>{selection.project.name}</strong>
          <small>{pathname === selection.from ? "MODULE SELECTED" : "MODULE READY"}</small>
        </div>
      )}
    </TransitionContext.Provider>
  );
}

type ProjectLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & { project: Project };
export function ProjectLink({ project, onNavigate, ...props }: ProjectLinkProps) {
  const { select, selectedSlug } = useContext(TransitionContext);
  return (
    <Link
      {...props}
      data-selected={selectedSlug === project.slug}
      href={`/projects/${project.slug}`}
      onNavigate={(event) => {
        select(project);
        onNavigate?.(event);
      }}
    />
  );
}
