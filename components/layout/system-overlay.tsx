"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Terminal } from "lucide-react";
import { OPEN_PALETTE, OPEN_TERMINAL } from "@/lib/events";
import { useMotionPreferences } from "@/components/ui/motion-provider";
import { Boot } from "./boot";
import { Cursor } from "./cursor";
import { Matrix } from "./matrix";

const TerminalWindow = dynamic(() => import("@/components/terminal/terminal"));
const CommandPalette = dynamic(() => import("@/components/terminal/command-palette"));
const sequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function SystemOverlay() {
  const [panel, setPanel] = useState<"terminal" | "palette" | null>(null);
  const [boot, setBoot] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const [debug, setDebug] = useState(false);
  const { lite, paused, setCommandMode } = useMotionPreferences();
  const close = useCallback(() => setPanel(null), []);
  const terminal = useCallback(() => setPanel("terminal"), []);
  const palette = useCallback(() => setPanel("palette"), []);
  const stopMatrix = useCallback(() => setMatrix(false), []);
  const completeBoot = useCallback(() => {
    try {
      sessionStorage.setItem("marcell:booted", "1");
    } catch {}
    setBoot(false);
  }, []);
  useEffect(() => {
    let frame = 0;
    try {
      if (
        !sessionStorage.getItem("marcell:booted") &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        frame = requestAnimationFrame(() => setBoot(true));
    } catch {}
    console.info(
      "\n  M   M  AAAAA  RRRR   CCCC  EEEEE  L     L\n  MM MM  A   A  R   R  C     E      L     L\n  M M M  AAAAA  RRRR   C     EEEE   L     L\n  M   M  A   A  R  R   C     E      L     L\n  M   M  A   A  R   R  CCCC  EEEEE  LLLLL LLLLL\n\nWelcome to Marcell.OS\nIf you're reading this, we should probably build something together.",
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    let matched = 0;
    function keydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel((value) => (value === "palette" ? null : "palette"));
        return;
      }
      if (
        event.target instanceof HTMLElement &&
        (event.target.matches("input, textarea") || event.target.isContentEditable)
      )
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      matched = key === sequence[matched] ? matched + 1 : key === sequence[0] ? 1 : 0;
      if (matched === sequence.length) {
        setDebug((value) => !value);
        matched = 0;
      }
    }
    window.addEventListener(OPEN_TERMINAL, terminal);
    window.addEventListener(OPEN_PALETTE, palette);
    document.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener(OPEN_TERMINAL, terminal);
      window.removeEventListener(OPEN_PALETTE, palette);
      document.removeEventListener("keydown", keydown);
    };
  }, [terminal, palette]);
  useEffect(() => {
    if (!matrix) return;
    const timer = setTimeout(stopMatrix, 15000);
    return () => clearTimeout(timer);
  }, [matrix, stopMatrix]);
  useEffect(() => {
    setCommandMode(panel === "palette");
    return () => setCommandMode(false);
  }, [panel, setCommandMode]);
  useEffect(() => {
    const elements = [
      ...document.querySelectorAll<HTMLElement>("header.status-bar, main, footer.footer"),
    ];
    elements.forEach((element) => {
      element.inert = !!panel || boot;
    });
    return () =>
      elements.forEach((element) => {
        element.inert = false;
      });
  }, [panel, boot]);
  return (
    <>
      <Cursor />
      <button
        className="terminal-launcher"
        onClick={terminal}
        aria-label="Open interactive terminal"
        title="Open terminal"
      >
        <Terminal size={20} />
        <span>TERMINAL</span>
      </button>
      {boot && <Boot onComplete={completeBoot} />}
      {panel === "terminal" && <TerminalWindow onClose={close} onMatrix={setMatrix} />}
      {panel === "palette" && <CommandPalette onClose={close} onTerminal={terminal} />}
      {matrix && <Matrix onStop={stopMatrix} />}
      {debug && <DebugPanel disabled={lite || paused} onClose={() => setDebug(false)} />}
    </>
  );
}

function DebugPanel({ disabled, onClose }: { disabled: boolean; onClose: () => void }) {
  const [stats, setStats] = useState({ fps: 0, x: 0, y: 0, nodes: 0 });
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let id = 0;
    let x = 0;
    let y = 0;
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
    };
    function update(now: number) {
      frames++;
      if (now - last >= 500) {
        setStats({
          fps: Math.round((frames * 1000) / (now - last)),
          x,
          y,
          nodes: document.querySelectorAll("*").length,
        });
        frames = 0;
        last = now;
      }
      id = requestAnimationFrame(update);
    }
    id = requestAnimationFrame(update);
    window.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <>
      <div className="debug-grid" aria-hidden="true" />
      <div className="debug-panel mono">
        <button onClick={onClose} aria-label="Close developer mode">
          ×
        </button>
        <strong>DEV MODE ACTIVATED</strong>
        <span>
          FPS {stats.fps} / DOM {stats.nodes}
        </span>
        <span>
          POINTER {stats.x}, {stats.y}
        </span>
        <span>RENDER {disabled ? "LITE" : "FULL"} / MARCELL.OS</span>
      </div>
    </>
  );
}
