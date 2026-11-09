import { z } from "zod";
import {
  company,
  persona,
  HOT_SEAT_VERSION,
  curveballs,
  type CompanyId,
  type PersonaId,
} from "./content";
export const dimensions = [
  "structure",
  "assumptions",
  "metrics",
  "tradeoffs",
  "clarity",
] as const;
export const optionsSchema = z
  .object({
    company: z.enum([
      "saas",
      "fintech",
      "marketplace",
      "health",
      "devtools",
      "ai",
      "commerce",
      "public",
    ]),
    persona: z.enum(["nora", "kai", "ellis"]),
    minutes: z.union([z.literal(10), z.literal(20), z.literal(30)]),
    pressure: z.enum(["friendly", "direct", "tough"]),
  })
  .strict();
export type Options = z.infer<typeof optionsSchema>;
export const observationSchema = z
  .object({
    dimension: z.enum(dimensions),
    polarity: z.enum(["positive", "negative", "neutral"]),
    turnId: z.string().max(150),
    quote: z.string().min(1).max(180),
    note: z.string().max(160),
  })
  .strict();
export const outputSchema = z
  .object({
    speech: z.string().min(10).max(600),
    style: z.enum(["curious", "neutral", "warm", "challenging", "playful"]),
    intent: z.enum([
      "open",
      "probe",
      "cross",
      "clarify",
      "curveball",
      "tradeoff",
      "evidence",
      "summarize",
      "reflect",
      "move_on",
      "close",
    ]),
    referencedFactIds: z.array(z.string().max(60)).max(6),
    referencedTurnIds: z.array(z.string().max(150)).max(4),
    observations: z.array(observationSchema).max(3),
    done: z.boolean(),
  })
  .strict();
