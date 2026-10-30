import type {
  Project,
  ProjectChapter,
  ProjectChoice,
  ProjectRule,
  ReactionKind,
} from "./types";
// Authored elaborations of the founder's blueprints. All organisations and observations are simulated.
type Option = [string, number[], string, string, ReactionKind, string];
type Chapter = [string, string, string[], ProjectChapter["pattern"], Option[]];
function project(
  id: string,
  title: string,
  setting: string,
  skill: string,
  category: string,
  tags: string[],
  colors: string[],
  vars: string[],
  archetypes: string[],
  chapters: Chapter[],
  rules: {
    chapter: number;
    flag: string;
    choice?: string;
    delta: number[];
    reaction: string;
    kind: ReactionKind;
    constraint: string;
  }[],
): Project {
  const keys = vars.map((v) => v.split("|")[0]);
  const vector = (values: number[]) =>
    Object.fromEntries(keys.map((key, i) => [key, values[i] || 0]));
  return {
    id,
    title,
    setting,
    skill,
    category,
    tags,
    palette: { bg: colors[0], ink: colors[1], accent: colors[2] },
    variables: vars.map((v) => {
      const [key, label, start, max, bad] = v.split("|");
      return {
        id: key,
        label,
        initial: Number(start || 55),
        max: Number(max || 100),
        unit: key.includes("runway") ? "weeks" : "index",
        bad: bad === "bad",
      };
    }),
    archetypes: archetypes.map((a) => {
      const [label, definition] = a.split("|");
      return { label, definition };
    }),
    chapters: chapters.map(([title, brief, evidence, pattern, options], c) => ({
      title,
      brief,
      pattern,
      evidence: evidence.map((text, i) => ({
        source: [
          "Operating dashboard",
          "Field note / stakeholder",
          "Contradicting signal",
        ][i],
        text,
        confidence: [
          "Partial sample",
          "First-person account",
          "Needs reconciliation",
        ][i],
      })),
      choices: options.map(
        (
          [label, delta, cost, reaction, kind, constraint],
          i,
        ): ProjectChoice => ({
          id: `c${c + 1}-${String.fromCharCode(97 + i)}`,
          label,
          delta: vector(delta),
          cost,
          reaction,
          kind,
          constraint,
          archetype: archetypes[i % archetypes.length].split("|")[0],
        }),
      ),
    })),
    rules: rules.map((r) => ({ ...r, delta: vector(r.delta) })),
  };
}
export const projects: Project[] = [
  project(
    "sacred-no",
    "The Sacred No",
    "A seed-stage startup, the night before its board meeting",
    "Say no under founder pressure without destroying the relationship",
    "strategy",
    ["High pressure", "Political"],
    ["#091a13", "#e5f3d3", "#a9ef64"],
    [
      "founder_trust|Founder trust|62",
      "product_stability|Product stability|65",
      "runway_weeks|Runway|12|26",
      "board_confidence|Board confidence|58",
      "political_capital|Political capital|55",
    ],
    [
      "Diplomat|Protects the relationship while making a bounded commitment.",
      "Wall|Protects scope with a firm boundary, accepting relationship costs.",
      "Data-backed Guardian|Makes a boundary executable with evidence and an alternative.",
    ],
    [
      [
        "Midnight Request",
        "The founder wants live AI recommendations in tomorrow’s board demo. The promise is already in an investor email. Your team has one reliable build.",
        [
          "Demo build: p95 latency 420 ms. Prototype with recommendations: 1,900 ms on 80 test sessions.",
          "Founder: ‘We need a story that shows ambition, not another safety review.’",
          "Sales says two prospects asked for recommendations; neither has agreed to pay.",
        ],
        "tradeoff",
        [
          [
            "Accept the feature for tomorrow",
            [14, -27, -2, 9, -8],
            "Borrow stability and engineering time to protect the immediate promise.",
            "The promise becomes a release commitment. Engineers move the stable build aside; the founder now expects the live feature.",
            "surge",
            "A live feature is promised. The board demo must now reconcile ambition with a degraded build.",
          ],
          [
            "Decline cleanly and protect the stable build",
            [-17, 12, 0, -7, -7],
            "The product stays safe; the founder owns a visible retraction.",
            "The founder’s seat dims. Scope is protected, but you have less trust for the next negotiation.",
            "dim",
            "The stable build is protected. You must rebuild founder support before asking for another concession.",
          ],
          [
            "Decline with latency data and a staged alternative",
            [5, 9, -1, 5, 10],
            "Spend a week on a credible pilot instead of promising it live.",
            "The brass boundary holds: a recorded prototype replaces the live promise, with a named pilot checkpoint.",
            "recover",
            "A recorded prototype is agreed. Sales will ask whether this is a delay or a real pilot.",
          ],
        ],
      ],
      [
        "Stakeholder Squeeze",
        "Sales offers two customers if you soften the boundary. Choose a commitment you can actually repeat to engineering.",
        [
          "The two customers represent 9% of next quarter’s pipeline, not signed revenue.",
          "Engineering can support one isolated pilot, or the general release—not both.",
          "The investor email still says ‘available soon’; Sales treats that as this week.",
        ],
        "frame",
        [
          [
            "Hedge: promise availability while engineering investigates",
            [8, -18, -1, 6, -12],
            "Avoid a confrontation now, leave the team an undefined commitment.",
            "The stability line jitters: Sales and engineering leave with different meanings of ‘soon’.",
            "fracture",
            "Two incompatible commitments remain. A board rehearsal must expose the gap.",
          ],
          [
            "Offer one isolated pilot with acceptance criteria",
            [2, 8, -1, -3, 12],
            "A narrower commercial story, with explicit latency and scope limits.",
            "A single pilot card stays on the table. Sales has a smaller offer it can explain.",
            "recover",
            "Only the isolated pilot is in scope. The board must hear its limits.",
          ],
          [
            "Ask the founder to choose the tradeoff publicly",
            [-4, 3, 0, 2, 5],
            "Escalation earns clarity but spends your relationship capital.",
            "The founder leans forward. The tradeoff is visible and the decision owner is named.",
            "dim",
            "The founder owns the choice; your board account must show its operational cost.",
          ],
        ],
      ],
      [
        "Boardroom Verdict",
        "The board is seated. A live build with low stability can fail on stage; a guarded demo trades spectacle for credibility.",
        [
          "Rehearsal crashes appear below stability index 40; this is a simulated risk threshold.",
          "The recorded prototype works, but it cannot prove production readiness.",
          "The board asks for an owner and a dated stop condition, not only a vision.",
        ],
        "tradeoff",
        [
          [
            "Run the live feature and stand behind the promise",
            [8, -12, -1, 10, -6],
            "Accept the explicit rehearsal risk for a stronger demonstration.",
            "The live feed is exposed to the board. The team has no protected rehearsal left.",
            "surge",
            "Your next funding conversation inherits what the live build actually demonstrated.",
          ],
          [
            "Show the stable product and disclose pilot limits",
            [-3, 12, 0, 6, 10],
            "A quieter story with a clear boundary and an operational checkpoint.",
            "The board sees a bounded plan. The product remains available while the pilot earns its place.",
            "recover",
            "A credible pilot now needs follow-through; the board expects the agreed evidence.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 2,
        flag: "c1-a",
        delta: [-7, -7, 0, -3, -4],
        reaction:
          "Your earlier yes lets Sales quote the feature as sold; this extra commitment consumes stability and trust.",
        kind: "dim",
        constraint:
          "The accepted feature remains a liability until explicitly bounded.",
      },
      {
        chapter: 3,
        flag: "c1-a",
        choice: "c3-a",
        delta: [-18, -22, -1, -25, -10],
        reaction:
          "The low-stability live build fails during the demo. This fracture follows the feature promise and the known rehearsal risk.",
        kind: "fracture",
        constraint:
          "The board now requires a recovery plan before more feature investment.",
      },
    ],
  ),
  project(
    "silent-churn",
    "The Silent Churn",
    "A legacy insurance corporation with cautious executives",
    "Find the quiet leak and build consensus",
    "root-cause",
    ["Corporate", "Political"],
    ["#101c30", "#e4e8ef", "#86a6ca"],
    [
      "client_trust|Client trust|48",
      "investigation_depth_spent|Investigation time spent|15|100|bad",
      "consensus_score|Consensus|38",
      "recovery_speed|Recovery speed|45",
      "executive_scepticism|Executive scepticism|60|100|bad",
    ],
    [
      "Diplomat|Builds a coalition around a shared explanation.",
      "Disruptor|Makes a testable public claim and accepts the resistance.",
    ],
    [
      [
        "Quiet",
        "High-value renewals are slipping without a clear complaint spike. Quarterly review is close; every deeper cut consumes investigation capacity.",
        [
          "Aggregate retention is 94%; the ten largest accounts renew at 81%.",
          "Account managers blame pricing. Exit notes mention repeated claims handoffs.",
          "A premium increase affected only a third of departing clients.",
        ],
        "investigate",
        [
          [
            "Cross-reference claims handoffs and account cohorts",
            [6, 28, 4, -12, -7],
            "Spend the review window on a stronger diagnosis.",
            "Two spreadsheets align around handoff delays. The clock advances by a planning window, not a forced timer.",
            "fog",
            "You have a narrower explanation and less time to prepare the executive coalition.",
          ],
          [
            "Take the pricing hypothesis into an immediate pilot",
            [-4, 7, -3, 18, 6],
            "Move quickly on a plausible but incomplete explanation.",
            "A pricing pilot starts before claims friction is reconciled. Executives see momentum and competing explanations.",
            "surge",
            "The pilot must distinguish pricing effects from the unresolved claims handoff signal.",
          ],
        ],
      ],
      [
        "Consensus Gauntlet",
        "Five executives disagree about what ‘retention’ includes. They will challenge a claim that ignores the early evidence.",
        [
          "Claims wants a process pilot; Finance wants a discount control group.",
          "The commercial director will support a bounded joint test privately.",
          "A direct company-wide change needs a majority in the review.",
        ],
        "ally",
        [
          [
            "Build a claims and finance coalition before presenting",
            [5, 12, 26, -7, -14],
            "Spend more preparation time for shared ownership.",
            "Two cautious seats turn toward the same test. Agreement improves; delivery time narrows.",
            "recover",
            "You can deploy a shared pilot, but must show a realistic recovery curve.",
          ],
          [
            "Present one bold theory with a falsifiable test",
            [-3, 0, -7, 17, 12],
            "Accept executive resistance for a faster decision.",
            "The committee leans back, then asks for the disconfirming result. Speed rises without automatic consensus.",
            "dim",
            "The first results must be independently credible; the committee will not grant a quiet expansion.",
          ],
        ],
      ],
      [
        "Increment Win",
        "A recovery plan can slow departures; no credible change restores all lost trust overnight.",
        [
          "An initial handoff pilot cuts repeat contacts by 12%, with a small sample.",
          "Discounted accounts show mixed renewal intent after two weeks.",
          "The review expects a staged trend, not a claim that churn has vanished.",
        ],
        "tradeoff",
        [
          [
            "Deploy a staged process pilot with a joint review",
            [17, 5, 8, 6, -7],
            "A slower recovery with shared operational ownership.",
            "The trust meter rises gradually. Renewals are still uncertain, but the handoff burden starts to fall.",
            "recover",
            "Continue the renewal cohort review; early process improvement is not yet recovered revenue.",
          ],
          [
            "Expand the commercial offer now and monitor exits",
            [5, 0, -4, 21, 3],
            "Faster relief with unresolved process costs.",
            "The offer reaches clients first. Claims teams still carry the handoff problem into the next quarter.",
            "surge",
            "Separate offer effects from service recovery before making the offer permanent.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-a",
        delta: [6, 0, 9, 3, -6],
        reaction:
          "The coalition you built makes the joint review operational instead of ceremonial.",
        kind: "recover",
        constraint:
          "Shared ownership helps recovery; departed clients still need time to rebuild trust.",
      },
    ],
  ),
  project(
    "feature-factory",
    "The Feature Factory",
    "A growth company that worships launch velocity",
    "Balance visible velocity and reliability",
    "execution-metrics",
    ["High pressure", "Technical"],
    ["#211b34", "#eee8ff", "#b295ff"],
    [
      "short_term_win|Short-term win|50",
      "reliability_debt|Reliability debt|35|100|bad",
      "eng_lead_trust|Engineering trust|48",
      "political_capital|Political capital|60",
      "board_visibility|Board visibility|45",
    ],
    [
      "Velocity Junkie|Pursues visible delivery while carrying reliability debt.",
      "Stabilizer|Builds a credible measurement and reliability foundation.",
    ],
    [
      [
        "Demo Day",
        "A beautiful engagement dashboard is due today. It counts clicks but cannot tie them to retained users.",
        [
          "Clicks grew 31%; retained cohorts are unavailable in the launch dashboard.",
          "The engineering lead says a metric fix costs a sprint of an exhausted team.",
          "A warehouse sample suggests repeat use may be flat.",
        ],
        "tradeoff",
        [
          [
            "Ship the dashboard on the promised date",
            [25, 23, -9, 12, 16],
            "Earn visibility with an unresolved measurement gap.",
            "The launch tiles light up. A retention blind spot is now inside the release.",
            "surge",
            "The next incident will have noisy engagement data and no trusted cohort baseline.",
          ],
          [
            "Delay for a cohort metric and explicit scope cut",
            [-13, -12, -6, -14, -4],
            "Miss the date and ask a tired lead to do less, more carefully.",
            "The launch clock stops being the headline. The lead needs proof that the scope cut is real.",
            "dim",
            "You owe a smaller release, a trustworthy baseline, and a recovery in team trust.",
          ],
        ],
      ],
      [
        "Debt Collector",
        "A critical failure appears. The company wants a diagnosis and another feature at the same time.",
        [
          "Event retries duplicate dashboard activity during the outage.",
          "The on-call lead can isolate one subsystem or keep the release train running.",
          "Support sees failed user actions while the headline chart trends upward.",
        ],
        "rank",
        [
          [
            "Isolate the subsystem and repair the measurement",
            [-8, -24, 21, -10, -3],
            "Spend visible delivery momentum on reliable diagnosis.",
            "The false growth tiles fracture and the affected subsystem is isolated. On-call load starts to settle.",
            "recover",
            "Explain a lower but credible number at the quarterly review.",
          ],
          [
            "Patch the symptom and keep the next release moving",
            [16, 17, -15, 7, 11],
            "Protect the release narrative while diagnosis remains noisy.",
            "The dashboard brightens before the incident is fully understood. The lead’s trust dims.",
            "fracture",
            "The review inherits a visible win and a larger reliability liability.",
          ],
        ],
      ],
      [
        "Zenith Review",
        "Choose the evidence the board will use to fund next quarter.",
        [
          "A retention cohort shows slower gains than the activity chart.",
          "Reliability work reduces repeat incidents, but has no launch headline.",
          "A fragile high-growth claim makes the next failure more public.",
        ],
        "frame",
        [
          [
            "Lead with launch velocity and the growth headline",
            [14, 12, -7, 12, 20],
            "Visibility increases faster than confidence in the underlying signal.",
            "The board sees a bold growth line, with reliability debt still casting a visible shadow.",
            "surge",
            "Future incident costs are attached to the growth promise.",
          ],
          [
            "Show cohort outcomes, debt and a reliability budget",
            [-3, -18, 17, 4, 3],
            "A smaller claim earns a concrete operating budget.",
            "The board sees fewer fireworks and a stable baseline with owners.",
            "recover",
            "Maintain the cohort definition and debt review as delivery resumes.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 2,
        flag: "c1-a",
        delta: [0, 12, -5, -7, 0],
        reaction:
          "The dashboard shipped without cohorts; duplicated events make this incident more expensive to diagnose.",
        kind: "fracture",
        constraint:
          "Reconcile retained users before treating activity growth as recovery.",
      },
    ],
  ),
  project(
    "ghost-metric",
    "The Ghost Metric",
    "An AI infrastructure firm dazzled by a single growth number",
    "Audit the North Star and communicate an uncomfortable truth",
    "root-cause",
    ["Technical", "Corporate"],
    ["#eeeae0", "#352b20", "#a66921"],
    [
      "audit_depth|Audit depth|25",
      "cto_trust|CTO trust|62",
      "fix_speed|Fix speed|50",
      "team_exhaustion|Team exhaustion|42|100|bad",
      "board_mandate|Board mandate|45",
    ],
    [
      "Truth Teller|Names the measurement failure directly and owns its cost.",
      "Strategist|Builds an executable route to a more honest metric.",
    ],
    [
      [
        "The Mirage",
        "The North Star says inference demand doubled. Billing and active workloads tell different stories.",
        [
          "Request count +102%; paid workloads +8% over the same window.",
          "A raw retry log is large enough to consume most of the review preparation window.",
          "A customer reports identical retries being counted as distinct workloads.",
        ],
        "investigate",
        [
          [
            "Cross-reference full retries, billing and unique jobs",
            [35, -3, -15, 14, 4],
            "Trade preparation time for direct audit evidence.",
            "The glowing metric splits into unique jobs and retries. Growth is still real, but the headline is not.",
            "fracture",
            "Present a smaller number with the raw reconciliation available.",
          ],
          [
            "Sample the dashboard and keep the board narrative",
            [8, 6, 15, -3, 9],
            "Preserve speed while the retry discrepancy stays unresolved.",
            "The polished chart holds. Its unverified denominator follows you into the CTO meeting.",
            "fog",
            "The growth claim is provisional until retries and paid workloads are reconciled.",
          ],
        ],
      ],
      [
        "The Truth",
        "The CTO sponsored the original metric. Framing affects whether the fix becomes a mandate or a slow negotiation.",
        [
          "The CTO asks whether the old claim was wrong or the product has evolved.",
          "Engineering can support one instrumentation change this cycle.",
          "The board deck still includes the headline growth number.",
        ],
        "frame",
        [
          [
            "Disclose the measurement failure and request a mandate",
            [8, -19, 20, 13, 20],
            "Faster authority, greater defensiveness and exhaustion.",
            "The CTO leans away, then authorises a narrow correction with a hard deadline.",
            "dim",
            "Use the mandate without turning the correction into an unbounded team sprint.",
          ],
          [
            "Frame a metric evolution with a dated reconciliation",
            [4, 13, -11, -4, -5],
            "Maintain trust, accept a slower correction.",
            "The meeting stays calm. The dated reconciliation is the only protection against a cosmetic rename.",
            "recover",
            "A slower transition must still retire the old claim publicly.",
          ],
        ],
      ],
      [
        "Realignment",
        "A new honest metric needs both an owner and an explicit retirement of the old chart.",
        [
          "Unique paid jobs better match billing but lose the impressive growth curve.",
          "A dual-reporting window lets Sales explain the change.",
          "Running both pipelines indefinitely adds maintenance work.",
        ],
        "tradeoff",
        [
          [
            "Replace the old metric immediately with unique paid jobs",
            [15, -8, 16, 18, 13],
            "A quick truth with operational and relationship costs.",
            "The amber chart settles on a smaller denominator. The team carries a concentrated migration load.",
            "recover",
            "Check instrumentation completeness before claiming the new chart is final.",
          ],
          [
            "Run a bounded dual-reporting transition",
            [12, 11, -6, 6, 4],
            "A slower truth with an explicit end date and duplicate work.",
            "Two charts sit side by side. A sunset card prevents ‘temporary’ from becoming permanent.",
            "fog",
            "Retire the legacy headline at the agreed checkpoint.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c1-b",
        delta: [-10, -7, -10, 8, -6],
        reaction:
          "The shallow initial sample leaves a reconciliation gap. The team must close it before certifying the new metric.",
        kind: "fog",
        constraint:
          "The replacement is provisional until the raw retry audit is complete.",
      },
    ],
  ),
  project(
    "pivot-point",
    "The Pivot Point",
    "A clinical health-tech team facing an operating budget ceiling",
    "Triage outcome depth against access and capacity",
    "product-sense",
    ["High pressure", "Corporate"],
    ["#e7f0ec", "#173b38", "#168d82"],
    [
      "patient_impact|Patient impact|55",
      "budget_strain|Budget strain|45|100|bad",
      "cmo_support|CMO support|58",
      "board_scepticism|Board scepticism|45|100|bad",
      "resource_crisis|Resource pressure|35|100|bad",
    ],
    [
      "Specialist|Protects depth of benefit for a smaller group.",
      "Humanitarian|Expands access while managing the burden on delivery.",
    ],
    [
      [
        "Triage Dilemma",
        "A recovery tool works well for a small group. An accessible model could reach more people with shallower support. This is a fictional product allocation exercise, not clinical advice.",
        [
          "Intensive service: 40 simulated participants, high completion, high cost per person.",
          "Accessible service: potential reach 6× larger, lower observed completion in a small pilot.",
          "The operations budget cannot fund both models at full capacity.",
        ],
        "tradeoff",
        [
          [
            "Double down on the intensive recovery service",
            [24, 24, 18, 17, 9],
            "Deeper benefit for fewer people with a tight budget.",
            "The CMO’s seat brightens; the capacity board turns amber.",
            "surge",
            "Protect the high-cost cohort without claiming it can scale unchanged.",
          ],
          [
            "Pivot toward a lower-cost access model",
            [12, -12, -16, -9, 21],
            "Broader reach with a lower-touch service burden.",
            "More doors open on the access map. The CMO questions what support has been lost.",
            "dim",
            "Demonstrate a quality floor before expanding access.",
          ],
        ],
      ],
      [
        "CMO Standoff",
        "The medical officer wants an explicit benefit floor; the board wants a funded operating model.",
        [
          "The pilot was not randomised; differences cannot be attributed to the service alone.",
          "A bounded quality review is feasible without a full platform rebuild.",
          "Staff report that access growth can overwhelm triage even when unit cost falls.",
        ],
        "frame",
        [
          [
            "Protect clinical depth and cap intake explicitly",
            [14, 15, 15, 12, -5],
            "Make the exclusion of some demand visible to the board.",
            "The intake boundary becomes a real card, not a hidden waiting list.",
            "recover",
            "Capacity is protected; excluded demand still needs an honest explanation.",
          ],
          [
            "Agree an access quality floor with staged enrolment",
            [9, -4, 12, -7, 8],
            "Accept measured lower-touch delivery with a safety checkpoint.",
            "The CMO and operations lead share the same quality-floor card.",
            "recover",
            "The quality floor is binding even if acquisition exceeds the plan.",
          ],
        ],
      ],
      [
        "Patient Pivot",
        "Deployment changes who receives help and how much operational slack remains.",
        [
          "Intensive demand exceeds capacity; the waitlist is not an outcome.",
          "Access demand can arrive faster than onboarding support can expand.",
          "The board will fund a bounded model, not an unlimited commitment.",
        ],
        "tradeoff",
        [
          [
            "Fund depth, with a published capacity cap",
            [17, 19, 12, 6, -3],
            "Life-changing support for a smaller simulated cohort.",
            "The depth lane stays staffed while unmet demand remains visible beside it.",
            "recover",
            "Keep the waiting-list burden visible alongside cohort outcomes.",
          ],
          [
            "Fund reach, with an explicit triage expansion",
            [13, 2, -2, -7, 19],
            "More people reached, with real pressure on delivery capacity.",
            "The access map grows; resource pressure remains an operating constraint.",
            "surge",
            "Audit the quality floor as the larger cohort arrives.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c1-b",
        choice: "c3-b",
        delta: [6, 7, 0, 0, 14],
        reaction:
          "The access route’s earlier demand now reaches triage. More reach does not remove the resource crisis.",
        kind: "surge",
        constraint:
          "Expand trained capacity or slow enrolment at the quality floor.",
      },
    ],
  ),
  project(
    "legacy-fracture",
    "The Legacy Fracture",
    "A logistics company running a museum-grade routing system",
    "Modernise without declaring war on the old guard",
    "root-cause",
    ["Corporate", "Technical", "Political"],
    ["#302a1d", "#eee4ca", "#d2b466"],
    [
      "old_guard_trust|Veteran trust|62",
      "board_mandate_speed|Mandate speed|40",
      "budget_security|Budget security|48",
      "migration_friction|Migration friction|45|100|bad",
      "fleet_health|Fleet health|58",
    ],
    [
      "Architect|Builds a staged technical path through the organisation.",
      "Diplomat|Builds trust with the people who must operate the change.",
      "Insurgent|Uses an explicit mandate to break an entrenched system.",
    ],
    [
      [
        "Gilded Line",
        "Routing software reports on-time performance that delivery logs dispute. Veterans built the system that the board now wants to replace.",
        [
          "Official on-time delivery is 96%; dispatch logs suggest 82% in two districts.",
          "A veteran dispatcher knows the manual exception process.",
          "The budget committee meets before a two-week proof of concept can finish.",
        ],
        "investigate",
        [
          [
            "Expose the discrepancy to the board now",
            [-24, 28, 14, 15, -4],
            "Earn a mandate while burning trust with the operators.",
            "The gilded dashboard cracks. Veterans see their work turned into an executive failure story.",
            "fracture",
            "You have authority without an operating coalition.",
          ],
          [
            "Build a proof of concept with the dispatch veterans",
            [20, -16, -13, -12, 6],
            "Earn trust, risk the funding window.",
            "A worn paper route and a new model share one desk. The budget clock moves ahead.",
            "recover",
            "The proof has operators, but funding remains exposed.",
          ],
        ],
      ],
      [
        "Coalition War",
        "Choose whose support carries the migration when executive attention moves elsewhere.",
        [
          "Operations can field-test one depot next week.",
          "Finance can protect a budget line now, but cannot operate the new workflow.",
          "Two competing routing systems will create daily dispatch disputes.",
        ],
        "ally",
        [
          [
            "Partner with operational managers",
            [17, 6, -5, -12, 10],
            "Faster ground adoption, weaker budget air cover.",
            "Depot leads take ownership of the first migration board.",
            "recover",
            "Protect the pilot’s funding while operators prove the new workflow.",
          ],
          [
            "Secure Finance as the executive sponsor",
            [-12, 15, 23, 16, 0],
            "Secure money while frontline adoption becomes harder.",
            "The budget line locks in. Dispatch seats dim as the mandate arrives from above.",
            "dim",
            "A funded migration still needs the operators to use it.",
          ],
        ],
      ],
      [
        "Great Migration",
        "An overnight switch removes duplicate systems. A phased migration preserves a fallback but creates a two-speed company.",
        [
          "A full switch has no tested fleet-wide fallback below fleet health 50.",
          "A depot pilot can isolate issues, but keeps old and new contracts alive.",
          "The morning dispatch wave cannot wait for a governance meeting.",
        ],
        "tradeoff",
        [
          [
            "Switch the fleet overnight",
            [-8, 18, 5, 18, -16],
            "One system quickly, with an explicit fleet continuity risk.",
            "The routing map changes in one sweep. Any unresolved operating gap now affects the full fleet.",
            "surge",
            "Reconcile the first dispatch wave before declaring migration complete.",
          ],
          [
            "Migrate depot by depot with a fallback",
            [10, -8, -9, -14, 18],
            "A safer transition and a longer political battle.",
            "The map runs in two colours. Dispatch keeps a fallback while each depot earns the next cutover.",
            "recover",
            "Retire each old route only after its depot meets the readiness check.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c1-a",
        choice: "c3-a",
        delta: [-12, 0, -8, 16, -25],
        reaction:
          "The overnight switch inherits the operator gap created by the public exposure. Dispatch stalls until veterans reconstruct the missing exceptions.",
        kind: "fracture",
        constraint:
          "Restore fleet service before pursuing further migration speed.",
      },
    ],
  ),
  project(
    "shadow-roadmap",
    "The Shadow Roadmap",
    "A chrome-cold product organisation with competing internal maps",
    "Navigate hidden agendas without losing an executable truth",
    "strategy",
    ["Political", "Corporate"],
    ["#181e25", "#e5e9ed", "#b7c7d4"],
    [
      "architect_ally|Architect alliance|40",
      "vp_trust|VP trust|60",
      "inner_circle_status|Inner-circle access|40",
      "fix_speed|Fix speed|48",
      "political_liability|Political liability|28|100|bad",
    ],
    [
      "Insider|Uses access and framing to make change executable.",
      "Whistleblower|Makes the discrepancy visible while accepting political costs.",
    ],
    [
      [
        "The Spread",
        "In this fictional workspace, authorised planning exports disagree with the official roadmap. Who hears it first changes who will work with you.",
        [
          "The published roadmap promises a general release; the architecture plan has a six-month dependency.",
          "The architect’s planning note calls the external date ‘commercial, not technical’.",
          "The VP has already committed the date to the board.",
        ],
        "ally",
        [
          [
            "Confront the architect privately with the discrepancy",
            [25, -4, 16, 7, 8],
            "Build an ally while becoming linked to the private account.",
            "One quiet channel opens. The architect gives you the dependency map and expects discretion.",
            "fog",
            "Your private access needs an honest route into the official plan.",
          ],
          [
            "Take the documented risk directly to the VP",
            [-16, -10, -8, 18, 17],
            "Earn a quicker executive decision and visible political exposure.",
            "The discrepancy lands on the VP’s desk. The architect stops volunteering context.",
            "dim",
            "You need a recovery plan that does not depend on quiet architectural favours.",
          ],
        ],
      ],
      [
        "Resource Cipher",
        "The same dependency can be framed as an evolution or as a critical delivery risk.",
        [
          "There is one available engineering pod.",
          "Evolution framing preserves the earlier promise longer.",
          "Risk framing gets a faster resource decision, but makes the promise owner defensive.",
        ],
        "frame",
        [
          [
            "Frame a strategic evolution with a dated correction",
            [9, 13, 20, -10, -5],
            "Keep access while carrying a slower technical correction.",
            "The roadmap slides rather than fractures. An explicit correction date is the accountability anchor.",
            "recover",
            "The quiet plan must become a public correction at the checkpoint.",
          ],
          [
            "Call out critical delivery risk and name an owner",
            [-8, -14, -14, 24, 18],
            "Trade access for a faster corrective mandate.",
            "A red dependency cuts across the roadmap. Funding moves, and your political liability rises.",
            "fracture",
            "A fast mandate still needs people willing to execute it.",
          ],
        ],
      ],
      [
        "The Reveal",
        "The board needs the true delivery plan. Private access and public accountability have both accumulated costs.",
        [
          "The dependency is real regardless of who first disclosed it.",
          "A corrected date without owners is another shadow roadmap.",
          "Public blame may remove the people needed to execute the recovery.",
        ],
        "frame",
        [
          [
            "Present a coalition-owned correction and its limits",
            [11, 7, 9, 8, -6],
            "Shared accountability may soften who owns the original error.",
            "Two maps become one with named owners. The board gets a feasible route, not a spotless history.",
            "recover",
            "Track the corrected dependency openly, including missed commitments.",
          ],
          [
            "Present the full discrepancy trail with individual accountability",
            [-13, -12, -10, 15, 14],
            "Maximum clarity may burn execution bridges.",
            "The evidence trail becomes visible. The room accepts the facts while relationships cool.",
            "dim",
            "Replace lost execution support with explicit ownership before the next milestone.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c1-a",
        choice: "c3-a",
        delta: [9, 4, 7, 6, 3],
        reaction:
          "The private architectural ally now helps reconcile dependencies, while association with the old plan remains a liability.",
        kind: "recover",
        constraint:
          "Your coalition must own the correction, not conceal the original discrepancy.",
      },
    ],
  ),
  project(
    "trojan-horse",
    "The Trojan Horse",
    "A hyper-growth consumer company inside a permanent victory party",
    "Separate accidental growth engines from expensive bugs",
    "product-sense",
    ["High pressure", "Crisis"],
    ["#2e1831", "#ffe6ee", "#eea3cb"],
    [
      "growth_rate|Growth rate|72",
      "burn_rate|Burn pressure|58|100|bad",
      "partner_segment_health|Partner health|64",
      "user_sentiment|User sentiment|66",
      "app_store_rating|Store reputation|73",
    ],
    [
      "Pragmatist|Bounds the cost of an imperfect growth mechanism.",
      "Purist|Removes the defect while accepting the ecosystem cost.",
      "Partner Guardian|Protects a legitimate channel while separating misuse.",
    ],
    [
      [
        "Golden Spike",
        "Circular referrals issue double rewards. Users see a generous feature; Finance sees unbounded liability.",
        [
          "Referral signups +68%; reward expense +130%.",
          "Support says users publicly teach each other the reward loop.",
          "Some high-value partner referrals share the same transaction pattern.",
        ],
        "tradeoff",
        [
          [
            "Kill the reward loop immediately",
            [-24, -27, -12, -23, -15],
            "Stop the bleed before distinguishing legitimate dependencies.",
            "The neon growth line drops. Reward-seeking users start a coordinated complaint thread.",
            "fracture",
            "The partner segment may be collateral damage; investigate it before the final fix.",
          ],
          [
            "Phase out rewards with a disclosed cost cap",
            [-8, -9, 5, 3, -2],
            "Keep the peace while continuing a bounded expense.",
            "A brass cap appears on the reward pool. Growth continues with a visible burn limit.",
            "fog",
            "The phase-out must finish before the capped reward pool is spent.",
          ],
        ],
      ],
      [
        "Hidden Engine",
        "The same loop also powers a valuable partner channel. Removing a bug and preserving a channel are separate decisions.",
        [
          "Partner referrals have higher paid conversion than circular consumer loops.",
          "Finance cannot fund the original reward indefinitely.",
          "A partner allowlist is possible but adds operating complexity.",
        ],
        "tradeoff",
        [
          [
            "Fix every instance of the loop uniformly",
            [-12, -20, -25, -8, -5],
            "Clean the books and accept damage to the profitable channel.",
            "The ledger becomes simpler. Partner seats dim as their acquisition path disappears.",
            "dim",
            "The final release needs a clear partner recovery story.",
          ],
          [
            "Formalise a capped partner-only version",
            [8, 13, 23, 2, 1],
            "Protect the channel while institutionalising a bounded inefficiency.",
            "The partner lane stays bright. Finance now expects a real unit-economics review.",
            "recover",
            "The partner exception needs a hard cap and an explicit review.",
          ],
        ],
      ],
      [
        "The Bill Comes Due",
        "The final launch can end the reward ambiguity or extend it into another funding discussion.",
        [
          "An abrupt consumer cutover risks rating backlash.",
          "A slow uncapped extension risks a forced funding round.",
          "A published sunset and partner cap can be monitored against actual redemption.",
        ],
        "tradeoff",
        [
          [
            "Enforce the cutover immediately with refunds for errors",
            [-13, -22, -8, -17, -18],
            "Faster financial control with a visible user backlash.",
            "The party lights fracture. Refunds address errors, while users still mourn the old reward.",
            "fracture",
            "Rebuild trust without promising to restore an unsustainable reward.",
          ],
          [
            "Publish a short sunset and cap the partner exception",
            [-4, -9, 10, 8, 4],
            "A softer landing with a small, continuing financial burden.",
            "The reward clock becomes a dated sunset. The partner lane stays visible beside the cost cap.",
            "recover",
            "Retire the consumer reward at the deadline and review partner payback.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-b",
        choice: "c3-b",
        delta: [5, 9, 8, 0, 0],
        reaction:
          "The partner feature you formalised preserves conversion and keeps a residual reward cost. The exception has not become free.",
        kind: "surge",
        constraint:
          "Measure partner contribution after rewards, not gross referral volume.",
      },
    ],
  ),
  project(
    "invisible-wall",
    "The Invisible Wall",
    "A stealth AI lab with a hidden compute throttle",
    "Balance capability, safety and technical trust",
    "ai-technical",
    ["Technical", "Political"],
    ["#252b2e", "#e7efeb", "#b8d3c4"],
    [
      "velocity|Velocity|61",
      "architect_trust|Architect trust|56",
      "system_stability|System stability|65",
      "competitive_edge|Competitive edge|64",
      "founding_member_trust|Founder trust|55",
    ],
    [
      "Guardian|Makes a safety boundary inspectable and operational.",
      "Optimizer|Pursues capability while owning the control burden.",
    ],
    [
      [
        "Opaque Orbit",
        "A hidden process throttles compute near a capability milestone. You can work around it or surface the anomaly through the architecture owner.",
        [
          "Throughput falls 38% near a repeatable evaluation threshold.",
          "The process has a founder-owned deployment signature.",
          "The ordinary performance dashboard labels the drop ‘capacity noise’.",
        ],
        "investigate",
        [
          [
            "Flag the anomaly and preserve the control while investigating",
            [-17, 19, 10, -10, 12],
            "Lose velocity and gain the context behind the boundary.",
            "The opaque node stays in the graph. The architect opens the control history.",
            "fog",
            "Explain the slowdown while the control’s purpose is verified.",
          ],
          [
            "Build a private workaround to keep the milestone moving",
            [19, -17, -15, 14, -14],
            "Keep speed while accepting a trust and exposure risk.",
            "A new path bypasses the opaque connection. The audit trail now contains an unreviewed control change.",
            "surge",
            "The next review must account for the bypass, not only the performance gain.",
          ],
        ],
      ],
      [
        "Shadow Lead",
        "The throttle is an intentional safety switch. The founder installed it to prevent an unreviewed capability jump.",
        [
          "Load tests above the threshold show inconsistent tool behaviour.",
          "The safety team can instrument the switch as an explicit product control.",
          "A competitor advertises the throughput number without an equivalent safety claim.",
        ],
        "tradeoff",
        [
          [
            "Integrate the switch as an observable safety boundary",
            [-10, 15, 22, -17, 18],
            "A stable product with a weaker raw capability headline.",
            "The opaque connection becomes a named control with an owner and evaluation log.",
            "recover",
            "The launch must sell a bounded capability rather than the fastest raw throughput.",
          ],
          [
            "Dismantle the switch for a controlled capability demonstration",
            [18, -18, -29, 22, -21],
            "A stronger demonstration with an explicit load-instability risk.",
            "The boundary vanishes. The network shimmers faster while the stability path flickers.",
            "fracture",
            "A high-capability demo needs isolation and a plan for erratic load behaviour.",
          ],
        ],
      ],
      [
        "The Breach",
        "The product faces sustained load. Pick a release envelope that matches the control history.",
        [
          "A bounded rollout can isolate abnormal tool behaviour.",
          "A broad demonstration maximises the competitive headline.",
          "The previous safety-switch decision changes how much isolation is left.",
        ],
        "tradeoff",
        [
          [
            "Release within an instrumented operating envelope",
            [-4, 10, 18, -9, 10],
            "Protect predictable behaviour and accept a bounded headline.",
            "The network settles into a clear envelope. Capability is narrower but inspectable.",
            "recover",
            "Expand only after evaluation supports a broader envelope.",
          ],
          [
            "Show maximum capability to the full audience",
            [14, -8, -18, 17, -10],
            "Win visibility while exposing unresolved load behaviour.",
            "The graph brightens under demand; every unstable connection is now user-visible.",
            "surge",
            "External trust now depends on the control burden exposed during the demonstration.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-b",
        choice: "c3-b",
        delta: [0, -9, -23, 3, -14],
        reaction:
          "Removing the switch and then widening exposure reproduces the known erratic-load condition. The fracture is the cost of both explicit choices.",
        kind: "fracture",
        constraint:
          "Contain load and restore inspectable controls before expansion.",
      },
    ],
  ),
  project(
    "deadlock",
    "The Deadlock",
    "A robotics company with hardware and software at an impasse",
    "Resolve cross-team stalemates with transparent evidence",
    "behavioral",
    ["Technical", "High pressure"],
    ["#113d40", "#f3e9d7", "#f3a453"],
    [
      "robotics_resentment|Robotics resentment|48|100|bad",
      "software_resentment|Software resentment|48|100|bad",
      "runway_remaining|Runway|12|26",
      "prototype_readiness|Prototype readiness|52",
      "team_alignment|Team alignment|35",
    ],
    [
      "Mediator|Makes the compromise and its evidence jointly owned.",
      "Decider|Chooses a direction and takes responsibility for the resulting asymmetry.",
    ],
    [
      [
        "Boiler Room",
        "Robotics wants autonomy; software wants strict safety overrides. The prototype cannot satisfy both teams’ ideal design on the remaining runway.",
        [
          "Autonomy makes the demo impressive but needs a supervisor in edge cases.",
          "Software’s override design passes more tests but delays integration.",
          "Both teams describe their own assumption as non-negotiable.",
        ],
        "tradeoff",
        [
          [
            "Reframe the prototype around shared minimum requirements",
            [-13, -13, -3, -8, 23],
            "Spend runway on alignment before building the next version.",
            "Two competing sketches become one bounded prototype brief.",
            "recover",
            "The foundation is shared; the lost runway makes scope discipline binding.",
          ],
          [
            "Choose autonomy and own the integration decision",
            [-10, 23, -1, 18, -13],
            "Get a demo sooner and accept a software resentment loop.",
            "The prototype moves forward. Software’s seat dims as its override concerns remain open.",
            "dim",
            "The next sprint inherits a public decision and an unresolved safety case.",
          ],
        ],
      ],
      [
        "Evidence Breach",
        "Validated tests contradict both teams. You decide whether the same evidence reaches everyone at the same time.",
        [
          "Autonomy fails in a narrow surface condition; strict overrides cause unnecessary stops.",
          "A joint test envelope can bound both failures.",
          "Selective reporting will make any compromise look politically chosen.",
        ],
        "frame",
        [
          [
            "Share the full tests and negotiate one operating envelope",
            [-16, -17, -1, 9, 25],
            "Take a temporary confidence dip while both assumptions change.",
            "The evidence board lights both failure modes. No team gets to keep an untouched story.",
            "recover",
            "The compromise is shared, but the product’s wow factor is narrower.",
          ],
          [
            "Brief team leads separately and enforce the selected design",
            [10, 12, 0, 13, -8],
            "Move faster with less shared ownership of the evidence.",
            "Two partial accounts leave the room. The build advances without settling the mutual suspicion.",
            "fog",
            "Supervision and escalation costs remain part of launch readiness.",
          ],
        ],
      ],
      [
        "First Run",
        "The robot is deployed into a bounded environment. The chosen operating envelope determines the supervision it needs.",
        [
          "A compromise design completes routine tasks reliably.",
          "Bold autonomy still needs expensive human intervention in the tested edge case.",
          "The next buyer asks who owns the supervision bill.",
        ],
        "tradeoff",
        [
          [
            "Deploy the aligned envelope and show its limitations",
            [-8, -8, -1, 12, 16],
            "A stable, less spectacular product with a shared support model.",
            "The robot follows a clear route. Both teams can explain the stop boundary.",
            "recover",
            "Expand the operating envelope only after a joint test.",
          ],
          [
            "Demonstrate bold autonomy with staffed supervision",
            [4, 15, -2, 20, -5],
            "An impressive demonstration with an explicit human operating cost.",
            "The prototype performs; the supervisor remains a visible part of the system.",
            "surge",
            "Do not treat a supervised demonstration as an autonomous cost structure.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-b",
        delta: [8, 8, -1, -3, -10],
        reaction:
          "Separate evidence briefings left the resentment loop unresolved. Integration support costs another planning week.",
        kind: "dim",
        constraint:
          "Resolve joint ownership before promising a low-supervision scale-up.",
      },
    ],
  ),
  project(
    "public-fracture",
    "The Public Fracture",
    "A prestige consumer brand under public firmware scrutiny",
    "Coordinate technical containment and crisis communication",
    "execution-metrics",
    ["Crisis", "High pressure"],
    ["#321b23", "#f3e5e6", "#ef8c8f"],
    [
      "user_loyalty|User loyalty|62",
      "media_headline_risk|Headline risk|40|100|bad",
      "support_load|Support load|45|100|bad",
      "stock_pressure|Stock pressure|45|100|bad",
      "long_term_trust|Long-term trust|60",
    ],
    [
      "Truth Teller|Makes uncertainty and user impact visible.",
      "Firefighter|Contains the immediate disruption and owns the response burden.",
    ],
    [
      [
        "First Spark",
        "A firmware update appears to break devices. Reports are concentrated on one hardware revision, but the early sample is incomplete.",
        [
          "Failure reports affect 3% of updated devices; most identify hardware revision B.",
          "Support cannot yet separate update failures from recoverable restarts.",
          "A total rollback disrupts unaffected users and creates a clear media headline.",
        ],
        "tradeoff",
        [
          [
            "Roll back everywhere and acknowledge the uncertainty",
            [6, 24, 8, 18, 10],
            "Stop further exposure while triggering broad stability concern.",
            "The rollout stops across the map. A large red headline now carries the uncertainty.",
            "fracture",
            "Communicate why unaffected users were interrupted and what remains unknown.",
          ],
          [
            "Isolate revision B while keeping the majority online",
            [-8, 6, 15, 6, -4],
            "Preserve service, leave an affected cohort waiting longer.",
            "One hardware lane is cordoned off. The majority stays online while revision B queues grow.",
            "fog",
            "Affected users need targeted updates rather than a reassuring aggregate.",
          ],
        ],
      ],
      [
        "War Room",
        "Technical triage and public language must describe the same incident.",
        [
          "Engineering has a likely revision-B mechanism, not a completed root cause.",
          "Media wants a sentence; support needs recovery instructions.",
          "Hedged language can reduce the headline while increasing confused contacts.",
        ],
        "frame",
        [
          [
            "Publish the impact, uncertainty and next update time",
            [9, 18, -12, 14, 21],
            "Earn durable trust and give the press a clean incident story.",
            "The communication board becomes legible. Support can reuse the same facts users see.",
            "recover",
            "Keep the promised update cadence even when the fix slips.",
          ],
          [
            "Use carefully hedged language until the fix is certain",
            [-8, -13, 24, -8, -19],
            "Contain immediate market anxiety while support absorbs ambiguity.",
            "The headline dims. Support queues fracture into conflicting interpretations.",
            "dim",
            "The remediation must repair both devices and the information gap.",
          ],
        ],
      ],
      [
        "Trust Audit",
        "A technical remediation is ready. The response’s trust cost does not disappear when the patch ships.",
        [
          "The fix restores the known failing revision in a controlled sample.",
          "Some users now hesitate to accept any update.",
          "A transparent recovery log can show progress without claiming total certainty.",
        ],
        "tradeoff",
        [
          [
            "Stage remediation with a public recovery log",
            [13, 4, -15, 4, 18],
            "Slower visible recovery with a credible record.",
            "The fracture closes in stages. Users can inspect what has recovered and what has not.",
            "recover",
            "Track update acceptance as well as technical recovery.",
          ],
          [
            "Push a fast remediation and prioritise a reassuring launch story",
            [3, -8, -6, -9, -10],
            "Quicker containment with a lingering trust tax.",
            "The patch reaches users quickly. The earlier communication burden remains in update hesitation.",
            "surge",
            "A faster fix does not certify restored trust.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-b",
        delta: [-7, 6, 12, 0, -13],
        reaction:
          "Earlier hedging left support with contradictory expectations. The patch inherits an extra trust and support burden.",
        kind: "dim",
        constraint:
          "Resolve the information gap alongside the technical remediation.",
      },
    ],
  ),
  project(
    "last-mile",
    "The Last Mile",
    "A delivery platform during a monsoon that floods half the city",
    "Balance couriers, restaurants and customers under crisis",
    "behavioral",
    ["Crisis", "High pressure"],
    ["#252d30", "#eef0db", "#e5d465"],
    [
      "courier_safety|Courier safety|60",
      "restaurant_loyalty|Restaurant loyalty|59",
      "customer_trust|Customer trust|60",
      "daily_active_users|Service continuity|66",
      "financial_pressure|Financial pressure|45|100|bad",
    ],
    [
      "Fleet protection|Protects couriers while making service limits explicit.",
      "Partner protection|Protects restaurant relationships while carrying the financial cost.",
    ],
    [
      [
        "The Surge",
        "Flooded wards strand half the fleet. Decisions here represent a fictional service crisis, not operational emergency advice. Routes declared unsafe remain closed in every option.",
        [
          "Half of dispatchable couriers cannot reach their assigned wards.",
          "Some customers rely on delivery while safe routes still exist elsewhere.",
          "Higher pay can attract capacity; it cannot make a flooded route safe.",
        ],
        "tradeoff",
        [
          [
            "Pause affected wards and communicate the service boundary",
            [24, 2, -7, -23, 18],
            "Protect couriers while leaving real demand unserved.",
            "Flooded wards go dark on the service map. The boundary is visible to customers and partners.",
            "recover",
            "The next decision must address stranded demand and partner losses.",
          ],
          [
            "Use surge pay only on verified safe routes",
            [3, -5, -10, 12, 8],
            "Preserve some service with affordability and workload pressure.",
            "Safe corridors remain lit. Surge pay attracts couriers but exposes an equity and workload tradeoff.",
            "surge",
            "Maintain the route boundary and explain who still cannot get service.",
          ],
        ],
      ],
      [
        "The Rebellion",
        "Restaurants cancel shifts because staff cannot travel. Refunds are necessary; deciding who carries the losses changes the coalition you have for recovery.",
        [
          "Automatic penalties would hit businesses already unable to operate safely.",
          "Absorbing losses protects partners but strains the platform budget.",
          "Customers need a clear refund and service-update cadence either way.",
        ],
        "tradeoff",
        [
          [
            "Refund customers and apply the existing restaurant penalties",
            [0, -26, 8, -4, -11],
            "Protect platform cash while imposing costs on flooded businesses.",
            "Refunds clear. Restaurant seats dim as penalties arrive during forced closure.",
            "dim",
            "Recovery will need partner reconciliation, not only courier availability.",
          ],
          [
            "Refund customers and absorb partner penalties this period",
            [3, 21, 10, -5, 24],
            "Protect relationships and customers while carrying the loss yourself.",
            "The ledger turns amber. Refunds are explicit, partner penalties are waived, and the platform owns the financial cost.",
            "recover",
            "The financial envelope now limits the recovery pace.",
          ],
        ],
      ],
      [
        "Recovery",
        "Water recedes at different rates. Restoring every constituency at once is not credible; communicate who recovers first and why.",
        [
          "Couriers ask for route rechecks before accepting new jobs.",
          "Restaurants want reliable demand before recalling staff.",
          "Customers remember whether the blackout communication explained the boundary.",
        ],
        "rank",
        [
          [
            "Reopen safe routes gradually with scheduled public updates",
            [16, 4, 14, 9, 8],
            "A slower restart earns trust and keeps excluded demand visible.",
            "The city map returns ward by ward. Courier checks and public updates move together.",
            "recover",
            "Continue route checks and partner recovery even after the map looks green.",
          ],
          [
            "Prioritise restaurant restart windows on verified routes",
            [6, 17, 3, 18, 14],
            "Support partners and continuity while safe-route capacity stays binding.",
            "Restaurant lanes reopen to known safe corridors. Capacity limits remain visible beside the order queue.",
            "surge",
            "Do not convert restart demand into unsafe courier commitments.",
          ],
        ],
      ],
    ],
    [
      {
        chapter: 3,
        flag: "c2-a",
        delta: [0, -12, -3, -5, 0],
        reaction:
          "The penalties chosen during closure leave restaurants reluctant to restart. Courier availability alone cannot restore the network.",
        kind: "dim",
        constraint:
          "Reconcile partner losses before claiming full platform recovery.",
      },
    ],
  ),
];
export const getProject = (id: string) => projects.find((p) => p.id === id);

// Archetypes describe the actual commitment rather than the option's position.
const archetypeMap: Record<string, string[][]> = {
  "sacred-no": [
    ["Diplomat", "Wall", "Data-backed Guardian"],
    ["Diplomat", "Data-backed Guardian", "Wall"],
    ["Diplomat", "Wall"],
  ],
  "legacy-fracture": [
    ["Insurgent", "Diplomat"],
    ["Diplomat", "Architect"],
    ["Insurgent", "Architect"],
  ],
  "trojan-horse": [
    ["Purist", "Pragmatist"],
    ["Pragmatist", "Partner Guardian"],
    ["Purist", "Partner Guardian"],
  ],
};
for (const p of projects)
  if (archetypeMap[p.id])
    p.chapters.forEach((ch, c) =>
      ch.choices.forEach((choice, i) => {
        choice.archetype = archetypeMap[p.id][c][i];
      }),
    );
