export type Contact = { name: "GitHub" | "LinkedIn" | "Email"; url: string };
export function githubUsername(): string | null {
  const value = (
    process.env.GITHUB_USERNAME ||
    process.env.NEXT_PUBLIC_GITHUB_USERNAME ||
    ""
  ).trim();
  return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value) && !value.includes("--") ? value : null;
}
function profileUrl(value: string | undefined, host: string): string | null {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" && url.hostname === host && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function getContacts(): Contact[] {
  const owner = githubUsername();
  const github = owner
    ? `https://github.com/${owner}`
    : profileUrl(process.env.NEXT_PUBLIC_GITHUB_URL, "github.com");
  const linkedin =
    profileUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL, "www.linkedin.com") ||
    profileUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL, "linkedin.com");
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return [
    ...(github ? [{ name: "GitHub" as const, url: github }] : []),
    ...(linkedin ? [{ name: "LinkedIn" as const, url: linkedin }] : []),
    ...(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? [{ name: "Email" as const, url: `mailto:${email}` }]
      : []),
  ];
}
