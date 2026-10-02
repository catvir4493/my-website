import { Cpu, MapPin, ScanFace } from "lucide-react";
import { profile } from "@/data/profile";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function ProfileSection() {
  return (
    <section id="about" className="section">
      <Reveal>
        <SectionHeading number="01" eyebrow="IDENTITY DATABASE" title="The human in the machine." />
        <div className="profile-layout">
          <div className="profile-statement">
            <p className="large-copy">
              I like understanding
              <br />
              how things work.
              <br />
              <span>
                Then making them
                <br />
                work differently.
              </span>
            </p>
            <p>
              Computer engineering connects the physical and the digital. That’s where I’m building
              my foundation — exploring systems, writing software, and following ideas beyond the
              obvious.
            </p>
            <div className="profile-location">
              <MapPin size={16} />
              <span>Budapest, Hungary</span>
              <span className="mono">47.4979 / 19.0402</span>
            </div>
          </div>
          <div className="identity-panel panel">
            <div className="panel-title mono">
              <span>
                <ScanFace size={16} /> ENGINEER PROFILE
              </span>
              <span>ID / M-001</span>
            </div>
            <div className="identity-top">
              <div className="digital-avatar">
                <span>M</span>
                <i />
                <small className="mono">HUMAN / ENGINEER</small>
              </div>
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.role}</p>
                <span className="online">
                  <i /> LEARNING & BUILDING
                </span>
              </div>
            </div>
            <dl className="identity-data">
              <div>
                <dt>UNIVERSITY</dt>
                <dd>
                  {profile.university}
                  <small>BME / {profile.degree}</small>
                </dd>
              </div>
              <div>
                <dt>LOCATION</dt>
                <dd>{profile.location}</dd>
              </div>
              <div>
                <dt>FOCUS</dt>
                <dd>Software · Systems · AI</dd>
              </div>
              <div>
                <dt>CURRENT MODE</dt>
                <dd className="text-cyan">Keep asking better questions.</dd>
              </div>
            </dl>
            <div className="identity-bottom mono">
              <Cpu size={15} />
              <span>HARDWARE + SOFTWARE + HUMAN POSSIBILITY</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
