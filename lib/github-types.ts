export type PublicRepository = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
};
export type PublicSignal = { type: string; repository: string; url: string; at: string };
export type GitHubTelemetry =
  | { status: "not-connected" }
  | { status: "error"; message: string; retryAt: string | null }
  | {
      status: "connected";
      username: string;
      url: string;
      publicRepos: number;
      repositories: PublicRepository[];
      primaryLanguages: string[];
      recentPush: string | null;
      signals: PublicSignal[];
      activityAvailable: boolean;
      fetchedAt: string;
      repositorySampleSize: number;
    };
