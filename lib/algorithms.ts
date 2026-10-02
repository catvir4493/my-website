export type SortAlgorithm = "Bubble sort" | "Quick sort" | "Merge sort";
export type SortFrame = {
  values: number[];
  active: number[];
  comparisons: number;
  writes: number;
  done: boolean;
};
export function sortingFrames(input: number[], algorithm: SortAlgorithm): SortFrame[] {
  const values = [...input];
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let writes = 0;
  const record = (active: number[] = [], done = false) =>
    frames.push({ values: [...values], active, comparisons, writes, done });
  const swap = (a: number, b: number) => {
    [values[a], values[b]] = [values[b], values[a]];
    writes += 2;
    record([a, b]);
  };
  record();
  if (algorithm === "Bubble sort") {
    for (let end = values.length - 1; end > 0; end--) {
      let changed = false;
      for (let i = 0; i < end; i++) {
        comparisons++;
        record([i, i + 1]);
        if (values[i] > values[i + 1]) {
          swap(i, i + 1);
          changed = true;
        }
      }
      if (!changed) break;
    }
  } else if (algorithm === "Quick sort") {
    const quick = (lo: number, hi: number) => {
      if (lo >= hi) return;
      let pivotIndex = lo;
      for (let i = lo; i < hi; i++) {
        comparisons++;
        record([i, hi]);
        if (values[i] <= values[hi]) {
          if (i !== pivotIndex) swap(i, pivotIndex);
          pivotIndex++;
        }
      }
      if (pivotIndex !== hi) swap(pivotIndex, hi);
      quick(lo, pivotIndex - 1);
      quick(pivotIndex + 1, hi);
    };
    quick(0, values.length - 1);
  } else {
    const merge = (lo: number, hi: number) => {
      if (hi - lo <= 1) return;
      const middle = Math.floor((lo + hi) / 2);
      merge(lo, middle);
      merge(middle, hi);
      const left = values.slice(lo, middle);
      const right = values.slice(middle, hi);
      let a = 0;
      let b = 0;
      let k = lo;
      while (a < left.length || b < right.length) {
        if (a < left.length && b < right.length) comparisons++;
        values[k] =
          b >= right.length || (a < left.length && left[a] <= right[b]) ? left[a++] : right[b++];
        writes++;
        record([k]);
        k++;
      }
    };
    merge(0, values.length);
  }
  record([], true);
  return frames;
}

export type PathFrame = { open: number[]; closed: number[]; current: number };
export type PathResult = { visited: number[]; path: number[]; found: boolean; frames: PathFrame[] };
export function findPath(
  rows: number,
  cols: number,
  walls: Set<number>,
  start: number,
  end: number,
  algorithm: "A*" | "Dijkstra",
): PathResult {
  const total = rows * cols;
  if (start < 0 || start >= total || end < 0 || end >= total || walls.has(start) || walls.has(end))
    return { visited: [], path: [], found: false, frames: [] };
  const cost = new Map<number, number>([[start, 0]]);
  const previous = new Map<number, number>();
  const open = new Set([start]);
  const closed = new Set<number>();
  const visited: number[] = [];
  const frames: PathFrame[] = [];
  const record = (current: number) =>
    frames.push({ open: [...open], closed: [...closed], current });
  const heuristic = (node: number) =>
    algorithm === "Dijkstra"
      ? 0
      : Math.abs(Math.floor(node / cols) - Math.floor(end / cols)) +
        Math.abs((node % cols) - (end % cols));
  while (open.size) {
    let current = -1;
    let minimum = Infinity;
    for (const node of open) {
      const priority = cost.get(node)! + heuristic(node);
      if (priority < minimum) {
        current = node;
        minimum = priority;
      }
    }
    open.delete(current);
    closed.add(current);
    visited.push(current);
    if (current === end) {
      record(current);
      const path = [end];
      while (path[0] !== start) path.unshift(previous.get(path[0])!);
      return { visited, path, found: true, frames };
    }
    const row = Math.floor(current / cols);
    const col = current % cols;
    const neighbors = [
      row > 0 ? current - cols : -1,
      col < cols - 1 ? current + 1 : -1,
      row < rows - 1 ? current + cols : -1,
      col > 0 ? current - 1 : -1,
    ];
    for (const next of neighbors) {
      if (next < 0 || walls.has(next) || closed.has(next)) continue;
      const nextCost = cost.get(current)! + 1;
      if (nextCost < (cost.get(next) ?? Infinity)) {
        cost.set(next, nextCost);
        previous.set(next, current);
        open.add(next);
      }
    }
    record(current);
  }
  return { visited, path: [], found: false, frames };
}

export type CpuState = {
  pc: number;
  acc: number;
  memory: number[];
  phase: "FETCH" | "DECODE" | "EXECUTE";
  cycles: number;
  halted: boolean;
};
export const cpuProgram = [
  "LOAD #7",
  "ADD #5",
  "STORE [04]",
  "LOAD #3",
  "ADD [04]",
  "STORE [08]",
  "HALT",
];
export function initialCpu(): CpuState {
  return {
    pc: 0,
    acc: 0,
    memory: Array<number>(16).fill(0),
    phase: "FETCH",
    cycles: 0,
    halted: false,
  };
}
export function stepCpu(state: CpuState): CpuState {
  if (state.halted) return state;
  if (state.phase !== "EXECUTE")
    return {
      ...state,
      phase: state.phase === "FETCH" ? "DECODE" : "EXECUTE",
      cycles: state.cycles + 1,
    };
  const next: CpuState = {
    ...state,
    memory: [...state.memory],
    cycles: state.cycles + 1,
    phase: "FETCH",
    pc: state.pc + 1,
  };
  switch (state.pc) {
    case 0:
      next.acc = 7;
      break;
    case 1:
      next.acc += 5;
      break;
    case 2:
      next.memory[4] = state.acc;
      break;
    case 3:
      next.acc = 3;
      break;
    case 4:
      next.acc += state.memory[4];
      break;
    case 5:
      next.memory[8] = state.acc;
      break;
    default:
      next.halted = true;
      next.pc = state.pc;
  }
  return next;
}
