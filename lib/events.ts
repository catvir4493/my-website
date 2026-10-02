export const OPEN_TERMINAL = "marcell:terminal";
export const OPEN_PALETTE = "marcell:palette";
export function openTerminal() {
  window.dispatchEvent(new Event(OPEN_TERMINAL));
}
export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE));
}
