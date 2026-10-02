import "server-only";
import { githubUsername } from "@/data/contact";
import { parsePublicGitHub } from "./github-data";
import type { GitHubTelemetry } from "./github-types";
type Cache = { key: string; until: number; value: GitHubTelemetry };
let cache: Cache | null = null;
let pending: { key: string; promise: Promise<GitHubTelemetry> } | null = null;
class GitHubError extends Error {
  constructor(
    public retryAt: number,
    public limited: boolean,
  ) {
    super(limited ? "GitHub rate limit" : "GitHub unavailable");
  }
}
async function publicRequest(path: string, token: string | undefined): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Marcell-OS",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const limited = response.status === 429 || response.status === 403;
    const retry = response.headers.get("retry-after");
    const retryDelay = retry ? Number(retry) : NaN;
    const retryDate = retry && !Number.isFinite(retryDelay) ? Date.parse(retry) : NaN;
    const reset =
      response.headers.get("x-ratelimit-remaining") === "0"
        ? Number(response.headers.get("x-ratelimit-reset")) * 1000
        : NaN;
    const until = Number.isFinite(retryDelay)
      ? Date.now() + retryDelay * 1000
      : Number.isFinite(retryDate)
        ? retryDate
        : Number.isFinite(reset)
          ? reset
          : Date.now() + (limited ? 60000 : 15000);
    throw new GitHubError(Math.max(Date.now() + 1000, until), limited);
  }
  return response.json();
}
export async function getGitHubTelemetry(): Promise<GitHubTelemetry> {
  const owner = githubUsername();
  if (!owner) return { status: "not-connected" };
  const token = process.env.GITHUB_TOKEN?.trim();
  const key = `${owner}:${Boolean(token)}`;
  if (cache?.key === key && cache.until > Date.now()) return cache.value;
  if (pending?.key === key) return pending.promise;
  const promise = (async (): Promise<GitHubTelemetry> => {
    const responses = await Promise.allSettled([
      publicRequest(`/users/${owner}`, token),
      publicRequest(`/users/${owner}/repos?sort=updated&per_page=100&type=owner`, token),
      publicRequest(`/users/${owner}/events/public?per_page=100`, token),
    ]);
    const failures = responses.filter((result) => result.status === "rejected");
    const retryAt = Math.max(
      Date.now() + 15000,
      ...failures.map((result) =>
        result.reason instanceof GitHubError ? result.reason.retryAt : Date.now() + 15000,
      ),
    );
    if (responses[0].status === "fulfilled" && responses[1].status === "fulfilled") {
      try {
        const value = parsePublicGitHub(
          owner,
          responses[0].value,
          responses[1].value,
          responses[2].status === "fulfilled" ? responses[2].value : null,
        );
        cache = { key, until: Math.max(Date.now() + 300000, failures.length ? retryAt : 0), value };
        return value;
      } catch {
        /* Reject malformed responses instead of filling invented defaults. */
      }
    }
    const limited = failures.some(
      (result) => result.reason instanceof GitHubError && result.reason.limited,
    );
    const value: GitHubTelemetry = {
      status: "error",
      message: limited
        ? "GitHub rate limit reached. The signal can be retried after the cooldown."
        : "The public GitHub signal is temporarily unavailable.",
      retryAt: new Date(retryAt).toISOString(),
    };
    cache = { key, until: retryAt, value };
    return value;
  })();
  pending = { key, promise };
  try {
    return await promise;
  } finally {
    if (pending?.promise === promise) pending = null;
  }
}
