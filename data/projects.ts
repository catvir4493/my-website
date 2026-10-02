export type ArchitectureNode = { title: string; detail: string };
export type Challenge = { title: string; description: string };
export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};
export type Project = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  category: string;
  summary: string;
  status: string;
  featured?: boolean;
  tech: string[];
  accent: "cyan" | "violet" | "lime";
  kind: "travel" | "vision" | "game" | "algorithm";
  ambientPrimary: string;
  ambientSecondary: string;
  glowStrength: number;
  problem: string;
  idea: string;
  architecture: ArchitectureNode[];
  challenges: Challenge[];
  results: string[];
  futureWork: string[];
  features: string[];
  performance?: { value: string; context: string };
  repository?: string;
  demo?: string;
  images: ProjectImage[];
};
// Owner-supplied facts. Future work is separate from implemented results.
// No project dates or benchmark claims are inferred from the portfolio release date.
export const projects: Project[] = [
  {
    id: "001",
    slug: "vision-navigation",
    name: "Vision Navigation",
    category: "AI / COMPUTER VISION / ACCESSIBILITY",
    status: "WORKING PROTOTYPE",
    featured: true,
    summary:
      "Real-time Android vision system that turns object detections into directional navigation warnings.",
    tech: ["CameraX", "MediaPipe", "EfficientDet-Lite0", "Android", "On-device inference"],
    accent: "violet",
    kind: "vision",
    ambientPrimary: "#86bfff",
    ambientSecondary: "#65d4e8",
    glowStrength: 0.12,
    problem:
      "A detected chair is not automatically a navigation risk. Visual assistance must interpret an object’s relative position, its relationship to the movement corridor, proximity cues, and likely collision relevance. Raw object labels alone cannot tell a visually impaired user what deserves attention.",
    idea: "Camera → perception → spatial reasoning → feedback. This Android accessibility prototype interprets on-device detections through a risk corridor, then communicates relevant obstacles with directional voice warnings and vibration cues.",
    architecture: [
      { title: "Camera", detail: "Live camera input" },
      { title: "CameraX frame stream", detail: "Android frame pipeline / orientation handling" },
      { title: "Object detection", detail: "MediaPipe / EfficientDet-Lite0 / on-device inference" },
      { title: "Object detections", detail: "x / y / width / height / class / confidence" },
      {
        title: "Risk corridor analysis",
        detail: "Objects relative to the user’s movement corridor",
      },
      { title: "LEFT / CENTER / RIGHT", detail: "Directional risk segmentation" },
      { title: "Risk evaluation", detail: "Position and navigation relevance → warning decision" },
      {
        title: "Voice + vibration feedback",
        detail: "Spoken warnings / directional information / vibration cues",
      },
    ],
    challenges: [
      {
        title: "Real-time performance",
        description:
          "Keep mobile inference and frame processing responsive within the device’s resource budget.",
      },
      {
        title: "Rotation / orientation",
        description:
          "Align camera coordinates, detection boxes, and corridor regions, including landscape orientation.",
      },
      {
        title: "Risk relevance",
        description:
          "A detector identifies an object; the navigation layer decides whether its position matters to the movement corridor. Proximity and collision relevance remain engineering concerns, rather than guaranteed distance measurements.",
      },
      {
        title: "Feedback overload",
        description:
          "Prioritize useful cues so repeated spoken warnings do not overwhelm the user.",
      },
    ],
    results: [
      "Working Android prototype with real-time object detection.",
      "LEFT / CENTER / RIGHT directional risk segmentation.",
      "Voice and vibration feedback pipeline.",
      "~20 FPS observed in the tested implementation; an approximate observation, not a standardized benchmark or production-readiness claim.",
    ],
    futureWork: [
      "Depth estimation",
      "Object tracking",
      "Improved corridor prediction",
      "Navigation context",
      "Adaptive warning frequency",
      "Route-level assistance",
    ],
    features: [
      "On-device perception",
      "Risk corridor logic",
      "Directional warnings",
      "Voice + vibration",
    ],
    performance: { value: "~20 FPS", context: "Observed in prototype testing / approximate" },
    images: [],
  },
  {
    id: "002",
    slug: "airpocket",
    name: "AirPocket",
    category: "PLATFORM / PRODUCT ENGINEERING",
    status: "PLATFORM CONCEPT",
    summary:
      "Travel and delivery matching platform exploring trip publishing, requests, chat and order workflows.",
    tech: ["WeChat Mini Program", "JavaScript", "WXML / WXSS", "WeChat Cloud Development"],
    accent: "cyan",
    kind: "travel",
    ambientPrimary: "#77dbcd",
    ambientSecondary: "#7cd6ee",
    glowStrength: 0.1,
    problem:
      "A traveler’s existing journey and another person’s delivery request can overlap, but the two sides need a clear way to discover each other and coordinate a handoff.",
    idea: "A travel / delivery matching platform concept connects travelers and requesters through published journeys, requests, conversation, and an understandable order flow.",
    architecture: [
      { title: "Login", detail: "User entry" },
      { title: "Traveler / requester", detail: "Two complementary roles" },
      { title: "Trips / requests", detail: "Publish trip / publish request" },
      { title: "Matching", detail: "Connect compatible journeys and delivery needs" },
      { title: "Chat", detail: "Coordinate details and handoffs" },
      { title: "Order flow", detail: "Represent the delivery workflow" },
    ],
    challenges: [
      {
        title: "Two-sided product flow",
        description:
          "Keep publishing and matching understandable for both travelers and requesters.",
      },
      {
        title: "Coordinated handoffs",
        description:
          "Make the relationship between matching, chat, and order state clear without assuming a particular backend implementation.",
      },
    ],
    results: [
      "Project scope covers Login, Publish Trip, Publish Request, Chat, and Orders.",
      "Published source archives contain a WeChat mini-program with delivery listings, offered capacity, binding records, administration pages, and Cloud Development functions.",
      "Presented as a platform concept; no production deployment, transaction, revenue, or user-count claims.",
    ],
    futureWork: ["Evaluate matching rules", "Refine handoff and order-state interactions"],
    features: ["Login", "Publish Trip", "Publish Request", "Chat", "Orders"],
    repository: "https://github.com/catvir4493/AirPocket",
    images: [],
  },
  {
    id: "003",
    slug: "swordsmith-notebook",
    name: "Swordsmith Notebook",
    subtitle: "铸剑师手记",
    category: "GAME SYSTEMS / GODOT",
    status: "ACTIVE DEVELOPMENT",
    summary:
      "Godot game project built around modular dialogue, progression, archive and interaction systems.",
    tech: ["Godot", "Game systems", "Scene architecture"],
    accent: "lime",
    kind: "game",
    ambientPrimary: "#d9b47d",
    ambientSecondary: "#985e54",
    glowStrength: 0.1,
    problem:
      "A workshop game needs more than a playable scene: conversations, items, requests, progression, and saved state must remain consistent across environments and UI transitions.",
    idea: "Treat the game as a set of connected systems. Scene architecture supports the forge / shop environment while interaction, dialogue, archive, and chapter systems maintain the player’s evolving state.",
    architecture: [
      { title: "Scenes / environment", detail: "Main menu and forge / shop environment" },
      { title: "Interaction / dialogue", detail: "Player actions and conversation state" },
      { title: "Items / requests", detail: "Item and request / combination systems" },
      { title: "Chapter progression", detail: "Progression across narrative chapters" },
      { title: "Save / archive", detail: "Persistent progress and archive systems" },
      { title: "UI state", detail: "Presentation aligned with game state" },
    ],
    challenges: [
      {
        title: "Connected state",
        description:
          "Coordinate dialogue, items, chapter progress, and archive data without coupling every scene to every other scene.",
      },
      {
        title: "Scene and UI boundaries",
        description:
          "Keep environment interactions and menu transitions consistent as development expands.",
      },
    ],
    results: [
      "Active Godot development includes the main menu, forge / shop environment, archive, chapter, and dialogue systems.",
      "Systems work is ongoing; this is not a finished-game release.",
    ],
    futureWork: [
      "Continue integrating interaction, item, and request / combination systems",
      "Refine environment and UI state transitions",
    ],
    features: ["Main menu", "Forge / shop", "Archive", "Chapters", "Dialogue"],
    repository: "https://github.com/catvir4493/Swordsmith-Notebook-",
    images: [],
  },
  {
    id: "004",
    slug: "gomoku-ai",
    name: "Gomoku AI",
    category: "C / ALGORITHMS / MINIMAX",
    status: "IMPLEMENTED",
    summary:
      "15×15 terminal Gomoku in C with a Minimax-based opponent, undo and save/load support.",
    tech: ["C", "Minimax", "Heuristic search"],
    accent: "cyan",
    kind: "algorithm",
    ambientPrimary: "#9fbfff",
    ambientSecondary: "#dae6f3",
    glowStrength: 0.1,
    problem:
      "A 15×15 board creates a large decision space. A search-based opponent needs a useful evaluation function and a controllable search depth while the game retains reliable undo and save/load behavior.",
    idea: "A modular C game separates board state, legal moves, heuristic scoring, Minimax search, and serialization. Configurable depth exposes the tradeoff between search effort and the opponent’s decisions.",
    architecture: [
      {
        title: "Board / game state",
        detail: "15×15 representation / human-vs-AI / local two-player",
      },
      { title: "Move generation", detail: "Generate candidate legal moves" },
      { title: "Heuristic evaluation", detail: "Score game positions" },
      { title: "Minimax search tree", detail: "Configurable AI search depth" },
      { title: "Game controls", detail: "New game / undo" },
      { title: "Serialization", detail: "Save game / load game" },
    ],
    challenges: [
      {
        title: "Search budget",
        description:
          "Balance the growth of the search tree with useful heuristic scoring and configurable depth.",
      },
      {
        title: "State consistency",
        description: "Preserve the board and turn state across undo, save, and load operations.",
      },
    ],
    results: [
      "15×15 terminal game written in C.",
      "Human-vs-AI and local two-player modes.",
      "Undo, save, load, new game, and configurable search depth.",
      "Minimax / heuristic search; no unverified alpha-beta or search-strength claims.",
    ],
    futureWork: [
      "Measure search behavior across depth settings",
      "Refine evaluation and move-generation tradeoffs",
    ],
    features: [
      "Human vs AI",
      "Local two-player",
      "Undo",
      "Save / load",
      "New game",
      "Configurable depth",
    ],
    images: [],
  },
];
