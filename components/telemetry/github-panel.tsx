"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, GitBranch, RefreshCw } from "lucide-react";
import type { GitHubTelemetry } from "@/lib/github-types";
function relative(value: string) {
  const time = Date.parse(value);
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 0) return new Date(time).toLocaleDateString("en-GB");
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
export function GitHubPanel() {
  const [data, setData] = useState<GitHubTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    try {
      const response = await fetch("/api/github", { signal: abort.signal });
      const value: GitHubTelemetry = await response.json();
      if (!["connected", "not-connected", "error"].includes(value.status))
        throw new Error("Invalid signal");
      setData(value);
    } catch {
      if (!abort.signal.aborted)
        setData({
          status: "error",
          message: "The public GitHub signal is temporarily unavailable.",
          retryAt: null,
        });
    } finally {
      if (!abort.signal.aborted) {
        setLoading(false);
        setNow(Date.now());
      }
    }
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void load();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      controller.current?.abort();
    };
  }, [load]);
  useEffect(() => {
    if (data?.status !== "error" || !data.retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [data]);
  const connected = data?.status === "connected" ? data : null;
  const cooldown =
    data?.status === "error" && data.retryAt
      ? Math.max(0, Math.ceil((Date.parse(data.retryAt) - now) / 1000))
      : 0;
  return (
    <div className="telemetry-layout real-telemetry" ref={container} aria-busy={loading}>
      <div className="panel github-signal-panel">
        <div className="panel-title mono">
          <span>SYSTEM / DEVELOPER TELEMETRY</span>
          <GitBranch size={16} />
        </div>
        <div className="github-status" role="status">
          <span className={connected ? "online mono" : "mono muted"}>
            {loading
              ? "ESTABLISHING SIGNAL…"
              : connected
                ? "GITHUB CONNECTED"
                : data?.status === "error"
                  ? "GITHUB SIGNAL LOST"
                  : "NOT CONNECTED"}
          </span>
          {connected && (
            <a className="text-link" href={connected.url} target="_blank" rel="noopener noreferrer">
              @{connected.username}
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        <div className="github-metrics">
          <div>
            <span>PUBLIC REPOS</span>
            <strong>{connected ? connected.publicRepos : "—"}</strong>
          </div>
          <div>
            <span>RECENT PUBLIC PUSH</span>
            <strong>
              {connected?.recentPush ? relative(connected.recentPush) : "DATA UNAVAILABLE"}
            </strong>
          </div>
          <div>
            <span>PRIMARY STACK / PUBLIC REPOS</span>
            <strong>
              {connected?.primaryLanguages.length
                ? connected.primaryLanguages.join(" / ")
                : "DATA UNAVAILABLE"}
            </strong>
          </div>
          <div>
            <span>ACTIVE PROJECT / CURATED</span>
            <strong>Vision Navigation</strong>
          </div>
        </div>
        {data?.status === "error" && (
          <div className="signal-error">
            <p>{data.message}</p>
            <button
              className="button secondary"
              disabled={loading || cooldown > 0}
              onClick={() => void load()}
            >
              <RefreshCw size={14} />
              {cooldown > 0 ? `Retry in ${cooldown}s` : "Retry GitHub signal"}
            </button>
          </div>
        )}
        <div className="recent-activity">
          <h3 className="mono">RECENT ACTIVITY / PUBLIC EVENTS</h3>
          {connected?.signals.map((signal, index) => (
            <a
              className="activity-signal"
              key={`${signal.at}-${index}`}
              href={signal.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                {signal.type} / {signal.repository}
              </span>
              <time dateTime={signal.at}>{relative(signal.at)}</time>
            </a>
          ))}
          {!connected?.signals.length && (
            <p>
              {connected && connected.activityAvailable
                ? "No recent events returned by GitHub’s public event feed."
                : "DATA UNAVAILABLE"}
            </p>
          )}
        </div>
        {connected && (
          <p className="signal-source mono">
            PUBLIC GITHUB API / FETCHED{" "}
            <time dateTime={connected.fetchedAt}>{relative(connected.fetchedAt)}</time>
            <br />
            RECENT REPOSITORY SAMPLE: {connected.repositorySampleSize} / EVENT FEED HAS A LIMITED
            HISTORY
          </p>
        )}
      </div>
      <div className="panel repository-signals">
        <div className="panel-title mono">
          <span>RECENT SIGNALS / UPDATED REPOSITORIES</span>
          <span>PUBLIC</span>
        </div>
        {connected?.repositories.map((repo) => (
          <a
            className="repository-signal"
            href={repo.url}
            key={repo.name}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>
              {repo.name}
              <ArrowUpRight size={15} />
            </h3>
            <div className="mono">
              <span>{repo.language || "LANGUAGE UNAVAILABLE"}</span>
              <time dateTime={repo.updatedAt}>updated {relative(repo.updatedAt)}</time>
            </div>
            {repo.description && <p>{repo.description}</p>}
          </a>
        ))}
        {!connected?.repositories.length && (
          <p className="signal-empty">
            {connected
              ? "No public repositories returned."
              : "Repository data will appear when the public signal is connected."}
          </p>
        )}
      </div>
    </div>
  );
}
