import type { Metadata, Viewport } from "next";
import { headingFont, bodyFont, codeFont } from "@/lib/fonts";
import "./globals.css";
import { siteUrl } from "@/data/profile";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MotionProvider } from "@/components/ui/motion-provider";
import { SystemOverlay } from "@/components/layout/system-overlay";
import { getContacts } from "@/data/contact";
import { ContactProvider } from "@/components/ui/contact-provider";
import { VisualEnvironment } from "@/components/visual/environment";
import { RouteTransition } from "@/components/visual/route-transition";
import { ProjectFocusProvider } from "@/components/visual/project-focus";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Marcell — Computer Engineering", template: "%s | Marcell.OS" },
  description:
    "Computer Engineering student at BME building software, computer vision systems, algorithms and experimental technology.",
  openGraph: {
    title: "Marcell — Computer Engineering",
    description:
      "Computer Engineering student at BME building software, computer vision systems, algorithms and experimental technology.",
    type: "website",
    locale: "en_US",
    siteName: "Marcell.OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marcell — Computer Engineering",
    description:
      "Computer Engineering student at BME building software, computer vision systems, algorithms and experimental technology.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#080b0d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} ${codeFont.variable}`}>
      <body>
        <ContactProvider contacts={getContacts()}>
          <MotionProvider>
            <ProjectFocusProvider>
              <RouteTransition>
                <a href="#main" className="skip-link">
                  Skip to content
                </a>
                <VisualEnvironment />
                <Header />
                <main id="main" tabIndex={-1}>
                  {children}
                </main>
                <Footer />
                <SystemOverlay />
              </RouteTransition>
            </ProjectFocusProvider>
          </MotionProvider>
        </ContactProvider>
      </body>
    </html>
  );
}
