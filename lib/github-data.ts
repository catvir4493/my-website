import type { GitHubTelemetry, PublicRepository, PublicSignal } from "./github-types";
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
const date = (value: unknown): string | null =>
  typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
const text = (value: unknown, limit = 300): string | null =>
  typeof value === "string" && value.trim() ? value.slice(0, limit) : null;
export function parsePublicGitHub(
  username: string,
  user: unknown,
  repositories: unknown,
  events: unknown,
  now = new Date(),
): Extract<GitHubTelemetry, { status: "connected" }> {
  const account = object(user);
  if (
    typeof account.login !== "string" ||
    account.login.toLowerCase() !== username.toLowerCase() ||
    !Number.isSafeInteger(account.public_repos) ||
    (account.public_repos as number) < 0 ||
    !Array.isArray(repositories)
  )
    throw new Error("Invalid public GitHub response");
  const repos: PublicRepository[] = repositories
    .flatMap((value) => {
      const repo = object(value);
      const owner = object(repo.owner);
      const name = text(repo.name, 100);
      const updated = date(repo.updated_at);
      // Only this owner's explicitly public repositories. URLs are constructed from verified names.
      if (
        repo.private !== false ||
        (repo.visibility && repo.visibility !== "public") ||
        typeof owner.login !== "string" ||
        owner.login.toLowerCase() !== username.toLowerCase() ||
        !name ||
        !updated
      )
        return [];
      return [
        {
          name,
          url: `https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(name)}`,
          description: text(repo.description),
          language: text(repo.language, 80),
          updatedAt: updated,
        },
      ];
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const signals: PublicSignal[] = Array.isArray(events)
    ? events
        .flatMap((value) => {
          const event = object(value);
          const repo = object(event.repo);
          const name = text(repo.name, 200);
          const at = date(event.created_at);
          if (event.public !== true || !name || !at || !/^[\w.-]+\/[\w.-]+$/.test(name)) return [];
          const labels: Record<string, string> = {
            PushEvent: "PUSH",
            CreateEvent: "CREATED",
            PullRequestEvent: "PULL REQUEST",
            IssuesEvent: "ISSUE",
            ReleaseEvent: "RELEASE",
            ForkEvent: "FORK",
            WatchEvent: "STAR",
            DeleteEvent: "DELETED",
          };
          const label = typeof event.type === "string" ? labels[event.type] : null;
          if (!label) return [];
          return [
            {
              type: label,
              repository: name,
              url: `https://github.com/${name.split("/").map(encodeURIComponent).join("/")}`,
              at,
            },
          ];
        })
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    : [];
  const languageCounts = new Map<string, number>();
  for (const repo of repos)
    if (repo.language)
      languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
  return {
    status: "connected",
    username,
    url: `https://github.com/${username}`,
    publicRepos: account.public_repos as number,
    repositories: repos.slice(0, 6),
    primaryLanguages: [...languageCounts]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 6),
    recentPush: signals.find((signal) => signal.type === "PUSH")?.at || null,
    signals: signals.slice(0, 6),
    activityAvailable: Array.isArray(events),
    fetchedAt: now.toISOString(),
    repositorySampleSize: repos.length,
  };
}
