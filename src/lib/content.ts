export type EvidenceFactor = {
  measured: 0 | 1 | 2;
  recency: 0 | 1 | 2;
  scope: 0 | 1 | 2;
  revenue: 0 | 1 | 2;
};

export type EvidenceCard = {
  id: number;
  number: string;
  category: string;
  content: string;
  source: string;
  recency: string;
  factors: EvidenceFactor;
  prompt: string;
  impact: "Low" | "Medium" | "High";
};

export const evidenceCards: EvidenceCard[] = [
  {
    id: 1,
    number: "01",
    category: "Feature request",
    content: "Users requested dark mode.",
    source: "Support inbox / tagged request",
    recency: "last 30 days",
    factors: { measured: 0, recency: 1, scope: 1, revenue: 0 },
    prompt: "A preference, not a movement. What would tell you it is worth acting on now?",
    impact: "Low",
  },
  {
    id: 2,
    number: "02",
    category: "Funnel",
    content: "Checkout abandonment increased 18%.",
    source: "Analytics / checkout funnel",
    recency: "last 7 days",
    factors: { measured: 2, recency: 2, scope: 2, revenue: 2 },
    prompt: "Strong, and probably related. Where in the funnel does it concentrate?",
    impact: "High",
  },
  {
    id: 3,
    number: "03",
    category: "Support",
    content: "Support tickets about login doubled.",
    source: "Support / ticket volume",
    recency: "last 7 days",
    factors: { measured: 2, recency: 2, scope: 1, revenue: 1 },
    prompt: "Strong, and probably related. Where in the funnel does it concentrate?",
    impact: "Medium",
  },
  {
    id: 4,
    number: "04",
    category: "Market",
    content: "Competitor launched dark mode.",
    source: "Market scan / release notes",
    recency: "last 21 days",
    factors: { measured: 0, recency: 1, scope: 0, revenue: 0 },
    prompt: "Competitive context is useful, but it is not your evidence. What is happening inside your product?",
    impact: "Low",
  },
  {
    id: 5,
    number: "05",
    category: "Stakeholder",
    content: "CEO wants a redesign.",
    source: "Slack / weekly leadership thread",
    recency: "last 2 days",
    factors: { measured: 0, recency: 0, scope: 0, revenue: 0 },
    prompt: "A strong opinion is still an opinion. What customer or commercial evidence sits underneath it?",
    impact: "Low",
  },
  {
    id: 6,
    number: "06",
    category: "Revenue signal",
    content: "Mobile conversion fell 22%.",
    source: "Analytics / revenue dashboard",
    recency: "last 14 days",
    factors: { measured: 2, recency: 2, scope: 2, revenue: 2 },
    prompt:
      "This is the strongest signal you have: measured, recent, broad, and tied directly to revenue.",
    impact: "High",
  },
  {
    id: 7,
    number: "07",
    category: "Power users",
    content: "Power users asked for exports.",
    source: "Community / power-user channel",
    recency: "last 30 days",
    factors: { measured: 0, recency: 1, scope: 1, revenue: 1 },
    prompt: "A valuable segment, but a request. How many accounts, and what revenue is attached?",
    impact: "Low",
  },
  {
    id: 8,
    number: "08",
    category: "Sentiment",
    content: "NPS dropped 4 points.",
    source: "Quarterly NPS survey",
    recency: "last 90 days",
    factors: { measured: 2, recency: 2, scope: 1, revenue: 0 },
    prompt: "Sentiment is a lagging indicator. Which behaviour changed at the same time?",
    impact: "Medium",
  },
  {
    id: 9,
    number: "09",
    category: "Sales",
    content: "A sales prospect requested SSO.",
    source: "Sales / one enterprise deal",
    recency: "last 5 days",
    factors: { measured: 0, recency: 1, scope: 0, revenue: 2 },
    prompt: "One deal can matter. Is it a pattern, or a single negotiation tactic?",
    impact: "Low",
  },
  {
    id: 10,
    number: "10",
    category: "Behaviour",
    content: "Session length is up 7%.",
    source: "Analytics / engagement",
    recency: "last 30 days",
    factors: { measured: 2, recency: 2, scope: 1, revenue: 0 },
    prompt: "Up is not automatically good. Are people engaged, or stuck?",
    impact: "Medium",
  },
];

