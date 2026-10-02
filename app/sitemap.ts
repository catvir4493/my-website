import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/profile";
import { projects } from "@/data/projects";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/projects", "/lab", ...projects.map((project) => `/projects/${project.slug}`)].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "monthly",
      priority: path === "" ? 1 : 0.7,
    }),
  );
}
