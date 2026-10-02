import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function ProjectsSection() {
  return (
    <section id="projects" className="section">
      <Reveal>
        <SectionHeading number="02" eyebrow="SELECTED SYSTEM MODULES" title="Curiosity, compiled.">
          <Link href="/projects" className="text-link">
            Full project archive <ArrowUpRight size={16} />
          </Link>
        </SectionHeading>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
        <p className="section-footnote mono">
          ANDROID VISION / PLATFORM DESIGN / GAME SYSTEMS / C ALGORITHMS
        </p>
      </Reveal>
    </section>
  );
}
