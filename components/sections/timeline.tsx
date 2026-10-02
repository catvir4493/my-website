import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { systemLog } from "@/data/system-log";
import { LogEntry } from "@/components/ui/log-entry";

export function TimelineSection() {
  return (
    <section id="timeline" className="section">
      <Reveal>
        <SectionHeading
          number="05"
          eyebrow="SYSTEM LOG / ALWAYS EVOLVING"
          title="Always a higher version."
        />
        <div className="timeline">
          {systemLog.map((entry) => (
            <LogEntry key={entry.date} {...entry} />
          ))}
          <Link href="/lab" className="lab-invitation" data-magnetic>
            <FlaskConical size={28} strokeWidth={1} />
            <span className="mono">NEXT / EXPERIMENT</span>
            <h3>What happens if…</h3>
            <p>Open the engineering lab.</p>
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
