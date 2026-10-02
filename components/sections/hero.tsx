"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Command,
  Cpu,
  FlaskConical,
  FolderOpen,
  UserRound,
} from "lucide-react";
import { Core } from "@/components/three/core";
import { FocusTicker } from "@/components/ui/focus-ticker";
import { openPalette } from "@/lib/events";
import { projects } from "@/data/projects";
import { system } from "@/data/system";
import { ProjectLink } from "@/components/visual/route-transition";
import { projectAmbient } from "@/components/visual/project-ambient";

const destinations = [
  {
    number: "01",
    icon: UserRound,
    title: "Engineer profile",
    subtitle: "The human behind the system",
    href: "/#about",
  },
  {
    number: "02",
    icon: FolderOpen,
    title: "Project archive",
    subtitle: "Ideas, compiled into reality",
    href: "/projects",
  },
  {
    number: "03",
    icon: Cpu,
    title: "Tech stack",
    subtitle: "Tools of the trade",
    href: "/#skills",
  },
  {
    number: "04",
    icon: FlaskConical,
    title: "Engineering lab",
    subtitle: "Curiosity, in execution",
    href: "/lab",
  },
];
export function Hero() {
  const [signal, setSignal] = useState<string | null>(null);
  const active = projects.find((project) => project.slug === signal);
  return (
    <section id="home" className="hero">
      <div className="hero-topline mono">
        <span>
          <i className="tiny-cross" /> PERSONAL SYSTEM / V.{system.version} / {system.release}
        </span>
        <span>47.4979° N &nbsp; 19.0402° E</span>
      </div>
      <div className="hero-main">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-square" /> COMPUTER ENGINEERING STUDENT
          </p>
          <h1>
            Marcell.
            <br />
            <span className="hero-outline">Built to</span>
            <br />
            <span className="gradient-text">think ahead.</span>
          </h1>
          <div className="hero-description">
            <span className="vertical-rule" />
            <p>
              At the intersection of hardware, software,
              <br className="desktop-break" /> and human possibility.
              <br />
              Turning curiosity into working systems.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="button primary" href="/projects">
              Explore my work <ArrowUpRight size={17} />
            </Link>
            <Link className="button secondary" href="/lab">
              <FlaskConical size={16} /> Enter the lab
            </Link>
          </div>
          <div className="hero-tags mono">
            <span>SYSTEMS</span>
            <i>/</i>
            <span>SOFTWARE</span>
            <i>/</i>
            <span>AI</span>
            <i>/</i>
            <span>WHAT’S NEXT</span>
          </div>
        </div>
        <div
          className="hero-visual"
          data-cursor-glow
          style={active ? projectAmbient(active) : undefined}
        >
          <div className="core-environment" aria-hidden="true">
            <div className="core-calibration" />
            <span className="core-environment-label mono">COMPUTE ASSEMBLY / EXPLODED VIEW</span>
          </div>
          <div className="core-crosshair top-left" />
          <div className="core-crosshair bottom-right" />
          <div className="core-label mono">
            <span className="text-cyan">[ COMPUTE CORE ]</span>
            <FocusTicker />
          </div>
          <Core signal={signal} color={active?.ambientPrimary || "#80ddeb"} />
          <div className="core-project-nodes" aria-label="Compute core project navigation">
            {projects.map((project, index) => (
              <ProjectLink
                project={project}
                className={`core-project-node node-${index} accent-${project.accent}`}
                data-active={signal === project.slug}
                key={project.slug}
                style={projectAmbient(project)}
                onMouseEnter={() => setSignal(project.slug)}
                onMouseLeave={() => setSignal(null)}
                onFocus={() => setSignal(project.slug)}
                onBlur={() => setSignal(null)}
              >
                <i />
                <span className="mono">
                  {["VISION", "AIRPOCKET", "GAME SYSTEMS", "ALGORITHMS"][index]}
                </span>
                <ArrowUpRight size={13} />
              </ProjectLink>
            ))}
          </div>
          <div className="floating-label label-left mono">
            <span>01 / INPUT</span>
            <strong>CURIOSITY</strong>
            <div className="signal-line" />
          </div>
          <div className="floating-label label-right mono">
            <span>02 / PROCESS</span>
            <strong>BUILD. BREAK. LEARN.</strong>
            <div className="signal-line" />
          </div>
          <div className="core-bottom mono">
            <span className="online">
              <i /> {signal ? "SIGNAL ROUTING" : "CORE ACTIVE"}
            </span>
            <span>
              {active
                ? `PROJECT_${active.id} / ${active.name.toUpperCase()}`
                : "HUMAN × TECHNOLOGY"}
            </span>
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <a href="#about" className="scroll-prompt">
          <ArrowDown size={15} />
          <span>SCROLL TO EXPLORE</span>
        </a>
        <button className="command-hint" onClick={openPalette}>
          <Command size={13} />
          <kbd>Ctrl K</kbd>
          <span>Navigate the system</span>
        </button>
        <span className="mono hero-bottom-caption">IDEAS → SYSTEMS → IMPACT</span>
      </div>
      <div className="module-grid">
        {destinations.map(({ icon: Icon, ...item }) => (
          <Link key={item.number} href={item.href} className="module-link">
            <span className="module-number mono">/{item.number}</span>
            <Icon className="module-icon" size={24} strokeWidth={1.3} />
            <div>
              <h2>{item.title}</h2>
              <p>{item.subtitle}</p>
            </div>
            <ArrowUpRight size={17} className="module-arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
