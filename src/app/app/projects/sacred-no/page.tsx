import type { Metadata } from "next";
import SacredNoExperience from "@/components/sacred-no/SacredNoExperience";
export const metadata: Metadata = {
  title: "The Sacred No — PMForge",
  description:
    "A midnight promise. A morning reckoning. An authored product decision simulation.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <SacredNoExperience />;
}
