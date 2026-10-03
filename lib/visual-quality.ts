// Compatibility exports. Layout, input and motion never select material quality.
export type { GraphicsQuality as VisualQuality } from "./graphics/capabilities";
export { subscribeGraphicsProfile as subscribeVisualQuality } from "./graphics/profile";
import { getGraphicsProfile } from "./graphics/profile";
export const getVisualQuality = () => getGraphicsProfile().quality;
