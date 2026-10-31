import { drawers, layers, headlines, asks, type DrawerId } from "./content";
import { z } from "zod";
export type Scene =
  | "cold"
  | "unit"
  | "audit"
  | "estimate"
  | "carry"
  | "promise"
  | "stakeholders"
  | "slides"
  | "metric"
  | "redteam"
  | "secondSource"
  | "rollout"
  | "board"
  | "debrief";
export type Framing = "direct" | "evolution" | "privateFirst" | "dataRoom";
export type Metric = {
  unit: "completions" | "paying" | "tokens" | "revenue";
  dedupe: boolean;
  streams: boolean;
  exclusions: "account" | "tag" | "none";
  segment: "all" | "enterprise" | "paying";
  window: "daily" | "rolling";
  guardrails: "both" | "latency" | "none";
};
export type Exploit =
  | "dedupe"
  | "streams"
  | "exclusions"
  | "segments"
  | "quality";
export type Receipt = {
  id: string;
  scene: Scene;
  eventIndex: number;
  words: string;
  because: string;
  concept: string;
};
export type Action =
  | { type: "OPEN" }
  | { type: "CLASSIFY"; counts: boolean }
  | { type: "DRAWER"; id: DrawerId }
  | {
      type: "JOIN";
      left: DrawerId;
      right: "gateway" | "billing" | "accounts";
      key: "request_id" | "account_id" | "customer_id";
    }
  | { type: "FINISH_AUDIT" }
  | { type: "ESTIMATE"; point: number; low: number; high: number }
  | { type: "CARRY"; mode: "now" | "verify" | "quiet"; verifyId?: DrawerId }
  | { type: "PROMISE"; wording: "confident" | "qualified" | "evasive" }
  | { type: "TELL"; person: "Ravi" | "Marcus" | "Elena" | "Joyce" }
  | { type: "FRAMING"; framing: Framing }
  | { type: "HEADLINE"; id: string }
  | { type: "EVIDENCE"; ids: DrawerId[] }
  | { type: "ASK"; id: string }
  | { type: "METRIC"; spec: Metric }
  | { type: "FIX"; id: Exploit }
  | { type: "FINISH_REDTEAM" }
  | { type: "SECOND_SOURCE"; source: "independent" | "limits" }
  | { type: "ROLLOUT"; support: boolean }
  | { type: "BOARD"; move: "own" | "blame" | "bury" };
