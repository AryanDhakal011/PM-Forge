import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getAuth, serverDatabase } from "../src/lib/product/server";
import { GET, PUT } from "../src/app/api/workspace/route";
import { projects } from "../src/lib/projects/content";
import {
  createProjectRun,
  lockProjectDecision,
} from "../src/lib/projects/engine";

test("configured account backend migrates and isolates two real signed test sessions", async () => {
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
  process.env.BETTER_AUTH_URL = "http://localhost:3999";
  process.env.PMFORGE_DATABASE_PATH = join(
    mkdtempSync(join(tmpdir(), "pmforge-auth-test-")),
    "accounts.sqlite",
  );
  const auth = await getAuth();
  assert.ok(auth);
  const context = await auth.$context;
  const a = await context.internalAdapter.createUser(
    { name: "Test A", email: "a@pmforge.test" },
    { method: "admin" },
  );
  const b = await context.internalAdapter.createUser(
    { name: "Test B", email: "b@pmforge.test" },
    { method: "admin" },
  );
  const aSession = await context.internalAdapter.createSession(a.id, false);
  const bSession = await context.internalAdapter.createSession(b.id, false);
  const cookie = (token: string) =>
    `${context.authCookies.sessionToken.name}=${encodeURIComponent(token + "." + createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64"))}`;
  const aCookie = cookie(aSession.token),
    bCookie = cookie(bSession.token);
  const request = (
    method: string,
    cookieValue?: string,
    body?: unknown,
    origin = "http://localhost:3999",
  ) =>
    new Request("http://localhost:3999/api/workspace", {
      method,
      headers: {
        ...(cookieValue ? { Cookie: cookieValue } : {}),
        Origin: origin,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const projectFixture = (id: string) => {
    const run = createProjectRun(projects[0], id);
    run.phase = "decision";
    run.entranceSeen = true;
    run.draft = {
      choiceId: "c1-c",
      rationale: "Private note, sync not consented",
      evidence: ["0"],
      ranking: [],
    };
    return lockProjectDecision(run);
  };
  const data = (id: string) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      id,
      name: "Test",
      role: "Product Manager",
      level: "easy",
      timeline: "Exploring",
      identity: "member",
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    },
    runs: [],
    records: [],
    bookmarks: [],
    projectRuns: [projectFixture(id)],
  });
  assert.equal((await GET(request("GET"))).status, 401);
  assert.equal(
    (
      await PUT(
        request(
          "PUT",
          aCookie,
          { data: data(a.id), version: 0 },
          "https://evil.example",
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (await PUT(request("PUT", aCookie, { data: data(a.id), version: 0 })))
      .status,
    200,
  );
  const own = await GET(request("GET", aCookie));
  assert.equal(own.status, 200);
  const ownBody = await own.json();
  assert.equal(ownBody.data.profile.id, a.id);
  assert.equal(ownBody.data.projectRuns[0].projectId, "sacred-no");
  assert.equal(ownBody.data.projectRuns[0].draft.rationale, "");
  assert.equal(ownBody.data.projectRuns[0].decisions[0].rationale, "");
  assert.equal(ownBody.data.projectRuns[0].state.product_stability, 74);
  assert.equal(ownBody.data.projectRuns[0].phase, "consequence");
  const tampered = data(a.id);
  tampered.projectRuns[0].state.founder_trust = 99;
  assert.equal(
    (await PUT(request("PUT", aCookie, { data: tampered, version: 1 }))).status,
    400,
  );
  const consented = data(a.id);
  consented.projectRuns[0].includeNotes = true;
  assert.equal(
    (await PUT(request("PUT", aCookie, { data: consented, version: 1 })))
      .status,
    200,
  );
  const restored = await (await GET(request("GET", aCookie))).json();
  assert.equal(
    restored.data.projectRuns[0].decisions[0].rationale,
    "Private note, sync not consented",
  );
  const other = await GET(request("GET", bCookie));
  assert.equal((await other.json()).data, null);
  assert.equal(
    (await PUT(request("PUT", bCookie, { data: data(a.id), version: 0 })))
      .status,
    403,
  );
  assert.equal(
    (await PUT(request("PUT", aCookie, { data: data(a.id), version: 0 })))
      .status,
    409,
  );
  assert.equal(
    (await PUT(request("PUT", bCookie, { data: data(b.id), version: 0 })))
      .status,
    200,
  );
  assert.equal(
    (
      await GET(
        request("GET", `${context.authCookies.sessionToken.name}=tampered`),
      )
    ).status,
    401,
  );
  const deletion = await auth.handler(
    new Request("http://localhost:3999/api/auth/delete-user", {
      method: "POST",
      headers: {
        Cookie: aCookie,
        Origin: "http://localhost:3999",
        "Content-Type": "application/json",
      },
      body: "{}",
    }),
  );
  assert.equal(deletion.status, 200);
  assert.equal(
    serverDatabase()
      .prepare("SELECT user_id FROM workspace WHERE user_id = ?")
      .get(a.id),
    undefined,
  );
  assert.ok(
    serverDatabase()
      .prepare("SELECT user_id FROM workspace WHERE user_id = ?")
      .get(b.id),
  );
  serverDatabase().close();
});