export const strongestEvidenceId = 6;
export const relatedEvidenceIds = [2, 3];

export function evidenceScore(card: EvidenceCard) {
  const { measured, recency, scope, revenue } = card.factors;
  return measured + recency + scope + revenue;
}

export function evidenceStrength(card: EvidenceCard) {
  const score = evidenceScore(card);
  if (score >= 7) return "High" as const;
  if (score >= 4) return "Medium" as const;
  return "Low" as const;
}

export type ModuleState = "not-started" | "in-progress" | "complete";

export type Module = {
  slug: string;
  number: string;
  title: string;
  short: string;
  description: string;
  outcome: string;
  tags: string[];
  state: ModuleState;
  progress: number;
  practice: string[];
  artifact: string;
};

export const modules: Module[] = [
  {
    slug: "foundation-and-product-strategy",
    number: "01",
    title: "Foundation & Product Strategy",
    short: "Turn a fuzzy business ambition into a product bet.",
    description:
      "Start with the frame: the customer, the problem, the constraint, and the bet you are making. Practice writing a strategy that a team could actually follow.",
    outcome: "Write a one-page strategy with a clear bet and a falsifiable assumption.",
    tags: ["strategy", "vision", "goals"],
    state: "not-started",
    progress: 0,
    practice: [
      "Rewrite a vague company goal as a customer problem.",
      "Name the assumption that would make the strategy wrong.",
      "Cut the strategy to one page without losing the trade-off.",
    ],
    artifact: "one-page strategy",
  },
  {
    slug: "customer-discovery",
    number: "02",
    title: "Customer Discovery",
    short: "Ask better questions and hear what people actually mean.",
    description:
      "Discovery is not a demo call. Learn to separate stated requests from observed behaviour, and to run interviews that change your mind.",
    outcome: "Run a five-question interview that surfaces behaviour, not opinions.",
    tags: ["research", "interviews", "jobs-to-be-done"],
    state: "not-started",
    progress: 0,
    practice: [
      "Turn three feature requests into problem statements.",
      "Run a 12-minute interview and mark every assumption.",
      "Write a discovery readout with one decision it changes.",
    ],
    artifact: "interview guide",
  },
  {
    slug: "data-and-experimentation",
    number: "03",
    title: "Data & Experimentation",
    short: "Read the metric, then read the story behind it.",
    description:
      "Metrics are evidence, not answers. Build the habit of checking definitions, segments, and counter-metrics before you declare a win.",
    outcome: "Design a test with a guardrail metric and a kill criterion.",
    tags: ["metrics", "experiments", "analytics"],
    state: "not-started",
    progress: 0,
    practice: [
      "Find the segment hiding inside an average.",
      "Write a hypothesis with a measurable threshold.",
      "Choose the guardrail metric you refuse to hurt.",
    ],
    artifact: "experiment brief",
  },
  {
    slug: "prioritization-and-decision-making",
    number: "04",
    title: "Prioritization & Decision Making",
    short: "Make hard calls with incomplete evidence.",
    description:
      "Prioritisation is a series of trade-offs, not a scoring ritual. Practice choosing, explaining what you are giving up, and naming the next review point.",
    outcome: "Produce a decision record that a sceptical stakeholder can follow.",
    tags: ["RICE", "trade-offs", "sequencing"],
    state: "not-started",
    progress: 0,
    practice: [
      "Rank five options and say what each one costs.",
      "Write the strongest argument against your decision.",
      "Set the evidence that would make you revisit it.",
    ],
    artifact: "decision record",
  },
  {
    slug: "technical-fluency",
    number: "05",
    title: "Technical Fluency",
    short: "Hold your own in an engineering conversation.",
    description:
      "You do not need to write the code. You do need to understand constraints, dependencies, failure modes, and the cost of a shortcut.",
    outcome: "Scope a fix with engineering and name the trade-off in plain language.",
    tags: ["systems", "APIs", "constraints"],
    state: "not-started",
    progress: 0,
    practice: [
      "Map one user action to its system dependencies.",
      "Ask five questions that expose hidden delivery risk.",
      "Explain a technical trade-off to a sales lead.",
    ],
    artifact: "technical brief",
  },
  {
    slug: "ui-ux-collaboration",
    number: "06",
    title: "UI/UX Collaboration",
    short: "Make the problem clear before the solution gets pretty.",
    description:
      "Work with design on flows, states, and language. Learn to critique work against the user's job rather than your personal taste.",
    outcome: "Run a design critique that ends with a testable next step.",
    tags: ["flows", "critique", "accessibility"],
    state: "not-started",
    progress: 0,
    practice: [
      "Map the empty, loading, error, and success states.",
      "Rewrite a confusing error message.",
      "Run a critique with one clear decision to make.",
    ],
    artifact: "flow critique",
  },
  {
    slug: "execution-and-delivery",
    number: "07",
    title: "Execution & Delivery",
    short: "Ship the smallest thing that answers the question.",
    description:
      "Delivery is where strategy meets reality. Practice cutting scope without cutting the learning, and keeping a team aligned when the plan changes.",
    outcome: "Cut a release to one learning goal without hiding the trade-off.",
    tags: ["scope", "delivery", "risk"],
    state: "not-started",
    progress: 0,
    practice: [
      "Turn a launch plan into a learning plan.",
      "Cut 40% of scope and explain what you keep.",
      "Write the rollback and communication plan.",
    ],
    artifact: "release brief",
  },
  {
    slug: "stakeholder-leadership",
    number: "08",
    title: "Stakeholder Leadership",
    short: "Bring people with you when the answer is not obvious.",
    description:
      "Influence is built through legible reasoning and early contact. Practice handling pressure without becoming either a pushover or a wall.",
    outcome: "Handle a late scope request without losing the decision.",
    tags: ["alignment", "influence", "communication"],
    state: "not-started",
    progress: 0,
    practice: [
      "Map what each stakeholder is measured on.",
      "Pre-wire a decision with the most likely blocker.",
      "Say no to a request while protecting the relationship.",
    ],
    artifact: "stakeholder map",
  },
  {
    slug: "ai-product-management",
    number: "09",
    title: "AI Product Management",
    short: "Design for uncertainty, evaluation, and trust.",
    description:
      "AI features fail differently. Learn to define quality, set up human review, and communicate confidence instead of promising magic.",
    outcome: "Write an eval plan for a probabilistic feature.",
    tags: ["evals", "trust", "quality"],
    state: "not-started",
    progress: 0,
    practice: [
      "Define what 'good enough' means for a model output.",
      "Design the failure and escalation states.",
      "Write a confidence statement a customer can understand.",
    ],
    artifact: "eval plan",
  },
  {
    slug: "job-ready",
    number: "10",
    title: "Job Ready",
    short: "Turn practice into evidence you can show.",
    description:
      "Your decisions are the portfolio. Learn to write them up, talk about them in interviews, and show how your thinking changed.",
    outcome: "Publish three decision records and a 90-second story.",
    tags: ["portfolio", "storytelling", "interviews"],
    state: "not-started",
    progress: 0,
    practice: [
      "Choose the decision that best shows your judgment.",
      "Write the context, the call, and the consequence.",
      "Rehearse the 90-second version out loud.",
    ],
    artifact: "portfolio story",
  },
];

