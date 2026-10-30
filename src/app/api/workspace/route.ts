import { z } from "zod";
import { exportSchema } from "@/lib/product/schema";
import {
  memberSession,
  rateLimited,
  serverDatabase,
  validOrigin,
} from "@/lib/product/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await memberSession(request);
  if (!session)
    return Response.json({ error: "Sign in to sync." }, { status: 401 });
  if (rateLimited(session.user.id))
    return Response.json(
      { error: "Please retry shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const row = serverDatabase()
    .prepare("SELECT version,data FROM workspace WHERE user_id = ?")
    .get(session.user.id) as { version: number; data: string } | undefined;
  return Response.json(
    { version: row?.version || 0, data: row ? JSON.parse(row.data) : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PUT(request: Request) {
  if (!validOrigin(request))
    return Response.json({ error: "Origin rejected." }, { status: 403 });
  const session = await memberSession(request);
  if (!session)
    return Response.json({ error: "Sign in to sync." }, { status: 401 });
  if (rateLimited(session.user.id))
    return Response.json(
      { error: "Please retry shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 1024 * 1024)
    return Response.json(
      {
        error:
          "Export this workspace to keep a local backup; the sync payload is too large.",
      },
      { status: 413 },
    );
  let body;
  try {
    body = z
      .object({ data: exportSchema, version: z.number().int().nonnegative() })
      .strict()
      .parse(JSON.parse(text));
  } catch {
    return Response.json({ error: "Invalid workspace data." }, { status: 400 });
  }
  const data = body.data;
  if (
    data.profile.id !== session.user.id ||
    [
      ...data.runs,
      ...data.records,
      ...data.bookmarks,
      ...(data.projectRuns || []),
    ].some((item) => item.ownerId !== session.user.id)
  )
    return Response.json({ error: "Ownership mismatch." }, { status: 403 });
  data.projectRuns = data.projectRuns?.map((run) =>
    run.includeNotes
      ? run
      : {
          ...run,
          draft: { ...run.draft, rationale: "" },
          decisions: run.decisions.map((d) => ({ ...d, rationale: "" })),
        },
  );
  const sql = serverDatabase();
  const row = sql
    .prepare("SELECT version FROM workspace WHERE user_id = ?")
    .get(session.user.id) as { version: number } | undefined;
  if ((row?.version || 0) !== body.version)
    return Response.json(
      {
        error:
          "Your account changed in another tab. Retry sync to merge the latest version.",
      },
      { status: 409 },
    );
  const version = body.version + 1;
  const result = row
    ? sql
        .prepare(
          "UPDATE workspace SET version = ?, data = ?, updated_at = ? WHERE user_id = ? AND version = ?",
        )
        .run(
          version,
          JSON.stringify(data),
          new Date().toISOString(),
          session.user.id,
          body.version,
        )
    : sql
        .prepare(
          "INSERT OR IGNORE INTO workspace (user_id,version,data,updated_at) VALUES (?,?,?,?)",
        )
        .run(
          session.user.id,
          version,
          JSON.stringify(data),
          new Date().toISOString(),
        );
  if (!result.changes)
    return Response.json({ error: "Sync conflict. Retry." }, { status: 409 });
  return Response.json({ version });
}
