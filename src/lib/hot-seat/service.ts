import "server-only";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { AILedger, digest, type RequestRow } from "../interview-ai/ledger";
import { aiConfig, availability, type AIConfig } from "../interview-ai/config";
import { AIError } from "../interview-ai/provider";
import {
  createSeat,
  optionsSchema,
  privacyIssue,
  withCurveball,
  type SeatSession,
} from "./model";
import { HOT_SEAT_VERSION } from "./content";
import { generateSeatTurn, validateSeatOutput } from "./provider";
const id = z.string().regex(/^[a-zA-Z0-9_-]{8,150}$/);
export const requestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("start"),
      id,
      localOwnerId: id,
      options: optionsSchema,
      consent: z
        .object({
          adult: z.literal(true),
          fictional: z.literal(true),
          provider: z.literal(true),
          region: z.string().length(2),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal("turn"),
      id,
      requestId: id,
      turnId: id,
      expected: z.number().int().min(0),
      text: z.string().trim().min(1).max(4000),
      source: z.enum(["typed", "voice"]),
      seconds: z.number().min(0).max(1800),
      elapsedMs: z.number().min(0).max(7200000),
      fictional: z.literal(true),
    })
    .strict(),
  z.object({ action: z.enum(["status", "release", "delete"]), id }).strict(),
]);
export type SeatRequest = z.infer<typeof requestSchema>;
export async function handleSeat(
  input: SeatRequest,
  owner: string,
  ledger = new AILedger(),
  c: AIConfig = aiConfig(),
  quotaOwner?: string,
  generate:typeof generateSeatTurn=generateSeatTurn,
) {
  if (input.action === "start") {
    if (availability(c)) throw new AIError("ai-not-configured", 503);
    if (!c.regions.includes(input.consent.region))
      throw new AIError("region-not-approved", 403);
    const existing = ledger.db
      .prepare("SELECT 1 FROM ai_hotseat WHERE run_id=?")
      .get(input.id);
    if (
      ledger.db
        .prepare("SELECT 1 FROM ai_sessions WHERE run_id=?")
        .get(input.id) &&
      !existing
    )
      throw new AIError("wrong-session-type", 409);
    if (input.options.persona === "ellis") throw new AIError("persona-retired",400);
    const session = createSeat(
      input.localOwnerId,
      input.options,
      input.id,
      randomInt(0, 600),
      c.maxTurns,
      c.mock ? "mock" : "gemini",
    );
    const row = ledger.start(
      session,
      owner,
      c,
      "assessment",
      quotaOwner,
      input.consent.region,
    );
    ledger.db
      .prepare("INSERT OR IGNORE INTO ai_hotseat VALUES(?,?)")
      .run(input.id, HOT_SEAT_VERSION);
    return {
      session: {
        ...ledger.read<SeatSession>(row.state),
        revision: row.revision,
      },
    };
  }
  if (
    !ledger.db
      .prepare("SELECT 1 FROM ai_hotseat WHERE run_id=? AND prompt=?")
      .get(input.id, HOT_SEAT_VERSION)
  )
    throw new AIError("session-not-found", 404);
  if (input.action === "delete") {
    if (!ledger.db.prepare("SELECT 1 FROM ai_sessions WHERE run_id=? AND owner=?").get(input.id, owner)) throw new AIError("session-not-owned",404);
    ledger.erase(input.id);
    return {deleted:true};
  }
  let row = ledger.row(input.id, owner);
  const original = ledger.read<SeatSession>(row.state);
  if (input.action === "release") {
    if (row.lease_until > Date.now())
      throw new AIError("turn-in-flight", 409, 2);
    ledger.db
      .prepare("UPDATE ai_sessions SET active_until=0 WHERE run_id=?")
      .run(input.id);
    return { released: true };
  }
  if (input.action === "status")
    return {
      session: { ...original, revision: row.revision },
      pending: row.lease_until > Date.now(),
    };
  if(input.action!=="turn")throw new AIError("invalid-action",400);
  if (availability(c)) throw new AIError("ai-not-configured", 503);
  ledger.assertPolicy(row, c);
  if (
    original.promptVersion !== HOT_SEAT_VERSION ||
    original.status === "complete"
  )
    throw new AIError("conversation-complete", 409);
  const issue = privacyIssue(input.text);
  if (c.mode === "free-pilot" && issue)
    throw new AIError("fictional-answer-required", 400);
  const prior = ledger.db
    .prepare("SELECT * FROM ai_requests WHERE id=?")
    .get(input.requestId) as RequestRow | undefined;
  const hash = digest(
    JSON.stringify({
      id: input.id,
      turn: input.turnId,
      text: input.text,
      source: input.source,
      seconds: input.seconds,
      expected: input.expected,
    }),
  );
  if (prior?.status === "complete") {
    if (prior.run_id !== input.id || prior.hash !== hash)
      throw new AIError("idempotency-conflict", 409);
    return ledger.read<Record<string, unknown>>(prior.result!);
  }
  let state: SeatSession = {
    ...original,
    elapsedMs: Math.max(original.elapsedMs, input.elapsedMs),
    draft: "",
    turns: original.turns.some((t) => t.id === input.turnId)
      ? original.turns
      : [
          ...original.turns,
          {
            id: input.turnId,
            who: "user",
            text: input.text,
            source: input.source,
            seconds: input.seconds,
            at: Date.now(),
          },
        ],
  };
  state = withCurveball(state);
  const reserved = ledger.reserve(
    row,
    {
      requestId: input.requestId,
      turnId: input.turnId,
      hash,
      expected: input.expected,
      candidate: input.text,
      state,
      tokens:
        Math.ceil(JSON.stringify(state.turns.slice(-8)).length / 3) + 3000,
    },
    c,
  );
  if (reserved.cached) return reserved.cached;
  let usage = {
    inputTokens: 0,
    outputTokens: 0,
    thoughtTokens: 0,
    latencyMs: 0,
  };
  try {
    const generated = await generate(state, c);
    usage = generated;
    const output = validateSeatOutput(generated.raw, state);
    const next: SeatSession = {
      ...state,
      revision: row.revision + 1,
      status: output.done ? "complete" : "active",
      updatedAt: new Date().toISOString(),
      observations: [...state.observations, ...output.observations].slice(-80),
      turns: [
        ...state.turns,
        {
          id: "reply-" + input.requestId,
          who: "ai",
          source: generated.source,
          text: output.speech,
          intent: output.intent,
          at: Date.now(),
        },
      ],
    };
    const result = {
      session: next,
      message: output.speech,
      latencyMs: generated.latencyMs,
    };
    ledger.finish(
      input.id,
      owner,
      input.requestId,
      reserved.attemptId,
      result,
      usage,
      undefined,
      next,
    );
    if (output.done)
      ledger.db
        .prepare("UPDATE ai_sessions SET active_until=0 WHERE run_id=?")
        .run(input.id);
    return result;
  } catch (error) {
    const failure =
      error instanceof AIError
        ? error
        : new AIError("invalid-provider-response", 502, 15);
    ledger.finish(
      input.id,
      owner,
      input.requestId,
      reserved.attemptId,
      {},
      usage,
      failure,
    );
    throw failure;
  }
}