export type Event = { action: Action; at: string };
export type State = {
  version: 1;
  scene: Scene;
  eventIndex: number;
  AH: number;
  PH: number;
  CTOt: number;
  CEOt: number;
  CROt: number;
  BC: number;
  CR: number;
  TE: number;
  DEF: number;
  DL: number;
  opened: DrawerId[];
  proved: string[];
  joinsUsed: string[];
  estimate: { point: number; low: number; high: number } | null;
  calibration: "calibrated" | "vague" | "overconfident" | "wide" | null;
  carry: "now" | "verify" | "quiet" | null;
  promise: "confident" | "qualified" | "evasive" | null;
  toldOrder: string[];
  framing: Framing | null;
  headline: string | null;
  slideEvidence: DrawerId[];
  ask: string | null;
  slideStep: number;
  spec: Metric | null;
  loopholes: Exploit[];
  fixed: Exploit[];
  fixHours: number;
  segmentsShown: boolean;
  skeptical: boolean;
  hidden: boolean;
  leak: boolean;
  scramble: boolean;
  secondSource: boolean;
  rollout: string;
  outcome: string;
  archetype: string;
  finalMove: string | null;
  lastConversation: string;
  feedback: string;
  receipts: Receipt[];
};
export const truth = {
  baseline: 2.5,
  current: 11,
  growth: 8.5,
  real: 1,
  ghost: 7.5,
  share: (7.5 / 8.5) * 100,
};
export const defaultMetric: Metric = {
  unit: "completions",
  dedupe: false,
  streams: true,
  exclusions: "tag",
  segment: "all",
  window: "daily",
  guardrails: "latency",
};
const drawerSchema = z.enum([
  "gateway",
  "billing",
  "sdk",
  "cohorts",
  "tags",
  "tickets",
]);
const metricSchema = z
  .object({
    unit: z.enum(["completions", "paying", "tokens", "revenue"]),
    dedupe: z.boolean(),
    streams: z.boolean(),
    exclusions: z.enum(["account", "tag", "none"]),
    segment: z.enum(["all", "enterprise", "paying"]),
    window: z.enum(["daily", "rolling"]),
    guardrails: z.enum(["both", "latency", "none"]),
  })
  .strict();
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("OPEN") }).strict(),
  z.object({ type: z.literal("FINISH_AUDIT") }).strict(),
  z.object({ type: z.literal("FINISH_REDTEAM") }).strict(),
  z.object({ type: z.literal("CLASSIFY"), counts: z.boolean() }).strict(),
  z.object({ type: z.literal("DRAWER"), id: drawerSchema }).strict(),
  z
    .object({
      type: z.literal("JOIN"),
      left: drawerSchema,
      right: z.enum(["gateway", "billing", "accounts"]),
      key: z.enum(["request_id", "account_id", "customer_id"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("ESTIMATE"),
      point: z.number(),
      low: z.number(),
      high: z.number(),
    })
    .strict(),
  z
    .object({
      type: z.literal("CARRY"),
      mode: z.enum(["now", "verify", "quiet"]),
      verifyId: drawerSchema.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("PROMISE"),
      wording: z.enum(["confident", "qualified", "evasive"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("TELL"),
      person: z.enum(["Ravi", "Marcus", "Elena", "Joyce"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("FRAMING"),
      framing: z.enum(["direct", "evolution", "privateFirst", "dataRoom"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("HEADLINE"),
      id: z.enum(["wrong", "limits", "customers", "cost", "new"]),
    })
    .strict(),
  z
    .object({ type: z.literal("EVIDENCE"), ids: z.array(drawerSchema) })
    .strict(),
  z
    .object({
      type: z.literal("ASK"),
      id: z.enum(["stop", "pause", "baseline", "none"]),
    })
    .strict(),
  z.object({ type: z.literal("METRIC"), spec: metricSchema }).strict(),
  z
    .object({
      type: z.literal("FIX"),
      id: z.enum(["dedupe", "streams", "exclusions", "segments", "quality"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("SECOND_SOURCE"),
      source: z.enum(["independent", "limits"]),
    })
    .strict(),
  z.object({ type: z.literal("ROLLOUT"), support: z.boolean() }).strict(),
  z
    .object({
      type: z.literal("BOARD"),
      move: z.enum(["own", "blame", "bury"]),
    })
    .strict(),
]);
export function initial(): State {
  return {
    version: 1,
    scene: "cold",
    eventIndex: 0,
    AH: 12,
    PH: 0,
    CTOt: 55,
    CEOt: 55,
    CROt: 50,
    BC: 50,
    CR: 40,
    TE: 70,
    DEF: 0,
    DL: 0,
    opened: [],
    proved: [],
    joinsUsed: [],
    estimate: null,
    calibration: null,
    carry: null,
    promise: null,
    toldOrder: [],
    framing: null,
    headline: null,
    slideEvidence: [],
    ask: null,
    slideStep: 0,
    spec: null,
    loopholes: [],
    fixed: [],
    fixHours: 3,
    segmentsShown: false,
    skeptical: false,
    hidden: false,
    leak: false,
    scramble: false,
    secondSource: false,
    rollout: "",
    outcome: "",
    archetype: "",
    finalMove: null,
    lastConversation: "opening",
    feedback: "",
    receipts: [],
  };
}
export function band(s: State) {
  const confirmed = layers
    .filter((l) => s.proved.includes(l.id))
    .reduce((n, l) => n + l.mass, 0);
  const real = s.opened.includes("cohorts") ? 0.8 : 0;
  return {
    mass: confirmed,
    low: (confirmed / truth.growth) * 100,
    high: Math.min(95, (1 - real / truth.growth) * 100),
  };
}
export function capacity(s: State) {
  return s.scramble ? 1 : 2 + Math.floor(s.PH / 2);
}
export function exploits(m: Metric, segmentsShown = false): Exploit[] {
  return [
    ...(!m.dedupe ? ["dedupe" as const] : []),
    ...(m.streams ? ["streams" as const] : []),
    ...(m.exclusions !== "account" ? ["exclusions" as const] : []),
    ...(m.segment === "all" && !segmentsShown ? ["segments" as const] : []),
    ...(m.guardrails !== "both" ? ["quality" as const] : []),
  ];
}
export function metricPreview(m: Metric) {
  // Units and denominators have separate previews: token/revenue growth is not
  // inferable from a request-count dataset. Never manufacture a +40% for them.
  if (m.unit === "tokens" || m.unit === "revenue")
    return {
      growth: null,
      current: null,
      label:
        m.unit === "tokens"
          ? "Token history not collected"
          : "Revenue history not collected",
      note: "Collect a comparable history before publishing this unit.",
    };
  const extra =
    (!m.dedupe ? 3 : 0) +
    (m.streams ? 3 : 0) +
    (m.exclusions === "none" ? 1.5 : m.exclusions === "tag" ? 0.35 : 0);
  const baseline =
    m.segment === "enterprise"
      ? 1.6
      : m.segment === "paying" || m.unit === "paying"
        ? 2
        : 2.5;
  const real =
    m.segment === "enterprise"
      ? 0.8
      : m.segment === "paying" || m.unit === "paying"
        ? 0.9
        : 1;
  const growth = ((real + extra) / baseline) * 100;
  return {
    growth,
    current: baseline + real + extra,
    label: `+${Math.round(growth)}%`,
    note:
      m.segment === "enterprise"
        ? "Enterprise cohort: 1.6M → 2.4M before counting leakage."
        : m.segment === "paying" || m.unit === "paying"
          ? "Paying-account cohort: 2.0M → 2.9M before counting leakage."
          : "All-customer daily average: 2.5M → 3.5M when counting is clean.",
  };
}
export function definition(m: Metric) {
  return `${m.unit === "paying" ? "Paying accounts’ successful completions" : m.unit === "completions" ? "Successful completions" : m.unit === "tokens" ? "Tokens delivered" : "Revenue per 1,000 calls"}; ${m.dedupe ? "deduplicated by request ID" : "every completion event counted"}; streams counted ${m.streams ? "per chunk" : "once"}; ${m.exclusions === "account" ? "exclude internal and test accounts" : m.exclusions === "tag" ? "exclude traffic tags only" : "no traffic exclusions"}; ${m.segment} cohort; ${m.window === "daily" ? "daily" : "7-day rolling"}; ${m.guardrails === "both" ? "latency and error-rate guardrails" : m.guardrails === "latency" ? "latency guardrail only" : "no quality guardrail"}.`;
}
function requireScene(s: State, ...scenes: Scene[]) {
  if (!scenes.includes(s.scene))
    throw Error("That action belongs to a different scene.");
}
function prove(s: State, id: string) {
  if (!s.proved.includes(id)) s.proved.push(id);
}
function openEvidence(s: State, id: DrawerId) {
  s.opened.push(id);
  if (id === "sdk") prove(s, "streaming");
  if (id === "tags") prove(s, "internal");
}
export function reduce(before: State, action: Action): State {
  action = actionSchema.parse(action) as Action;
  const s = structuredClone(before);
  s.feedback = "";
  s.eventIndex++;
  const receipt = (
    id: string,
    words: string,
    because: string,
    concept: string,
  ) =>
    s.receipts.push({
      id,
      words,
      because,
      concept,
      scene: before.scene,
      eventIndex: before.eventIndex,
    });
  switch (action.type) {
    case "OPEN":
      requireScene(s, "cold");
      s.scene = "unit";
      s.lastConversation = "unit";
      break;
    case "CLASSIFY":
      requireScene(s, "unit");
      receipt(
        "G01",
        `A retry ${action.counts ? "counts" : "does not count"} as new demand.`,
        action.counts
          ? "AMC counts it, but the customer did not ask for something new."
          : "You separated a pipeline event from a new customer request.",
        "A number is a unit times a rule.",
      );
      s.lastConversation = action.counts ? "unitYes" : "unitNo";
      s.scene = "audit";
      break;
    case "DRAWER": {
      requireScene(s, "audit");
      const d = drawers.find((d) => d.id === action.id);
      if (!d || s.opened.includes(d.id))
        throw Error("Choose an unopened drawer.");
      if (s.AH < d.cost)
        throw Error(
          "Not enough audit hours. Keep time for a join or carry the uncertainty.",
        );
      s.AH -= d.cost;
      openEvidence(s, d.id);
      s.lastConversation = d.id;
      s.feedback = d.reading;
      receipt(
        "D" + s.eventIndex,
        `Opened ${d.title}.`,
        d.reading,
        "Evidence before interpretation.",
      );
      break;
    }
    case "JOIN": {
      requireScene(s, "audit");
      if (!s.opened.includes(action.left))
        throw Error("Open the source drawer first.");
      if (action.right === "billing" && !s.opened.includes("billing"))
        throw Error("Open billing before joining to it.");
      if (s.AH < 1) throw Error("A join needs one audit hour.");
      const key = `${action.left}:${action.right}:${action.key}`;
      if (s.joinsUsed.includes(key))
        throw Error("That join is already in your case file.");
      s.AH--;
      s.joinsUsed.push(key);
      const retry =
        action.left === "gateway" &&
        action.right === "gateway" &&
        action.key === "request_id";
      const partner =
        action.left === "tags" &&
        action.right === "accounts" &&
        action.key === "account_id";
      const billing =
        action.left === "gateway" &&
        action.right === "billing" &&
        action.key === "request_id";
      if (retry) {
        prove(s, "retries");
        s.lastConversation = "retryJoin";
        s.feedback =
          "Duplicate request IDs explain 3.0M extra counted calls per day.";
      } else if (partner) {
        prove(s, "partner");
        s.lastConversation = "partnerJoin";
        s.feedback =
          "Account identities confirm 0.7M daily Orbitly test events.";
      } else if (billing) {
        s.lastConversation = "billingJoin";
        s.feedback =
          "41% of sampled call events have no matching billing event. This is a sample, not an estimate of all ghost traffic.";
      } else {
        s.lastConversation = "wrongJoin";
        s.feedback =
          "No valid match: these columns do not identify the same entity. The attempted check used one hour.";
      }
      receipt(
        "J" + s.eventIndex,
        `Joined ${action.left} to ${action.right} on ${action.key}.`,
        s.feedback,
        "Join keys must describe the same thing.",
      );
      break;
    }
    case "FINISH_AUDIT":
      requireScene(s, "audit");
      s.scene = "estimate";
      s.lastConversation = "estimate";
      break;
    case "ESTIMATE": {
      requireScene(s, "estimate");
      const { point, low, high } = action;
      if (
        ![point, low, high].every(Number.isFinite) ||
        low < 0 ||
        high > 100 ||
        low > point ||
        point > high
      )
        throw Error("Use 0 ≤ low ≤ estimate ≤ high ≤ 100.");
      s.estimate = { point, low, high };
      const inside = truth.share >= low && truth.share <= high,
        width = high - low;
      s.calibration = !inside
        ? "overconfident"
        : width <= 25
          ? "calibrated"
          : width > 40
            ? "vague"
            : "wide";
      s.CR +=
        s.calibration === "calibrated"
          ? 10
          : s.calibration === "vague"
            ? 3
            : s.calibration === "overconfident"
              ? -8
              : 0;
      s.scene = "carry";
      s.lastConversation = "estimated";
      receipt(
        "G_EST",
        `${point}% ghost share; range ${low}–${high}%.`,
        "You recorded uncertainty before seeing the complete audit. Calibration is revealed in the debrief.",
        "A range beats a point you cannot defend.",
      );
      break;
    }
    case "CARRY": {
      requireScene(s, "carry");
      s.carry = action.mode;
      s.PH = s.AH;
      const b = band(s),
        found = s.proved.includes("retries") || s.proved.includes("streaming");
      if (action.mode === "now") {
        if (found) {
          s.CR += 5;
          s.CEOt -= 3;
          s.TE -= 2;
        }
        if (b.low < 25) s.CR -= 6;
        s.lastConversation = "now";
        s.scene = "stakeholders";
      } else if (action.mode === "verify") {
        if (s.PH < 2)
          throw Error(
            "A targeted verification needs two remaining prep hours.",
          );
        s.PH -= 2;
        s.DL++;
        const oldWidth = b.high - b.low;
        const id = action.verifyId;
        if (id && !s.opened.includes(id) && drawers.some((d) => d.id === id))
          openEvidence(s, id);
        else if (s.opened.includes("gateway") && !s.proved.includes("retries"))
          prove(s, "retries");
        const after = band(s);
        if (oldWidth - (after.high - after.low) >= 15) s.CR += 2;
        s.lastConversation = "verify";
        s.scene = "stakeholders";
      } else {
        if (b.low >= 60) {
          s.CR -= 12;
          s.hidden = true;
        } else s.CR -= 4;
        s.lastConversation = "quiet";
        s.scene = "promise";
      }
      s.scramble =
        s.PH < 2 &&
        (s.proved.includes("retries") || s.proved.includes("streaming"));
      receipt(
        "G_CARRY",
        action.mode === "now"
          ? "Raised the concern now."
          : action.mode === "verify"
            ? "Spent two prep hours verifying first."
            : "Kept the roadmap moving without raising the concern.",
        s.hidden
          ? "You withheld a concern despite proving most of the growth was ghost traffic."
          : `You carried ${s.PH} prep hours and ${s.DL} day of delay forward.`,
        "The cost of delay.",
      );
      break;
    }
    case "PROMISE":
      requireScene(s, "promise");
      s.promise = action.wording;
      s.scene = "stakeholders";
      s.lastConversation =
        "promise" + action.wording[0].toUpperCase() + action.wording.slice(1);
      receipt(
        "G_PROMISE",
        action.wording === "confident"
          ? "“Yes. You can tell the board it is solid.”"
          : action.wording === "qualified"
            ? "“The activity grew. Customer demand is not verified yet.”"
            : "“The dashboard is reporting the number we have.”",
        "Elena will carry these exact words into the board meeting.",
        "A promise is a future constraint.",
      );
      break;
    case "TELL":
      requireScene(s, "stakeholders");
      if (
        !["Ravi", "Marcus", "Elena", "Joyce"].includes(action.person) ||
        s.toldOrder.includes(action.person)
      )
        throw Error("Choose someone you have not told.");
      s.toldOrder.push(action.person);
      if (action.person === "Elena") s.CEOt += 5;
      s.lastConversation = "tell" + action.person;
      receipt(
        "T" + s.eventIndex,
        `Told ${action.person} ${s.toldOrder.length === 1 ? "first" : `at position ${s.toldOrder.length}`}.`,
        "They heard the concern directly from you.",
        "Stakeholder sequencing.",
      );
      break;
    case "FRAMING": {
      requireScene(s, "stakeholders");
      if (!s.toldOrder.length) throw Error("Choose who hears it first.");
      if (action.framing === "privateFirst" && s.toldOrder[0] !== "Ravi")
        throw Error("Private-first starts with the metric owner, Ravi.");
      s.framing = action.framing;
      if (
        s.toldOrder.includes("Ravi") &&
        s.toldOrder.indexOf("Ravi") === s.toldOrder.length - 1 &&
        s.toldOrder.length > 1
      ) {
        s.DEF += 2;
        s.CTOt -= 4;
      }
      if (action.framing === "direct") {
        s.DEF += 3;
        s.CTOt -= 15;
        s.skeptical = true;
      }
      if (action.framing === "evolution") {
        s.CTOt += 5;
        s.CEOt += 4;
        s.DL += 6;
      }
      if (action.framing === "privateFirst") {
        s.CTOt += 10;
        if (!s.toldOrder.includes("Marcus")) {
          s.CROt -= 8;
          s.leak = true;
        }
      }
      if (action.framing === "dataRoom") {
        s.DL += 3;
        s.CR += 3;
        s.CEOt -= 4;
      }
      s.lastConversation =
        action.framing === "privateFirst" && !s.proved.includes("retries")
          ? "privateNoProof"
          : action.framing;
      s.scene = "slides";
      receipt(
        "G_FRAME",
        `Used ${action.framing === "privateFirst" ? "a private conversation with Ravi" : action.framing === "dataRoom" ? "the data room" : action.framing === "evolution" ? "a “Metric v2” narrative" : "a direct executive meeting"}.`,
        s.leak
          ? "Marcus learned through Slack because you did not brief him."
          : `The delivery changed trust and added ${s.DL} total days of delay.`,
        "Frame the question, not the culprit.",
      );
      break;
    }
    case "HEADLINE": {
      requireScene(s, "slides");
      if (s.slideStep !== 0 || !headlines.some((h) => h.id === action.id))
        throw Error("Choose a headline on slide one.");
      s.headline = action.id;
      s.slideStep = 1;
      if (action.id === "wrong") s.DEF += 2;
      if (action.id === "limits") {
        s.DEF--;
        s.CR += 2;
      }
      if (action.id === "customers")
        s.CR +=
          s.opened.includes("billing") || s.opened.includes("cohorts") ? 4 : -2;
      s.lastConversation = (
        {
          wrong: "headlineWrong",
          limits: "headlineLimits",
          customers: "headlineCustomers",
          cost: "headlineCost",
          new: "headlineNew",
        } as Record<string, string>
      )[action.id];
      receipt(
        "G_HEADLINE",
        headlines.find((h) => h.id === action.id)!.words,
        action.id === "wrong"
          ? "Ravi heard his work being dismissed."
          : action.id === "customers" &&
              !s.opened.includes("billing") &&
              !s.opened.includes("cohorts")
            ? "You made a customer-value claim without opening its supporting data."
            : "The room heard the question before the conclusion.",
        "Reading the room.",
      );
      break;
    }
    case "EVIDENCE":
      requireScene(s, "slides");
      if (
        s.slideStep !== 1 ||
        new Set(action.ids).size !== action.ids.length ||
        action.ids.length > capacity(s) ||
        action.ids.some((id) => !s.opened.includes(id))
      )
        throw Error("Use only collected sources within your slide capacity.");
      s.slideEvidence = [...action.ids];
      s.slideStep = 2;
      s.lastConversation = "slideAsk";
      receipt(
        "G_SLIDES",
        `Presented ${action.ids.length ? action.ids.map((id) => drawers.find((d) => d.id === id)!.title).join(" → ") : "no source cards"}.`,
        s.scramble
          ? "Your audit left less than two prep hours: one evidence card fits."
          : "Evidence order is the order you chose.",
        "Evidence should be checkable.",
      );
      break;
    case "ASK":
      requireScene(s, "slides");
      if (s.slideStep !== 2 || !asks.some((a) => a.id === action.id))
        throw Error("Choose an ask on slide three.");
      s.ask = action.id;
      if (action.id === "pause") {
        s.CEOt -= 2;
        s.BC += 3;
      }
      if (action.id === "stop") {
        s.DL = Math.max(0, s.DL - 4);
        s.CROt -= 6;
      }
      if (action.id === "baseline") s.TE += 2;
      s.scene = "metric";
      s.lastConversation =
        action.id === "none"
          ? "noAsk"
          : s.leak
            ? "leak"
            : s.DL > 0
              ? "delay"
              : "metric";
      receipt(
        "G_ASK",
        asks.find((a) => a.id === action.id)!.label,
        action.id === "pause"
          ? "The proposed threefold scale-up is paused."
          : action.id === "stop"
            ? "Publication stops sooner, but Marcus must explain changing targets."
            : action.id === "baseline"
              ? "The team gets time for an agreed baseline."
              : "No decision was requested. The old plan remains in motion.",
        "Turn evidence into a decision.",
      );
      break;
    case "METRIC": {
      requireScene(s, "metric");
      validateMetric(action.spec);
      s.spec = structuredClone(action.spec);
      s.loopholes = exploits(s.spec);
      s.scene = "redteam";
      s.lastConversation = s.loopholes.length ? "redteam" : "clean";
      receipt(
        "G_METRIC",
        definition(s.spec),
        "The red team will test these exact rules.",
        "Goodhart’s law.",
      );
      break;
    }
    case "FIX": {
      requireScene(s, "redteam");
      if (
        !s.spec ||
        !s.loopholes.includes(action.id) ||
        s.fixed.includes(action.id)
      )
        throw Error("Choose an open loophole.");
      if (action.id === "segments") s.segmentsShown = true;
      else {
        if (s.fixHours < 1)
          throw Error("No fix hours remain. Carry the known limitation.");
        s.fixHours--;
        if (action.id === "dedupe") s.spec.dedupe = true;
        if (action.id === "streams") s.spec.streams = false;
        if (action.id === "exclusions") s.spec.exclusions = "account";
        if (action.id === "quality") s.spec.guardrails = "both";
      }
      s.fixed.push(action.id);
      s.loopholes = exploits(s.spec, s.segmentsShown);
      s.lastConversation = "fixed";
      receipt(
        "F" + s.eventIndex,
        `Closed the ${action.id} loophole.`,
        action.id === "segments"
          ? "Added a visible cohort breakdown without dropping smaller customer groups."
          : "The written definition changed. The preview now follows that rule.",
        "Red-team before rollout.",
      );
      break;
    }
    case "FINISH_REDTEAM":
      requireScene(s, "redteam");
      s.scene = s.CTOt < 40 || s.skeptical ? "secondSource" : "rollout";
      s.lastConversation =
        s.scene === "secondSource"
          ? "secondSource"
          : s.CTOt >= 60 && s.DL <= 3
            ? "rolloutSlow"
            : s.CEOt >= 60 && s.DL > 3
              ? "rolloutMandate"
              : "rolloutNormal";
      break;
    case "SECOND_SOURCE":
      requireScene(s, "secondSource");
      s.secondSource = true;
      if (action.source === "independent" && s.slideEvidence.length) {
        s.CTOt += 5;
        s.CR += 2;
        s.lastConversation = "secondConfirmed";
      } else {
        s.CR += 1;
        s.lastConversation = "secondLimited";
      }
      s.scene = "rollout";
      receipt(
        "G_SECOND",
        action.source === "independent"
          ? "Requested an independent review of the cited source."
          : "Limited the claim pending independent validation.",
        s.slideEvidence.length
          ? "A second reader checked the original source."
          : "No source card was presented; the claim stays explicitly unverified.",
        "Independent validation.",
      );
      break;
    case "ROLLOUT":
      requireScene(s, "rollout");
      if (s.CTOt >= 60 && s.DL <= 3) {
        s.rollout = "Three-week migration";
        s.TE += 3;
        s.BC += 4;
      } else if (s.CEOt >= 60 && s.DL > 3) {
        s.rollout = "Immediate mandate";
        s.TE -= 15;
        s.BC += 2;
      } else s.rollout = "Staged migration";
      if (!action.support) s.TE -= 20;
      else {
        s.TE += 2;
        s.DL++;
      }
      s.scene = "board";
      s.lastConversation =
        s.carry === "quiet" && band(s).low < 25 ? "compounds" : "board";
      receipt(
        "G_ROLLOUT",
        `${s.rollout}; ${action.support ? "protect migration capacity" : "keep all existing commitments"}.`,
        action.support
          ? "The team gets capacity at the cost of one extra day."
          : "The same team must migrate while delivering the existing roadmap.",
        "Pivot fatigue.",
      );
      break;
    case "BOARD": {
      requireScene(s, "board");
      s.finalMove = action.move;
      const compounded = s.carry === "quiet" && band(s).low < 25;
      const materialPromise = s.promise === "confident";
      s.BC +=
        Math.round((s.CR - 40) / 3) +
        (s.calibration === "calibrated" ? 5 : 0) -
        (materialPromise ? 10 : 0) -
        s.loopholes.length * 3;
      if (action.move === "own") {
        s.CR += 5;
        s.BC += 3;
      }
      if (action.move === "blame") {
        s.CTOt -= 8;
        s.BC -= 4;
      }
      if (action.move === "bury") {
        s.CR -= 12;
        s.BC -= 12;
      }
      const adopt =
        !!s.spec &&
        s.loopholes.filter((x) => x !== "segments").length === 0 &&
        !["tokens", "revenue"].includes(s.spec.unit) &&
        action.move !== "bury";
      s.outcome = compounded
        ? "Crisis"
        : s.CTOt < 35 && !s.secondSource
          ? "Stalemate"
          : !adopt
            ? "Stalemate"
            : s.CTOt < 45 || s.TE < 45 || s.BC < 45
              ? "Reset with scars"
              : "Reset";
      const all = layers.every((l) => s.proved.includes(l.id));
      s.archetype = compounded
        ? "The Optimist"
        : all &&
            12 - s.AH <= 11 &&
            s.calibration === "calibrated" &&
            !s.loopholes.length &&
            s.CTOt >= 60
          ? "The Surgeon"
          : s.hidden || (s.DL > 6 && !adopt)
            ? "The Smoothie"
            : s.framing === "direct" && band(s).low >= 60 && s.CR >= 45
              ? "The Truth-teller"
              : s.AH === 0 && band(s).low >= 60
                ? "The Auditor"
                : ["evolution", "privateFirst"].includes(s.framing || "") &&
                    s.CTOt >= 45 &&
                    s.CROt >= 40 &&
                    s.DL <= 6 &&
                    !s.loopholes.length
                  ? "The Strategist"
                  : "The Investigator";
      s.scene = "debrief";
      s.lastConversation = "reveal";
      receipt(
        "G_BOARD",
        action.move === "own"
          ? "Owned the correction."
          : action.move === "blame"
            ? "Blamed the process."
            : "Kept the old number in circulation.",
        compounded
          ? "The unverified promise drove a threefold infrastructure scale-up before the outside challenge."
          : `${s.outcome}: ${s.loopholes.length} known limitations reached the board; ${s.DL} days elapsed before correction.`,
        "Trust follows a reproducible claim.",
      );
      break;
    }
    default:
      throw Error("Unknown Ghost Metric action.");
  }
  for (const key of ["CTOt", "CEOt", "CROt", "BC", "CR", "TE"] as const)
    s[key] = Math.max(0, Math.min(100, s[key]));
  s.DEF = Math.max(0, Math.min(5, s.DEF));
  return s;
}
export function validateMetric(m: Metric) {
  const allowed: Record<keyof Metric, unknown[]> = {
    unit: ["completions", "paying", "tokens", "revenue"],
    dedupe: [true, false],
    streams: [true, false],
    exclusions: ["account", "tag", "none"],
    segment: ["all", "enterprise", "paying"],
    window: ["daily", "rolling"],
    guardrails: ["both", "latency", "none"],
  };
  if (
    !m ||
    Object.entries(allowed).some(
      ([key, values]) => !values.includes(m[key as keyof Metric]),
    )
  )
    throw Error("Choose a valid option for every part of the metric.");
}
export function replay(events: Event[]) {
  return events.reduce((s, e) => reduce(s, e.action), initial());
}
export function conclusion(s: State) {
  if (s.outcome === "Crisis")
    return "The unverified number became a spending plan. You are correcting it after an outside challenge.";
  if (s.outcome === "Stalemate")
    return "You questioned the headline, but the replacement still needs agreement or stronger controls.";
  return s.outcome === "Reset with scars"
    ? "A reproducible metric replaced the headline, with trust or team capacity still to repair."
    : "The team adopted a reproducible metric and a correction the board could follow.";
}
