"use client";
import { Pause, Play, Terminal } from "lucide-react";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { openTerminal } from "@/lib/events";
import { system } from "@/data/system";

export function Footer() {
  const { paused, toggle } = useMotionPreferences();
  return (
    <footer className="footer">
      <div>
        <span className="footer-brand">
          MARCELL<span className="text-cyan">.OS</span>
        </span>
        <span className="mono">
          v{system.version} / {system.release}
        </span>
      </div>
      <p>Designed & engineered by Marcell.</p>
      <div className="footer-controls">
        <button onClick={toggle} aria-pressed={paused}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "Resume motion" : "Pause motion"}
        </button>
        <button onClick={openTerminal}>
          <Terminal size={15} />
          Open terminal
        </button>
        <span className="online">
          <i /> ONLINE
        </span>
      </div>
    </footer>
  );
}
