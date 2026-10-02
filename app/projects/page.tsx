import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/project-card";
export const metadata: Metadata = {
  title: "Project Archive",
  description:
    "Marcell’s engineering project archive. Explore software, intelligent systems, game development, and experimental technology.",
  alternates: { canonical: "/projects" },
};
export default function ProjectsPage() {
  return (
    <div className="route-page">
      <div className="breadcrumb mono">
        <Link href="/">MARCELL.OS</Link>
        <span>/</span>
        <span>PROJECTS</span>
      </div>
      <div className="route-hero">
        <p className="eyebrow">
          PROJECT DATABASE / {projects.length.toString().padStart(2, "0")} MODULES
        </p>
        <h1>
          Ideas into
          <br />
          <span className="gradient-text">working systems.</span>
        </h1>
        <p>
          Android visual assistance, platform workflows, modular game systems, and search-based game
          AI. Four projects, explained through the engineering behind them.
        </p>
      </div>
      <div className="archive-grid">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      <p className="section-footnote mono">
        PROJECT FACTS / CURRENT RESULTS / FUTURE WORK — CLEARLY SEPARATED
      </p>
    </div>
  );
}
