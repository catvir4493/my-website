"use client";
import { useId, ViewTransition, type CSSProperties } from "react";
import type { Project } from "@/data/projects";
import { useMotionPreferences } from "@/components/ui/motion-provider";

const descriptions = {
  vision:
    "Synthetic camera frame, object detection, left / center / right risk corridor, and voice / vibration feedback.",
  travel:
    "Illustrative Budapest to Vienna journey connected to a request, matching, chat, and order flow.",
  game: "Main menu, game state, dialogue, inventory, chapters, and archive connected as modular game systems.",
  algorithm:
    "Illustrative 15 by 15 Gomoku position, candidate moves, and a branching Minimax decision tree. Scores are illustrative, not runtime output.",
};
const stage = (index: number) => ({ "--stage": index }) as CSSProperties;

export function ProjectVisual({
  kind,
  large = false,
  shared = true,
}: {
  kind: Project["kind"];
  large?: boolean;
  shared?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const { quality, paused, quiet, dormant, reducedMotion } = useMotionPreferences();
  return (
    <>
      {large && (
        <p className="sr-only">
          {descriptions[kind]} This is a system visualization, not a runtime capture.
        </p>
      )}
      <ViewTransition
        name={shared ? `project-diagram-${kind}` : undefined}
        default="none"
        share={quality === "high" && !paused && !reducedMotion ? "module-morph" : "none"}
      >
        <div
          className={`project-visual visual-${kind}${large ? " large" : ""}`}
          aria-hidden="true"
          data-play={
            paused || quiet || dormant || reducedMotion
              ? "static"
              : large && quality !== "low"
                ? "loop"
                : "once"
          }
          data-cursor={large ? "TRACE" : undefined}
        >
          <svg viewBox="0 0 500 280" fill="none">
            <defs>
              <pattern id={`grid-${id}`} width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M25 0H0V25" stroke="currentColor" strokeOpacity=".07" />
              </pattern>
              <radialGradient id={`glow-${id}`}>
                <stop stopColor="currentColor" stopOpacity=".1" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="500" height="280" fill={`url(#grid-${id})`} />
            <ellipse cx="250" cy="130" rx="235" ry="145" fill={`url(#glow-${id})`} />
            <g className="diagram-ink" stroke="currentColor" strokeWidth="1">
              {kind === "vision" && (
                <>
                  <g className="diagram-stage" data-step="0" style={stage(0)}>
                    <path d="M35 69V49H55M299 49H319V69M35 202V222H55M299 222H319V202" />
                    <path d="M35 83H319M35 202H319" opacity=".2" />
                    <text x="36" y="37">
                      CAMERAX / FRAME INPUT
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="1" style={stage(1)}>
                    <rect x="162" y="104" width="39" height="79" strokeDasharray="3 3" />
                    <circle cx="181" cy="120" r="6" />
                    <path d="M181 127V157M169 140H193M181 157L170 175M181 157L192 175" />
                    <text x="152" y="96">
                      OBJECT_01
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="2" style={stage(2)}>
                    <path
                      d="M71 211L120 70H238L283 211M120 70L139 211M238 70L218 211"
                      opacity=".35"
                    />
                    <path d="M159 211L167 132H193L201 211Z" fill="currentColor" opacity=".07" />
                    <text x="69" y="238">
                      LEFT
                    </text>
                    <text x="161" y="238">
                      CENTER
                    </text>
                    <text x="257" y="238">
                      RIGHT
                    </text>
                  </g>
                  <g className="diagram-stage corridor-highlight" data-step="3" style={stage(3)}>
                    <path
                      d="M144 202L160 72H201L218 202Z"
                      fill="currentColor"
                      fillOpacity=".08"
                      strokeDasharray="3 5"
                    />
                    <text x="156" y="257">
                      RISK ACTIVE
                    </text>
                  </g>
                  <path
                    d="M322 131H346M370 92V109M370 147V175M370 202H390"
                    className="diagram-link"
                  />
                  <g className="diagram-stage" data-step="1" style={stage(1)}>
                    <rect x="346" y="56" width="116" height="35" />
                    <text x="358" y="78">
                      DETECTION
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="4" style={stage(4)}>
                    <rect x="346" y="110" width="116" height="36" />
                    <text x="358" y="133">
                      DECISION
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="5" style={stage(5)}>
                    <rect x="346" y="175" width="116" height="51" />
                    <text x="358" y="196">
                      VOICE
                    </text>
                    <text x="358" y="215">
                      VIBRATION
                    </text>
                  </g>
                </>
              )}
              {kind === "travel" && (
                <>
                  <text x="35" y="37">
                    JOURNEY / ILLUSTRATIVE SCENARIO
                  </text>
                  <path d="M85 153C128 24 318 24 387 125" strokeDasharray="3 6" opacity=".3" />
                  <path
                    d="M85 153C128 24 318 24 387 125"
                    className="diagram-link route-arc diagram-stage"
                    data-step="2"
                  />
                  <g className="diagram-stage" data-step="0" style={stage(0)}>
                    <circle cx="85" cy="153" r="20" />
                    <circle cx="85" cy="153" r="4" fill="currentColor" />
                    <text x="44" y="194">
                      BUDAPEST
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="1" style={stage(1)}>
                    <circle cx="387" cy="125" r="20" />
                    <circle cx="387" cy="125" r="4" fill="currentColor" />
                    <text x="364" y="164">
                      VIENNA
                    </text>
                  </g>
                  <path d="M85 217H422M180 98V201M305 121V201" opacity=".25" />
                  {[
                    ["REQUEST", 112],
                    ["MATCH", 218],
                    ["CHAT", 304],
                    ["ORDER", 385],
                  ].map(([label, x], index) => (
                    <g
                      key={label}
                      className="diagram-stage"
                      data-step={index + 3}
                      style={stage(index + 3)}
                    >
                      <rect x={Number(x) - 15} y="203" width="76" height="29" fill="#0b131a" />
                      <text x={Number(x) - 8} y="222">
                        {label}
                      </text>
                    </g>
                  ))}
                  <path
                    className="diagram-stage"
                    data-step="2"
                    d="M197 94L210 101L201 105L197 115L194 104L184 100L194 98Z"
                    fill="currentColor"
                    stroke="none"
                  />
                </>
              )}
              {kind === "game" && (
                <>
                  <text x="35" y="37">
                    MODULAR SCENE ARCHITECTURE
                  </text>
                  <path d="M91 109V177H255V109H413V177M255 177H413" opacity=".3" />
                  {[
                    { x: 35, y: 68, title: "MAIN MENU", sub: "ENTRY" },
                    { x: 199, y: 68, title: "GAME STATE", sub: "COORDINATE" },
                    { x: 363, y: 68, title: "DIALOGUE", sub: "INTERACT" },
                    { x: 35, y: 157, title: "INVENTORY", sub: "ITEMS" },
                    { x: 199, y: 157, title: "CHAPTERS", sub: "PROGRESSION" },
                    { x: 363, y: 157, title: "ARCHIVE", sub: "PERSIST" },
                  ].map((node, index) => (
                    <g
                      key={node.title}
                      className="diagram-stage"
                      data-step={index}
                      style={stage(index)}
                    >
                      <rect x={node.x} y={node.y} width="102" height="51" fill="#111619" />
                      <path
                        d={`M${node.x} ${node.y + 9}V${node.y}H${node.x + 16}`}
                        strokeWidth="2"
                      />
                      <text x={node.x + 10} y={node.y + 22}>
                        {node.title}
                      </text>
                      <text className="diagram-subtext" x={node.x + 10} y={node.y + 40}>
                        {node.sub}
                      </text>
                    </g>
                  ))}
                  <path
                    d="M137 93H199M301 93H363M137 182H199M301 182H363"
                    className="diagram-link"
                  />
                  <text x="35" y="239">
                    GODOT / CONNECTED SYSTEMS
                  </text>
                </>
              )}
              {kind === "algorithm" && (
                <>
                  <text x="35" y="37">
                    15 × 15 / BOARD STATE
                  </text>
                  <g transform="translate(35 62)">
                    {Array.from({ length: 15 }, (_, index) => (
                      <path
                        key={index}
                        d={`M${index * 11.5} 0V161M0 ${index * 11.5}H161`}
                        opacity=".24"
                      />
                    ))}
                    {[
                      [7, 7],
                      [8, 8],
                      [6, 7],
                      [9, 9],
                      [5, 7],
                      [7, 8],
                      [4, 7],
                      [6, 8],
                    ].map(([x, y], index) => (
                      <circle
                        key={index}
                        cx={x * 11.5}
                        cy={y * 11.5}
                        r="4.4"
                        fill={index % 2 ? "#31424d" : "#c5d9e5"}
                        strokeOpacity=".5"
                      />
                    ))}
                    <g className="diagram-stage" data-step="1" style={stage(1)}>
                      <circle cx="34.5" cy="80.5" r="5.5" strokeDasharray="2 2" />
                      <circle
                        cx="115"
                        cy="115"
                        r="5.5"
                        strokeDasharray="2 2"
                        data-alternative="true"
                      />
                    </g>
                    <g className="diagram-stage" data-step="5" style={stage(5)}>
                      <circle cx="34.5" cy="80.5" r="9" />
                      <circle cx="34.5" cy="80.5" r="4" fill="currentColor" />
                    </g>
                  </g>
                  <text x="260" y="37">
                    MINIMAX / SEARCH
                  </text>
                  <path
                    className="diagram-stage"
                    data-step="2"
                    d="M196 143H231M347 88L283 135M347 88L409 135M283 151L254 191M283 151L312 191M409 151L378 191M409 151L438 191"
                    opacity=".3"
                  />
                  <g className="diagram-stage" data-step="2" style={stage(2)}>
                    {[
                      [347, 77],
                      [283, 143],
                      [409, 143],
                      [254, 203],
                      [312, 203],
                      [378, 203],
                      [438, 203],
                    ].map(([x, y]) => (
                      <circle
                        key={`${x}-${y}`}
                        cx={x}
                        cy={y}
                        r="9"
                        fill="#0d1924"
                        data-alternative={x === 254 || x >= 378}
                      />
                    ))}
                  </g>
                  <g className="diagram-stage" data-step="3" style={stage(3)}>
                    <text x="319" y="61">
                      MAX +2
                    </text>
                    <text x="243" y="167">
                      MIN +2
                    </text>
                    <text x="384" y="167">
                      MIN −1
                    </text>
                    <text x="244" y="236" data-alternative="true">
                      +4
                    </text>
                    <text x="302" y="236">
                      +2
                    </text>
                    <text x="368" y="236" data-alternative="true">
                      −1
                    </text>
                    <text x="428" y="236" data-alternative="true">
                      +1
                    </text>
                  </g>
                  <g className="diagram-stage" data-step="5" style={stage(5)}>
                    <path d="M347 88L283 135M283 151L312 191" strokeWidth="1.5" />
                    <text x="268" y="112">
                      BEST MOVE
                    </text>
                  </g>
                  <text className="diagram-subtext" x="261" y="254">
                    ILLUSTRATIVE SCORES
                  </text>
                </>
              )}
            </g>
            <path
              d="M14 28V14H28M472 14H486V28M14 250V266H28M472 266H486V250"
              stroke="currentColor"
              strokeOpacity=".28"
            />
          </svg>
          <span className="visual-caption mono">
            {large ? "SYSTEM VISUALIZATION" : "CONCEPT SCHEMATIC"} /{" "}
            {kind === "vision"
              ? "PERCEPTION → FEEDBACK"
              : kind === "travel"
                ? "JOURNEY → MATCH"
                : kind === "game"
                  ? "STATE → SYSTEMS"
                  : "SEARCH → DECISION"}
          </span>
        </div>
      </ViewTransition>
    </>
  );
}
