"use client";
import { useMemo, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { sortingFrames, type SortAlgorithm } from "@/lib/algorithms";
import { usePlayback } from "@/hooks/use-playback";
const seed = [68, 24, 88, 39, 54, 17, 77, 45, 96, 31, 62, 12, 83, 48, 71, 21, 57, 36];
const complexity: Record<SortAlgorithm, string> = {
  "Bubble sort": "O(n²) TIME / O(1) SPACE",
  "Quick sort": "O(n log n) AVG / O(n²) WORST",
  "Merge sort": "O(n log n) TIME / O(n) SPACE",
};

export function SortingExperiment() {
  const [values, setValues] = useState(seed);
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>("Quick sort");
  const [speed, setSpeed] = useState(35);
  const frames = useMemo(() => sortingFrames(values, algorithm), [values, algorithm]);
  const playback = usePlayback(frames.length, 220 - speed * 2);
  const frame = frames[playback.index] || frames[0];
  return (
    <div className="experiment-panel">
      <div className="experiment-heading">
        <div>
          <h2>Order from chaos.</h2>
          <p>
            Watch an algorithm turn an unsorted array into an ordered system. Purple bars show the
            active comparison or write.
          </p>
        </div>
        <span className="mono text-cyan">EXP_001 / SORTING</span>
      </div>
      <div className="experiment-controls">
        <label>
          ALGORITHM
          <select
            value={algorithm}
            onChange={(event) => {
              playback.reset();
              setAlgorithm(event.target.value as SortAlgorithm);
            }}
          >
            <option>Quick sort</option>
            <option>Bubble sort</option>
            <option>Merge sort</option>
          </select>
        </label>
        <label>
          SPEED
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Sorting animation speed"
          />
        </label>
        <button
          className="button primary"
          onClick={playback.running ? playback.pause : playback.play}
        >
          {playback.running ? <Pause size={15} /> : <Play size={15} />}
          {playback.running ? "Pause" : frame.done ? "Replay" : "Run"}
        </button>
        <button className="button secondary" onClick={playback.step} disabled={frame.done}>
          <SkipForward size={15} />
          Step
        </button>
        <button
          className="button secondary"
          onClick={() => {
            playback.reset();
            setValues(Array.from({ length: 18 }, () => Math.floor(Math.random() * 87) + 10));
          }}
        >
          <RotateCcw size={15} />
          Shuffle
        </button>
      </div>
      <div
        className="sort-bars"
        role="img"
        aria-label={`Array values: ${frame.values.join(", ")}. ${frame.done ? "Sorting complete." : "Sorting in progress."}`}
      >
        {frame.values.map((value, i) => (
          <div
            key={i}
            className="sort-bar"
            style={{ height: `${value}%` }}
            data-active={frame.active.includes(i)}
            data-done={frame.done}
          >
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="experiment-metrics mono">
        <span>
          COMPARISONS <strong>{frame.comparisons}</strong>
        </span>
        <span>
          WRITES <strong>{frame.writes}</strong>
        </span>
        <span>
          FRAME{" "}
          <strong>
            {playback.index + 1} / {frames.length}
          </strong>
        </span>
        <span>{complexity[algorithm]}</span>
      </div>
      <p className="experiment-note" role="status">
        {frame.done
          ? "Sorted. Every value is now in ascending order."
          : playback.running
            ? "Algorithm running. Pause to inspect a frame."
            : "Ready. Run the algorithm or step through one operation at a time."}
      </p>
    </div>
  );
}
