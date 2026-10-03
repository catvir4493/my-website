import {
  decideQuality,
  deferredCapabilities,
  probeCapabilities,
  unknownCapabilities,
  type GraphicsCapabilities,
  type GraphicsQuality,
} from "./capabilities";
export type LayoutClass = "phone" | "tablet" | "compact-desktop" | "desktop" | "wide-desktop";
export interface GraphicsProfile {
  ready: boolean;
  quality: GraphicsQuality;
  autoQuality: GraphicsQuality;
  layoutClass: LayoutClass;
  dpr: number;
  renderDpr: number;
  renderScale: number;
  webgl2: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  pointerType: "fine" | "coarse" | "none";
  pointerFine: boolean;
  pointerCoarse: boolean;
  hoverCapable: boolean;
  touchCapable: boolean;
  touchPoints: number;
  viewport: [number, number];
  screen: [number, number];
  mobileStaticCorePolicy: boolean;
  coreWebgl: boolean;
  debug: boolean;
  reason: string[];
  capabilities: GraphicsCapabilities;
}
export function classifyLayout(width: number, fine: boolean, hover: boolean): LayoutClass {
  if (width < 640) return "phone";
  if (width < 900) return fine && hover ? "compact-desktop" : "tablet";
  if (width < 1200) return "compact-desktop";
  return width < 1800 ? "desktop" : "wide-desktop";
}
export function capRenderDpr(dpr: number, quality: GraphicsQuality) {
  return Math.min(Math.max(dpr, 0.5), quality === "high" ? 1.5 : quality === "medium" ? 1.25 : 1);
}
export const serverProfile: GraphicsProfile = {
  ready: false,
  quality: "medium",
  autoQuality: "medium",
  layoutClass: "desktop",
  dpr: 1,
  renderDpr: 1,
  renderScale: 1,
  webgl2: false,
  reducedMotion: false,
  hidden: false,
  pointerType: "none",
  pointerFine: false,
  pointerCoarse: false,
  hoverCapable: false,
  touchCapable: false,
  touchPoints: 0,
  viewport: [0, 0],
  screen: [0, 0],
  mobileStaticCorePolicy: false,
  coreWebgl: false,
  debug: false,
  reason: ["Progressive enhancement pending local capability probe."],
  capabilities: unknownCapabilities,
};
let profile = serverProfile;
let decision: ReturnType<typeof decideQuality> | undefined;
let probing = false;
let fullProbeComplete = false;
let capabilities = unknownCapabilities;
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;
export function refreshGraphicsProfile() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const override = params.get("quality");
  const debug = params.get("debugGraphics") === "1";
  const fine = matchMedia("(pointer: fine)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const hover = matchMedia("(hover: hover)").matches;
  const layouts: Record<string, LayoutClass> = {
    phone: "phone",
    tablet: "tablet",
    compact: "compact-desktop",
    desktop: "desktop",
    wide: "wide-desktop",
  };
  const layoutClass =
    ((debug || process.env.NODE_ENV === "development") && layouts[params.get("layout") || ""]) ||
    classifyLayout(window.innerWidth, fine, hover);
  const mobileStaticCorePolicy = layoutClass === "phone" && !(fine && hover);
  const needsContext = !mobileStaticCorePolicy || debug;
  if (!decision && !needsContext) {
    capabilities = deferredCapabilities();
    decision = decideQuality(capabilities);
  }
  if (needsContext && !probing) {
    probing = true;
    const retainedQuality = decision?.quality;
    void probeCapabilities().then((caps) => {
      capabilities = caps;
      const measured = decideQuality(caps);
      // A deferred, conservative session budget does not jump on rotation/resize.
      decision =
        retainedQuality && measured.quality !== "low"
          ? {
              quality: retainedQuality,
              reason: [
                ...measured.reason,
                "Retaining this session's initial conservative material budget.",
              ],
            }
          : measured;
      fullProbeComplete = true;
      refreshGraphicsProfile();
    });
  }
  const selected = decision || {
    quality: "medium" as GraphicsQuality,
    reason: ["Capability probe pending; static progressive enhancement without delaying content."],
  };
  const quality =
    override === "high" || override === "medium" || override === "low"
      ? override
      : selected.quality;
  const dpr = window.devicePixelRatio || 1;
  const renderDpr = capRenderDpr(dpr, quality);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coreWebgl =
    capabilities.webgl2 &&
    capabilities.contextSuccess === true &&
    !mobileStaticCorePolicy &&
    quality !== "low";
  const reason = [
    ...(quality === override
      ? [
          `URL quality override: ${quality.toUpperCase()}. Automatic decision: ${selected.quality.toUpperCase()}.`,
        ]
      : selected.reason),
  ];
  if (mobileStaticCorePolicy)
    reason.push(
      "Touch-primary phone: static Core is a product policy for power and UX; graphics quality is unchanged.",
    );
  if (reducedMotion)
    reason.push("Reduced motion: freeze animation; retain selected materials and static optics.");
  if (decision && !capabilities.webgl2 && quality !== "low")
    reason.push(
      "Requested materials retained in profile; WebGL unavailable, so Core uses its safe static fallback.",
    );
  const next: GraphicsProfile = {
    ready: !!decision && (!needsContext || fullProbeComplete),
    quality,
    autoQuality: selected.quality,
    layoutClass,
    dpr,
    renderDpr,
    renderScale: renderDpr / dpr,
    webgl2: capabilities.webgl2,
    reducedMotion,
    hidden: document.hidden,
    pointerType: fine ? "fine" : coarse ? "coarse" : "none",
    pointerFine: fine,
    pointerCoarse: coarse,
    hoverCapable: hover,
    touchPoints: navigator.maxTouchPoints || 0,
    touchCapable: navigator.maxTouchPoints > 0,
    viewport: [window.innerWidth, window.innerHeight],
    screen: [screen.width, screen.height],
    mobileStaticCorePolicy,
    coreWebgl,
    debug,
    reason,
    capabilities,
  };
  if (JSON.stringify(profile) === JSON.stringify(next)) return;
  profile = next;
  listeners.forEach((listener) => listener());
}
export const getGraphicsProfile = () => profile;
export const getServerGraphicsProfile = () => serverProfile;
export function subscribeGraphicsProfile(callback: () => void) {
  listeners.add(callback);
  if (!stop) {
    const queries = [
      "(pointer: fine)",
      "(pointer: coarse)",
      "(hover: hover)",
      "(prefers-reduced-motion: reduce)",
    ].map((query) => matchMedia(query));
    let resolution: MediaQueryList;
    const resolutionChange = () => {
      refreshGraphicsProfile();
      watchResolution();
    };
    function watchResolution() {
      resolution?.removeEventListener("change", resolutionChange);
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener("change", resolutionChange);
    }
    queries.forEach((query) => query.addEventListener("change", refreshGraphicsProfile));
    window.addEventListener("resize", refreshGraphicsProfile, { passive: true });
    window.addEventListener("popstate", refreshGraphicsProfile);
    document.addEventListener("visibilitychange", refreshGraphicsProfile);
    watchResolution();
    refreshGraphicsProfile();
    stop = () => {
      queries.forEach((query) => query.removeEventListener("change", refreshGraphicsProfile));
      resolution.removeEventListener("change", resolutionChange);
      window.removeEventListener("resize", refreshGraphicsProfile);
      window.removeEventListener("popstate", refreshGraphicsProfile);
      document.removeEventListener("visibilitychange", refreshGraphicsProfile);
    };
  }
  return () => {
    listeners.delete(callback);
    if (!listeners.size) {
      stop?.();
      stop = undefined;
    }
  };
}
