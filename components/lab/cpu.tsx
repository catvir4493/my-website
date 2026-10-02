"use client";
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { cpuProgram, initialCpu, stepCpu } from "@/lib/algorithms";

export function CpuExperiment() {
  const [cpu, setCpu] = useState(initialCpu);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || cpu.halted) return;
    const timer = setTimeout(() => setCpu(stepCpu), 300);
    return () => clearTimeout(timer);
  }, [running, cpu]);
  const isRunning = running && !cpu.halted;
  return (
    <div className="experiment-panel">
      <div className="experiment-heading">
        <div>
          <h2>Inside the instruction cycle.</h2>
          <p>
            A simplified virtual CPU, executing a real miniature program. Follow fetch, decode, and
            execute as registers and memory change.
          </p>
        </div>
        <span className="mono text-cyan">EXP_005 / CPU SIMULATION</span>
      </div>
      <div className="experiment-controls">
        <button
          className="button primary"
          onClick={() => {
            if (cpu.halted) setCpu(initialCpu());
            setRunning(!isRunning);
          }}
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          {isRunning ? "Pause" : cpu.halted ? "Replay" : "Run CPU"}
        </button>
        <button
          className="button secondary"
          disabled={cpu.halted}
          onClick={() => {
            setRunning(false);
            setCpu(stepCpu);
          }}
        >
          <SkipForward size={15} />
          Step cycle
        </button>
        <button
          className="button secondary"
          onClick={() => {
            setRunning(false);
            setCpu(initialCpu());
          }}
        >
          <RotateCcw size={15} />
          Reset
        </button>
        <span className="mono text-cyan">{cpu.halted ? "HALTED" : cpu.phase}</span>
      </div>
      <div className="cpu-layout">
        <div className="cpu-registers">
          <div>
            <span>PC / PROGRAM COUNTER</span>
            <strong>0x{cpu.pc.toString(16).padStart(2, "0").toUpperCase()}</strong>
          </div>
          <div>
            <span>ACC / ACCUMULATOR</span>
            <strong>{cpu.acc}</strong>
          </div>
          <div>
            <span>IR / INSTRUCTION</span>
            <strong>{cpuProgram[cpu.pc]}</strong>
          </div>
          <div>
            <span>CYCLE COUNT</span>
            <strong>{cpu.cycles}</strong>
          </div>
          <div>
            <span>PHASE</span>
            <strong>{cpu.halted ? "HALT" : cpu.phase}</strong>
          </div>
        </div>
        <div className="cpu-program">
          {cpuProgram.map((instruction, i) => (
            <div key={i} className={`cpu-instruction ${i === cpu.pc ? "active" : ""}`}>
              <span>{i.toString(16).padStart(2, "0")}</span>
              {instruction}
            </div>
          ))}
        </div>
      </div>
      <div className="memory-grid" aria-label="16 memory cells">
        {cpu.memory.map((value, i) => (
          <div key={i} className={value ? "active" : ""}>
            <small>0x{i.toString(16).padStart(2, "0").toUpperCase()}</small>
            <strong>{value.toString(16).padStart(2, "0").toUpperCase()}</strong>
          </div>
        ))}
      </div>
      <p className="experiment-note" role="status">
        {cpu.halted
          ? `Program complete. Memory[04] = ${cpu.memory[4]}; Memory[08] = ${cpu.memory[8]}. Final accumulator: ${cpu.acc}.`
          : "Program: (7 + 5) → Memory[04]; (3 + Memory[04]) → Memory[08]. Each instruction takes three simulated cycles."}
      </p>
    </div>
  );
}
