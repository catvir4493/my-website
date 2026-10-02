# MARCELL.OS v1.2.0 — VISUAL SYSTEMS UPDATE

The existing portfolio, its seven routes, its content, and its functional architecture remain intact. This release refines depth, lighting, materials, feedback, and continuity around the established interface.

## Audit before implementation

- Next.js App Router / React 19, Tailwind 4 with modular CSS. Design colors lived in `base.css`; there is no separate Tailwind config. Typography already separates Space Grotesk headings, Inter body, and JetBrains Mono engineering labels.
- The existing Compute Core was dynamically loaded and protected by an error boundary, with a CSS fallback for mobile and reduced motion. Its original 72 pins each used their own mesh/material; its 110 particles and large full-emissive middle plate offered limited return. Rings extended near the canvas edges. There was no custom shader or post-processing stack.
- Both `.site-grid` and `.site-grid::before` drew the same grid. The pseudo-element drifted continuously. The negative z-index put the environment behind the main background, reducing its contribution to depth.
- Motion durations were scattered across CSS. Framer Motion was confined to grouped reveals and global reduced-motion configuration. Existing route changes had no shared visual identity. The digital avatar scanned repeatedly.
- Project card tilt moved the entire card, including text. Project illustration colors followed the global cyan/violet/lime categories; the generic Gomoku illustration showed a nine-line board and an unsupported alpha/beta cue.
- The existing skills system was a readable DOM graph with actual evidence links, rather than a WebGL scene. Its hover and selection shared one state. Existing pathfinding already exposed real open/closed/current states; memory already simulated allocation, freeing, and contiguous space correctly.
- Modals already trapped focus, restored it, and made primary content inert. Layers used the existing HUD, dialog, boot, and cursor ordering. Blur was concentrated in the sticky header and modals; the header used 18px blur.
- Offscreen and tab visibility checks already protected the core; the canvas used an unrestricted `always` loop while visible. Decorative tickers, the header clock, and optional Matrix effect did not share those lifecycle checks.

## 1. Visual components created

- `components/visual/environment.tsx`: manages the environmental layers, section atmosphere, module visibility, and event-driven pointer/scroll parallax.
- `ambient-light.tsx`, `depth-grid.tsx`: radial light volumes and one masked environment grid.
- `cursor-glow.tsx`: one delegated pointer handler for eligible surfaces; CSS coordinates update at most once per pointer frame, with no idle loop or React state updates.
- `project-ambient.ts`: translates project data into shared CSS variables.
- `route-transition.tsx`: `ProjectLink` and a persistent module identity indicator through navigation. Links retain native modifier-click, prefetch, and keyboard behavior.
- `route-resolve.tsx` and `app/template.tsx`: subtle module arrival across all routes, keyed by pathname, including detail-to-detail navigation.
- `lib/motion.ts`, `lib/visual-quality.ts`, `lib/core-material.ts`: shared timing, adaptive quality, and the smoked-glass Fresnel shader.
- `visual-tokens.css`, `visual-environment.css`, `visual-surfaces.css`, `visual-motion.css`: centralized visual foundation and separated responsibilities.

## 2. Existing components modified

The layout, MotionProvider, Reveal, hero, Core wrapper and existing CoreScene, project cards and diagrams, project detail page, skills inspector/network, terminal palette label, lab tabs and memory visualization, footer, header, ticker, cursor, Matrix lifecycle, and playback hook were refined. Existing CSS timings now use the shared tokens. System/package release labels now read v1.2.0; project versioning and owner-provided facts were retained.

## 3–6. Compute Core, motion, lighting, and shader

- The original core architecture now contains a matte metal base, understated emissive circuit frame, sixteen processing tiles, raised central module, and a smoked-glass cover. Roughness varies between surfaces; highlights stay restrained.
- The 72 pins now share one instanced draw. Orbit geometry uses 96 segments instead of 160, with interrupted arcs and smaller signal markers. High quality uses 48 particles; medium uses 16, compared with 110 previously.
- Three sparse pulses follow visible input/process/output traces. Each project selects its own trace topology: linear perception pipeline, branching route network, modular state loop, or decision branches. Hover activates the frame; click activity settles after 450ms.
- Soft cyan key lighting and a weak violet rim replace the earlier high-energy lighting. Project selection affects the local key light, frame, data paths, and CSS atmosphere. Status green remains a small accent.
- High quality uses one small Fresnel shader on the glass cover. It computes edge alpha and tint from the view angle. There is no shader displacement, fullscreen post-processing, bloom, or extra canvas. Medium uses a simpler translucent material.
- Motion tokens: fast 160ms, standard 280ms, system 500ms, cinematic 800ms, atmosphere 1600ms. The shared easing is `cubic-bezier(0.22, 1, 0.36, 1)`.
- Module reveals group related content, activate a thin line, and focus headings. Body text maintains contrast during reveals. Project opening uses a one-pass scan and React ViewTransition to morph the same project diagram from card to hero. Other browsers preserve route resolve and local color continuity.
- Cards keep text stable, lift only their diagram by 3px, activate partial corners/status edges, and respond to pointer light. Buttons compress 1px and move arrows 2px. The terminal frame/top bar/prompt sequence resolves within roughly 370ms. The command palette dims the environment and slows the core to ten scheduled frames per second.

## 7. Project-specific visual effects

