"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { AmbientLight } from "./ambient-light";
import { DepthGrid } from "./depth-grid";
import { CursorGlow } from "./cursor-glow";
import { MagneticControls } from "./magnetic-controls";
import { useProjectFocus } from "./project-focus";
import { projects } from "@/data/projects";

export function VisualEnvironment() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { quality, dormant, quiet, commandMode, shellMode } = useMotionPreferences();
  const { signal } = useProjectFocus();
  const project = projects.find(
    (item) => item.slug === signal || pathname === `/projects/${item.slug}`,
  );
  useEffect(() => {
    const environment = ref.current;
    if (environment)
      environment.dataset.section =
        pathname === "/" ? "home" : pathname === "/lab" ? "lab" : "projects";
    if (!environment || dormant || quiet || commandMode || shellMode) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    let active: HTMLElement | undefined;
    let handoffTimer: ReturnType<typeof setTimeout>;
    const hero = document.querySelector<HTMLElement>(".hero");
    const sections = [
      ...document.querySelectorAll<HTMLElement>(
        "main .hero, main section.section, main .route-hero",
      ),
    ];
    let positions: { element: HTMLElement; top: number }[] = [];
    let heroHeight = 1;
    const measure = () => {
      positions = sections.map((element) => ({
        element,
        top: element.getBoundingClientRect().top + window.scrollY,
      }));
      heroHeight = hero?.offsetHeight || 1;
    };
    const draw = () => {
      frame = 0;
      if (quality === "high") {
        environment.style.setProperty("--parallax-x", `${x}px`);
        environment.style.setProperty("--parallax-y", `${y}px`);
        environment.style.setProperty(
          "--scroll-depth",
          `${Math.min(window.scrollY * 0.012, 60)}px`,
        );
        hero?.style.setProperty(
          "--camera-progress",
          String(Math.min(1, window.scrollY / (heroHeight * 0.8))),
        );
      }
      // Local core atmosphere and HUD use the same coordinates, different multipliers.
      const visual = hero?.querySelector<HTMLElement>(".hero-visual");
      visual?.style.setProperty("--parallax-x", `${x}px`);
      visual?.style.setProperty("--parallax-y", `${y}px`);
      const focus = window.scrollY + window.innerHeight * 0.4;
      const next = positions.filter(({ top }) => top <= focus).at(-1)?.element || sections[0];
      if (next && next !== active) {
        const previous = active;
        active = next;
        environment.dataset.section = next.id || (pathname === "/lab" ? "lab" : "projects");
        sections.forEach(
          (section) =>
            (section.dataset.attention =
              section === next ? "focus" : section.offsetTop < next.offsetTop ? "past" : "next"),
        );
        if (previous && quality !== "low") {
          environment.dataset.handoff = "false";
          // Re-arm a single signal after each real section change, never continuously.
          void environment.offsetWidth;
          environment.dataset.handoff = "true";
          clearTimeout(handoffTimer);
          handoffTimer = setTimeout(() => {
            environment.dataset.handoff = "false";
          }, 700);
        }
      }
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (quality !== "high") return;
      x = (event.clientX / window.innerWidth - 0.5) * 4;
      y = (event.clientY / window.innerHeight - 0.5) * 4;
      environment.style.setProperty("--ambient-camera-x", `${50 + x * 4}%`);
      queue();
    };
    const resize = () => {
      measure();
      queue();
    };
    const layout = new ResizeObserver(resize);
    sections.forEach((section) => layout.observe(section));
    measure();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    queue();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(handoffTimer);
      layout.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", resize);
      environment.style.removeProperty("--parallax-x");
      environment.style.removeProperty("--parallax-y");
      environment.style.removeProperty("--scroll-depth");
      const visual = hero?.querySelector<HTMLElement>(".hero-visual");
      visual?.style.removeProperty("--parallax-x");
      visual?.style.removeProperty("--parallax-y");
    };
  }, [quality, dormant, quiet, commandMode, shellMode, pathname]);
  useEffect(() => {
    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.setAttribute("data-visual-visible", String(entry.isIntersecting));
          // Technical diagrams draw once on entry; later scrolling does not restart them.
          if (entry.isIntersecting) entry.target.setAttribute("data-visual-entered", "true");
        });
      },
      { rootMargin: "-15% 0px -25% 0px" },
    );
    const collect = () =>
      document
        .querySelectorAll(
          "main section.section, .hero, .project-detail-visual, .route-hero, .project-visual, .system-architecture",
        )
        .forEach((section) => {
          if (!observed.has(section)) {
            observed.add(section);
            observer.observe(section);
          }
        });
    collect();
    // A real loading.tsx fallback may commit before its diagram. Observe that handoff too.
    const loading = new MutationObserver(collect);
    const main = document.querySelector("main");
    if (main) loading.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      loading.disconnect();
    };
  }, [pathname]);
  return (
    <>
      <div
        ref={ref}
        className="visual-environment"
        aria-hidden="true"
        data-project-focus={project?.slug || "none"}
        style={
          project
            ? ({
                "--ambient-primary": project.ambientPrimary,
                "--ambient-secondary": project.ambientSecondary,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="depth-background" data-depth="background" />
        <DepthGrid />
        <AmbientLight />
        <div className="digital-noise" />
        <svg className="section-handoff" viewBox="0 0 80 180" fill="none">
          <path
            className="handoff-trace"
            d="M40 0V50L18 72V108L40 130V180M40 50L62 72V108L40 130"
          />
          <circle className="handoff-origin" cx="40" cy="50" r="3" />
          <circle className="handoff-node" cx="18" cy="90" r="3" />
          <circle className="handoff-node" cx="62" cy="90" r="3" />
          <circle className="handoff-destination" cx="40" cy="130" r="3" />
        </svg>
      </div>
      <CursorGlow />
      <MagneticControls />
    </>
  );
}