export const interviewCase = {
  id: "case-01",
  label: "Case 01 / Growth diagnosis",
  prompt: "A growth metric dropped 40% in one week. What do you investigate first?",
  context:
    "You are the PM for a subscription marketplace. Weekly active buyers fell sharply. Leadership wants an answer by end of day.",
  minutes: 2,
  reveals: [
    {
      id: "mobile",
      label: "Segment the drop",
      text: "The drop is concentrated in mobile. Desktop is flat.",
      note: "Narrow the problem before choosing a cause.",
    },
    {
      id: "release",
      label: "Check the timeline",
      text: "A checkout release shipped three days before the drop.",
      note: "Proximity is a lead, not proof.",
    },
    {
      id: "errors",
      label: "Inspect the funnel",
      text: "Error rate increased on one payment method, mostly at the final step.",
      note: "Now you have a mechanism, not just a correlation.",
    },
    {
      id: "support",
      label: "Listen to customers",
      text: "Support has matching complaints: 'payment failed, then I gave up'.",
      note: "Customer language tells you how to frame the fix.",
    },
  ],
  pivots: [
    { label: "User growth", criterion: "problem" },
    { label: "Revenue", criterion: "impact" },
    { label: "Stakeholders", criterion: "risks" },
    { label: "Time pressure", criterion: "prioritization" },
  ],
};

