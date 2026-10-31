export const people = [
  {
    id: "Elena",
    name: "Elena Park",
    role: "CEO",
    want: "Keep investor confidence.",
    fear: "Being the person who announced the wrong number.",
    tell: "Calls bad news a learning.",
    color: "#75857a",
    voice: "af_bella",
    speed: 0.95,
  },
  {
    id: "Joyce",
    name: "Joyce Tan",
    role: "Data Platform",
    want: "Get the discrepancy heard.",
    fear: "Being blamed for raising it.",
    tell: "Says “probably fine” when it isn’t.",
    color: "#9c6f59",
    voice: "af_heart",
    speed: 0.96,
  },
  {
    id: "Ravi",
    name: "Ravi Subramanian",
    role: "CTO · metric owner",
    want: "Have the system understood and respected.",
    fear: "His work being dismissed.",
    tell: "Asks for the query before discussing the conclusion.",
    color: "#647587",
    voice: "bm_george",
    speed: 0.97,
  },
  {
    id: "Marcus",
    name: "Marcus Holt",
    role: "CRO",
    want: "Keep the sales plan stable.",
    fear: "Targets changing after commitments are made.",
    tell: "A joke, then a pointed question.",
    color: "#8b7565",
    voice: "am_michael",
    speed: 1,
  },
  {
    id: "Anders",
    name: "Anders Lund",
    role: "Lead investor",
    want: "A trend he can trust.",
    fear: "Another surprise in the next board pack.",
    tell: "Asks what you would put your name to.",
    color: "#72746d",
    voice: "bm_lewis",
    speed: 0.94,
  },
] as const;
export type Person = (typeof people)[number]["id"];
export const drawers = [
  {
    id: "gateway",
    title: "Gateway request logs",
    cost: 3,
    kind: "LOG / 01",
    preview: "One request. Four entries.",
    reading:
      "Request 8f2a appears four times after a timeout. Same request ID.",
    rows: [
      ["8f2a", "09:41:02", "timeout"],
      ["8f2a", "09:41:03", "retry"],
      ["8f2a", "09:41:04", "retry"],
      ["8f2a", "09:41:06", "completed"],
    ],
    hint: "You have seen retries. Join request IDs to quantify their size.",
  },
  {
    id: "billing",
    title: "Billing events",
    cost: 2,
    kind: "LEDGER / 02",
    preview: "The commercial record.",
    reading:
      "Calls rose 340%. Revenue per call fell 71%. These measures disagree.",
    rows: [
      ["Previous quarter", "2.5M calls", "indexed 100"],
      ["This quarter", "11.0M calls", "indexed 29"],
    ],
    hint: "A discrepancy is a reason to investigate, not proof that revenue fell.",
  },
  {
    id: "sdk",
    title: "SDK telemetry v2.3",
    cost: 3,
    kind: "RELEASE / 03",
    preview: "A small definition change.",
    reading:
      "SDK 2.3 reports each streamed chunk as a call. That adds 3.0M counted events per day.",
    rows: [
      ["request 6b1", "chunk 1", "count +1"],
      ["request 6b1", "chunk 2", "count +1"],
      ["request 6b1", "chunk 3", "count +1"],
    ],
    hint: "Three pieces of one response are not three new customer requests.",
  },
  {
    id: "cohorts",
    title: "Customer cohorts",
    cost: 2,
    kind: "SEGMENT / 04",
    preview: "Who actually grew?",
    reading:
      "Enterprise fine-tuning added 0.8M real daily completions. Other cohorts show a smaller, noisier rise.",
    rows: [
      ["Enterprise fine-tuning", "+0.8M", "confirmed"],
      ["Other customers", "small rise", "not yet verified"],
    ],
    hint: "The company has real growth. A noisy total can hide where it comes from.",
  },
  {
    id: "tags",
    title: "Internal & partner traffic",
    cost: 3,
    kind: "TRAFFIC / 05",
    preview: "Not every caller is a customer.",
    reading:
      "Internal health checks account for 0.8M daily events. Orbitly appears repeatedly under inconsistent tags.",
    rows: [
      ["health-ping", "internal", "0.8M"],
      ["orb-test / orbit-prod", "Orbitly?", "join needed"],
    ],
    hint: "Join the partner account list before naming the amount of partner test traffic.",
  },
  {
    id: "tickets",
    title: "Support tickets",
    cost: 2,
    kind: "INBOX / 06",
    preview: "The cost behind the calls.",
    reading:
      "Customers report timeouts and repeated attempts. A retry can increase AMC while making their experience worse.",
    rows: [
      ["Customer 41", "Response timed out", "retried four times"],
      ["Customer 88", "Still waiting", "SDK retried automatically"],
    ],
    hint: "Tickets support the mechanism. They do not quantify its size.",
  },
] as const;
export type DrawerId = (typeof drawers)[number]["id"];
export const layers = [
  { id: "retries", label: "Timeout retries", mass: 3, color: "#b66d30" },
  {
    id: "streaming",
    label: "Streaming double-count",
    mass: 3,
    color: "#8798b4",
  },
  {
    id: "internal",
    label: "Internal health checks",
    mass: 0.8,
    color: "#9aaa94",
  },
  { id: "partner", label: "Orbitly test loop", mass: 0.7, color: "#b79bbd" },
] as const;
export const headlines = [
  {
    id: "wrong",
    label: "The metric is wrong",
    words: "The published growth number overstates customer demand.",
  },
  {
    id: "limits",
    label: "What the number cannot tell us",
    words:
      "AMC counts activity. It cannot yet distinguish demand from repeated events.",
  },
  {
    id: "customers",
    label: "What customers actually got",
    words: "Let’s separate useful customer work from the activity around it.",
  },
  {
    id: "cost",
    label: "The cost of continuing",
    words:
      "We are planning infrastructure against an unverified demand signal.",
  },
  {
    id: "new",
    label: "A metric we can defend",
    words: "Keep the history. Publish a definition we can reproduce.",
  },
] as const;
export const asks = [
  { id: "stop", label: "Stop publishing AMC until corrected" },
  { id: "pause", label: "Pause the infrastructure scale-up" },
  { id: "baseline", label: "A two-week re-baseline" },
  { id: "none", label: "No decision requested" },
] as const;
export const metricOptions = {
  unit: [
    ["completions", "Successful completions"],
    ["paying", "Paying accounts’ completions"],
    ["tokens", "Tokens delivered"],
    ["revenue", "Revenue per 1,000 calls"],
  ],
  dedupe: [
    ["yes", "One request ID, one completion"],
    ["no", "Count every completion event"],
  ],
  streams: [
    ["one", "One streamed response = one call"],
    ["many", "Count each streamed chunk"],
  ],
  exclusions: [
    ["account", "Exclude internal & test accounts"],
    ["tag", "Exclude by traffic tags only"],
    ["none", "No exclusions"],
  ],
  segment: [
    ["all", "All customer cohorts"],
    ["enterprise", "Enterprise fine-tuning"],
    ["paying", "Paying customers"],
  ],
  window: [
    ["daily", "Daily"],
    ["rolling", "7-day rolling"],
  ],
  guardrails: [
    ["both", "p95 latency + error rate"],
    ["latency", "p95 latency only"],
    ["none", "No quality guardrail"],
  ],
} as const;
export const guides: Record<string, [string, string, string]> = {
  unit: [
    "What counts as one?",
    "Classify one event. It records your starting assumption; you can revise it.",
    "A number is a unit times a rule.",
  ],
  audit: [
    "Open a drawer, then join the evidence.",
    "Each drawer spends audit hours. Two joins can quantify what a log alone cannot.",
    "Retries are not demand.",
  ],
  estimate: [
    "Give a range you can defend.",
    "Your band describes uncertainty. It is not a score or a prediction.",
    "A range beats a point you cannot defend.",
  ],
  carry: [
    "Decide when to raise it.",
    "Moving now protects time; verifying uses prep hours. Silence also makes a commitment.",
    "Waiting is a decision with a cost.",
  ],
  stakeholders: [
    "Who needs to hear it from you?",
    "Choose an order. Ravi owns the definition; Marcus has targets tied to it.",
    "Frame the question, not the culprit.",
  ],
  slides: [
    "Build a short conversation.",
    "Choose a headline, attach evidence you opened, then make one explicit ask.",
    "A fact without an ask rarely changes a plan.",
  ],
  metric: [
    "Write a rule someone else can reproduce.",
    "Choose the unit, counting rule, exclusions and quality guardrails.",
    "Every metric will be gamed. Find how before they do.",
  ],
  redteam: [
    "Try to break your own definition.",
    "You have three fix hours. A transparent cohort view is free; counting fixes cost an hour.",
    "The wording is part of the product.",
  ],
  board: [
    "Put a claim on the record.",
    "The board remembers your range, your promise and the controls you kept.",
    "Own the correction, including your part in it.",
  ],
};
