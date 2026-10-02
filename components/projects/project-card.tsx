"use client";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { ProjectVisual } from "./project-visual";
import { ProjectLink } from "@/components/visual/route-transition";
import { projectAmbient } from "@/components/visual/project-ambient";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <ProjectLink
      project={project}
      className={`project-card accent-${project.accent}`}
      data-cursor="OPEN"
      data-project={project.slug}
      data-cursor-glow
      style={projectAmbient(project)}
    >
      <div className="project-card-top mono">
        <span>PROJECT_{project.id}</span>
        <span>{project.featured ? "FLAGSHIP" : "ENGINEERING"}</span>
      </div>
      <ProjectVisual kind={project.kind} />
      <div className="project-card-body">
        <p className="eyebrow">{project.category}</p>
        <h3>
          {project.name}
          <ArrowUpRight size={20} />
        </h3>
        <p>{project.summary}</p>
        <div className="project-tech">
          {project.tech.slice(0, 3).map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        <div className="project-card-status mono">
          <span>
            <i />
            {project.status}
          </span>
          <span>VIEW MODULE</span>
        </div>
      </div>
    </ProjectLink>
  );
}
