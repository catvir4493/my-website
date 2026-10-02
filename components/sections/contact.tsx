"use client";
import { ArrowUpRight, GitBranch, ContactRound, Mail } from "lucide-react";
import { useContacts } from "@/components/ui/contact-provider";
import { Reveal } from "@/components/ui/reveal";
const icons = { GitHub: GitBranch, LinkedIn: ContactRound, Email: Mail };
export function ContactSection() {
  const contacts = useContacts();
  const primary = contacts.find((item) => item.name === "Email") || contacts[0];
  return (
    <section id="contact" className="contact-section section">
      <Reveal>
        <div className="contact-top mono">
          <span>06 / ESTABLISH CONNECTION</span>
          <span>GOOD THINGS START WITH A CONVERSATION.</span>
        </div>
        <div className="contact-content">
          <div>
            <h2>
              Have an idea?
              <br />
              <span>Let’s build it.</span>
            </h2>
            <p>
              Interesting problems. Unusual ideas. Better systems.
              <br />
              There’s always something worth exploring together.
            </p>
          </div>
          {primary && (
            <a
              href={primary.url}
              target={primary.name === "Email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="contact-orb"
              aria-label={`Connect via ${primary.name}`}
            >
              <ArrowUpRight size={46} strokeWidth={1} />
            </a>
          )}
        </div>
        <div className="contact-bottom">
          <div className="contact-links">
            {contacts.map(({ name, url }) => {
              const Icon = icons[name];
              return (
                <a
                  key={name}
                  href={url}
                  target={name === "Email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                >
                  <Icon size={17} />
                  {name}
                  <ArrowUpRight size={15} />
                </a>
              );
            })}
          </div>
          <span className="mono muted">BUDAPEST, HUNGARY / OPEN TO INTERESTING IDEAS</span>
        </div>
      </Reveal>
    </section>
  );
}