export type ProjectScenario = {
  id: string;
  name: string;
  descriptor: string;
  brief: string;
  phases: { name: string; note: string }[];
  sprint: { id: string; label: string }[];
  artifacts: Record<string, { title: string; kicker: string; body: string; stamp?: string }[]>;
  pressure: {
    evidence: string[];
    constraints: { team: string; note: string }[];
  };
  baseline: { users: number; revenue: number; load: number };
};

export const projectScenarios: ProjectScenario[] = [
  {
    id: "checkout",
    name: "Marketplace Checkout Recovery",
    descriptor: "Scenario 01 · 6 weeks · Cross-functional",
    brief:
      "Checkout abandonment is climbing and a payment provider changed its retry behaviour. Find the real failure, decide what ships, and keep the business moving.",
    phases: [
      { name: "Research", note: "Funnel, interviews, support tags" },
      { name: "Define", note: "Problem frame, non-goals" },
      { name: "Build", note: "Retry flow, telemetry, QA" },
      { name: "Launch", note: "Guardrails, comms, review" },
    ],
    sprint: [
      { id: "interviews", label: "User interviews" },
      { id: "prd", label: "PRD draft" },
      { id: "design", label: "Design review" },
      { id: "build", label: "Dev build" },
      { id: "demo", label: "Stakeholder demo" },
    ],
    artifacts: {
      Research: [
        {
          title: "Payment failure is a dead end",
          kicker: "Research note · 6 interviews",
          body: "Users do not understand why payment failed, and the retry button returns them to the same broken state.",
        },
        {
          title: "Abandonment by step",
          kicker: "KPI chart · last 14 days",
          body: "Payment step +18%. Cart and address steps are flat. Android accounts for 71% of the increase.",
        },
      ],
      Define: [
        {
          title: "Problem frame",
          kicker: "PRD · problem",
          body: "Android buyers cannot recover from a failed payment without abandoning the purchase and starting over.",
        },
        {
          title: "Non-goals",
          kicker: "PRD · scope",
          body: "No new payment methods. No checkout redesign. No desktop changes in this cycle.",
        },
      ],
      Build: [
        {
          title: "PM-284 · Improve payment retry handling",
          kicker: "Ticket · acceptance criteria",
          body: "Retry preserves cart state. Error copy names the failing method. Telemetry fires on every retry attempt.",
        },
        {
          title: "Two sprints, not two days",
          kicker: "Engineering note",
          body: "The provider SDK needs a version bump. A safe workaround is possible for Android only, behind a flag.",
        },
      ],
      Launch: [
        {
          title: "Guardrail: payment error rate",
          kicker: "Launch check",
          body: "Roll out to 10% of Android traffic. Pause if error rate rises above the pre-release baseline.",
        },
        {
          title: "Demo in 48 hours",
          kicker: "Sales message",
          body: "A major account is watching. Sales wants a visible fix before Friday, even if the full rollout waits.",
        },
      ],
    },
    pressure: {
      evidence: [
        "Payment failures are affecting only Android users.",
        "Engineering says the fix will take 2 sprints.",
        "Sales has a major customer demo in 48 hours.",
      ],
      constraints: [
        { team: "Engineering", note: "Safe fix needs two sprints." },
        { team: "Sales", note: "Major demo in 48 hours." },
        { team: "UX", note: "Drop-off concentrates on step 3." },
      ],
    },
    baseline: { users: 5, revenue: 4, load: 6 },
  },
  {
    id: "onboarding",
    name: "Growth Onboarding",
    descriptor: "Scenario 02 · 4 weeks · Activation",
    brief:
      "New users sign up, then stall before the first useful action. Decide which onboarding bet gets the next sprint and defend the metric.",
    phases: [
      { name: "Research", note: "Activation funnel, first-session recordings" },
      { name: "Define", note: "Activation moment, hypothesis" },
      { name: "Build", note: "Checklist, empty states, prompts" },
      { name: "Launch", note: "Experiment, guardrails" },
    ],
    sprint: [
      { id: "interviews", label: "User interviews" },
      { id: "prd", label: "PRD draft" },
      { id: "design", label: "Design review" },
      { id: "build", label: "Dev build" },
      { id: "demo", label: "Stakeholder demo" },
    ],
    artifacts: {
      Research: [
        {
          title: "The first useful action is unclear",
          kicker: "Research note · 8 sessions",
          body: "New users can describe the product, but not the first thing they should do. Most stall on an empty workspace.",
        },
        {
          title: "Activation by cohort",
          kicker: "KPI chart · last 30 days",
          body: "Only 32% reach a first project. Users who do are 2.4× more likely to return in week two.",
        },
      ],
      Define: [
        {
          title: "Activation moment",
          kicker: "Hypothesis",
          body: "A new user creates and shares one project within the first session. That is the behaviour worth designing for.",
        },
        {
          title: "Non-goals",
          kicker: "PRD · scope",
          body: "No onboarding video. No new pricing page. No change to the signup flow this cycle.",
        },
      ],
      Build: [
        {
          title: "Guided first project",
          kicker: "Design note",
          body: "Replace the empty workspace with a three-step starter. Every step has a visible finish line.",
        },
        {
          title: "Telemetry before polish",
          kicker: "Analytics ticket",
          body: "Instrument each step, time-to-first-project, and drop-off reason. Without this, the test cannot be read.",
        },
      ],
      Launch: [
        {
          title: "Experiment: 50 / 50",
          kicker: "Launch check",
          body: "Primary metric: first-project creation. Guardrail: week-two retention and support contacts.",
        },
        {
          title: "CEO wants a redesign",
          kicker: "Stakeholder message",
          body: "Leadership saw the mockups and wants a full visual refresh. The team has one sprint.",
        },
      ],
    },
    pressure: {
      evidence: [
        "Only 32% of new users reach a first project.",
        "The guided starter needs one more sprint to be measurable.",
        "The CEO wants a full visual redesign in the same sprint.",
      ],
      constraints: [
        { team: "Engineering", note: "One sprint, no exceptions." },
        { team: "Sales", note: "Enterprise demo needs polish." },
        { team: "UX", note: "The empty state is the real blocker." },
      ],
    },
    baseline: { users: 5, revenue: 5, load: 5 },
  },
];

