"use client";
import { useEffect, useState } from "react";
import { useMotionPreferences } from "./motion-provider";
const modes = [
  "COMPUTER ENGINEERING",
  "SYSTEMS PROGRAMMING",
  "SOFTWARE DEVELOPMENT",
  "ARTIFICIAL INTELLIGENCE",
  "BUILDING THINGS",
];
export function FocusTicker() {
  const [index, setIndex] = useState(0);
  const { dormant, lite } = useMotionPreferences();
  useEffect(() => {
    if (dormant || lite) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % modes.length), 3200);
    return () => clearInterval(timer);
  }, [dormant, lite]);
  return (
    <span className="focus-ticker">
      <span className="sr-only">Exploring computer engineering, systems, software, and AI</span>
      <span key={index} aria-hidden="true">
        {modes[index]}
      </span>
    </span>
  );
}
