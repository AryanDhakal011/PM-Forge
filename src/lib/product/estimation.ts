import type { Dial, Run } from "./types";
const dial = (
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit: string,
  band: [number, number],
): Dial => ({ id, label, value, min, max, step, unit, band });
const MODELS: Record<string, Dial[]> = {
  "EST-E-1": [
    dial("adults", "Adult share", 65, 10, 95, 1, "%", [55, 75]),
    dial("premium", "Premium segment", 8, 1, 35, 1, "%", [4, 12]),
    dial("cycle", "Replacement cycle", 3, 1, 8, 0.5, "years", [2, 4]),
    dial("capture", "Store capture", 5, 1, 25, 1, "%", [3, 8]),
  ],
  "EST-E-2": [
    dial("active", "Weekly / monthly actives", 55, 10, 95, 1, "%", [40, 70]),
    dial("transact", "Weekly transactors", 35, 5, 80, 1, "%", [25, 45]),
    dial("adoption", "Feature adoption", 5, 1, 30, 1, "%", [3, 9]),
    dial("uses", "Uses per user", 1.8, 0.5, 8, 0.1, "/week", [1, 3]),
  ],
  "EST-E-3": [
    dial("contact", "Contact rate", 0.6, 0.1, 5, 0.1, "%", [0.3, 1.2]),
    dial("launch", "Launch multiplier", 1.5, 1, 5, 0.1, "×", [1.2, 2]),
    dial("chat", "Chat share", 70, 10, 100, 1, "%", [50, 85]),
    dial("handle", "Handle time", 9, 2, 30, 1, "min", [6, 14]),
  ],
  "EST-M-1": [
    dial("demand", "Storm demand lift", 42, 0, 100, 1, "%", [35, 55]),
    dial("surge", "Demand shaped away", 22, 0, 60, 1, "%", [18, 25]),
    dial("speed", "Speed reduction", 27, 0, 80, 1, "%", [20, 35]),
    dial("exits", "Driver exits", 8, 0, 40, 1, "%", [4, 15]),
  ],
  "EST-M-2": [
    dial(
      "limit",
      "Payment-provider capacity",
      40,
      10,
      100,
      1,
      "auth/s",
      [30, 60],
    ),
    dial("headroom", "Capacity target", 70, 10, 100, 1, "%", [50, 80]),
    dial("attempt", "Payment-attempt share", 45, 10, 90, 1, "%", [30, 60]),
    dial("calls", "Calls per attempt", 1.3, 1, 5, 0.1, "calls", [1, 2]),
  ],
  "EST-M-3": [
    dial(
      "orders",
      "Prior gross orders",
      9400,
      1000,
      25000,
      100,
      "orders",
      [7100, 12000],
    ),
    dial("growth", "Year-on-year growth", 35, 0, 100, 1, "%", [20, 50]),
    dial("peak", "Orders on two peak days", 60, 10, 100, 1, "%", [45, 75]),
    dial("rider", "Rider productivity", 2.2, 0.5, 6, 0.1, "orders/h", [1.5, 3]),
  ],
  "EST-H-1": [
    dial(
      "passengers",
      "Passengers in window",
      7200,
      1000,
      15000,
      100,
      "people",
      [5000, 9000],
    ),
    dial("manual", "Need manual check-in", 45, 10, 100, 1, "%", [35, 60]),
    dial("agents", "Available agents", 60, 10, 150, 1, "agents", [40, 80]),
    dial("capacity", "Agent productivity", 12, 2, 30, 1, "people/h", [8, 16]),
  ],
  "EST-H-2": [
    dial(
      "requests",
      "Normal arrival rate",
      187,
      20,
      600,
      1,
      "visits/s",
      [100, 250],
    ),
    dial("burst", "Peak multiplier", 3, 1, 8, 0.1, "×", [2, 4]),
    dial("fanout", "Requests per visitor", 6, 1, 20, 1, "requests", [4, 8]),
    dial(
      "capacity",
      "Web capacity",
      2000,
      500,
      6000,
      100,
      "req/s",
      [1500, 3000],
    ),
  ],
  "EST-H-3": [
    dial(
      "vehicles",
      "EVs passing",
      1800,
      500,
      5000,
      100,
      "vehicles",
      [1200, 2400],
    ),
    dial("need", "Need charging", 35, 5, 80, 1, "%", [25, 50]),
    dial("energy", "Energy per session", 30, 10, 90, 1, "kWh", [20, 40]),
    dial("power", "Grid connection", 1.2, 0.2, 3, 0.1, "MW", [0.8, 1.4]),
  ],
};
export const getDials = (id: string) => MODELS[id] || [];
export function estimate(id: string, values: Record<string, number>, seed = 0) {
  const v = Object.fromEntries(
    getDials(id).map((d) => [d.id, values[d.id] ?? d.value]),
  );
  const factor = [1, 1.2, 0.85][seed % 3];
  const rate = (key: string) => v[key] / 100;
  switch (id) {
    case "EST-E-1":
      return {
        value:
          ((2041587 * rate("adults") * rate("premium")) / v.cycle / 12) *
          rate("capture"),
        unit: "phones / month",
        formula:
          "2,041,587 × adult share × premium share ÷ cycle ÷ 12 × capture",
        comparison: `Break-even: ${((1500000 * factor) / 12000).toFixed(0)} phones/month (NPR ${(1500000 * factor).toLocaleString()} fixed / NPR 12,000 margin)`,
      };
    case "EST-E-2":
      return {
        value:
          1200000 *
          factor *
          rate("active") *
          rate("transact") *
          rate("adoption") *
          v.uses,
        unit: "uses / week",
        formula:
          "Monthly actives × weekly share × transacting share × adoption × uses",
        comparison: "Tier S: 30,000 uses/week. Tier L: 100,000 uses/week.",
      };
    case "EST-E-3":
      return {
        value:
          (400000 *
            factor *
            rate("contact") *
            v.launch *
            rate("chat") *
            v.handle) /
          (480 * 0.8 * 3),
        unit: "agents / shift",
        formula:
          "DAU × contact rate × launch factor × chat share × handle time ÷ (480 × .8 × 3)",
        comparison:
          "Check the busiest three hours separately before choosing a staffing level.",
      };
    case "EST-M-1":
      return {
        value: Math.max(
          0,
          (713175 *
            0.07 *
            0.35 *
            factor *
            (1 + rate("demand")) *
            (1 - rate("surge"))) /
            (1.6 * (1 - rate("speed"))) -
            ((713175 * 0.07 * 0.35) / 1.6) * (1 - rate("exits")),
        ),
        unit: "additional drivers",
        formula:
          "Storm trips after demand-shaping ÷ reduced driver productivity − remaining drivers",
        comparison:
          "Recruitment is bounded: past incentives filled only 40% of the gap in 45 minutes.",
      };
    case "EST-M-2":
      return {
        value:
          (v.limit * factor * rate("headroom")) / (rate("attempt") * v.calls),
        unit: "admissions / second",
        formula:
          "Provider limit × target utilisation ÷ (payment-attempt share × calls per attempt)",
        comparison:
          "Inventory: 10,000 seats; 2 tickets/order; 80% payment success; 5-minute holds.",
      };
    case "EST-M-3":
      return {
        value:
          (((v.orders * (1 + rate("growth")) * factor * rate("peak")) / 2) *
            0.55) /
          4 /
          v.rider,
        unit: "riders at peak",
        formula:
          "Gross orders × growth × peak share ÷ 2 × .55 ÷ 4 ÷ orders per rider-hour",
        comparison:
          "Supply: 600 × 65% = 390 active riders. Finance excludes cancelled orders.",
      };
    case "EST-H-1":
      return {
        value:
          ((v.agents * v.capacity * 3) /
            (v.passengers * rate("manual") * factor)) *
          100,
        unit: "% of manual demand served",
        formula:
          "Agents × passengers per agent-hour × 3 ÷ manual passengers × 100",
        comparison:
          "Security cap: 2,400/hour. Bag drop and boarding have earlier closure times.",
      };
    case "EST-H-2":
      return {
        value: (v.requests * v.burst * v.fanout * factor) / v.capacity,
        unit: "× web capacity",
        formula: "Arrivals × burst × request fanout ÷ web capacity",
        comparison:
          "Overflow does not disappear: SMS and phone have separate bottlenecks.",
      };
    default:
      return {
        value:
          ((v.power * 1000 * 10) /
            (v.vehicles * rate("need") * v.energy * factor)) *
          100,
        unit: "% of charging energy covered",
        formula:
          "Grid MW × 1,000 × 10 hours ÷ (EVs × charging share × kWh) × 100",
        comparison:
          "Adding charger plugs cannot increase available grid energy.",
      };
  }
}
export const sanityRatio = (run: Run) => {
  const dials = getDials(run.questionId);
  return dials.length
    ? dials.filter((d) => {
        const v = run.dials[d.id] ?? d.value;
        return v >= d.band[0] && v <= d.band[1];
      }).length / dials.length
    : 0;
};