| Project             | Local light          | Synthetic system visualization                                                               |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Vision Navigation   | Cool blue/cyan       | CameraX frame → object box → directional corridor → risk logic → voice/vibration             |
| AirPocket           | Teal/cyan            | Illustrative Budapest → Vienna route → request → matching → chat → order                     |
| Swordsmith Notebook | Muted amber/dark red | Menu, game state, dialogue, inventory, chapters, and archive modules                         |
| Gomoku AI           | Blue/white           | Actual 15×15 diagram grid, candidate moves, Minimax branches, explicitly illustrative scores |

SVG IDs are unique. All diagrams are labeled as system visualizations or concept schematics. Detail diagrams include text equivalents. No diagram claims to be a screenshot, live product capture, benchmark, or neural-network implementation.

The skills graph separates hover, selection, related, and idle states. Selecting C highlights algorithms, data structures, and the related memory teaching model, while retaining truthful evidence links. Related edges receive a brief traveling signal. Pathfinding color transitions preserve the real search sequence; memory adds a proportional contiguous-region strip and block edges to make fragmentation visible.

## 8–9. Mobile and reduced motion

- Up to 760px, the core uses an intentional static layered composition with pins, technical traces, orbit outlines, and radial light. Project navigation remains fully interactive. The WebGL chunk is not requested for this mode.
- Medium quality uses fewer particles, simple glass, a 20fps scheduled core, DPR capped at 1.25, and no global parallax. High quality caps DPR at 1.5 and schedules the core at about 20fps at idle and 30fps during interaction. Both pins and processing tiles are instanced; the two tile batches preserve their different roughness values.
- Quality detection uses only viewport/reduced-motion media queries, coarse hardware concurrency, and the Save-Data preference. It stores no fingerprint or device profile.
- Reduced motion disables parallax, WebGL, route/shared-element animation, moving SVG signals, and scan effects. Functional state changes, all content, and all keyboard controls remain.
- User pause and tab visibility share a dormant state. The core, ticker, clock, Matrix, CSS loops, and experiment playback stop while dormant; active experiments resume from their state. The core also stops when outside its viewport margin. SVG diagram/architecture loops pause offscreen.

## 10–12. Verification

Validation ran against the local production build on 2 October 2026. Evidence is saved in `artifacts/v1.2/`; the scripts are checked in so it can be repeated.

| Check                  | Result                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run build`        | Passed; all 13 static outputs generated, including every existing project route                                          |
| `npm run lint`         | Passed; zero warnings                                                                                                    |
| `npm run typecheck`    | Passed                                                                                                                   |
| `npm test`             | 39 passed; existing functionality, new continuity/quality checks, mobile WCAG checks, and readable paused-motion dialogs |
| Desktop Lighthouse     | Performance **97**, accessibility **100**, best practices **100**, SEO **100**                                           |
| Mobile Lighthouse      | Performance **92**, accessibility **100**, best practices **100**, SEO **100**                                           |
| Desktop startup        | FCP 0.2s, LCP 1.0s, TBT 30ms, CLS 0.008                                                                                  |
| Mobile startup         | FCP 0.9s, LCP 3.3s, TBT 30ms, CLS 0                                                                                      |
| Chromium layout checks | Seven routes at 1920×1080, 1440×900, 1366×768, 820×1180 iPad, and 390×844; no horizontal overflow or page errors         |
| WebKit compatibility   | Seven routes at desktop and mobile sizes; palette and project navigation passed, zero page errors                        |
| Live GitHub endpoint   | Connected to configured public account `catvir4493`; verified independently of mocked recovery tests                     |

The visual matrix includes 62 Chromium captures plus WebKit desktop/mobile captures. Terminal, palette, pathfinding, memory, converter, CPU, and reduced-motion states are included. The runtime probe confirms roughly 20 actual core frames per second at idle, 30 during project interaction, and 10 in command mode. Offscreen, user-paused, simulated hidden-tab, and mobile states generate **zero core frames**. About 22 draw calls per core frame remain after instancing. Native view transitions were observed on both core navigation and card-to-detail navigation.

The final Lighthouse measurements exceed the 90 desktop / 85 mobile targets. Earlier v1.1 reports in this folder showed 98 / 93; the final 97 / 92 measurements are one point lower, and are not a controlled same-run comparison. The upgrade therefore meets the requested budgets but does not claim a Lighthouse improvement. No warnings were reported by either final Lighthouse run.

Runtime performance uses headless Chromium/Edge and may use software WebGL. Browser RAF cadence is distinct from the deliberately capped core cadence. Renderer TaskDuration measures main-thread work, not total system CPU or GPU load. Hidden-tab visibility is simulated to exercise lifecycle cleanup. WebKit verifies the Safari engine; native Safari on Apple hardware and Lighthouse against a deployed v1.2 release remain unverified. These are local production-build results, not production Vercel claims.

## 13. Intentionally omitted

- True volumetric lighting, bloom passes, reflective environments, extra canvases, heavy particle fields, and animated fullscreen noise: their cost and visual density would exceed their value here. Noise is a cached static texture at 1.8% opacity.
- Grid-displacement/black-hole shaders: unnecessary for the restrained core composition; the masked grid and shallow parallax supply environmental depth.
- Aggressive card rotation, bouncing springs, prolonged boot delays, repeated global scans, broken-CRT distortion, fake performance counters, and generated product screenshots: these would weaken usability, readability, or factual accuracy.
- A second large marketing slogan: the existing hero and contact typography already provide two substantial typographic moments without changing the approved content architecture.

This workspace is a supplied project folder without a Git repository. No deployment or source-control publication is performed by this implementation.
