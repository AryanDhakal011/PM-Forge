export type LessonNote = {
  principle: string;
  failure: string;
  field: string;
};

/**
 * The extra teaching note for each module. Kept separate from the module
 * catalogue so the landing page can stay light while the lesson route still
 * has a point of view.
 */
export const lessonNotes: Record<string, LessonNote> = {
  "foundation-and-product-strategy": {
    principle:
      "A strategy is a set of choices: who you serve, what problem you solve, what you will not do, and what would prove you wrong. If it cannot lose, it is not a strategy.",
    failure:
      "A page of ambitions with no trade-off. Teams can execute it, but they cannot use it to decide between two credible options.",
    field:
      "Before the next planning cycle, write the sentence you are afraid to say out loud: “We are betting that ___ because ___, and we will know we were wrong if ___.”",
  },
  "customer-discovery": {
    principle:
      "Ask about the last time the problem happened, what the person did instead, and what it cost them. Past behaviour is evidence; polite enthusiasm is not.",
    failure:
      "Pitching the idea halfway through the interview, then treating the room's encouragement as demand.",
    field:
      "Replace “Would you use this?” with “Walk me through the last time you tried to solve this. What did you do next?”",
  },
  "data-and-experimentation": {
    principle:
      "A metric is a definition plus a population plus a time window. Check all three before you tell a story about the number.",
    failure:
      "Celebrating an average that hides a segment falling off a cliff, or shipping a test with no guardrail metric.",
    field:
      "For the next metric you quote, write down the definition, the denominator, and one group the average could conceal.",
  },
  "prioritization-and-decision-making": {
    principle:
      "Prioritisation is not a score. It is a defensible choice about what to delay, what to disappoint, and what evidence would change your mind.",
    failure:
      "Using a framework to manufacture certainty, then refusing to revisit the ranking when new evidence arrives.",
    field:
      "Write the strongest argument against your top priority. If you cannot steel-man it, you are not ready to defend the call.",
  },
  "technical-fluency": {
    principle:
      "You need enough technical understanding to see the failure mode, the dependency, and the real cost of a shortcut — not enough to write the implementation.",
    failure:
      "Treating an estimate as a commitment, then discovering the hidden migration work after the launch date is public.",
    field:
      "Ask engineering: “What would make this take twice as long?” Then write the answer into the risk section of the brief.",
  },
  "ui-ux-collaboration": {
    principle:
      "Design the empty, loading, error, and success states before you debate the happy path. The product is the whole flow, not the screenshot.",
    failure:
      "A critique that argues about taste and ends with no testable next step.",
    field:
      "Open a flow you own and name what the user can do in every state. The missing state is usually where trust is lost.",
  },
  "execution-and-delivery": {
    principle:
      "Ship the smallest thing that answers the question. Scope is a hypothesis about what creates learning, not a promise to build everything on the roadmap.",
    failure:
      "Cutting the learning instrument (telemetry, interviews, a clear success metric) while protecting the visible feature.",
    field:
      "Cut your next release by 40%. Name what you keep, what you defer, and what you will still be able to learn.",
  },
  "stakeholder-leadership": {
    principle:
      "Influence is legible reasoning plus early contact. People accept a decision they helped stress-test more readily than a surprise they are asked to endorse.",
    failure:
      "Saving the hard no for the big meeting, then treating the resulting friction as a communication problem.",
    field:
      "Map what each stakeholder is measured on. Pre-wire the decision with the person most likely to block it.",
  },
  "ai-product-management": {
    principle:
      "Quality is a distribution, not a demo. Define what good enough means, how failures surface, who reviews them, and what confidence you can honestly promise.",
    failure:
      "A polished demo becomes the spec, and the team has no eval set, escalation path, or language for uncertainty.",
    field:
      "Write three examples that should pass, three that should fail, and the one failure a customer must never see.",
  },
  "job-ready": {
    principle:
      "A portfolio is a record of judgment: the context, the evidence, the call, the trade-off, and what happened next. Outcomes are useful; reasoning is the transferable part.",
    failure:
      "A gallery of screens with no decision behind them, or a success story that hides the moment the team changed course.",
    field:
      "Write one decision in 250 words using this shape: context → evidence → options → call → next check. Then rehearse the 90-second version.",
  },
};
