import type { Person } from "./content";
export type Line = {
  id: string;
  speaker: Person;
  text: string;
  emotion: "neutral" | "thinking" | "annoyed" | "approving";
};
const script: Record<string, [Person, Line["emotion"], string][]> = {
  opening: [
    [
      "Elena",
      "approving",
      "Three hundred and forty percent. Let’s celebrate that.",
    ],
  ],
  introElena: [
    [
      "Elena",
      "approving",
      "I’m Elena, CEO. We announced three hundred and forty percent growth.",
    ],
    [
      "Elena",
      "thinking",
      "Investors expect us to explain what that growth actually means.",
    ],
  ],
  introRavi: [
    [
      "Ravi",
      "neutral",
      "I’m Ravi, CTO. My team built the pipeline and AMC definition.",
    ],
    [
      "Ravi",
      "thinking",
      "If something disagrees, show me the source. We will check it together.",
    ],
  ],
  introMarcus: [
    [
      "Marcus",
      "neutral",
      "Marcus, revenue. Our targets and bonuses use that same number.",
    ],
    ["Marcus", "thinking", "Tell me early if the definition needs to change."],
  ],
  introJoyce: [
    [
      "Joyce",
      "neutral",
      "I’m Joyce, your data platform partner. Billing and AMC don’t quite agree.",
    ],
  ],
  caseBrief: [
    [
      "Joyce",
      "neutral",
      "You’re our new Platform Growth PM. You own dashboards and the roadmap.",
    ],
    [
      "Joyce",
      "thinking",
      "In three days, tell the board whether this number represents new demand.",
    ],
    [
      "Joyce",
      "neutral",
      "Twelve audit hours buy sources and joins. Unspent hours become presentation prep.",
    ],
    [
      "Joyce",
      "neutral",
      "Credibility comes from evidence and honest uncertainty. Start with one sample request.",
    ],
  ],
  invitation: [
    [
      "Joyce",
      "thinking",
      "Now, can you look at something? It’s probably nothing.",
    ],
  ],
  coachUnit: [
    [
      "Joyce",
      "neutral",
      "One customer request can create several events. Classify the retry, not the customer.",
    ],
  ],
  coachAudit: [
    [
      "Joyce",
      "neutral",
      "Open a drawer with your audit hours. Inspect its rows, then choose a join.",
    ],
    [
      "Joyce",
      "thinking",
      "Success means knowing what you proved, and what is still uncertain.",
    ],
  ],
  coachJoin: [
    [
      "Joyce",
      "neutral",
      "Choose columns that identify the same thing. Confirming any attempt spends one hour.",
    ],
    [
      "Joyce",
      "thinking",
      "Matched rows can quantify a cause. An empty match tells you why.",
    ],
  ],
  coachEstimate: [
    [
      "Joyce",
      "neutral",
      "Set a point and a range. Both bounds should reflect your actual uncertainty.",
    ],
  ],
  coachCarry: [
    [
      "Joyce",
      "neutral",
      "Decide when to raise this. Waiting uses preparation time and has consequences.",
    ],
  ],
  coachStakeholders: [
    [
      "Joyce",
      "neutral",
      "Choose who hears this first. You can brief others before picking a delivery.",
    ],
  ],
  coachSlides: [
    [
      "Elena",
      "neutral",
      "Give us one headline, sources we can check, and one explicit decision request.",
    ],
  ],
  coachMetric: [
    [
      "Ravi",
      "neutral",
      "Define one unit, its counting rules, and the quality limits beside it.",
    ],
  ],
  coachRedteam: [
    [
      "Marcus",
      "neutral",
      "We test your wording, not your intentions. Close loopholes with three fix hours.",
    ],
  ],
  coachBoard: [
    [
      "Joyce",
      "neutral",
      "The board remembers your estimate and promises. Review them before answering.",
    ],
  ],
  coachAuditV2: [
    [
      "Joyce",
      "neutral",
      "Start with one source. Leave enough hours to test how its rows connect.",
    ],
    [
      "Joyce",
      "thinking",
      "Carry what you can defend, not everything you suspect.",
    ],
  ],
  coachAuditV3: [
    [
      "Joyce",
      "neutral",
      "Pick the drawer most likely to change your mind. Joins cost another hour.",
    ],
    [
      "Joyce",
      "thinking",
      "A smaller, verified claim is useful. You do not need every source.",
    ],
  ],
  coachAuditV4: [
    [
      "Joyce",
      "neutral",
      "Your budget cannot open everything. Choose a source, inspect it, then cross-check it.",
    ],
  ],
  coachJoinV2: [
    [
      "Joyce",
      "neutral",
      "Start from this drawer. Select a target describing the same request or account.",
    ],
    ["Joyce", "thinking", "Review the keys before spending your hour."],
  ],
  coachJoinV3: [
    [
      "Joyce",
      "neutral",
      "A request ID matches requests. An account ID matches accounts. Pick both sides.",
    ],
  ],
  coachJoinV4: [
    [
      "Joyce",
      "neutral",
      "Use the chips or keyboard. Nothing is charged until you confirm the join.",
    ],
  ],
  coachEstimateV2: [
    [
      "Joyce",
      "neutral",
      "How uncertain are you? Choose bounds you can explain from your sources.",
    ],
  ],
  coachEstimateV3: [
    [
      "Joyce",
      "thinking",
      "A precise point can hide uncertainty. Show the range you actually believe.",
    ],
  ],
  coachUnitV2: [
    [
      "Joyce",
      "neutral",
      "The same request can appear again. Decide whether that adds new customer intent.",
    ],
  ],
  coachUnitV3: [
    [
      "Joyce",
      "thinking",
      "Read the event, then classify it. A repeated attempt is not necessarily new demand.",
    ],
  ],
  coachCarryV2: [
    [
      "Joyce",
      "thinking",
      "Move with evidence, spend time verifying, or accept the consequences of staying quiet.",
    ],
  ],
  coachCarryV3: [
    [
      "Joyce",
      "neutral",
      "Choose what leaves the audit. You will need time to prepare the conversation.",
    ],
  ],
  coachBoardV2: [
    [
      "Joyce",
      "thinking",
      "Your words are already in the record. Choose a response you can defend.",
    ],
  ],
  coachBoardV3: [
    [
      "Joyce",
      "neutral",
      "Review the promises and remaining limits. Then put your correction on the record.",
    ],
  ],
  coachStakeholdersV2: [
    [
      "Joyce",
      "neutral",
      "Who needs this directly from you? Set the order before the room hears.",
    ],
  ],
  coachStakeholdersV3: [
    [
      "Joyce",
      "thinking",
      "The owner, sponsor, and target-holder need different conversations. Choose who comes first.",
    ],
  ],
  coachSlidesV2: [
    [
      "Elena",
      "neutral",
      "Make a claim, show the source, then tell us what decision changes.",
    ],
  ],
  coachSlidesV3: [
    [
      "Elena",
      "thinking",
      "Keep the deck short. Your evidence should lead to a specific ask.",
    ],
  ],
  coachMetricV2: [
    [
      "Ravi",
      "neutral",
      "Someone else should reproduce this number from your wording. Make every boundary explicit.",
    ],
  ],
  coachMetricV3: [
    [
      "Ravi",
      "thinking",
      "What is one unit? What is excluded? What would stop publication?",
    ],
  ],
  coachRedteamV2: [
    [
      "Marcus",
      "thinking",
      "Imagine I must hit this target. Which rule could I exploit?",
    ],
  ],
  coachRedteamV3: [
    [
      "Marcus",
      "neutral",
      "Read the definition literally. Patch the controls that matter most.",
    ],
  ],
  fixedV2: [
    [
      "Ravi",
      "approving",
      "That route is closed. Check whether the remaining rules still allow inflation.",
    ],
  ],
  fixedV3: [
    [
      "Ravi",
      "approving",
      "The definition now prevents that. We should test the other boundaries too.",
    ],
  ],
  fixedV4: [
    [
      "Ravi",
      "neutral",
      "One fewer loophole. The updated model follows the rule you just changed.",
    ],
  ],
  wrongJoinV2: [
    [
      "Ravi",
      "neutral",
      "Those identifiers refer to different entities. We spent an hour checking the mismatch.",
    ],
  ],
  wrongJoinV3: [
    [
      "Joyce",
      "thinking",
      "No shared key here. Keep the failed check in the audit trail.",
    ],
  ],
  wrongJoinV4: [
    [
      "Joyce",
      "neutral",
      "These rows cannot align on that identifier. Try a key describing the same thing.",
    ],
  ],
  estimatedV2: [
    [
      "Joyce",
      "neutral",
      "Your range is saved. We will compare it with the completed audit later.",
    ],
  ],
  estimatedV3: [
    [
      "Joyce",
      "thinking",
      "Keep that uncertainty visible when you present. The record now contains your range.",
    ],
  ],
  unit: [
    [
      "Joyce",
      "thinking",
      "Before we compare numbers, what counts as one call?",
    ],
  ],
  unitYes: [
    [
      "Joyce",
      "neutral",
      "That is how AMC counts it. Is it new demand, though?",
    ],
  ],
  unitNo: [
    [
      "Joyce",
      "approving",
      "That distinction matters. Let’s see whether the pipeline makes it.",
    ],
  ],
  audit: [
    [
      "Joyce",
      "thinking",
      "Billing and the dashboard disagree. I need your help checking why.",
    ],
    ["Ravi", "neutral", "If you find a discrepancy, send me the query."],
    [
      "Marcus",
      "approving",
      "Good quarter. My team has already committed to the next target.",
    ],
  ],
  gateway: [
    [
      "Joyce",
      "thinking",
      "Same request ID. Four entries. We still need the total.",
    ],
  ],
  billing: [
    [
      "Joyce",
      "thinking",
      "Calls grew much faster than revenue. That does not explain why.",
    ],
  ],
  sdk: [
    [
      "Ravi",
      "thinking",
      "Those are response chunks. They should not represent separate customer requests.",
    ],
  ],
  cohorts: [
    [
      "Joyce",
      "approving",
      "There is real growth here. Enterprise fine-tuning looks different.",
    ],
  ],
  tags: [
    [
      "Joyce",
      "thinking",
      "Health checks are definitely internal. Orbitly needs an account-level check.",
    ],
  ],
  tickets: [
    [
      "Joyce",
      "thinking",
      "A customer waiting longer can make our activity number look better.",
    ],
  ],
  retryJoin: [
    [
      "Joyce",
      "thinking",
      "After deduplication, retries explain three million extra counted calls daily.",
    ],
  ],
  partnerJoin: [
    [
      "Joyce",
      "thinking",
      "The account list confirms Orbitly. Seven hundred thousand daily test events.",
    ],
  ],
  billingJoin: [
    [
      "Joyce",
      "thinking",
      "Forty-one percent have no matching billing event in this sample.",
    ],
  ],
  wrongJoin: [
    [
      "Ravi",
      "neutral",
      "A customer ID and request ID describe different things. They cannot match.",
    ],
  ],
  estimate: [
    [
      "Joyce",
      "thinking",
      "What can you defend? Give a range, not just a confident point.",
    ],
  ],
  calibrated: [
    [
      "Joyce",
      "approving",
      "You left room for what we have not verified. Keep that range.",
    ],
  ],
  estimated: [
    [
      "Joyce",
      "neutral",
      "Your estimate is recorded. We will test it against the full audit.",
    ],
  ],
  carry: [
    [
      "Elena",
      "neutral",
      "The board pack closes soon. Do we have a concern to raise?",
    ],
  ],
  now: [
    [
      "Elena",
      "thinking",
      "Then bring the evidence. I need to know what changes today.",
    ],
  ],
  verify: [
    [
      "Joyce",
      "thinking",
      "One targeted check. We will have less time to prepare the conversation.",
    ],
  ],
  quiet: [["Elena", "thinking", "Can I tell the board it’s solid?"]],
  promiseConfident: [
    [
      "Elena",
      "neutral",
      "All right. I will carry that wording into the board meeting.",
    ],
  ],
  promiseQualified: [
    [
      "Elena",
      "thinking",
      "Understood. I will call it provisional, not verified demand.",
    ],
  ],
  promiseEvasive: [
    [
      "Elena",
      "thinking",
      "That does not answer my question. I still need a defensible statement.",
    ],
  ],
  stakeholders: [
    [
      "Joyce",
      "thinking",
      "Who needs to hear this from you before the room hears it?",
    ],
  ],
  tellRavi: [
    [
      "Ravi",
      "thinking",
      "Show me the unit and the joining key. Then your conclusion.",
    ],
  ],
  tellMarcus: [
    [
      "Marcus",
      "thinking",
      "Help me understand what happens to the targets we already agreed.",
    ],
  ],
  tellElena: [
    [
      "Elena",
      "thinking",
      "Tell me what is certain, what is estimated, and what you need.",
    ],
  ],
  tellJoyce: [
    [
      "Joyce",
      "approving",
      "I can walk through the sources with you. Keep the uncertainty visible.",
    ],
  ],
  slides: [
    [
      "Elena",
      "neutral",
      "Three slides. What changed, what supports it, and your decision request.",
    ],
  ],
  headlineWrong: [
    ["Ravi", "annoyed", "So my metric is wrong. Send me the query."],
  ],
  headlineLimits: [
    [
      "Ravi",
      "thinking",
      "That is a fair question. Show me what it cannot distinguish.",
    ],
  ],
  headlineCustomers: [
    [
      "Marcus",
      "thinking",
      "If customers got more value, show me where. I can use that.",
    ],
  ],
  headlineCost: [
    [
      "Elena",
      "thinking",
      "Which spending decision would change if we accepted your estimate?",
    ],
  ],
  headlineNew: [
    [
      "Ravi",
      "thinking",
      "A replacement needs a definition. A nicer chart will not be enough.",
    ],
  ],
  slideEvidence: [
    [
      "Joyce",
      "neutral",
      "Keep the source beside the claim. Let them check the same rows.",
    ],
  ],
  slideAsk: [
    [
      "Elena",
      "neutral",
      "What decision do you want from us before we leave this room?",
    ],
  ],
  direct: [
    [
      "Ravi",
      "annoyed",
      "I would have preferred this conversation before the executive meeting.",
    ],
  ],
  privateFirst: [
    [
      "Ravi",
      "approving",
      "Wait. This request ID repeats. Why didn’t I see that?",
    ],
  ],
  privateNoProof: [
    [
      "Ravi",
      "thinking",
      "Let’s check the definition together. We do not have a quantified cause yet.",
    ],
  ],
  evolution: [
    [
      "Ravi",
      "neutral",
      "Metric version two. We can work it into the next planning cycle.",
    ],
  ],
  dataRoom: [
    ["Elena", "thinking", "I read the data room. Why didn’t you talk to me?"],
  ],
  leak: [
    [
      "Marcus",
      "annoyed",
      "I heard about this on Slack. I should have heard it from you.",
    ],
  ],
  informed: [
    [
      "Marcus",
      "neutral",
      "Thanks for telling me before the room. I can prepare the target discussion.",
    ],
  ],
  delay: [
    [
      "Joyce",
      "thinking",
      "While we wait, infrastructure is still scaling against the old number.",
    ],
  ],
  metric: [
    [
      "Ravi",
      "thinking",
      "Let’s write exactly what one unit means. Someone else must reproduce it.",
    ],
    ["Joyce", "neutral", "Keep the quality signal beside the growth signal."],
  ],
  redteam: [
    [
      "Marcus",
      "thinking",
      "Imagine I have a target to hit. Where could I inflate this?",
    ],
  ],
  loopholeDedupe: [
    [
      "Marcus",
      "neutral",
      "You count repeated completions. Retries can still increase the number.",
    ],
  ],
  loopholeTags: [
    [
      "Joyce",
      "thinking",
      "Rename a traffic tag and the same internal account gets counted again.",
    ],
  ],
  loopholeStreams: [
    [
      "Ravi",
      "thinking",
      "You still count each chunk. Longer answers become artificial growth.",
    ],
  ],
  loopholeSegments: [
    [
      "Marcus",
      "neutral",
      "The total hides which customers grew. Show the cohort breakdown beside it.",
    ],
  ],
  loopholeQuality: [
    [
      "Joyce",
      "thinking",
      "We can increase volume while latency worsens. Where is the stop condition?",
    ],
  ],
  fixed: [
    [
      "Ravi",
      "approving",
      "That closes this route. Let’s see what the remaining definition allows.",
    ],
  ],
  clean: [
    [
      "Joyce",
      "approving",
      "No authored exploit remains. That is a test result, not a guarantee.",
    ],
  ],
  secondSource: [
    [
      "Ravi",
      "thinking",
      "I need an independent source before I sign off on another definition.",
    ],
  ],
  secondConfirmed: [
    [
      "Ravi",
      "approving",
      "The independent check agrees with the source you cited. I can sign that.",
    ],
  ],
  secondLimited: [
    [
      "Ravi",
      "thinking",
      "That check limits the claim. Let’s carry the uncertainty into the boardroom.",
    ],
  ],
  rolloutSlow: [
    [
      "Ravi",
      "neutral",
      "Three weeks to migrate safely. We can publish both definitions during that time.",
    ],
  ],
  rolloutMandate: [
    [
      "Elena",
      "thinking",
      "We cannot keep publishing this. Start the change today.",
    ],
  ],
  rolloutNormal: [
    [
      "Joyce",
      "neutral",
      "We have a definition. Now give people time to replace their dashboards.",
    ],
  ],
  fatigueOne: [
    [
      "Ravi",
      "annoyed",
      "The team has rebuilt this twice. They need one agreed definition.",
    ],
  ],
  fatigueTwo: [
    [
      "Joyce",
      "thinking",
      "A fast mandate does not remove the migration work. Who covers it?",
    ],
  ],
  compounds: [
    [
      "Joyce",
      "thinking",
      "The scale-up is live. A customer left after another timeout.",
    ],
    [
      "Elena",
      "thinking",
      "An outside analyst is asking how we counted the growth.",
    ],
  ],
  board: [["Anders", "neutral", "What would you stake your reputation on?"]],
  promiseReturn: [
    [
      "Anders",
      "thinking",
      "You told us it was solid. What changed after that statement?",
    ],
  ],
  qualifiedReturn: [
    [
      "Anders",
      "neutral",
      "You called the number provisional. What can you now confirm?",
    ],
  ],
  evasiveReturn: [
    [
      "Anders",
      "thinking",
      "You avoided a commitment. What can you put on the record now?",
    ],
  ],
  boardClean: [
    [
      "Anders",
      "approving",
      "A smaller claim I can reproduce is better than a larger mystery.",
    ],
  ],
  boardWeak: [
    [
      "Anders",
      "thinking",
      "The replacement still has known counting gaps. Why should we adopt it?",
    ],
  ],
  own: [
    [
      "Elena",
      "thinking",
      "We will correct the record, including how we got here.",
    ],
  ],
  blame: [
    [
      "Ravi",
      "annoyed",
      "The pipeline needs fixing. Blame does not give us a better definition.",
    ],
  ],
  bury: [
    [
      "Anders",
      "annoyed",
      "Leaving the old number in place does not resolve the discrepancy.",
    ],
  ],
  reveal: [
    [
      "Joyce",
      "neutral",
      "Forty percent real growth. Still good. Not three hundred and forty.",
    ],
  ],
  reflection: [
    [
      "Anders",
      "thinking",
      "Next time, which question will you ask before publishing a number?",
    ],
  ],
  resume: [
    [
      "Joyce",
      "neutral",
      "Your sources and decisions are here. Pick up where you left off.",
    ],
  ],
  guideAudit: [
    [
      "Joyce",
      "neutral",
      "Open one drawer. You can inspect its rows before deciding what to join.",
    ],
  ],
  guideJoin: [
    [
      "Joyce",
      "neutral",
      "Select the source, destination, and the column that identifies the same thing.",
    ],
  ],
  guideRange: [
    [
      "Joyce",
      "neutral",
      "Your low and high bounds should describe the uncertainty you actually have.",
    ],
  ],
  guideSlides: [
    [
      "Elena",
      "neutral",
      "One headline, the sources behind it, and one clear ask.",
    ],
  ],
  guideMetric: [
    [
      "Ravi",
      "neutral",
      "The counting rule matters as much as the unit you choose.",
    ],
  ],
  guideRedteam: [
    ["Marcus", "neutral", "I will try the rules as written. No secret tricks."],
  ],
  guideCase: [
    [
      "Joyce",
      "neutral",
      "The case file keeps your words beside what happened next.",
    ],
  ],
  guidePeople: [
    [
      "Joyce",
      "neutral",
      "Their concerns are different. A correct number still needs a human conversation.",
    ],
  ],
  guardrail: [
    [
      "Ravi",
      "thinking",
      "A completion is not useful if the customer waited too long for it.",
    ],
  ],
  accountControl: [
    [
      "Joyce",
      "approving",
      "Accounts are a stronger boundary than labels anyone can rename.",
    ],
  ],
  noAsk: [
    [
      "Elena",
      "thinking",
      "We discussed the data, but nobody agreed to change the plan.",
    ],
  ],
  paused: [
    [
      "Joyce",
      "neutral",
      "Nothing moves while you are away. Your choices are already saved.",
    ],
  ],
  farewell: [
    ["Joyce", "approving", "Keep the question. What, exactly, did we count?"],
  ],
};
export const lines: Line[] = Object.entries(script).flatMap(([group, rows]) =>
  rows.map(([speaker, emotion, text], i) => ({
    id: group + "-" + i,
    speaker,
    emotion,
    text,
  })),
);
export function conversation(group: string): Line[] {
  return lines.filter((l) => l.id.startsWith(group + "-"));
}
