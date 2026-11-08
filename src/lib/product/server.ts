import "server-only";
import {authEmail} from "./auth-email-template";
import {mailConfigured,queueAuthMail,drainAuthMail} from "./auth-mail";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join,dirname } from "node:path";

const globalState = globalThis as unknown as {
  pmfAuth?: ReturnType<typeof betterAuth>;
  pmfSqlite?: DatabaseSync;
  pmfMigration?: Promise<void>;
};
export const providersConfigured = () => ({
  email: !!process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length>=32 && mailConfigured(),
  google: !!(
    process.env.BETTER_AUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ),
  github: !!(
    process.env.BETTER_AUTH_SECRET &&
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
  ),
});
export function serverDatabase() {
  if (!globalState.pmfSqlite) {
    mkdirSync(process.env.PMFORGE_DATABASE_PATH ? dirname(process.env.PMFORGE_DATABASE_PATH) : join(process.cwd(), ".data"), { recursive: true, mode:0o700 });
    const database = new DatabaseSync(
      process.env.PMFORGE_DATABASE_PATH ||
        join(process.cwd(), ".data", "pmforge.sqlite"),
    );
    database.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS workspace (user_id TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at TEXT NOT NULL);",
    );
    globalState.pmfSqlite = database;
  }
  return globalState.pmfSqlite;
}
export async function getAuth() {
  if(process.env.NODE_ENV==='production'&&(!process.env.BETTER_AUTH_URL||!process.env.BETTER_AUTH_URL.startsWith('https://')))return null;
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    return null;
  if (!globalState.pmfAuth) {
    const configured = providersConfigured();
    const options: BetterAuthOptions = {
      appName: "PMForge",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3002",
      trustedOrigins:[new URL(process.env.BETTER_AUTH_URL || "http://localhost:3002").origin],
      emailAndPassword:{enabled:configured.email,requireEmailVerification:true,minPasswordLength:12,maxPasswordLength:128,revokeSessionsOnPasswordReset:true,resetPasswordTokenExpiresIn:1800,sendResetPassword:async({user,url})=>queueAuthMail({to:user.email,...authEmail("reset",url)})},
      emailVerification:{sendOnSignUp:true,sendOnSignIn:true,autoSignInAfterVerification:true,expiresIn:3600,sendVerificationEmail:async({user,url})=>queueAuthMail({to:user.email,...authEmail("verify",url)})},
      advanced:{useSecureCookies:(process.env.BETTER_AUTH_URL||'').startsWith('https://'),ipAddress:{ipAddressHeaders:[process.env.AUTH_TRUSTED_IP_HEADER||'x-pmforge-client-ip']}},
      secret: process.env.BETTER_AUTH_SECRET,
      database: serverDatabase(),
      socialProviders: {
        ...(configured.google
          ? {
              google: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              },
            }
          : {}),
        ...(configured.github
          ? {
              github: {
                clientId: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
              },
            }
          : {}),
      },
      session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
      user: {
        deleteUser: {
          enabled: true,
          afterDelete: async (user) => {
            const db=serverDatabase();
            if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_sessions'").get()){
              const rows=db.prepare('SELECT run_id FROM ai_sessions WHERE owner=?').all('member:'+user.id) as {run_id:string}[];
              for(const row of rows){for(const table of ['ai_requests','ai_turns','ai_native','ai_policies','ai_consents','ai_sessions'])if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))db.prepare(`DELETE FROM ${table} WHERE run_id=?`).run(row.run_id)}
            }
            serverDatabase()
              .prepare("DELETE FROM workspace WHERE user_id = ?")
              .run(user.id);
          },
        },
      },
      account: { accountLinking: { enabled: false } },
      rateLimit: { enabled: true, storage:"database", window: 60, max: 60,customRules:{"/sign-in/email":{window:60,max:5},"/sign-up/email":{window:60,max:5},"/request-password-reset":{window:60,max:3},"/send-verification-email":{window:60,max:3}} },
    };
    globalState.pmfAuth = betterAuth(options);
    globalState.pmfMigration = getMigrations(options).then((plan) =>
      plan.runMigrations(),
    );
  }
  await globalState.pmfMigration;
  void drainAuthMail();
  return globalState.pmfAuth;
}
export async function memberSession(request: Request) {
  const auth = await getAuth();
  return auth ? auth.api.getSession({ headers: request.headers }) : null;
}
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !!origin &&
    origin === new URL(process.env.BETTER_AUTH_URL || request.url).origin
  );
}
const limits = new Map<string, { at: number; count: number }>();
export function rateLimited(key: string, max = 120) {
  const now = Date.now();
  if (limits.size > 5000)
    for (const [k, v] of limits) if (now - v.at > 60000) limits.delete(k);
  const state = limits.get(key);
  if (!state || now - state.at > 60000) {
    limits.set(key, { at: now, count: 1 });
    return false;
  }
  state.count++;
  return state.count > max;
}

export const clientKey=(request:Request)=>request.headers.get(process.env.AUTH_TRUSTED_IP_HEADER||'x-pmforge-client-ip')||'unattributed';
