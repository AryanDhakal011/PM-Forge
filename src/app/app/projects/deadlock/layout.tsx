import { preload } from "react-dom";
import type { Metadata } from "next";
import DeadlockExperience from "@/components/deadlock/DeadlockExperience";
export const metadata: Metadata = {
  title: "The Deadlock — PMForge",
  description:
    "Two teams. Twelve weeks. One prototype. A fictional, playable product simulation.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  preload("/deadlock/fonts/barlow-condensed-latin-600-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  preload("/deadlock/fonts/ibm-plex-mono-latin-400-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  return (
    <>
      <DeadlockExperience />
      {children}
    </>
  );
}
