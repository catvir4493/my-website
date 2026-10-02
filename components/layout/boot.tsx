"use client";
import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
const lines = [
  "CPU ............. ONLINE",
  "MEMORY .......... ONLINE",
  "NETWORK ......... ONLINE",
  "PROJECTS ........ LOADED",
  "PROFILE ......... AUTHORIZED",
];

export function Boot({ onComplete }: { onComplete: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useDialogFocus(dialog, onComplete);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(
      () => setStep(Math.min(5, Math.floor((performance.now() - start) / 250))),
      100,
    );
    const finish = setTimeout(onComplete, 1800);
    return () => {
      clearInterval(timer);
      clearTimeout(finish);
    };
  }, [onComplete]);
  return (
    <div
      className="boot-screen"
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boot-title"
      tabIndex={-1}
    >
      <div className="boot-inner">
        <span className="boot-mark">M_</span>
        <h2 id="boot-title">
          MARCELL<span>.OS</span>
        </h2>
        <p className="mono">INITIALIZING PERSONAL SYSTEM…</p>
        <div className="boot-log mono">
          {lines.slice(0, step).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="boot-progress">
          <span style={{ width: `${step * 20}%` }} />
        </div>
        <p className="boot-complete mono">
          {step >= 5 ? "BOOT COMPLETE / ENTERING SYSTEM" : "PREPARING YOUR WORKSPACE"}
        </p>
        <button data-autofocus onClick={onComplete} className="button secondary">
          Skip boot sequence
        </button>
      </div>
      <span className="boot-build mono">BUILD 2026.10 / BUDAPEST, HU</span>
    </div>
  );
}
