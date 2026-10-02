import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Zap } from "lucide-react";
import { LabWorkbench } from "@/components/lab/lab-workbench";
import { experiments } from "@/data/lab";
export const metadata: Metadata = {
  title: "Engineering Lab",
  description:
    "Interactive sorting, pathfinding, number systems, and CPU experiments. A place to turn curiosity into working systems.",
  alternates: { canonical: "/lab" },
};
export default function LabPage() {
  return (
    <div className="route-page">
      <div className="breadcrumb mono">
        <Link href="/">MARCELL.OS</Link>
        <span>/</span>
        <span>LAB</span>
      </div>
      <div className="route-hero">
        <p className="eyebrow">
          <FlaskConical size={15} /> EXPERIMENTAL SYSTEMS / ALWAYS IN PROGRESS
        </p>
        <h1>
          A place for
          <br />
          <span className="gradient-text">“what if?”</span>
        </h1>
        <p>
          Algorithms, circuits, and small moments of understanding. Open an experiment, change a
          variable, and see what happens.
        </p>
        <div className="lab-intro-stats mono">
          <span>
            <Zap size={13} /> {experiments.length.toString().padStart(2, "0")} INTERACTIVE
            EXPERIMENTS
          </span>
          <span>BROWSER NATIVE / INTERACTIVE</span>
        </div>
      </div>
      <LabWorkbench />
    </div>
  );
}
