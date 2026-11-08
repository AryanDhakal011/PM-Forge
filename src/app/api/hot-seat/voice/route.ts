import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { AILedger, digest } from "@/lib/interview-ai/ledger";
import { aiConfig, availability } from "@/lib/interview-ai/config";
import { AIError } from "@/lib/interview-ai/provider";
import {
  seatAccess,
  seatRequestLimit,
  isLoopback,
} from "@/lib/hot-seat/access";
import type { SeatSession } from "@/lib/hot-seat/model";
import { seatSpeechEnabled } from "@/lib/hot-seat/speech-config";
import { persona } from "@/lib/hot-seat/content";
import { limitedBody } from "@/lib/portfolio/request";
import { validOrigin } from "@/lib/product/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const c = aiConfig();
    if (!validOrigin(request)) throw new AIError("origin-rejected", 403);
    if (c.localTest && !isLoopback(request))
      throw new AIError("local-test-only", 403);
    if (!seatSpeechEnabled(c)) throw new AIError("speech-not-enabled", 503);
    const rpm = Number(process.env.PMFORGE_HOTSEAT_TTS_RPM) || 0,
      rpd = Number(process.env.PMFORGE_HOTSEAT_TTS_RPD) || 0;
    if (rpm < 1 || rpd < 1)
      throw new AIError("speech-capacity-not-reviewed", 503);
    const body = z
        .object({ id: z.string().max(150), turnId: z.string().max(150) })
        .strict()
        .parse(
          JSON.parse(
            new TextDecoder().decode(await limitedBody(request, 1000)),
          ),
        ),
      ledger = new AILedger();
    seatRequestLimit(request, ledger);
    const { owner } = await seatAccess(request, ledger, false, body.id);
    ledger.admit(c);
    const row = ledger.row(body.id, owner);
    if (
      !ledger.db.prepare("SELECT 1 FROM ai_hotseat WHERE run_id=?").get(body.id)
    )
      throw new AIError("wrong-session-type", 404);
    const state = ledger.read<SeatSession>(row.state),
      turn = body.turnId === "debrief-intro" && state.status === "complete" ? {text: "The conversation is complete. Let’s look at the reasoning you documented. This review is provisional, not a hiring verdict."} : state.turns.find((t) => t.id === body.turnId && t.who === "ai");
    if (!turn) throw new AIError("speech-line-not-owned", 404);
    ledger.db.exec(
      "CREATE TABLE IF NOT EXISTS ai_seat_speech (key TEXT PRIMARY KEY,run_id TEXT NOT NULL,at INTEGER NOT NULL,day TEXT NOT NULL,status TEXT NOT NULL,audio BLOB)",
    );
    const key = digest(body.id + turn.text + state.options.persona),
      cached = ledger.db
        .prepare(
          "SELECT audio FROM ai_seat_speech WHERE key=? AND status='complete'",
        )
        .get(key) as { audio: string } | undefined;
    if (cached)
      return new Response(new Uint8Array(Buffer.from(ledger.read<string>(cached.audio), "base64")), {
        headers: { ...headers, "Content-Type": "audio/wav" },
      });
    ledger.transaction(() => {
      ledger.db
        .prepare("DELETE FROM ai_seat_speech WHERE at<?")
        .run(Date.now() - 86400000);
      const minute = ledger.db
          .prepare("SELECT COUNT(*) n FROM ai_seat_speech WHERE at>?")
          .get(Date.now() - 60000) as { n: number },
        day = ledger.db
          .prepare("SELECT COUNT(*) n FROM ai_seat_speech WHERE day=?")
          .get(ledger.day()) as { n: number };
      if (
        minute.n >= Math.max(1, Math.floor(rpm * 0.7)) ||
        day.n >= Math.max(1, Math.floor(rpd * 0.7))
      )
        throw new AIError("speech-quota", 429, 60);
      if (
        ledger.db.prepare("SELECT 1 FROM ai_seat_speech WHERE key=?").get(key)
      )
        throw new AIError("speech-already-requested", 409, 30);
      ledger.db
        .prepare("INSERT INTO ai_seat_speech VALUES(?,?,?,?,?,NULL)")
        .run(key, body.id, Date.now(), ledger.day(), "pending");
    });
    try {
      const model =
        process.env.PMFORGE_HOTSEAT_TTS_MODEL || "gemini-3.8-flash-lite-tts";
      if (
        !["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"].includes(model)
      )
        throw new AIError("speech-model-not-reviewed", 503);
      const result = await new GoogleGenAI({
        apiKey: c.key,
      }).interactions.create(
        {
          model,
          store: false,
          input: [
            {
              type: "user_input",
              content: [
                {
                  type: "text",
                  text: turn.text,
                  annotations: [
                    {
                      type: "speech_metadata",
                      style:
                        "Natural, warm, clear female voice. Conversational, measured pace.",
                    },
                  ],
                },
              ],
            },
          ],
          response_format: { type: "audio" },
          generation_config: {
            speech_config: [
              { voice: persona(state.options.persona).geminiVoice },
            ],
          },
        },
        { timeout_ms: 20000, retries: { strategy: "none" } },
      );
      const data = result.output_audio?.data;
      if (!data) throw Error();
      const audio = Buffer.from(data, "base64");
      if (audio.length > 4000000 || audio.subarray(0, 4).toString() !== "RIFF")
        throw Error();
      ledger.db
        .prepare(
          "UPDATE ai_seat_speech SET status='complete',audio=? WHERE key=?",
        )
        .run(ledger.seal(audio.toString("base64")), key);
      return new Response(audio, {
        headers: { ...headers, "Content-Type": "audio/wav" },
      });
    } catch {
      ledger.db
        .prepare("UPDATE ai_seat_speech SET status='failed' WHERE key=?")
        .run(key);
      throw new AIError("speech-provider-unavailable", 503, 30);
    }
  } catch (error) {
    const e =
      error instanceof AIError
        ? error
        : new AIError("invalid-speech-request", 400);
    return Response.json(
      { error: e.code, retryAfter: e.retryAfter },
      {
        status: e.status,
        headers: {
          ...headers,
          ...(e.retryAfter ? { "Retry-After": String(e.retryAfter) } : {}),
        },
      },
    );
  }
}