export const pressureChoices = [
  { id: "workaround", label: "Ship workaround", note: "Protect the demo, contain the risk." },
  { id: "delay", label: "Delay launch", note: "Trade speed for a complete fix." },
  { id: "scope", label: "Reduce scope", note: "Solve the sharpest user pain first." },
  { id: "escalate", label: "Escalate", note: "Make the trade-off visible to leadership." },
  { id: "investigate", label: "Investigate further", note: "Buy certainty before committing." },
] as const;

export const pressureOutcomes: Record<
  string,
  {
    title: string;
    consequence: string;
    meters: { users: number; revenue: number; load: number };
    review: string;
  }
> = {
  workaround: {
    title: "Ship the Android workaround",
    consequence:
      "The demo lands and affected users get a path forward. The root cause remains, so the team carries a short-term maintenance cost.",
    meters: { users: 8, revenue: 7, load: 8 },
    review: "In 5 days: retry success rate, crash-free sessions, support tags.",
  },
  delay: {
    title: "Delay the launch",
    consequence:
      "The fix ships complete and the team avoids a second patch. Sales loses the visible moment and a segment waits longer.",
    meters: { users: 6, revenue: 4, load: 4 },
    review: "At the next release gate: provider SDK readiness and QA sign-off.",
  },
  scope: {
    title: "Reduce scope to the sharpest pain",
    consequence:
      "Android payment recovery ships first. The broader retry redesign is deferred with a written rationale.",
    meters: { users: 8, revenue: 6, load: 5 },
    review: "In 7 days: Android conversion and the deferred-scope ticket.",
  },
  escalate: {
    title: "Escalate the trade-off",
    consequence:
      "Leadership makes the revenue-versus-risk call. The team keeps its credibility, but the decision takes time it may not have.",
    meters: { users: 5, revenue: 5, load: 3 },
    review: "Within 24 hours: written decision and named owner.",
  },
  investigate: {
    title: "Investigate one more day",
    consequence:
      "The team confirms the failing payment method before shipping. The demo is at risk and the pressure moves to communication.",
    meters: { users: 6, revenue: 4, load: 6 },
    review: "Tomorrow at stand-up: confirmed cause or ship the workaround.",
  },
};

