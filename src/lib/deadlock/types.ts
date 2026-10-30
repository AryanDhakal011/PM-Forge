export type Lane = "speed" | "recovery" | "learning";
export type Resolution = "R" | "S" | "B" | "D";
export type Evidence = "E1" | "E2" | "E3" | "E4" | "E5";
export type Dataset = "D1" | "D2" | "D3" | "D4";
export type Scene =
  | "entry"
  | "intro"
  | "floor"
  | "table"
  | "consequence1"
  | "opening2"
  | "data"
  | "forge"
  | "consequence2"
  | "run"
  | "ending"
  | "debrief";
export type Room =
  "ALIGNED_BURN" | "ROBOTICS_WIN" | "SOFTWARE_WIN" | "STALLED" | "MIXED";
export type Ending =
  | "QUIET ROOM"
  | "FRACTURE"
  | "SHARED GROUND"
  | "STANDING GUARD"
  | "BABYSITTER"
  | "STEADY HANDS";
export type Archetype =
  | "MEDIATOR"
  | "DECIDER"
  | "SHOWRUNNER"
  | "GAMBLER"
  | "BYSTANDER"
  | "PRAGMATIST";
export type Dial = {
  s: 0.5 | 0.8 | 1 | 1.2;
  r: "manual" | "assisted" | "auto";
  l: "always" | "uncertain" | "never";
};
export type Metrics = {
  rob: number;
  sw: number;
  runway: number;
  ready: number;
  align: number;
  cred: number;
  ap: number;
};
export type LaneChoice = {
  res?: Resolution;
  evidence?: Evidence;
  previewMs?: number;
};
export type Ledger = Metrics & {
  wow: number;
  supervision: number;
  incidents: number;
  tokens: number;
};
export type Badge = boolean | null;
export type Badges = {
  evidence: Badge;
  tradeoff: Badge;
  heard: Badge;
  adapted: Badge;
};
export type Action =
  | {
      type: "START";
      mode: "sound" | "silent" | "listen";
      experienceVersion?: 2;
    }
  | { type: "ACK_SCENE"; scene: Scene }
  | { type: "INSPECT"; card: Evidence }
  | { type: "BEGIN_INSPECT"; card: Evidence }
  | { type: "SOCKET"; lane: Lane; res: Resolution; previewMs: number }
  | { type: "ATTACH"; lane: Lane; card?: Evidence }
  | { type: "LOCK_PLAN" }
  | { type: "SHOW"; dataset: Dataset; previewMs: number }
  | { type: "CALL_DEV" }
  | { type: "REMOVE_VETO"; side: "R" | "S" }
  | { type: "DIAL"; value: Dial }
  | { type: "ATTACH_DIAL"; dial: Lane; card?: Evidence | Dataset }
  | { type: "PROPOSE"; previewMs: number }
  | { type: "PUSH" }
  | { type: "REVISE" }
  | {
      type: "RUN_DECISION";
      eventNo: number;
      action: "let" | "pause" | "slow" | "takeover";
    };
export type DeadlockEvent = Action & { seq: number; t: string };
export type Trace = {
  seq: number;
  chapter: number;
  title: string;
  assumption?: string;
  before: Ledger;
  after: Ledger;
  cause: string;
  why: string;
  constraint: string;
  badges: Badges;
};
export type DeadlockState = Metrics & {
  scene: Scene;
  focus: number;
  inspected: Evidence[];
  inspecting?: Evidence;
  lanes: Record<Lane, LaneChoice>;
  room: Room;
  shown: Dataset[];
  dials: Dial;
  defenses: Partial<Record<Lane, Evidence | Dataset>>;
  proposals: number;
  proposal?: {
    robotics: boolean | null;
    software: boolean;
    reasons: string[];
    previewMs: number;
  };
  flags: string[];
  experienceVersion?: 2;
  run: {
    wow: number;
    supervision: number;
    incidents: number;
    tokens: number;
    eventNo: number;
    interventions: number;
    log: { event: number; action: string; incident: boolean; wow: number }[];
  };
  ending?: Ending;
  archetype?: Archetype;
  seq: number;
  trace: Trace[];
};
export type SavedRun = {
  id: string;
  ownerId: string;
  contentVersion: "1.0";
  events: DeadlockEvent[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  forkSeq?: number;
  note?: string;
  revision: number;
  echoes?: { seq: number; assumption: string }[];
};
