import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../src/app/api/health/config/route";

test("readiness checks the live dependencies and emits only approved fields", async (t) => {
  const environment = {
    PMFORGE_STORAGE_DRIVER: "supabase",
    SUPABASE_URL: "https://database.example",
    SUPABASE_PUBLISHABLE_KEY: "test-publishable-value",
    PMFORGE_PUBLIC_PORTFOLIO_ORIGIN: "https://reader.example",
    PMFORGE_CLOUD_GOOGLE_ENABLED: "true",
    PMFORGE_CLOUD_GITHUB_ENABLED: "true",
    PMFORGE_CLOUD_EMAIL_ENABLED: "false",
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
  };
  for (const [key, value] of Object.entries(environment)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  let responding = true;
  const calls: string[] = [];
  const healthy = { schema: 1, status: "ready", storage: "postgres", unexpected: "untrusted-metadata" };
  t.mock.method(globalThis, "fetch", async (url: URL, options: RequestInit) => {
    calls.push(url.pathname);
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal);
    const headers = new Headers(options.headers);
    assert.equal(headers.get("apikey"), url.hostname === "reader.example" ? null : environment.SUPABASE_PUBLISHABLE_KEY);
    if (!responding) throw new Error("upstream-network-detail");
    if (url.pathname === "/auth/v1/settings") {
      return Response.json({ external: { google: true, github: false, email: true }, disable_signup: false });
    }
    if (url.pathname === "/functions/v1/pmforge-backend") {
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(String(options.body)), { action: "health" });
    }
    return Response.json(healthy);
  });

  const request = new Request("https://app.example/api/health/config");
  const response = await GET(request);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const report = await response.json();
  assert.deepEqual(report, {
    version: "a".repeat(40),
    env: "production",
    db: true,
    auth: { anonymous: false, manualLinking: false, captcha: false, google: true, github: false, email: false },
    publish: { backend: true, readerReachable: true },
    ai: {
      poolEnabled: false, providers: { groq: false, cerebras: false, openrouter: false, cloudflare: false },
      byokEnabled: false, deviceLaneEnabled: false, killSwitch: false,
    },
    voice: { serverTranscription: false },
    ops: { lastCronAt: null, lastBackupAt: null, lastRetentionRunAt: null },
    checks: { authSettingsReachable: true, emailDisabledAtSupabase: false },
  });
  assert.deepEqual(calls.sort(), [
    "/api/health", "/auth/v1/settings", "/functions/v1/pmforge-backend", "/rest/v1/rpc/pmforge_health",
  ].sort());
  responding = false;
  const failed = await (await GET(request)).json();
  assert.equal(failed.db, false);
  assert.equal(failed.auth.google, false);
  assert.equal(failed.publish.backend, false);
  assert.equal(failed.publish.readerReachable, false);
  assert.equal(failed.checks.authSettingsReachable, false);
  assert.ok(!JSON.stringify(failed).includes("upstream-network-detail"));
});