export const onboardingPressureOutcomes: Record<
  string,
  {
    title: string;
    consequence: string;
    meters: { users: number; revenue: number; load: number };
    review: string;
  }
> = {
  workaround: {
    title: "Ship the narrow onboarding patch",
    consequence:
      "A guided first step reaches new users this sprint and protects the demo. The full three-step experience waits, so the fix only proves part of the hypothesis.",
    meters: { users: 7, revenue: 7, load: 7 },
    review: "In 7 days: first-project creation and drop-off on step one.",
  },
  delay: {
    title: "Delay until the starter is measurable",
    consequence:
      "The guided project ships with complete telemetry and a clean read. Another cohort stalls on the empty workspace while the team waits.",
    meters: { users: 5, revenue: 4, load: 4 },
    review: "At the next planning gate: instrumentation sign-off and experiment ready.",
  },
  scope: {
    title: "Reduce scope to the empty state",
    consequence:
      "The team replaces the empty workspace with a single clear first action. The checklist and prompts are deferred with a written rationale.",
    meters: { users: 8, revenue: 6, load: 4 },
    review: "In 7 days: first-project creation and support contacts.",
  },
  escalate: {
    title: "Escalate the sprint trade-off",
    consequence:
      "Leadership chooses between the redesign and activation work. The decision is legible, but a week passes before anyone starts building.",
    meters: { users: 5, revenue: 5, load: 3 },
    review: "Within 24 hours: written decision, named owner, and sprint reslot.",
  },
  investigate: {
    title: "Spend one day on first-session evidence",
    consequence:
      "The team confirms where new users stall before committing the sprint. The demo prep slips and the pressure moves to communication.",
    meters: { users: 6, revenue: 4, load: 5 },
    review: "Tomorrow at stand-up: confirmed blocker or ship the empty-state fix.",
  },
};

export const blueprintExample = {
  problem:
    "New users stall before their first project, so activation stays at 32% and week-two retention suffers.",
  evidence:
    "Activation funnel (30 days), 8 first-session recordings, support tags, and one 50/50 experiment brief.",
  assumptions:
    "A guided first project reduces effort; users want to share early; the empty state is a bigger blocker than pricing.",
  options:
    "A guided starter, a template gallery, or a shorter signup flow.",
  tradeoffs:
    "The guided starter costs one sprint and delays the pricing test. It is the only option that changes the first-session behaviour directly.",
  decision:
    "Double down on the onboarding flow: ship the three-step guided project to 50% of new users.",
  metric:
    "First-project creation within session one, from 32% to 45%, with week-two retention as the guardrail.",
  nextCheck: "Review at 14 days or 400 exposed users, whichever comes first.",
  rationale: ["User growth trend", "Positive sentiment", "Strong market fit"],
  risks: ["Regulatory changes", "Competitor response", "Scaling challenges"],
};

export const careerSkills = [
  "Product Strategy",
  "User Research",
  "Data Analysis",
  "Leadership",
  "Prioritization",
  "Experimentation",
  "Stakeholder Comms",
];

export const careerEvidence = [
  {
    label: "LinkedIn Profile",
    value: "linkedin.com/in/sarahchen",
    status: "Add your URL",
    action: "linkedin",
  },
  {
    label: "Academic Background",
    value: "Stanford University · MS, HCI",
    status: "Example",
    action: "none",
  },
  {
    label: "Projects",
    value: "3 documented decisions",
    status: "View projects",
    action: "projects",
  },
];

export const navLinks = [
  { label: "Home", href: "/#top" },
  { label: "Modules", href: "/learn" },
  { label: "Interview Prep", href: "/practice" },
  { label: "Projects", href: "/projects" },
  { label: "Tools", href: "/tools" },
  { label: "Resources", href: "/resources" },
];

export const chapters = [
  { id: "chaos", label: "Chaos", href: "#hero" },
  { id: "signal", label: "Signal", href: "#signal" },
  { id: "decision", label: "Decision", href: "#projects" },
  { id: "impact", label: "Impact", href: "#career" },
];
