export const profile = {
  name: "Marcell",
  role: "Computer Engineering Student",
  university: "Budapest University of Technology and Economics",
  universityShort: "BME",
  degree: "mérnökinformatikus",
  location: "Budapest, Hungary",
  github: process.env.NEXT_PUBLIC_GITHUB_URL || "",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
