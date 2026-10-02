import localFont from "next/font/local";

export const headingFont = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2",
      weight: "600",
    },
  ],
  variable: "--font-heading",
  display: "swap",
  fallback: ["Arial"],
});
export const bodyFont = localFont({
  src: [
    { path: "../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["Arial"],
});
export const codeFont = localFont({
  src: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-code",
  display: "swap",
  fallback: ["monospace"],
  adjustFontFallback: false,
});
