"use client";
import { useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Shuffle } from "lucide-react";
import { findPath, type PathResult } from "@/lib/algorithms";
import { usePlayback } from "@/hooks/use-playback";
const rows = 12;
const cols = 20;
const defaultWalls = () =>
  new Set([
    29, 49, 69, 89, 109, 129, 169, 189, 209, 229, 63, 64, 65, 66, 67, 68, 172, 173, 174, 175, 176,
  ]);

export function PathfindingExperiment() {
  const [walls, setWalls] = useState(defaultWalls);
  const [algorithm, setAlgorithm] = useState<"A*" | "Dijkstra">("A*");
  const [start, setStart] = useState(121);
  const [end, setEnd] = useState(138);
  const [result, setResult] = useState<PathResult | null>(null);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [mode, setMode] = useState("wall");
  const [cursor, setCursor] = useState(121);
  const grid = useRef<HTMLDivElement>(null);
  const drawing = useRef<boolean | null>(null);
  const handledClick = useRef(false);
  const total = (result?.visited.length || 0) + (result?.path.length || 0) + 1;
  const playback = usePlayback(total, 25);
  const frame = result?.frames[Math.min(playback.index - 1, result.frames.length - 1)];
  const visited = new Set(frame?.closed);
  const open = new Set(frame?.open);
  const path = new Set(
    result?.path.slice(0, Math.max(0, playback.index - (result?.visited.length || 0))),
  );
  function edit(node: number, paint?: boolean) {
    playback.reset();
    setResult(null);
    setRuntime(null);
    if (mode === "start") {
      if (node !== end) {
        setStart(node);
        setWalls((value) => {
          const next = new Set(value);
          next.delete(node);
          return next;
        });
      }
      return;
    }
    if (mode === "end") {
      if (node !== start) {
        setEnd(node);
        setWalls((value) => {
          const next = new Set(value);
          next.delete(node);
          return next;
        });
      }
      return;
    }
    if (node === start || node === end) return;
    setWalls((value) => {
      const next = new Set(value);
      if (paint ?? !next.has(node)) next.add(node);
      else next.delete(node);
      return next;
    });
  }
  const finished = result && playback.index >= total - 1;
  function calculate() {
    const before = performance.now();
    const next = findPath(rows, cols, walls, start, end, algorithm);
    setRuntime(performance.now() - before);
    setResult(next);
    return next;
  }
  function reset() {
    playback.reset();
    setResult(null);
    setRuntime(null);
  }
  return (
    <div className="experiment-panel">
      <div className="experiment-heading">
        <div>
          <h2>Find a way through.</h2>
          <p>
            Draw walls, place endpoints, and compare search strategies. Every move has equal cost;
            diagonal moves are disabled.
          </p>
        </div>
        <span className="mono text-cyan">EXP_002 / PATHFINDING</span>
      </div>
      <div className="experiment-controls">
        <label>
          ALGORITHM
          <select
            value={algorithm}
            onChange={(event) => {
              reset();
              setAlgorithm(event.target.value as "A*" | "Dijkstra");
            }}
          >
            <option>A*</option>
            <option>Dijkstra</option>
          </select>
        </label>
        <label>
          DRAW MODE
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="wall">Walls / erase</option>
            <option value="start">Place start</option>
            <option value="end">Place target</option>
          </select>
        </label>
        <button
          className="button primary"
          onClick={() => {
            if (playback.running) playback.pause();
            else if (result && !finished) playback.play();
            else {
              calculate();
              playback.reset();
              playback.play();
            }
          }}
        >
          {playback.running ? <Pause size={15} /> : <Play size={15} />}
          {playback.running ? "Pause" : "Run"}
        </button>
        <button
          className="button secondary"
          disabled={!!finished}
          onClick={() => {
            if (!result) {
              const next = calculate();
              playback.seek(next.frames.length ? 1 : 0);
            } else playback.step();
          }}
        >
          <SkipForward size={15} />
          Step
        </button>
        <button className="button secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reset
        </button>
        <button
          className="button secondary"
          onClick={() => {
            reset();
            setWalls(
              new Set(
                Array.from({ length: rows * cols }, (_, i) => i).filter(
                  (i) => i !== start && i !== end && Math.random() < 0.23,
                ),
              ),
            );
          }}
        >
          <Shuffle size={15} />
          Generate walls
        </button>
        <button
          className="button secondary"
          onClick={() => {
            reset();
            setWalls(new Set());
          }}
        >
          <RotateCcw size={15} />
          Clear walls
        </button>
      </div>
      <div
        className="path-grid"
        ref={grid}
        role="group"
        aria-label="Pathfinding board. Use arrow keys to move and Enter or Space to draw."
        onPointerUp={() => {
          drawing.current = null;
        }}
        onPointerLeave={() => {
          drawing.current = null;
        }}
      >
        {Array.from({ length: rows * cols }, (_, node) => {
          const kind =
            node === start
              ? "start"
              : node === end
                ? "end"
                : walls.has(node)
                  ? "wall"
                  : path.has(node)
                    ? "path"
                    : !finished && frame?.current === node
                      ? "current"
                      : open.has(node)
                        ? "open"
                        : visited.has(node)
                          ? "closed"
                          : "empty";
          return (
            <button
              key={node}
              className="path-cell"
              data-kind={kind}
              data-current={!finished && frame?.current === node}
              tabIndex={node === cursor ? 0 : -1}
              aria-label={`Row ${Math.floor(node / cols) + 1}, column ${(node % cols) + 1}, ${kind}${!finished && frame?.current === node ? ", current node" : ""}`}
              onFocus={() => setCursor(node)}
              onPointerDown={(event) => {
                if (event.pointerType !== "mouse") return;
                event.preventDefault();
                handledClick.current = true;
                drawing.current = !walls.has(node);
                edit(node, drawing.current);
              }}
              onPointerEnter={(event) => {
                if (event.buttons === 1 && drawing.current !== null && mode === "wall")
                  edit(node, drawing.current);
              }}
              onClick={(event) => {
                if (event.detail === 0 || !handledClick.current) edit(node);
                handledClick.current = false;
              }}
              onKeyDown={(event) => {
                const row = Math.floor(node / cols);
                const col = node % cols;
                let next = node;
                if (event.key === "ArrowUp") next = row > 0 ? node - cols : node;
                else if (event.key === "ArrowDown") next = row < rows - 1 ? node + cols : node;
                else if (event.key === "ArrowLeft") next = col > 0 ? node - 1 : node;
                else if (event.key === "ArrowRight") next = col < cols - 1 ? node + 1 : node;
                else return;
                event.preventDefault();
                setCursor(next);
                grid.current?.querySelectorAll<HTMLButtonElement>("button")[next].focus();
              }}
            >
              {kind === "start" ? "S" : kind === "end" ? "T" : ""}
            </button>
          );
        })}
      </div>
      <div className="path-legend mono">
        {["WALL", "START", "TARGET", "OPEN", "CLOSED", "CURRENT", "PATH"].map((label) => (
          <span key={label}>
            <i />
            {label}
          </span>
        ))}
      </div>
      <div className="experiment-metrics mono">
        <span>
          VISITED <strong>{Math.min(playback.index, result?.visited.length || 0)}</strong>
        </span>
        <span>
          PATH LENGTH <strong>{finished && result?.found ? result.path.length - 1 : "—"}</strong>
        </span>
        <span>
          RUNTIME / COMPUTATION{" "}
          <strong>{runtime === null ? "—" : `${runtime.toFixed(3)} ms`}</strong>
        </span>
        <span>
          HEURISTIC <strong>{algorithm === "A*" ? "MANHATTAN" : "NONE"}</strong>
        </span>
      </div>
      <p className="experiment-note" role="status">
        {finished
          ? result.found
            ? `Target reached in ${result.path.length - 1} moves. Both algorithms find a shortest path on this board.`
            : "No path found. Remove a wall or move an endpoint."
          : playback.running
            ? "Exploring the search space…"
            : "Click or drag to edit. Keyboard: arrow keys to navigate, Space to draw."}
      </p>
    </div>
  );
}
