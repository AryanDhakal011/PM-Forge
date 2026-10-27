export const interviewQuestionBank = [
  {
    prompt: "A core metric dropped 40% in one week. What do you investigate first?",
    strong:
      "Segment the drop, check instrumentation and seasonality, then form two competing explanations with the evidence that would separate them.",
  },
  {
    prompt: "Sales wants a custom feature for one enterprise prospect. How do you decide?",
    strong:
      "Size the deal and the pattern, separate the stated request from the job, and name what you would defer to serve it.",
  },
  {
    prompt: "How would you prioritise a platform migration against a visible growth feature?",
    strong:
      "Compare cost of delay, risk of inaction, reversibility, and the learning each option buys. Make the trade-off explicit.",
  },
  {
    prompt: "Design a success metric for a feature that helps users recover from failed payments.",
    strong:
      "Tie the metric to recovered revenue and successful retries, then add guardrails for duplicate charges and support load.",
  },
  {
    prompt: "Tell me about a decision you changed your mind on. What moved you?",
    strong:
      "Name the original belief, the specific evidence that challenged it, the cost of changing course, and what you would watch next time.",
  },
  {
    prompt: "An AI feature works in the demo but fails in production. What now?",
    strong:
      "Define the failure distribution, add human escalation and confidence language, and narrow the scope until the eval set passes.",
  },
];
