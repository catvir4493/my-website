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
import { projectIdentifier } from "./project-identity";
import { useProjectFocus } from "./project-focus";

const TransitionContext = createContext<{
  select: (project: Project) => void;
  selectedSlug: string | null;
}>({ select: () => {}, selectedSlug: null });

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setSignal } = useProjectFocus();
  const { lite, paused } = useMotionPreferences();
  const [selection, setSelection] = useState<{
    project: Project;
    from: string;
    ready: boolean;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const select = useCallback(
    (project: Project) => {
      if (lite || paused) return;
      setSelection({ project, from: pathname, ready: false });
    },
    [lite, paused, pathname],
  );
  useEffect(() => {
    const cancel = () => {
      setSelection(null);
      setSignal(null);
    };
    window.addEventListener("popstate", cancel);
    return () => window.removeEventListener("popstate", cancel);
  }, [setSignal]);
  useEffect(() => {
    if (!selection || selection.ready) return;
    const resolve = () => {
      if (document.querySelector(`.project-detail[data-project="${selection.project.slug}"]`))
        setSelection((current) =>
          current?.project.slug === selection.project.slug ? { ...current, ready: true } : current,
        );
    };
    const frame = requestAnimationFrame(resolve);
    const observer = new MutationObserver(resolve);
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [selection]);
  useEffect(() => {
    if (!selection) return;
    // Keep the identifier through commit, with a fail-safe for cancelled navigation.
    timer.current = setTimeout(
      () => {
        setSelection(null);
        setSignal(null);
      },
      selection.ready ? 650 : 10000,
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [selection, pathname, setSignal]);
  useEffect(() => {
    document.documentElement.dataset.routeState =
      selection && !selection.ready ? "departing" : "ready";
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
          data-state={
            selection.ready ? "TRANSITION" : pathname === selection.from ? "LOCKED" : "LOADING"
          }
        >
          <span className="route-signal-line" />
          <span>{projectIdentifier(selection.project.id)}</span>
          <strong>{selection.project.name}</strong>
          <small>
            {selection.ready
              ? "MODULE READY"
              : pathname === selection.from
                ? "PROJECT SIGNAL ACQUIRED"
                : "RESOLVING MODULE"}
          </small>
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
      data-cursor="OPEN"
      {...props}
      data-selected={selectedSlug === project.slug}
      data-system-state={selectedSlug === project.slug ? "LOCKED" : "IDLE"}
      href={`/projects/${project.slug}`}
      onNavigate={(event) => {
        select(project);
        onNavigate?.(event);
      }}
    />
  );
}