export type Output = z.infer<typeof outputSchema>;
export type Turn = {
  id: string;
  who: "ai" | "user";
  text: string;
  at: number;
  source: "authored" | "gemini" | "guided" | "mock" | "typed" | "voice" | "realtime";
  intent?: Output["intent"];
  interrupted?: boolean;
  spokenChars?: number;
  seconds?: number;
};
export type Pending = {
  requestId: string;
  turnId: string;
  expected: number;
  text: string;
  source: "typed" | "voice";
  seconds: number;
  fictional: boolean;
};
export type SeatSession = {
  version: 1;
  promptVersion: string;
  id: string;
  ownerId: string;
  options: Options;
  variant: number;
  mode: "gemini" | "guided" | "mock" | "realtime";
  status: "active" | "paused" | "complete";
  revision: number;
  maxTurns: number;
  elapsedMs: number;
  createdAt: string;
  updatedAt: string;
  turns: Turn[];
  observations: z.infer<typeof observationSchema>[];
  draft: string;
  pending?: Pending;
  curveball?: string;
  serverLinked?: boolean;
  trailSaved?: boolean;
  debriefRead?: boolean;
  realtime?: {version:1; consentVersion:string; promptVersion?:string; stack?:{stt:string;llm:string;tts:string;voice:string;region:string}};
};
export function createSeat(
  ownerId: string,
  options: Options,
  id = crypto.randomUUID(),
  variant = 0,
  maxTurns = 8,
  mode: SeatSession["mode"] = "guided",
): SeatSession {
  const c = company(options.company),
    p = persona(options.persona),
    now = new Date().toISOString();
  return {
    version: 1,
    promptVersion: HOT_SEAT_VERSION,
    id,
    ownerId,
    options,
    variant,
    mode,
    serverLinked: mode !== "guided",
    status: "active",
    revision: 0,
    maxTurns,
    elapsedMs: 0,
    createdAt: now,
    updatedAt: now,
    turns: [
      {
        id: "opening",
        who: "ai",
        source: "authored",
        intent: "open",
        at: Date.now(),
        text: `I'm ${p.name}. You're joining ${c.name}, our fictional ${c.stage.toLowerCase()} company. ${c.situation} ${c.openers[variant % c.openers.length]}`,
      },
    ],
    observations: [],
    draft: "",
  };
}
export function permittedFacts(s: SeatSession) {
  const c = company(s.options.company);
  return [
    { id: "world", text: `${c.name}. ${c.stage}. ${c.situation}` },
    { id: "goal", text: `The working metric is ${c.metric}.` },
    { id: "constraint", text: c.constraint },
    { id: "people", text: c.stakeholders.join(", ") },
    ...(s.curveball ? [{ id: "curveball", text: s.curveball }] : []),
  ];
}
export function withCurveball(s: SeatSession) {
  const users = s.turns.filter((t) => t.who === "user").length;
  return !s.curveball && users >= Math.max(3, Math.ceil(s.maxTurns * 0.6))
    ? { ...s, curveball: curveballs[s.variant % curveballs.length] }
    : s;
}
export function privacyIssue(text: string) {
  if (
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:sk-|AIza|AQ\.)[A-Za-z0-9_-]{12,}|-----BEGIN|(?:password|api[_ -]?key|access[_ -]?token)\s*[:=]|(?:\+\d[\d ()-]{8,}\d)|\b\d{13,19}\b/i.test(
      text,
    )
  )
    return "This may contain contact details or a secret. Remove them before sending.";
  if (
    /\b(my|our)\s+(employer|patient|client|customer)\b|\b(real name|my medical|my diagnosis|my salary)\b/i.test(
      text,
    )
  )
    return "Use only the fictional company. Personal or employer-private material belongs in local guided practice.";
  return null;
}
export function phase(s: SeatSession) {
  const n = s.turns.filter((t) => t.who === "user").length;
  return n >= s.maxTurns
    ? "close"
    : n >= s.maxTurns - 1
      ? "reflect"
      : s.curveball
        ? "tradeoff"
        : "probe";
}
export function guidedOutput(s: SeatSession): Output {
  const last = s.turns.filter((t) => t.who === "user").at(-1);
  const n = s.turns.filter((t) => t.who === "user").length;
  const close = phase(s) === "close",
    quoted = last?.text.split(/\s+/).slice(0, 8).join(" ") || "";
  let speech = close
    ? "We will stop here and review the reasoning you documented. This is provisional practice feedback, not a hiring verdict."
    : phase(s) === "reflect"
      ? "What would you do differently after hearing the challenge?"
      : s.curveball && n === Math.max(3, Math.ceil(s.maxTurns * 0.6))
        ? `${s.curveball} How does that change your next move?`
        : /metric|measure|rate/i.test(last?.text || "")
          ? "How would you define that measure, and what would keep you from optimizing the wrong thing?"
          : /test|pilot|experiment/i.test(last?.text || "")
            ? "What would make that test change your decision?"
            : /stakeholder|team|sales/i.test(last?.text || "")
              ? "How would you explain the opportunity cost to the stakeholder who disagrees?"
              : `You mentioned “${quoted}”. ${["Which uncertainty would you resolve first?", "What evidence would change your position?", "Which alternative would you compare it with?", "What would you deliberately leave out?"][n % 4]}`;
  return {
    speech,
    style: "curious",
    intent: close ? "close" : s.curveball ? "tradeoff" : "probe",
    referencedFactIds: s.curveball ? ["curveball"] : ["world"],
    referencedTurnIds: last ? [last.id] : [],
    observations: [],
    done: close,
  };
}
export function debrief(s: SeatSession) {
  const users = s.turns.filter((t) => t.who === "user");
  return {
    bands: dimensions.map((d) => {
      const obs = s.observations.filter(
          (o) =>
            o.dimension === d &&
            users.some((t) => t.id === o.turnId && t.text.includes(o.quote)),
        ),
        positive = obs.filter((o) => o.polarity === "positive").length,
        negative = obs.filter((o) => o.polarity === "negative").length;
      const center = Math.max(
        20,
        Math.min(80, 50 + positive * 8 - negative * 8),
      );
      return {
        dimension: d,
        assessed: obs.length > 0,
        low: Math.max(0, center - 15),
        high: Math.min(100, center + 15),
        count: obs.length,
      };
    }),
    moments: s.observations
      .filter((o) =>
        users.some((t) => t.id === o.turnId && t.text.includes(o.quote)),
      )
      .slice(-3),
    words: users.reduce(
      (n, t) => n + t.text.trim().split(/\s+/).filter(Boolean).length,
      0,
    ),
    voiceSeconds: users
      .filter((t) => t.source === "voice")
      .reduce((n, t) => n + (t.seconds || 0), 0),
    fillers: users.reduce(
      (n, t) =>
        n +
        (
          t.text.match(/\b(um|uh|basically|actually)\b|you know|kind of/gi) ||
          []
        ).length,
      0,
    ),
    longest: Math.max(0, ...users.map((t) => t.seconds || 0)),
    interruptions: s.turns.filter((t) => t.interrupted).length,
  };
}
export function sessionExport(s: SeatSession) {
  return JSON.stringify({ ...s, pending: undefined }, null, 2);
}
export type { CompanyId, PersonaId };

export function mergeSeat(remote: SeatSession, local: SeatSession): SeatSession { return {
      ...remote,
      debriefRead: local.debriefRead,
      trailSaved: local.trailSaved,
      serverLinked: local.serverLinked || remote.serverLinked,
      status:
        local.status === "complete" ? "complete" : local.status === "paused" && remote.status !== "complete"
          ? "paused"
          : remote.status,
      draft: local.draft,
      elapsedMs: Math.max(remote.elapsedMs, local.elapsedMs),
      turns: remote.turns.map((t) => {
        const existing = local.turns.find((x) => x.id === t.id);
        return {
          ...t,
          ...(existing?.interrupted
            ? { interrupted: true, spokenChars: existing.spokenChars }
            : {}),
        };
      }),
      pending: undefined,
    }; }
