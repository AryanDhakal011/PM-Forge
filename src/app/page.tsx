import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Master the mess. Turn chaotic signals into justified decisions.",
  description:
    "PMForge is a practice ground for product judgment. Pressure-test evidence, work real project scenarios, rehearse interviews, and document the decision behind the outcome.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage />;
}
