import "server-only";
import { randomBytes } from "node:crypto";
import { AILedger, digest } from "../interview-ai/ledger";
import { memberSession, clientKey } from "../product/server";
import { AIError } from "../interview-ai/provider";
export async function seatAccess(
  request: Request,
  ledger: AILedger,
  create = false,
  runId?: string,
) {
  const member = await memberSession(request),
    token = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)pmforge_hotseat_guest=([a-f0-9]{64})(?:;|$)/)?.[1];
  const guest = token
    ? (ledger.db
        .prepare("SELECT owner FROM ai_guests WHERE token_hash=? AND expires>?")
        .get(digest(token), Date.now()) as { owner: string } | undefined)
    : undefined;
  if (guest && runId && ledger.db.prepare("SELECT 1 FROM ai_sessions WHERE run_id=? AND owner=?").get(runId, guest.owner)) return {owner:guest.owner,cookie:undefined,quotaOwner:digest(ledger.control("encryption") + ":ip:" + clientKey(request))};
  if (member)
    return {
      owner: "member:" + member.user.id,
      cookie: undefined,
      quotaOwner: undefined,
    };
  if (guest)
    return {
      owner: guest.owner,
      cookie: undefined,
      quotaOwner: digest(
        ledger.control("encryption") + ":ip:" + clientKey(request),
      ),
    };
  if (!create) throw new AIError("guest-session-required", 401);
  const credential = randomBytes(32).toString("hex"),
    owner = "guest:" + crypto.randomUUID();
  ledger.db
    .prepare("INSERT INTO ai_guests VALUES(?,?,?)")
    .run(digest(credential), owner, Date.now() + 86400000);
  return {
    owner,
    quotaOwner: digest(
      ledger.control("encryption") + ":ip:" + clientKey(request),
    ),
    cookie: `pmforge_hotseat_guest=${credential}; Path=/api/hot-seat; HttpOnly; SameSite=Strict; Max-Age=86400${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
  };
}
export function seatRequestLimit(request: Request, ledger: AILedger) {
  ledger.db.exec(
    "CREATE TABLE IF NOT EXISTS ai_api_limits (key TEXT PRIMARY KEY,at INTEGER NOT NULL,count INTEGER NOT NULL)",
  );
  ledger.transaction(() => {
    ledger.db
      .prepare("DELETE FROM ai_api_limits WHERE at<?")
      .run(Date.now() - 60000);
    for (const [key, max] of [
      [digest(ledger.control("encryption") + clientKey(request)), 120],
      ["global", 1200],
    ] as const) {
      ledger.db
        .prepare(
          "INSERT INTO ai_api_limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1",
        )
        .run(key, Date.now());
      const row = ledger.db
        .prepare("SELECT count FROM ai_api_limits WHERE key=?")
        .get(key) as { count: number };
      if (row.count > max) throw new AIError("request-limit", 429, 60);
    }
  });
}
export const isLoopback = (r: Request) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(r.url).hostname);
