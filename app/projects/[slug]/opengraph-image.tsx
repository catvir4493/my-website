import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { SocialImage } from "@/components/projects/social-image";
export const alt = "Marcell.OS engineering project case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return new ImageResponse(
    <SocialImage
      title={project.name}
      category={`PROJECT_${project.id} / ${project.category}`}
      summary={project.summary}
    />,
    size,
  );
}
