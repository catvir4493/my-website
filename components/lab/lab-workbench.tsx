"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownUp, Binary, Cpu, Route, Layers } from "lucide-react";
import { experiments, type ExperimentId } from "@/data/lab";
import { SortingExperiment } from "./sorting";
const loading = () => (
  <p className="experiment-note" role="status">
    Loading experiment…
  </p>
);
const PathfindingExperiment = dynamic(
  () => import("./pathfinding").then((module) => module.PathfindingExperiment),
  { loading },
);
const ConverterExperiment = dynamic(
  () => import("./converter").then((module) => module.ConverterExperiment),
  { loading },
);
const MemoryExperiment = dynamic(
  () => import("./memory").then((module) => module.MemoryExperiment),
  { loading },
);
const CpuExperiment = dynamic(() => import("./cpu").then((module) => module.CpuExperiment), {
  loading,
});
const icons = {
  sorting: ArrowDownUp,
  pathfinding: Route,
  converter: Binary,
  memory: Layers,
  cpu: Cpu,
};
const tabs = experiments.map((item) => ({ ...item, icon: icons[item.id] }));

export function LabWorkbench() {
  const [tab, setTab] = useState<ExperimentId>("sorting");
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1);
      if (experiments.some((item) => item.id === id)) setTab(id as ExperimentId);
    };
    const frame = requestAnimationFrame(sync);
    window.addEventListener("hashchange", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  function select(id: ExperimentId) {
    setTab(id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${id}`,
    );
  }
  return (
    <>
      <div
        className="lab-tabs experiment-cards"
        role="tablist"
        aria-label="Engineering experiments"
      >
        {tabs.map(({ id, name, icon: Icon, index, status, description }, i) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            data-cursor-glow
            aria-selected={tab === id}
            aria-controls={`experiment-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (i + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (i - 1 + tabs.length) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              select(tabs[next].id);
              document.getElementById(`tab-${tabs[next].id}`)?.focus();
            }}
          >
            <Icon size={18} />
            <span>
              <small className="mono">
                EXP_{index} / {status}
              </small>
              <strong>{name}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>
      <div id={`experiment-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {tab === "sorting" ? (
          <SortingExperiment />
        ) : tab === "pathfinding" ? (
          <PathfindingExperiment />
        ) : tab === "converter" ? (
          <ConverterExperiment />
        ) : tab === "memory" ? (
          <MemoryExperiment />
        ) : (
          <CpuExperiment />
        )}
      </div>
      <p className="section-footnote mono">LOCAL EXECUTION / NO SERVER REQUIRED / LEARN BY DOING</p>
    </>
  );
}
