export type ExperimentId = "sorting" | "pathfinding" | "converter" | "memory" | "cpu";
export const experiments: {
  id: ExperimentId;
  index: string;
  name: string;
  status: "ONLINE" | "EXPERIMENTAL";
  description: string;
}[] = [
  {
    id: "sorting",
    index: "001",
    name: "Sorting Visualizer",
    status: "ONLINE",
    description: "Bubble, quick, and merge sort. Compare every swap and write.",
  },
  {
    id: "pathfinding",
    index: "002",
    name: "Pathfinding Lab",
    status: "ONLINE",
    description:
      "A* and Dijkstra. Edit the grid, step through the frontier, inspect shortest paths.",
  },
  {
    id: "converter",
    index: "003",
    name: "Binary Playground",
    status: "ONLINE",
    description: "Decimal, binary, hexadecimal, and octal. Exact signed / unsigned bit patterns.",
  },
  {
    id: "memory",
    index: "004",
    name: "Memory Lab",
    status: "EXPERIMENTAL",
    description: "Stack frames, malloc, free, and fragmentation in an educational simulation.",
  },
  {
    id: "cpu",
    index: "005",
    name: "CPU Instruction Cycle",
    status: "ONLINE",
    description:
      "The existing fetch / decode / execute experiment. Registers and simulated memory.",
  },
];
