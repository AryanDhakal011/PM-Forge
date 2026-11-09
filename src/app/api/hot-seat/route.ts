import {seatSpeechEnabled} from "@/lib/hot-seat/speech-config";
import { aiConfig, availability } from "@/lib/interview-ai/config";
import { AILedger } from "@/lib/interview-ai/ledger";
import { AIError } from "@/lib/interview-ai/provider";
import { validOrigin,memberSession } from "@/lib/product/server";
import { limitedBody } from "@/lib/portfolio/request";
import { handleSeat, requestSchema } from "@/lib/hot-seat/service";
import {
  seatAccess,
  seatRequestLimit,
  isLoopback,
} from "@/lib/hot-seat/access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  const c = aiConfig(),
    ledger = new AILedger(),
    reason =
      (c.localTest && !isLoopback(request)
        ? "This pilot is local to this computer."
        : null) ||
      availability(c) ||
      (ledger.control("kill") === "true"
        ? "The operator paused AI generation."
        : null);
  return Response.json(
    {
      available: !reason,
      reason,
      mode: c.mode,
      model: c.model,
      mock: c.mock,
      maxTurns: c.maxTurns,
      regions: c.regions,
      geminiSpeech:seatSpeechEnabled(c),
    localPilot: c.localTest,
      dataUse:
        "Committed fictional answers and permitted world facts go to Google. Unpaid-service inputs and outputs may be reviewed and used to improve Google products. Private drafts stay local until Send. Dictation and Kokoro speech run on this device after model downloads from Hugging Face.",
    },
    { headers },
  );
}
export async function POST(request: Request) {
  let cookie: string | undefined;
  try {
    const c = aiConfig();
    if (c.localTest && !isLoopback(request))
      throw new AIError("local-test-only", 403);
    if (!validOrigin(request)) throw new AIError("origin-rejected", 403);
    const bytes = await limitedBody(request, 22000),
      input = requestSchema.parse(JSON.parse(new TextDecoder().decode(bytes))),
      ledger = new AILedger();
    seatRequestLimit(request, ledger);
    if(c.mode==='production'&&['start','turn','retry'].includes(input.action)){
      const member=await memberSession(request);
      if(!member?.user.emailVerified)throw new AIError('verified-account-required',401);
    }
    const identity = await seatAccess(
      request,
      ledger,
      input.action === "start",
      input.action === "start" ? undefined : input.id,
    );
    cookie = identity.cookie;
    const result = await handleSeat(
      input,
      identity.owner,
      ledger,
      c,
      identity.quotaOwner,
    );
    return Response.json(result, {
      headers: { ...headers, ...(cookie ? { "Set-Cookie": cookie } : {}) },
    });
  } catch (error) {
    const failure =
      error instanceof AIError ? error : new AIError("invalid-request", 400);
    return Response.json(
      { error: failure.code, retryAfter: failure.retryAfter },
      {
        status: failure.status,
        headers: {
          ...headers,
          ...(cookie ? { "Set-Cookie": cookie } : {}),
          ...(failure.retryAfter
            ? { "Retry-After": String(failure.retryAfter) }
            : {}),
        },
      },
    );
  }
}
