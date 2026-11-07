export type Segment = "fraud" | "gamers" | "guilds" | "unknown";
export type Placement = "cut" | "sunset" | "keep" | "formalize";
export type Chapter = 1 | 2 | 3 | 4;

export type State = {
  chapter: Chapter;
  week: number;
  cash: number;
  burn: number;
  trust: number;
  partnerTrust: number;
  rating: number;
  message: string;
  announcement: string;
  placements: Record<Segment, Placement | "">;
  grace: Record<Segment, number>;
  lenses: string[];
  drawers: string[];
  rollout: "instant" | "2-weeks" | "4-weeks";
};

export const initialState: State = {
  chapter: 1,
  week: 0,
  cash: 6_200_000,
  burn: 510_000,
  trust: 70,
  partnerTrust: 60,
  rating: 4.7,
  message: "",
  announcement: "",
  placements: { fraud: "", gamers: "", guilds: "", unknown: "" },
  grace: { fraud: 0, gamers: 14, guilds: 30, unknown: 0 },
  lenses: [],
  drawers: [],
  rollout: "2-weeks",
};

export const runway = (s: State) => Math.max(0, s.cash / s.burn);

export function advanceState(s: State, weeks = 2): State {
  const segmented = s.placements.guilds === "formalize" || s.placements.guilds === "keep";
  const fraudCut = s.placements.fraud === "cut";
  const gamerSunset = s.placements.gamers === "sunset";
  let payoutSavings = 0;
  if (fraudCut) payoutSavings += 180_000;
  if (gamerSunset) payoutSavings += 52_000 * 0.8;
  if (s.placements.guilds === "formalize") payoutSavings += 18_000;
  if (s.placements.guilds === "keep") payoutSavings -= 58_000;

  const guildRevenue = segmented ? 190_000 * (s.partnerTrust / 60) : 190_000 * 0.45;
  const burn = Math.max(0, 430_000 + 290_000 - payoutSavings);
  const revenue = 330_000 + guildRevenue;
  const netBurn = burn - revenue;
  const graceCost = Object.values(s.grace).reduce((sum, days) => sum + (days > 0 ? 290_000 * (days / 7 / 52) : 0), 0);
  const cash = Math.max(0, s.cash - netBurn * weeks - graceCost * weeks);
  return { ...s, week: s.week + weeks, cash, burn: netBurn };
}

export function placementLabel(value: Placement | "") {
  if (value === "cut") return "Cut now";
  if (value === "sunset") return "Sunset with notice";
  if (value === "keep") return "Keep as designed";
  if (value === "formalize") return "Formalize with cap";
  return "Unplaced";
}
