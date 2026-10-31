import content from "../../../content/projects/sacred-no/content.json";
export { content };
export type Scene = keyof typeof content.beats;
export type Position = "ship" | "guarded" | "no" | "defer";
export type Alternative = "data" | "beta" | "sandbox" | "none";
export type Tone = "direct" | "warm" | "hedged";
export type Draft = {
  position: Position;
  evidence: string[];
  alternative: Alternative;
  ask: string;
  deadline: string;
  tone: Tone;
};
export type Action =
  | { type: "REPLY"; reply: "on" | "ask" | "call" }
  | { type: "INSPECT"; id: string }
  | { type: "LINK"; id: string; claim: number }
  | { type: "ALLOCATE"; hours: number }
  | { type: "REHEARSE"; lens: string }
  | { type: "NEXT" }
  | { type: "CALL"; draft: Draft }
  | { type: "PRIYA"; queue: boolean }
  | { type: "DEAL"; id: string; tone: Tone }
  | { type: "ROLLOUT"; segments: string[] }
  | { type: "LOCK"; position: Position; evidence: string; uninformed?: boolean }
  | { type: "DEMO" }
  | { type: "FINAL"; move: "own" | "defend" | "rollback" | "week" };
export type Event = { action: Action; at: string };
export type Receipt = {
  id: string;
  scene: Scene;
  minute: number;
  words: string;
  because: string;
  concept: string;
  line: string;
  source?: string;
  eventIndex: number;
};
export type State = {
  version: 1;
  eventIndex: number;
  scene: Scene;
  CT: number;
  ST: number;
  ET: number;
  CR: number;
  SY: number;
  TM: number;
  JIT: number;
  SG: number;
  research: number;
  inspected: string[];
  links: Record<string, number[]>;
  lenses: string[];
  queue: boolean;
  killSwitch: boolean;
  caved: boolean;
  strong: boolean;
  alternative: Alternative;
  plan: Position;
  draft?: Draft;
  deals: string[];
  segments: string[];
  lockedEvidence: string;
  backchannel: boolean;
  maxHours: number;
  shortMorning: boolean;
  eligibleGolden: boolean;
  golden: boolean;
  demo?:
    | "stable"
    | "degraded"
    | "crash"
    | "payments"
    | "marlo"
    | "sandbox"
    | "data"
    | "deferred"
    | "unready";
  outcome?: "Backed" | "Tolerated" | "Overruled" | "Crash" | "Standoff";
  archetype?: string;
  receipts: Receipt[];
  fuses: { id: string; firesAt: Scene; receiptId: string; fired: boolean }[];
  lastLine: string;
  effect: "none" | "cave" | "steady" | "fracture" | "gold";
  pro: string;
  finalMove?: string;
};
export function initial(): State {
  return {
    version: 1,
    eventIndex: 0,
    scene: "cold",
    CT: 55,
    ST: 50,
    ET: 60,
    CR: 40,
    SY: 62,
    TM: 553,
    JIT: 0,
    SG: 5,
    research: 0,
    inspected: [],
    links: {},
    lenses: [],
    queue: false,
    killSwitch: false,
    caved: false,
    strong: false,
    alternative: "none",
    plan: "defer",
    deals: [],
    segments: [],
    lockedEvidence: "",
    backchannel: false,
    maxHours: 10,
    shortMorning: false,
    eligibleGolden: false,
    golden: false,
    receipts: [],
    fuses: [],
    lastLine: "OPEN",
    effect: "none",
    pro: "",
  };
}
const ensure = (ok: unknown, message: string) => {
  if (!ok) throw Error(message);
};
const byId = <T extends { id: string }>(items: T[], id: string) => {
  const item = items.find((x) => x.id === id);
  ensure(item, "Unknown content identifier.");
  return item!;
};
export function clock(s: State) {
  const elapsed = 553 - s.TM;
  const minutes = (23 * 60 + 47 + elapsed) % (24 * 60);
  return `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${minutes < 720 ? "AM" : "PM"}`;
}
export function strength(ids: string[]) {
  return [...new Set(ids)].reduce(
    (n, id) => n + (content.evidence.find((e) => e.id === id)?.strength || 0),
    0,
  );
}
export function isStrong(ids: string[]) {
  return strength(ids.filter((id) => id !== "tickets")) >= 4;
}
export function sentence(d: Draft) {
  const position = byId(content.positions, d.position).text;
  const prefix =
    d.tone === "hedged"
      ? "I think maybe "
      : d.tone === "warm"
        ? "I want us to succeed. "
        : "";
  const evidence = d.evidence
    .map((id) => byId(content.evidence, id).reading)
    .join(" ");
  return `${prefix}${d.tone === "hedged" ? position[0].toLowerCase() + position.slice(1) : position} ${evidence || "I have not linked evidence."} ${byId(content.alternatives, d.alternative).text} ${byId(content.asks, d.ask).text} ${byId(content.deadlines, d.deadline).text}`;
}
export function projection(s: State, segments = s.segments) {
  const share = Math.min(
    1,
    content.segments
      .filter((x) => segments.includes(x.id))
      .reduce((a, x) => a + x.share, 0),
  );
  const promised = s.deals.includes("risk")
    ? 1
    : s.deals.includes("marlo")
      ? 0.32
      : s.deals.includes("beta")
        ? 0.18
        : 0;
  const effective = Math.max(share, promised, s.plan === "ship" ? 1 : 0),
    base = 4000 + 380 * s.SG + (s.queue ? 1500 : 0);
  const cap = Math.round(
    base * (1 + Math.max(-0.05, Math.min(0.05, (s.SY - 62) / 400))),
  );
  const load = Math.round(
    9000 * effective * (segments.includes("android") ? 1.04 : 1),
  );
  const payment = Math.round(load * 0.2),
    paymentRisk = payment > 1500;
  return {
    share: effective,
    load,
    cap,
    payment,
    paymentRisk,
    ratio: load / cap,
    risk:
      (load > cap * 1.1 && !s.killSwitch) || (paymentRisk && !s.killSwitch)
        ? "failure"
        : load > cap * 0.9
          ? "risky"
          : "stable",
  };
}
function receipt(
  s: State,
  words: string,
  because: string,
  concept: string,
  line: string,
  source?: string,
) {
  const r = {
    id: `R${String(s.receipts.length + 1).padStart(2, "0")}`,
    scene: s.scene,
    minute: 553 - s.TM,
    words,
    because,
    concept,
    line,
    source,
    eventIndex: s.eventIndex,
  };
  s.receipts.push(r);
  s.lastLine = line;
  s.pro = concept;
  return r;
}
function spend(s: State, minutes: number) {
  ensure(s.TM >= minutes, "Not enough story time remains for that action.");
  s.TM -= minutes;
}
function fuse(s: State, r: Receipt, firesAt: Scene) {
  s.fuses.push({
    id: `F${s.fuses.length + 1}`,
    firesAt,
    receiptId: r.id,
    fired: false,
  });
}
function arrive(s: State, scene: Scene) {
  s.scene = scene;
  for (const f of s.fuses) if (f.firesAt === scene) f.fired = true;
}
function cap(s: State) {
  for (const k of ["CT", "ST", "ET", "CR", "SY"] as const)
    s[k] = Math.max(0, Math.min(100, Math.round(s[k])));
  s.JIT = Math.max(0, Math.min(5, s.JIT));
  return s;
}
export function reduce(previous: State, action: Action): State {
  const s = structuredClone(previous);
  s.effect = "none";
  s.pro = "";
  s.eventIndex++;
  const at = (...scenes: Scene[]) =>
    ensure(scenes.includes(s.scene), "That action belongs to another scene.");
  switch (action.type) {
    case "REPLY": {
      at("cold");
      ensure(["on", "ask", "call"].includes(action.reply), "Choose a reply.");
      spend(s, 3);
      s.CT += action.reply === "on" ? 3 : action.reply === "ask" ? 1 : -1;
      receipt(
        s,
        {
          on: "On it.",
          ask: "Walk me through what you promised.",
          call: "Call me.",
        }[action.reply],
        "Kian forms his first impression from your reply.",
        "credibility",
        `REPLY-${action.reply.toUpperCase()}`,
      );
      arrive(s, "evidence");
      break;
    }
    case "INSPECT": {
      at("evidence");
      const e = byId(content.evidence, action.id);
      ensure(!s.inspected.includes(e.id), "This source is already collected.");
      ensure(
        s.research + e.cost <= 110,
        "Your overnight research window is full. Keep time for the call.",
      );
      spend(s, e.cost);
      s.research += e.cost;
      s.inspected.push(e.id);
      s.CR += 2;
      receipt(s, `Investigated ${e.title}`, e.reading, "refusal", e.line);
      break;
    }
    case "LINK": {
      at("evidence");
      const e = byId(content.evidence, action.id);
      ensure(s.inspected.includes(e.id), "Investigate that source first.");
      ensure(
        Number.isInteger(action.claim) && action.claim >= 0 && action.claim < 5,
        "Choose a claim.",
      );
      const relevant =
        e.breaks.includes(action.claim) || e.supports.includes(action.claim);
      s.links[e.id] ??= [];
      ensure(
        !s.links[e.id].includes(action.claim),
        "This connection is already recorded.",
      );
      if (relevant) {
        s.links[e.id].push(action.claim);
        s.CR += 2;
      } else s.CR -= 1;
      receipt(
        s,
        `${e.title} → ${content.claims[action.claim]}`,
        relevant
          ? e.supports.includes(action.claim)
            ? "Supports this claim; customer demand is real."
            : "Contradicts this claim; the strand breaks."
          : "Useful context, but it does not test this claim.",
        "refusal",
        relevant
          ? e.supports.includes(action.claim)
            ? "G-LINK-SUPPORT"
            : "G-LINK-BREAK"
          : "G-LINK-MISS",
      );
      break;
    }
    case "ALLOCATE": {
      at("resources");
      ensure(
        Number.isInteger(action.hours) &&
          action.hours >= 0 &&
          action.hours <= s.maxHours,
        "Allocation exceeds available engineer hours.",
      );
      s.SG = action.hours;
      spend(s, 10);
      s.SY += s.SG - 5;
      receipt(
        s,
        `${s.SG} engineer-hours to safeguards; ${10 - s.SG} to feature work.`,
        "Safeguards increase capacity, but leave fewer hours for Live Drops.",
        "blast",
        "PRIYA-NEUTRAL",
      );
      arrive(s, "rehearsal");
      break;
    }
    case "REHEARSE": {
      at("rehearsal");
      const lens = byId(content.lenses, action.lens);
      ensure(
        s.lenses.length < 3 && !s.lenses.includes(lens.id),
        "Choose up to three different rehearsals.",
      );
      spend(s, 15);
      s.lenses.push(lens.id);
      receipt(
        s,
        `Rehearsed ${lens.label}`,
        "A rehearsal reveals Kian’s lens; it is not a real commitment.",
        "credibility",
        lens.line,
      );
      break;
    }
    case "CALL": {
      at("call");
      const d = action.draft;
      byId(content.positions, d.position);
      byId(content.alternatives, d.alternative);
      byId(content.asks, d.ask);
      byId(content.deadlines, d.deadline);
      ensure(["direct", "warm", "hedged"].includes(d.tone), "Choose a tone.");
      ensure(
        d.evidence.length <= 2 &&
          new Set(d.evidence).size === d.evidence.length &&
          d.evidence.every((e) => s.inspected.includes(e)),
        "Link up to two collected sources.",
      );
      spend(s, 20);
      s.draft = d;
      s.strong = isStrong(d.evidence);
      s.alternative = d.alternative;
      s.plan = d.position;
      let line = "CALL-WEAK";
      if (d.tone === "warm") {
        s.CT += 2;
        s.ST += 1;
      }
      if (d.tone === "hedged") s.JIT += 2;
      if (
        d.position === "ship" ||
        (d.tone === "hedged" &&
          !s.strong &&
          ["no", "guarded"].includes(d.position))
      ) {
        s.caved = true;
        s.plan = "ship";
        s.CT += 5;
        s.ET -= 12;
        s.effect = "cave";
        line = d.tone === "hedged" ? "CALL-HEDGE" : "CALL-CAVE";
      } else if (d.position === "no" && s.strong && d.alternative !== "none") {
        s.CT += 8;
        s.CR += 12;
        s.eligibleGolden = d.alternative === "data";
        s.effect = "steady";
        line = "CALL-STRONG";
      } else if (d.position === "no" && d.alternative === "none") {
        s.CT -= 15;
        s.CR += d.evidence.length ? 4 : 0;
        line = "CALL-BARE";
      } else if (d.position === "guarded" && s.SG >= 6) {
        s.CT += 3;
        s.ET += 6;
        line = "CALL-GUARD";
      } else if (d.position === "defer") {
        s.CT -= 8;
        s.ST -= 4;
        s.CR += 2;
        line = "CALL-DEFER";
      } else {
        s.CT -= 6;
        s.CR += s.strong ? 4 : 0;
      }
      if (d.tone === "hedged" && s.JIT >= 3) {
        s.CR -= 6;
        line = "CALL-HEDGE";
      }
      if (
        d.evidence.includes("tickets") &&
        d.evidence.every((id) => id === "tickets")
      ) {
        s.CR -= 2;
      }
      const r = receipt(
        s,
        sentence(d),
        s.caved
          ? "Your answer was received as an unguarded commitment."
          : d.position === "no" && s.strong && d.alternative !== "none"
            ? "Kian agreed to hear your alternative because you linked relevant evidence."
            : d.position === "no" && d.alternative === "none"
              ? "Kian had no replacement to take to the board. His trust fell."
              : d.position === "guarded" && s.SG >= 6
                ? "Kian accepted a guarded proposal with a named safeguard budget."
                : d.position === "defer"
                  ? "The call postponed the decision; CEO and Sales trust fell."
                  : "The response left a gap in evidence or a replacement plan.",
        d.tone === "hedged"
          ? "hedge"
          : d.alternative !== "none"
            ? "alternative"
            : "refusal",
        line,
      );
      fuse(s, r, "priya");
      fuse(s, r, "board");
      s.backchannel = s.CT < 45;
      s.shortMorning = s.TM < 410;
      s.maxHours = s.ET < 50 || s.plan === "ship" ? 5 : 10;
      s.TM = Math.min(s.TM, s.shortMorning ? 115 : 150);
      arrive(s, "priya");
      break;
    }
    case "PRIYA": {
      at("priya");
      s.SG = Math.min(s.SG, s.maxHours);
      const listened = s.strong && s.plan !== "ship";
      s.killSwitch = listened || action.queue;
      s.queue = action.queue;
      s.ET += action.queue ? 8 : -3;
      s.SY += action.queue ? 6 : -2;
      spend(s, 10);
      const r = receipt(
        s,
        action.queue
          ? "Protect the queue and name Priya rollback owner."
          : "Keep the feature allocation; no extra queue isolation.",
        listened
          ? "Your evidence-backed call earned an additional kill switch."
          : action.queue
            ? "You protected the queue after her warning; a kill switch is included."
            : "The warning is recorded, but the release remains less protected.",
        "reversible",
        action.queue ? "PRIYA-QUEUE" : "PRIYA-KEEP",
        s.fuses.find((f) => f.firesAt === "priya")?.receiptId,
      );
      fuse(s, r, "board");
      arrive(s, "deals");
      break;
    }
    case "DEAL": {
      at("deals");
      const d = byId(content.deals, action.id);
      ensure(
        ["direct", "warm", "hedged"].includes(action.tone),
        "Choose a tone.",
      );
      ensure(
        s.deals.length < 2 && !s.deals.includes(d.id),
        "Choose at most two distinct commitments.",
      );
      ensure(
        !(s.deals.includes("apology") && ["risk", "marlo"].includes(d.id)) &&
          !(
            d.id === "apology" &&
            s.deals.some((id) => ["risk", "marlo"].includes(id))
          ),
        "A public delay conflicts with a live-production promise. Choose one.",
      );
      spend(s, 20);
      s.deals.push(d.id);
      s.ST += d.ST + (action.tone === "warm" ? 2 : 0);
      s.CT += d.CT - (s.backchannel ? 2 : 0);
      s.SY += d.SY;
      if (action.tone === "hedged") {
        s.JIT++;
        s.CR -= 2;
      }
      const r = receipt(
        s,
        d.title,
        d.cost,
        "debt",
        action.tone === "hedged" ? "DEAL-HEDGE" : `DEAL-${d.id.toUpperCase()}`,
      );
      fuse(s, r, "board");
      break;
    }
    case "ROLLOUT": {
      at("rollout");
      ensure(
        new Set(action.segments).size === action.segments.length &&
          action.segments.every((id) =>
            content.segments.some((x) => x.id === id),
          ),
        "Choose valid rollout cohorts.",
      );
      spend(s, 15);
      s.segments = action.segments;
      const p = projection(s);
      receipt(
        s,
        `${s.segments.length ? s.segments.map((id) => byId(content.segments, id).label).join(", ") : "Nobody"} selected`,
        `${p.load.toLocaleString("en-US")} forecast viewers / ${p.cap.toLocaleString("en-US")} modelled capacity; partner commitments set a minimum exposure.`,
        "blast",
        "PRIYA-NEUTRAL",
      );
      arrive(s, "lock");
      break;
    }
    case "LOCK": {
      at("lock");
      ensure(
        ["guarded", "no", "defer"].includes(action.position),
        "Choose a bounded board proposal.",
      );
      ensure(
        s.inspected.includes(action.evidence) || action.uninformed === true,
        "Cite collected evidence, or explicitly hand off without it.",
      );
      ensure(
        action.position !== "guarded" || projection(s).load > 0,
        "Select at least one cohort before proposing a live release.",
      );
      spend(s, 10);
      s.lockedEvidence = action.evidence;
      s.plan = action.position;
      if (action.uninformed) {
        s.CR -= 10;
        s.CT -= 8;
        s.plan = "ship";
      } else {
        s.CR += 4;
      }
      if (s.deals.includes("risk") || s.deals.includes("marlo"))
        s.plan = "guarded";
      receipt(
        s,
        action.uninformed
          ? "Handed the launch decision to Kian without evidence."
          : `Board proposal: ${s.plan}; ${byId(content.evidence, action.evidence).title}.`,
        s.deals.some((id) => ["risk", "marlo"].includes(id))
          ? "Your live-production commitment still applies; it cannot be erased by a later slide."
          : "The board will see this proposal and the evidence you cited.",
        "credibility",
        action.uninformed ? "CALL-CAVE" : "BOARD-OPEN",
      );
      s.TM = 0;
      arrive(s, "board");
      break;
    }
    case "DEMO": {
      at("board");
      const p = projection(s);
      const live = s.plan === "ship" || s.plan === "guarded";
      let line = "DEMO-DEFER";
      if (live) {
        if (s.SG > 8) {
          s.demo = "unready";
          s.plan = "defer";
          line = "DEMO-UNREADY";
          s.CT -= 5;
          s.CR -= 4;
        } else if (s.deals.includes("marlo") && s.SG < 6) {
          s.demo = "marlo";
          line = "DEMO-MARLO";
        } else if (p.paymentRisk && !s.killSwitch) {
          s.demo = "payments";
          line = "DEMO-PAYMENT";
        } else if (p.load > p.cap * 1.1 && !s.killSwitch) {
          s.demo = "crash";
          line = "DEMO-CRASH";
        } else if ((p.load > p.cap * 0.9 || p.paymentRisk) && s.killSwitch) {
          s.demo = "degraded";
          line = "DEMO-DEGRADED";
        } else {
          s.demo = "stable";
          line = "DEMO-STABLE";
        }
      } else if (s.alternative === "data") {
        s.demo = "data";
        line = "DEMO-DATA";
        s.golden =
          s.eligibleGolden &&
          s.inspected.includes("dashboard") &&
          s.SG >= 4 &&
          s.SG <= 8;
      } else if (s.alternative === "sandbox" || s.alternative === "beta") {
        s.demo = "sandbox";
        line = "DEMO-SANDBOX";
      } else s.demo = "deferred";
      if (["crash", "payments", "marlo"].includes(s.demo!)) {
        s.effect = "fracture";
        s.CR -= 10;
        s.CT -= 8;
        s.ST -= s.demo === "marlo" ? 12 : 6;
      } else if (s.golden) {
        s.effect = "gold";
        s.CR += 10;
        s.CT += 5;
      } else {
        s.CR += 4;
      }
      const source = s.receipts.findLast((r) => r.scene === "lock");
      receipt(
        s,
        s.demo === "unready"
          ? "The production demonstration was postponed before launch."
          : live
            ? `Demonstrated ${p.load} forecast viewers against ${p.cap} modelled capacity.`
            : `Presented ${s.alternative === "none" ? "a deferral" : byId(content.alternatives, s.alternative).label}.`,
        s.demo === "unready"
          ? "Fewer than two engineer-hours remained for Live Drops. The demonstration was postponed."
          : s.demo === "marlo"
            ? "The Marlo deal promised live access with fewer than six safeguard hours."
            : s.demo === "payments"
              ? "Forecast payment attempts exceeded the provider limit without containment."
              : s.demo === "crash"
                ? "Forecast load exceeded capacity without a kill switch."
                : s.demo === "degraded"
                  ? "The kill switch contained the load or payment limit breach."
                  : s.golden
                    ? "You offered a testable checkout alternative; the uplift remains a forecast."
                    : s.demo === "stable"
                      ? "The chosen exposure stayed within this model’s release boundary."
                      : "No public production launch was demonstrated.",
        s.golden ? "alternative" : "blast",
        line,
        source?.id,
      );
      arrive(s, "final");
      break;
    }
    case "FINAL": {
      at("final");
      ensure(
        ["own", "defend", "rollback", "week"].includes(action.move),
        "Choose a final response.",
      );
      ensure(
        action.move !== "week" || s.CR >= 70,
        "The additional week requires established credibility.",
      );
      s.finalMove = action.move;
      s.CR +=
        action.move === "own"
          ? 6
          : action.move === "rollback"
            ? 8
            : action.move === "week"
              ? 4
              : -2;
      s.ET += action.move === "rollback" ? 4 : 0;
      s.CT += action.move === "own" ? 2 : action.move === "defend" ? -3 : 0;
      cap(s);
      s.outcome = ["crash", "payments", "marlo"].includes(s.demo || "")
        ? "Crash"
        : s.CT < 35 && s.plan !== "guarded"
          ? s.strong
            ? "Standoff"
            : "Overruled"
          : s.CR >= 60 && s.CT >= 45
            ? "Backed"
            : "Tolerated";
      s.archetype = s.caved
        ? "The Echo"
        : s.golden
          ? "The Alchemist"
          : s.deals.length >= 2
            ? "The Dealmaker"
            : s.plan === "no" && s.strong && s.CT < 55
              ? "The Firewall"
              : "The Diplomat";
      receipt(
        s,
        {
          own: "Acknowledge the result and own the next checkpoint.",
          defend: "Defend the decision and state what would reverse it.",
          rollback:
            "Propose rollback with Priya as owner and an explicit trigger.",
          week: "Ask the board for one week to validate the release.",
        }[action.move],
        `The board ${s.outcome === "Backed" ? "supports the bounded plan" : s.outcome === "Crash" ? "requires containment and recovery" : s.outcome === "Overruled" ? "overrules the delay" : s.outcome === "Standoff" ? "accepts the evidence but the relationship is damaged" : "allows the plan with lower trust"}.`,
        "credibility",
        s.outcome === "Overruled"
          ? "OVERRULE"
          : `VERDICT-${s.outcome === "Standoff" ? "STANDOFF" : s.outcome.toUpperCase()}`,
      );
      arrive(s, "debrief");
      break;
    }
    case "NEXT": {
      if (s.scene === "evidence") arrive(s, "resources");
      else if (s.scene === "rehearsal") arrive(s, "call");
      else if (s.scene === "deals") {
        if (!s.deals.length) s.lastLine = "DEAL-NONE";
        arrive(s, "rollout");
      } else throw Error("Finish the current decision before continuing.");
      break;
    }
    default:
      throw Error("Unknown decision type.");
  }
  return cap(s);
}
export function replay(events: Event[]) {
  ensure(events.length <= 1000, "Run log is too large.");
  return events.reduce((s, e) => reduce(s, e.action), initial());
}
export function conclusion(s: State) {
  if (s.demo === "unready")
    return "You protected the system, but left too little time for the live feature.";
  return s.outcome === "Crash"
    ? "The live promise exceeded its release boundary. The board asked for recovery."
    : s.outcome === "Overruled"
      ? "Your delay lacked support. Kian chose to launch after the meeting."
      : s.outcome === "Standoff"
        ? "Your evidence held up, but the relationship did not."
        : s.golden
          ? "You refused a public launch and offered a testable checkout alternative."
          : s.outcome === "Backed"
            ? "The board backed a bounded plan you could explain."
            : "The plan stands, with commitments and trust still to repair.";
}
export function lintContent() {
  const flags = new Set([
    "strong",
    "caved",
    "backchannel",
    "queue",
    "killSwitch",
    "golden",
    "eligibleGolden",
    "shortMorning",
  ]);
  const ids = new Set<string>();
  for (const l of content.lines) {
    ensure(!ids.has(l.id), `Duplicate line ${l.id}`);
    ids.add(l.id);
    ensure(l.text.split(/\s+/).length <= 14, `Line too long: ${l.id}`);
    for (const f of l.requires) ensure(flags.has(f), `Unknown flag ${f}`);
  }
  for (const e of content.evidence)
    ensure(ids.has(e.line), `Missing evidence dialogue ${e.line}`);
  for (const [scene, conversation] of Object.entries(content.conversations)) {
    ensure(scene in content.beats, `Unknown conversation scene ${scene}`);
    ensure(
      conversation.lines.length > 0 && conversation.lines.length <= 3,
      `Conversation budget exceeded for ${scene}`,
    );
    for (const id of conversation.lines)
      ensure(ids.has(id), `Missing guide recording ${id}`);
    ensure(conversation.task.length > 0, `Missing task guidance for ${scene}`);
  }
  return true;
}
