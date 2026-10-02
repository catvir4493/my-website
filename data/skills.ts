export type Skill = {
  name: string;
  category: string;
  usage: string;
  focus: string;
  evidence: { name: string; href: string }[];
};
export const skillGroups = [
  "ALL SYSTEMS",
  "LANGUAGES",
  "ENGINEERING",
  "AI / VISION",
  "TOOLS",
  "WEB",
];
const gomoku = [{ name: "Gomoku AI", href: "/projects/gomoku-ai" }];
const vision = [{ name: "Vision Navigation", href: "/projects/vision-navigation" }];
const game = [{ name: "Swordsmith Notebook", href: "/projects/swordsmith-notebook" }];
const airpocket = [{ name: "AirPocket", href: "/projects/airpocket" }];
const web = [{ name: "Marcell.OS / Engineering Lab", href: "/lab" }];
export const skills: Skill[] = [
  {
    name: "JavaScript",
    category: "LANGUAGES",
    usage: "WeChat mini-program pages and Cloud Development functions",
    focus: "Verified public source archive",
    evidence: airpocket,
  },
  {
    name: "WeChat Mini Program",
    category: "TOOLS",
    usage: "WXML / WXSS interface and Cloud Development integration",
    focus: "Verified public source archive",
    evidence: airpocket,
  },
  {
    name: "C",
    category: "LANGUAGES",
    usage: "Board state, search, and serialization",
    focus: "Project implementation",
    evidence: gomoku,
  },
  {
    name: "TypeScript",
    category: "LANGUAGES",
    usage: "Typed portfolio and interactive experiments",
    focus: "Project implementation",
    evidence: web,
  },
  {
    name: "C++",
    category: "LANGUAGES",
    usage: "Learning interest; no project usage asserted",
    focus: "Learning",
    evidence: [],
  },
  {
    name: "Python",
    category: "LANGUAGES",
    usage: "Learning interest; no project usage asserted",
    focus: "Learning",
    evidence: [],
  },
  {
    name: "Algorithms",
    category: "ENGINEERING",
    usage: "Minimax / heuristic evaluation",
    focus: "Search-based game AI",
    evidence: gomoku,
  },
  {
    name: "Data Structures",
    category: "ENGINEERING",
    usage: "Board representation and game state",
    focus: "Modular C",
    evidence: gomoku,
  },
  {
    name: "Game Systems",
    category: "ENGINEERING",
    usage: "Dialogue, chapters, archive, and interactions",
    focus: "Active development",
    evidence: game,
  },
  {
    name: "Dynamic Memory",
    category: "ENGINEERING",
    usage: "Allocation and fragmentation visualization",
    focus: "Educational simulation",
    evidence: [{ name: "Memory Lab", href: "/lab#memory" }],
  },
  ...["Computer Vision", "MediaPipe", "EfficientDet-Lite0", "Object Detection"].map((name) => ({
    name,
    category: "AI / VISION",
    usage: "On-device detection → directional risk warnings",
    focus: "Working Android prototype",
    evidence: vision,
  })),
  ...["Android", "CameraX"].map((name) => ({
    name,
    category: "TOOLS",
    usage: "Mobile frame stream and feedback pipeline",
    focus: "Project implementation",
    evidence: vision,
  })),
  {
    name: "Godot",
    category: "TOOLS",
    usage: "Scene architecture and connected game systems",
    focus: "Active development",
    evidence: game,
  },
  {
    name: "Git",
    category: "TOOLS",
    usage: "Version-control learning",
    focus: "Learning / workflow",
    evidence: [],
  },
  {
    name: "Linux",
    category: "TOOLS",
    usage: "Systems learning interest",
    focus: "Learning",
    evidence: [],
  },
  ...["React", "Next.js", "Tailwind CSS"].map((name) => ({
    name,
    category: "WEB",
    usage: "Marcell.OS portfolio interface",
    focus: "This website",
    evidence: web,
  })),
];
