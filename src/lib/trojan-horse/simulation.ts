/** Authored training model, not a financial prediction. Dollars are weekly USD. */
export const segments = ["fraud", "gamers", "guilds"] as const;
export type Segment = typeof segments[number];
export type Policy = "cut" | "sunset" | "keep" | "formalize";
export const policies: Record<Policy, string> = { cut: "Cut now", sunset: "Sunset with notice", keep: "Keep as designed", formalize: "Formalize with a cap" };
export const segmentInfo = {
  fraud: { name: "Fraud rings", share: 62, color: "#a49aaa", finding: "One device, fourteen accounts. No completed purchases.", value: "Cost without customer value" },
  gamers: { name: "Reward gamers", share: 18, color: "#f088bd", finding: "Real people, repeated swaps. Purchases stop when rewards stop.", value: "Sensitive to incentives" },
  guilds: { name: "Neighborhood Guilds", share: 20, color: "#e9c776", finding: "Different devices, repeat purchases, signed mutual-referral contracts.", value: "$212 lifetime value versus $51 overall" },
};
export type Trace = { step: number; title: string; choice: string; because: string };
export type Run = {
  version: 2; id: string; parent?: string; step: number; line: number; sample: string;
  reports: number[]; lenses: string[]; attempts: string[]; reward: number; multiplier: number; cap: number; delay: number;
  reply: string; message: number; placements: Record<Segment, Policy | "">; grace: number;
  reason: string; tone: string; channels: string; rollout: number; response: string; final: string;
  reflection: string; reflected: boolean; trace: Trace[];
};
export function newRun(): Run { return { version: 2, id: globalThis.crypto.randomUUID(), step: 0, line: 0, sample: "", reports: [], lenses: [], attempts: [], reward: 10, multiplier: 2, cap: 4, delay: 0, reply: "", message: -1, placements: { fraud: "", gamers: "", guilds: "" }, grace: 14, reason: "Value, not repeated accounts", tone: "Own the change", channels: "In-app + partners + email", rollout: 14, response: "", final: "", reflection: "", reflected: false, trace: [] }; }
export const SAVE = "pmforge.trojan-horses.run.v2";
export const ARCHIVE = "pmforge.trojan-horses.archive.v2";
export function restoreRun(raw: string | null): Run | null {
  try {
    const r = JSON.parse(raw || "null");
    if (!r || r.version !== 2 || typeof r.id !== "string" || !Number.isInteger(r.step) || r.step < 0 || r.step > 18) return null;
    const b = newRun();
    if (!Array.isArray(r.reports) || !Array.isArray(r.lenses) || !Array.isArray(r.trace) || !r.placements || typeof r.placements !== "object") return null;
    return { ...b, ...r, line: Number.isInteger(r.line) && r.line >= 0 && r.line < 8 ? r.line : 0,
      reports: [...new Set<number>(r.reports.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 7))].slice(0, 3),
      lenses: [...new Set<string>(r.lenses.filter((v: unknown) => ["Devices", "Purchases", "Location"].includes(String(v))))],
      attempts: Array.isArray(r.attempts) ? [...new Set<string>(r.attempts.filter((v: unknown) => ["Devices", "Age", "Purchases", "Location"].includes(String(v))))] : [],
      trace: r.trace.filter((t: unknown) => t && typeof t === "object" && typeof (t as Trace).title === "string" && typeof (t as Trace).choice === "string" && typeof (t as Trace).because === "string" && Number.isInteger((t as Trace).step) && (t as Trace).step >= 0 && (t as Trace).step <= 18).slice(-80),
      reason: ["Value, not repeated accounts", "Call every loop fraud"].includes(r.reason) ? r.reason : b.reason,
      tone: ["Own the change", "Blame users"].includes(r.tone) ? r.tone : b.tone,
      channels: ["In-app + partners + email", "In-app only"].includes(r.channels) ? r.channels : b.channels,
      response: ["own", "deny", "silent"].includes(r.response) ? r.response : "",
      final: ["partners", "community", "finance", "split"].includes(r.final) ? r.final : "",
      placements: Object.fromEntries(segments.map(s => [s, Object.keys(policies).includes(r.placements[s]) ? r.placements[s] : ""])) as Run["placements"],
      reward: bound(r.reward, 0, 20, 10), multiplier: bound(r.multiplier, 1, 5, 2), cap: bound(r.cap, 1, 8, 4), delay: bound(r.delay, 0, 30, 0), grace: bound(r.grace, 0, 30, 14), rollout: bound(r.rollout, 0, 28, 14),
      message: [-1, 0, 1, 2].includes(r.message) ? r.message : -1,
      sample: typeof r.sample === "string" ? r.sample : "", reply: typeof r.reply === "string" ? r.reply : "", reflection: typeof r.reflection === "string" ? r.reflection : "", reflected: r.reflected === true,
    };
  } catch { return null; }
}
function bound(n: unknown, min: number, max: number, fallback: number) { return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }
export function ready(r: Run) {
  switch (r.step) {
    case 2: return !!r.sample;
    case 4: return !!r.reply;
    case 5: return r.reports.length === 3;
    case 6: return r.lenses.length === 3;
    case 9: return r.message >= 0;
    case 11: return segments.every(s => !!r.placements[s]);
    case 14: return !!r.response;
    case 17: return !!r.final;
    default: return true;
  }
}
export function remember(r: Run, title: string, choice: string, because: string): Run {
  return { ...r, trace: [...r.trace.filter(t => t.title !== title), { step: r.step, title, choice, because }] };
}
export function nextRun(r: Run): Run { return ready(r) ? { ...r, step: Math.min(18, r.step + 1), line: 0 } : r; }
export function forkRun(r: Run, step: number): Run {
  const b = newRun();
  return { ...b, parent: r.id, step, sample: r.sample, reply: r.reply, reports: [...r.reports], lenses: [...r.lenses], attempts: [...r.attempts], reward: r.reward, multiplier: r.multiplier, cap: r.cap, delay: r.delay,
    ...(step >= 10 ? { message: r.message } : {}), ...(step >= 13 ? { placements: { ...r.placements }, grace: r.grace } : {}), trace: r.trace.filter(t => t.step < step).map(t => ({ ...t })) };
}
export function forecast(r: Run) {
  const scale = (r.reward / 10) * (r.multiplier / 2) * (r.cap / 4) * (1 - r.delay / 150);
  const valvePayout = 410_000 * scale, valveBurn = 100_000 + valvePayout;
  let payout = valvePayout, burn = valveBurn;
  if (r.step >= 11) {
    const factor: Record<Policy, number> = { cut: 0, sunset: Math.min(1, r.grace / 28), keep: 1, formalize: .35 };
    const remaining = segments.reduce((sum, s) => sum + segmentInfo[s].share / 100 * factor[(r.placements[s] || "keep") as Policy], 0);
    // Segment shares apply to the $290k circular pool, not the $120k ordinary referrals.
    const targetPayout = (120_000 + 290_000 * remaining) * scale;
    const rolloutShare = r.step >= 13 ? r.rollout / 56 : 0;
    payout = targetPayout + (valvePayout - targetPayout) * rolloutShare;
    burn = 100_000 + payout;
    // Losing valuable Guild revenue increases weekly cash consumption.
    if (r.placements.guilds === "cut") burn += 105_000;
    if (r.placements.guilds === "sunset") burn += 50_000;
  }
  const week = r.step < 8 ? 0 : r.step < 10 ? 1 : r.step < 15 ? 3 : 7;
  let partner = 60, trust = 70;
  if (r.step >= 11) {
    partner += r.placements.guilds === "formalize" ? 22 : r.placements.guilds === "keep" ? 12 : r.placements.guilds === "sunset" ? -12 : -38;
    if (r.grace < 14 && r.placements.guilds !== "keep") partner -= 12;
  }
  const contradiction = r.message === 0 && r.rollout > 0 || r.message === 2 && r.grace < 28;
  if (r.step >= 15) {
    trust += r.tone === "Own the change" ? 4 : -10;
    trust += r.rollout === 0 ? -22 : r.rollout < 7 ? -10 : 4;
    trust += contradiction ? (r.response === "own" ? -5 : -16) : 3;
    if (r.channels === "In-app only") partner -= 10;
    if (r.reason === "Call every loop fraud") { trust -= 12; partner -= 8; }
  }
  if (r.step >= 18) {
    if (r.final === "partners") partner += 6;
    if (r.final === "community") trust += 6;
    if (r.final === "split") { partner += 3; trust += 3; }
  }
  const revolt = r.step >= 15 && trust < 48;
  const cashBeforeBridge = 6_200_000 - valveBurn * Math.min(3, week) - burn * Math.max(0, week - 3);
  const bridge = r.step >= 16 && cashBeforeBridge / burn < 8;
  const cash = Math.max(0, cashBeforeBridge + (bridge ? 2_000_000 : 0));
  const gardener = r.placements.fraud === "cut" && r.placements.guilds === "formalize" && partner >= 65 && !revolt;
  return { payout, burn, cash, week, runway: cash / burn, partner: Math.max(0, Math.min(100, partner)), trust: Math.max(0, Math.min(100, trust)), rating: Math.max(1, Math.min(4.9, 4.7 + (trust - 70) / 60)), contradiction, revolt, bridge, gardener, saved: (510_000 - burn) * 4 };
}
export function conclusion(r: Run) {
  const f = forecast(r);
  return `${r.placements.fraud === "cut" ? "You stopped payouts to shared-device fraud rings." : "Fraud payouts survived your policy."} ${r.placements.guilds === "formalize" ? "You kept the valuable Guild loop under a cap." : r.placements.guilds === "cut" ? "Cutting Guilds also removed legitimate partner revenue." : "Your Guild choice traded cash against partner value."} ${f.contradiction ? "Your public promise conflicted with the rollout" + (r.response === "own" ? "; owning the correction softened the response." : "; the screenshot damaged trust.") : "Your rollout matched your public wording."} ${f.bridge ? "A bridge restored cash, with eight percent dilution." : "You finished without emergency funding."}`;
}
