export type VisualQuality = "high" | "medium" | "low";

export function getVisualQuality(): VisualQuality {
  if (window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)").matches)
    return "low";
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return navigator.hardwareConcurrency <= 4 || connection?.saveData ? "medium" : "high";
}

export function subscribeVisualQuality(callback: () => void) {
  const queries = ["(prefers-reduced-motion: reduce)", "(max-width: 760px)"].map((query) =>
    window.matchMedia(query),
  );
  queries.forEach((query) => query.addEventListener("change", callback));
  return () => queries.forEach((query) => query.removeEventListener("change", callback));
}
