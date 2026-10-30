import type { Metadata } from "next";
import { preload } from "react-dom";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Master the mess. Turn chaotic signals into justified decisions.",
  description:
    "PMForge is a practice ground for product judgment. Pressure-test evidence, work real project scenarios, rehearse interviews, and document the decision behind the outcome.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  preload("/assets/textures/wood-table-diffuse.webp", {
    as: "image",
    crossOrigin: "anonymous",
    fetchPriority: "high",
    media: "(min-width:768px)",
  });
  preload("/assets/textures/wood-table-rough.webp", {
    as: "image",
    crossOrigin: "anonymous",
    media: "(min-width:768px)",
  });
  preload("/assets/images/plates/cozy-sunlit-workspace.webp", { as: "image" });
  return <LandingPage />;
}
