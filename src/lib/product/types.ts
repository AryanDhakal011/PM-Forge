export type Category =
  | "estimation"
  | "root-cause"
  | "strategy"
  | "execution-metrics"
  | "ai-technical"
  | "behavioral"
  | "product-sense";
export type Level = "easy" | "medium" | "hard";
export type Dimension = { id: string; label: string; weight: number };
export type Evidence = {
  id: string;
  title: string;
  text: string;
  cost: number;
  discriminating: boolean;
  tag: "SIMULATED" | "REFERENCE";
};
export type Choice = {
  id: string;
  label: string;
  quality: number;
  consequence: string;
  trap?: boolean;
};
export type Dial = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  band: [number, number];
};
export type Question = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  level: Level;
  minutes: number;
  version: number;
  status: "draft" | "reviewed";
  reviewers?: string[];
  primer: string[];
  scenario: string;
  goal: string;
  evidence: Evidence[];
  evidenceSummary: string;
  task: string;
  trap: string;
  choices: Choice[];
  trace: string;
  alternatives: string[];
  pump: string;
  probes: string;
  retryNotes: string;
  storyPrompt?: string;
  dimensions: Dimension[];
};
export type RunStage =
  | "primer"
  | "fundamentals"
  | "clarify"
  | "investigate"
  | "workbench"
  | "event"
  | "synthesis"
  | "feedback"
  | "replay"
  | "reflection"
  | "expert"
  | "complete";
export type Decision = {
  stage: RunStage;
  action: string;
  value: string;
  at: string;
};
export type Synthesis = {
  decision: string;
  evidenceId: string;
  tradeoff: string;
  notDoing: string;
  metric: string;
  guardrail: string;
  stopRule: string;
  note: string;
};
export type Run = {
  id: string;
  ownerId: string;
  questionId: string;
  contentVersion: number;
  seed: number;
  revision: number;
  stage: RunStage;
  status: "active" | "paused" | "complete";
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  evidenceIds: string[];
  decisions: Decision[];
  locked: string[];
  objectivePinned: boolean;
  choiceId: string;
  rank: string[];
  segment: string;
  dials: Record<string, number>;
  unitConfirmed: boolean;
  metrics: { primary: string; guardrail: string; test: string };
  architecture: string[];
  story: {
    stakes: string;
    actions: string[];
    result: string;
    learning: string;
    later: string;
    observable: boolean;
    ownership: boolean;
  };
  eventResponse: string;
  eventIndex: number;
  synthesis: Synthesis;
  reflection: Record<string, number>;
  reflectionNote: string;
  fundamentals: Record<string, string>;
  pausedFrom?: RunStage;
  elapsedSeconds: number;
  pressureSeconds: number | null;
  guided?: boolean;
  sessionId?: string;
  reflectionStartedAt?: string;
  reflectionCompletedAt?: string;
  reflectionTimedOut?: boolean;
  spoken?: {
    seconds: number;
    structure: boolean;
    clarity: boolean;
    skipped: boolean;
  };
};
export type Profile = {
  id: string;
  name: string;
  role: string;
  level: Level;
  timeline: string;
  onboardingComplete: boolean;
  identity: "guest" | "member";
  updatedAt: string;
};
export type RecordFields = {
  problem: string;
  evidence: string;
  assumptions: string;
  options: string;
  tradeoffs: string;
  decision: string;
  metric: string;
  nextCheck: string;
};
export type DecisionRecord = {
  id: string;
  ownerId: string;
  title: string;
  source: "run" | "manual" | "Demo";
  runId?: string;
  fields: RecordFields;
  createdAt: string;
  updatedAt: string;
};
export type Bookmark = {
  id: string;
  ownerId: string;
  questionId: string;
  updatedAt: string;
};
export type Snapshot = {
  id?: number;
  runId: string;
  ownerId: string;
  revision: number;
  data: Run;
  createdAt: string;
};
export type WorkspaceExport = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  runs: Run[];
  records: DecisionRecord[];
  bookmarks: Bookmark[];
  projectRuns?: import("../projects/types").ProjectRun[];
};
