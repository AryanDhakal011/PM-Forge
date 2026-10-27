import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { NarrativeStrip } from "./NarrativeStrip";
import { SignalTest } from "./SignalTest";
import { LearningPath } from "./LearningPath";
import { ProjectsWorkbench } from "./ProjectsWorkbench";
import { InterviewLab } from "./InterviewLab";
import { CareerBoard } from "./CareerBoard";
import { DecisionBlueprint } from "./DecisionBlueprint";
import { Footer } from "./Footer";
import { LoaderOverlay } from "./LoaderOverlay";
import { PencilCursor } from "@/components/ui/PencilCursor";
import { PerformanceReport } from "@/components/dev/PerformanceReport";

export function LandingPage() {
  return (
    <>
      <PerformanceReport />
      <LoaderOverlay />
      <Navigation />
      <PencilCursor />

      <main id="main" tabIndex={-1}>
        <Hero />

        <div className="wallRun">
          <NarrativeStrip
            left="The world is noise."
            right="Notice the signal."
            variant="noise-to-signal"
          />
          <SignalTest />
        </div>
        <NarrativeStrip
          statement="Separate evidence from assumptions."
          variant="evidence-vs-assumptions"
        />
        <LearningPath />

        <NarrativeStrip
          statement="New evidence detected."
          variant="new-evidence"
        />

        <ProjectsWorkbench />

        <NarrativeStrip
          statement="Reassess the decision."
          variant="reassess"
          tone="warm"
        />

        <InterviewLab />
        <CareerBoard />

        <DecisionBlueprint />
      </main>

      <Footer />
    </>
  );
}
