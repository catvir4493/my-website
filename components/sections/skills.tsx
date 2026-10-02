"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Braces, CircuitBoard, Network } from "lucide-react";
import { skills, skillGroups, type Skill } from "@/data/skills";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function SkillsSection() {
  const [category, setCategory] = useState("ALL SYSTEMS");
  const [selected, setSelected] = useState<Skill>(skills[0]);
  const [hovered, setHovered] = useState<Skill | null>(null);
  const inspected = hovered || selected;
  const related = (skill: Skill) =>
    skill.name !== selected.name &&
    (skill.evidence.some((item) =>
      selected.evidence.some((evidence) => evidence.href === item.href),
    ) ||
      (selected.name === "C" &&
        ["Algorithms", "Data Structures", "Dynamic Memory"].includes(skill.name)));
  const filtered = skills.filter(
    (skill) => category === "ALL SYSTEMS" || skill.category === category,
  );
  return (
    <section id="skills" className="section">
      <Reveal>
        <SectionHeading number="03" eyebrow="TECHNOLOGY NEURAL NETWORK" title="A growing toolkit.">
          <span className="mono muted">{skills.length} NODES / ALWAYS EVOLVING</span>
        </SectionHeading>
        <div className="skill-filters" aria-label="Filter technologies">
          {skillGroups.map((group) => (
            <button
              key={group}
              className={category === group ? "selected" : ""}
              aria-pressed={category === group}
              onClick={() => {
                setCategory(group);
                setHovered(null);
                setSelected(
                  skills.find((skill) => group === "ALL SYSTEMS" || skill.category === group)!,
                );
              }}
            >
              {group}
            </button>
          ))}
        </div>
        <div className="skills-layout">
          <div className="skill-network" data-cursor-glow>
            <div className="network-spine" />
            <div className="skill-nodes">
              {filtered.map((skill) => (
                <button
                  key={skill.name}
                  className={`skill-node ${selected.name === skill.name ? "selected" : ""}`}
                  data-state={
                    selected.name === skill.name
                      ? "selected"
                      : hovered?.name === skill.name
                        ? "hover"
                        : related(skill)
                          ? "related"
                          : "idle"
                  }
                  aria-pressed={selected.name === skill.name}
                  onMouseEnter={() => setHovered(skill)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setSelected(skill)}
                  onClick={() => {
                    setSelected(skill);
                    setHovered(null);
                  }}
                >
                  <span className="skill-symbol">
                    {skill.category === "ENGINEERING" ? (
                      <CircuitBoard size={19} />
                    ) : skill.category === "AI / VISION" ? (
                      <Network size={19} />
                    ) : (
                      <Braces size={19} />
                    )}
                  </span>
                  <span>{skill.name}</span>
                  <i />
                </button>
              ))}
            </div>
          </div>
          <aside className="skill-inspector panel" aria-live="polite">
            <div className="panel-title mono">
              <span>NODE INSPECTOR</span>
              <ArrowUpRight size={15} />
            </div>
            <div className="inspector-icon">
              <Network size={42} strokeWidth={1} />
            </div>
            <h3>{inspected.name}</h3>
            <dl>
              <div>
                <dt>CATEGORY</dt>
                <dd>{inspected.category}</dd>
              </div>
              <div>
                <dt>EXPERIENCE / FOCUS</dt>
                <dd>{inspected.focus}</dd>
              </div>
              <div>
                <dt>PROJECT USAGE</dt>
                <dd>{inspected.usage}</dd>
              </div>
            </dl>
            <div className="skill-evidence" key={inspected.name}>
              {inspected.evidence.map((item) => (
                <Link className="text-link" key={item.href} href={item.href}>
                  {item.name}
                  <ArrowUpRight size={15} />
                </Link>
              ))}
              {inspected.name === "C" && (
                <Link className="text-link" href="/lab#memory">
                  Memory Lab / related teaching model
                  <ArrowUpRight size={15} />
                </Link>
              )}
              {!inspected.evidence.length && (
                <p className="mono muted">LEARNING / NO PROJECT EVIDENCE CLAIMED</p>
              )}
            </div>
            <p className="mono text-cyan">TOOLS → PROJECTS → EVIDENCE</p>
          </aside>
        </div>
      </Reveal>
    </section>
  );
}
