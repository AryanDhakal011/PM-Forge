const defaultOrigin = "https://pmforge-tau.vercel.app";
const args = process.argv.slice(2);
const baseline = args.includes("--baseline");
const origin = args.find((argument) => !argument.startsWith("--")) ?? defaultOrigin;

try {
  const target = new URL(origin);
  if (target.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(target.hostname)) {
    throw new Error("Expected HTTPS or loopback.");
  }
  const response = await fetch(new URL("/api/health/config", target.origin), {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Readiness request failed.");
  const report = await response.json();
  let failures = 0;

  function check(label, passed, required = true) {
    console.log(`${passed ? "PASS" : required ? "FAIL" : "OPEN"} ${label}`);
    if (!passed && required) failures++;
  }

  function recent(value, hours) {
    if (typeof value !== "string") return false;
    const age = Date.now() - Date.parse(value);
    return Number.isFinite(age) && age >= 0 && age <= hours * 3600000;
  }

  check("Production environment", report?.env === "production");
  check("Deployment revision", typeof report?.version === "string" && /^[0-9a-f]{40}$/.test(report.version)
    && (!process.env.PMFORGE_EXPECTED_REVISION || process.env.PMFORGE_EXPECTED_REVISION === report.version));
  check("Database", report?.db === true);
  check("Supabase Auth settings reachable", report?.checks?.authSettingsReachable === true);
  check("Publishing backend reachable", report?.publish?.backend === true);
  check("Isolated portfolio reader reachable", report?.publish?.readerReachable === true);
  check("Email sign-in disabled in the app", report?.auth?.email === false);
  check("Email provider disabled in Supabase", report?.checks?.emailDisabledAtSupabase === true, !baseline);
  check("Google sign-in", report?.auth?.google === true, !baseline);
  check("GitHub sign-in", report?.auth?.github === true, !baseline);
  check("Anonymous cloud sign-in", report?.auth?.anonymous === true, !baseline);
  check("Manual identity linking", report?.auth?.manualLinking === true, !baseline);
  check("CAPTCHA rejects bad tokens", report?.auth?.captcha === true, !baseline);
  check("Pooled inference enabled", report?.ai?.poolEnabled === true, !baseline);
  check("BYOK enabled", report?.ai?.byokEnabled === true, !baseline);
  check("On-device lane enabled", report?.ai?.deviceLaneEnabled === true, !baseline);
  check("AI kill switch inactive", report?.ai?.killSwitch === false);
  const providers = ["groq", "cerebras", "openrouter", "cloudflare"];
  check("At least one pooled provider verified in the last 24 hours",
    providers.some((provider) => report?.ai?.providers?.[provider] === true), !baseline);
  for (const provider of providers) {
    check(`Provider ${provider} verified`, report?.ai?.providers?.[provider] === true, false);
  }
  check("Optional server transcription enabled", report?.voice?.serverTranscription === true, false);
  check("Cron succeeded in the last 24 hours", recent(report?.ops?.lastCronAt, 24), !baseline);
  check("Encrypted backup verified in the last 24 hours", recent(report?.ops?.lastBackupAt, 24), !baseline);
  check("Retention ran successfully in the last 24 hours", recent(report?.ops?.lastRetentionRunAt, 24), !baseline);
  if (baseline) console.log("Baseline only. OPEN items still need release evidence.");
  process.exitCode = failures ? 1 : 0;
} catch {
  console.error("FAIL Readiness endpoint returned no usable report.");
  process.exitCode = 1;
}
