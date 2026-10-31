import type { Metadata } from "next";
import GhostMetricExperience from "@/components/ghost-metric/GhostMetricExperience";
export const metadata: Metadata = {
  title: "The Ghost Metric — PMForge",
  description:
    "Audit a celebrated growth number, tell its owners, and build a metric that survives the red team.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <GhostMetricExperience />;
}
