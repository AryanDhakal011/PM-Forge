import "server-only";
import { cloudConfig } from "./config";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

async function readJson(url: URL, init?: RequestInit): Promise<JsonObject | undefined> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return;
    return object(await response.json());
  } catch {
    return undefined;
  }
}

function configuredCloud() {
  try {
    return cloudConfig();
  } catch {
    return undefined;
  }
}

async function readerHealth(appOrigin: string) {
  try {
    const reader = new URL(process.env.PMFORGE_PUBLIC_PORTFOLIO_ORIGIN ?? "");
    if (reader.protocol !== "https:" || reader.origin === appOrigin) return false;
    const health = await readJson(new URL("/api/health", reader.origin));
    return health?.status === "ready" && health?.storage === "postgres" && health?.schema === 1;
  } catch {
    return false;
  }
}

export async function configReadiness(appOrigin: string) {
  const cloud = configuredCloud();
  const headers = cloud ? { apikey: cloud.key } : undefined;
  const [health, authSettings, readerReachable, publisher] = await Promise.all([
    cloud && readJson(new URL("/rest/v1/rpc/pmforge_health", cloud.url), { headers }),
    cloud && readJson(new URL("/auth/v1/settings", cloud.url), { headers }),
    cloud ? readerHealth(appOrigin) : false,
    cloud && readJson(new URL("/functions/v1/pmforge-backend", cloud.url), {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "health" }),
    }),
  ]);
  const providers = object(authSettings?.external);
  const db = health?.status === "ready" && health?.storage === "postgres" && health?.schema === 1;
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const environment = process.env.VERCEL_ENV;

  return {
    version: /^[0-9a-f]{40}$/.test(sha) ? sha : null,
    env: environment === "production" || environment === "preview" ? environment : "development",
    db,
    auth: {
      anonymous: providers?.anonymous === true && authSettings?.disable_signup === false,
      manualLinking: false,
      captcha: false,
      google: cloud?.google === true && providers?.google === true,
      github: cloud?.github === true && providers?.github === true,
      email: cloud?.email === true && providers?.email === true,
    },
    publish: {
      backend: publisher?.status === "ready" && publisher?.storage === "postgres",
      readerReachable,
    },
    ai: {
      poolEnabled: false,
      providers: { groq: false, cerebras: false, openrouter: false, cloudflare: false },
      byokEnabled: false,
      deviceLaneEnabled: false,
      killSwitch: false,
    },
    voice: { serverTranscription: false },
    ops: { lastCronAt: null, lastBackupAt: null, lastRetentionRunAt: null },
    checks: {
      authSettingsReachable: Boolean(providers),
      emailDisabledAtSupabase: providers?.email === false,
    },
  };
}
