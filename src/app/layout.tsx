import type { Metadata, Viewport } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import "./globals.css";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { LOADER_BOOT_SCRIPT } from "@/lib/loaderBoot";
import { EntryGate } from "@/components/product/EntryGate";

// Set NEXT_PUBLIC_SITE_URL when deploying. The localhost fallback keeps
// canonical and social URLs valid for a local preview on the documented port.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PMForge — Master the mess. Make better product decisions.",
    template: "%s · PMForge",
  },
  description:
    "Practice real Product Management decisions through interactive scenarios, interviews, projects, and rubric-based feedback.",
  keywords: [
    "product management",
    "PM interview practice",
    "product decisions",
    "case study",
    "PM portfolio",
  ],
  openGraph: {
    title: "PMForge — Master the mess. Make better product decisions.",
    description:
      "A flight simulator for product management. Turn chaotic signals into justified decisions.",
    type: "website",
    images: [{ url: "/assets/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PMForge — Master the mess.",
    description:
      "Practice the decisions that matter. Real scenarios, timed interviews, documented reasoning.",
    images: ["/assets/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F3EBDD",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Must run before the first paint; see LOADER_BOOT_SCRIPT.
          dangerouslySetInnerHTML={{ __html: LOADER_BOOT_SCRIPT }}
        />
      </head>
      <body suppressHydrationWarning>
        <noscript>
          <style>{`[data-loader-overlay]{display:none!important}html.is-loading{overflow:auto!important}`}</style>
        </noscript>
        <a href="#main" className="skipLink">
          Skip to content
        </a>
        <SettingsProvider>
          <SmoothScroll />
          {children}
          <EntryGate />
        </SettingsProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
