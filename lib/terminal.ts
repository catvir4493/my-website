import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { system } from "@/data/system";
import type { Contact } from "@/data/contact";
export type TerminalResult = {
  lines: string[];
  action?: "clear" | "matrix" | "stop-matrix" | "navigate" | "github" | "close";
  path?: string;
};
type Context = { history?: string[]; contacts?: Contact[]; now?: Date };
export function runCommand(raw: string, context: Context = {}): TerminalResult {
  const text = raw.trim().toLowerCase();
  const [command, ...args] = text.split(/\s+/);
  const responses: Record<string, string[]> = {
    help: [
      "MARCELL.OS — COMMAND REFERENCE",
      "help / whoami / about / education / location",
      "projects / projects --all / open <slug>",
      "skills / lab / contact / github",
      "clear / history / date / neofetch / exit",
      "matrix / matrix --stop / sudo",
      "↑ / ↓: history · Tab: autocomplete · Ctrl+L: clear",
      "Only predefined portfolio commands are available.",
    ],
    whoami: [profile.name, profile.role, profile.university],
    about: [
      "Marcell / Computer Engineering Student at BME",
      "Building software, computer vision systems, algorithms, and experimental technology.",
      "Run: open about",
    ],
    education: [
      profile.university,
      "BME — Budapesti Műszaki és Gazdaságtudományi Egyetem",
      profile.degree,
    ],
    location: [profile.location, "Time zone: Europe/Budapest"],
    skills: [
      "EVIDENCE / TECHNOLOGY RELATIONSHIPS",
      ...skills.map(
        (skill) =>
          `${skill.name}: ${skill.evidence.length ? skill.evidence.map((item) => item.name).join(" / ") : "LEARNING"}`,
      ),
    ],
    contact: context.contacts?.length
      ? context.contacts.map((item) => `${item.name}: ${item.url}`)
      : ["NOT CONNECTED"],
    neofetch: [
      "███╗   ███╗",
      "████╗ ████║",
      "██╔████╔██║",
      "██║╚██╔╝██║",
      "██║ ╚═╝ ██║",
      "",
      `OS        Marcell.OS v${system.version}`,
      "Host      BME",
      "Major     Computer Engineering",
      `School    ${profile.university}`,
      `Location  ${profile.location}`,
      "Focus     Systems / AI / Software",
      "Status    Building",
      "Shell     curiosity",
      "Theme     Engineering Black",
      "Core      Human × Technology",
    ],
    history: (context.history || []).map(
      (entry, index) => `${String(index + 1).padStart(3, " ")}  ${entry}`,
    ),
    date: [
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "Europe/Budapest",
      }).format(context.now || new Date()),
    ],
  };
  if (!command) return { lines: [] };
  if (responses[command] && !args.length) return { lines: responses[command] };
  if (command === "projects" && (!args.length || args.join(" ") === "--all"))
    return {
      lines: [
        "PROJECT ARCHIVE / ENGINEERING MODULES",
        ...projects.flatMap((project) => [
          `${project.id}  ${project.name}  [${project.slug}] / ${project.status}`,
          ...(args.length ? [`     ${project.summary}`, `     ${project.tech.join(" / ")}`] : []),
        ]),
        "Use: open <slug>",
      ],
    };
  if (command === "clear" && !args.length) return { lines: [], action: "clear" };
  if (command === "exit" && !args.length) return { lines: ["Closing session."], action: "close" };
  if (command === "sudo")
    return {
      lines:
        args.join(" ") === "rm -rf /"
          ? [
              "Critical operation blocked by Marcell.OS safety layer.",
              "The compute core prefers to keep existing.",
            ]
          : ["Permission denied.", "Nice try."],
    };
  if (command === "matrix" && (!args.length || args.join(" ") === "--stop"))
    return args.length
      ? { lines: ["Data stream terminated."], action: "stop-matrix" }
      : { lines: ["Data stream online. Auto-stop in 15s. Use: matrix --stop"], action: "matrix" };
  if (command === "github" && !args.length) {
    const github = context.contacts?.find((item) => item.name === "GitHub");
    return github
      ? { lines: ["Opening the verified GitHub profile…"], action: "github", path: github.url }
      : { lines: ["GitHub / NOT CONNECTED"] };
  }
  if (command === "lab" && !args.length)
    return { lines: ["Opening engineering lab…"], action: "navigate", path: "/lab" };
  if (command === "open") {
    const target = args.join(" ");
    const project = projects.find((project) =>
      [project.slug, project.name.toLowerCase(), project.id].includes(target),
    );
    if (project)
      return {
        lines: [`Loading ${project.name}…`],
        action: "navigate",
        path: `/projects/${project.slug}`,
      };
    const paths: Record<string, string> = {
      home: "/",
      about: "/#about",
      projects: "/projects",
      skills: "/#skills",
      lab: "/lab",
      contact: "/#contact",
    };
    if (paths[target])
      return { lines: [`Opening ${target}…`], action: "navigate", path: paths[target] };
    return {
      lines: [
        `Module not found: ${target || "(missing target)"}`,
        "Use: projects, then open <slug>",
      ],
    };
  }
  return { lines: [`Command not found: ${raw.trim()}`, "Type help for available commands."] };
}
export const terminalCommands = [
  "help",
  "whoami",
  "about",
  "education",
  "location",
  "skills",
  "projects",
  "projects --all",
  "contact",
  "github",
  "lab",
  "clear",
  "history",
  "date",
  "neofetch",
  "matrix",
  "matrix --stop",
  "sudo",
  "exit",
  ...projects.map((project) => `open ${project.slug}`),
  "open home",
  "open about",
  "open contact",
  "open skills",
  "open projects",
  "open lab",
];
