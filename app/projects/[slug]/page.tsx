import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, GitBranch, ImageOff } from "lucide-react";
import { projects } from "@/data/projects";
import { siteUrl } from "@/data/profile";
import { ProjectVisual } from "@/components/projects/project-visual";
import { Architecture } from "@/components/projects/architecture";
import { projectAmbient } from "@/components/visual/project-ambient";
import { ProjectLink } from "@/components/visual/route-transition";
import { ProjectIdentity } from "@/components/visual/project-identity";
import { VisionStory } from "@/components/projects/vision-story";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return { title: "Module not found", robots: { index: false } };
  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: project.name,
      description: project.summary,
      url: `/projects/${slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: project.name, description: project.summary },
  };
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.summary,
    url: `${siteUrl}/projects/${slug}`,
    creator: { "@type": "Person", name: "Marcell" },
    keywords: project.tech.join(", "),
  };
  return (
    <article
      className="route-page project-detail"
      data-project={project.slug}
      style={projectAmbient(project)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="breadcrumb mono">
        <Link href="/">MARCELL.OS</Link>
        <span>/</span>
        <Link href="/projects">PROJECTS</Link>
        <span>/</span>
        <span>{project.id}</span>
      </div>
      <div className="project-detail-top">
        <div>
          <p className="eyebrow">
            <ProjectIdentity id={project.id} /> / {project.category}
            {project.featured ? " / FLAGSHIP" : ""}
          </p>
          <h1>{project.name}</h1>
          {project.subtitle && <p lang="zh">{project.subtitle}</p>}
          <p>{project.summary}</p>
        </div>
        <div className="project-detail-meta mono">
          <span className="text-cyan">{project.status}</span>
          <span>ENGINEERING ARCHIVE</span>
        </div>
      </div>
      <div className="project-detail-visual">
        <ProjectVisual kind={project.kind} large />
        <p className="project-visual-note mono">
          SYSTEM VISUALIZATION / SYNTHETIC DIAGRAM / NOT A RUNTIME CAPTURE
        </p>
      </div>
      <div className="project-detail-grid">
        <div className="project-detail-copy">
          <section data-vision-phase={project.kind === "vision" ? "0" : undefined}>
            <p className="eyebrow">01 / PROBLEM</p>
            <h2>Beyond the surface.</h2>
            <p>{project.problem}</p>
          </section>
          <section data-vision-phase={project.kind === "vision" ? "1" : undefined}>
            <p className="eyebrow">02 / SYSTEM IDEA</p>
            <h2>From input to intent.</h2>
            <p>{project.idea}</p>
            <div className="project-tech case-features">
              {project.features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
          </section>
          <section data-vision-phase={project.kind === "vision" ? "2" : undefined}>
            <p className="eyebrow">03 / ARCHITECTURE</p>
            <h2>The system, connected.</h2>
            <Architecture project={project} />
          </section>
          <section data-vision-phase={project.kind === "vision" ? "3" : undefined}>
            <p className="eyebrow">04 / ENGINEERING CHALLENGES</p>
            <h2>The decisions that matter.</h2>
            <div className="case-challenges">
              {project.challenges.map((challenge) => (
                <div key={challenge.title}>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="eyebrow">05 / CURRENT RESULT</p>
            <h2>What works today.</h2>
            {project.performance && (
              <div className="observed-performance">
                <strong>{project.performance.value}</strong>
                <p>{project.performance.context}</p>
              </div>
            )}
            <ul className="case-list">
              {project.results.map((result) => (
                <li key={result}>{result}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="eyebrow">06 / NEXT ITERATION — FUTURE WORK</p>
            <h2>Next questions.</h2>
            <ul className="case-list">
              {project.futureWork.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="eyebrow">07 / BUILD ARTIFACTS</p>
            {project.images.length ? (
              project.images.map((image) => (
                <figure key={image.src}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                  />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))
            ) : (
              <div className="artifact-pending">
                <ImageOff size={26} />
                <div>
                  <h3>SCREENSHOT NOT YET PUBLISHED</h3>
                  <p>BUILD ARTIFACT PENDING / VISUAL DATA UNAVAILABLE</p>
                </div>
              </div>
            )}
          </section>
        </div>
        <aside className="detail-sidebar panel">
          <div className="panel-title mono">
            <span>MODULE INFORMATION</span>
            <span>/{project.id}</span>
          </div>
          {project.kind === "vision" && <VisionStory />}
          <dl>
            <div>
              <dt>STATUS</dt>
              <dd>{project.status}</dd>
            </div>
            <div>
              <dt>TECHNOLOGIES</dt>
              <dd className="project-tech">
                {project.tech.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt>AUTHOR</dt>
              <dd>Marcell</dd>
            </div>
          </dl>
          {project.repository ? (
            <a
              className="button primary"
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitBranch size={16} />
              Repository
            </a>
          ) : (
            <p className="mono">REPOSITORY / NOT CONNECTED</p>
          )}
          {project.demo && (
            <a
              className="button secondary"
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open demo
              <ArrowUpRight size={15} />
            </a>
          )}
          <Link className="button secondary" style={{ marginTop: 22 }} href="/projects">
            Back to archive
          </Link>
        </aside>
      </div>
      <ProjectLink project={next} className="project-next">
        <div>
          <p className="eyebrow">NEXT MODULE / PROJECT_{next.id}</p>
          <h2>{next.name}</h2>
        </div>
        <ArrowUpRight size={30} />
      </ProjectLink>
    </article>
  );
}
