import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { GitHubPanel } from "@/components/telemetry/github-panel";
export function TelemetrySection() {
  return (
    <section id="telemetry" className="section">
      <Reveal>
        <SectionHeading number="04" eyebrow="LIVE PUBLIC SIGNAL / GITHUB" title="Leave a trace.">
          <span className="mono muted">REAL DATA / PUBLIC REPOSITORIES</span>
        </SectionHeading>
        <GitHubPanel />
      </Reveal>
    </section>
  );
}
