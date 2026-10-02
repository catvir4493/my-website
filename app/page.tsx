import { Hero } from "@/components/sections/hero";
import { ProfileSection } from "@/components/sections/profile";
import { ProjectsSection } from "@/components/sections/projects";
import { SkillsSection } from "@/components/sections/skills";
import { TelemetrySection } from "@/components/sections/telemetry";
import { TimelineSection } from "@/components/sections/timeline";
import { ContactSection } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProfileSection />
      <ProjectsSection />
      <SkillsSection />
      <TelemetrySection />
      <TimelineSection />
      <ContactSection />
    </>
  );
}
