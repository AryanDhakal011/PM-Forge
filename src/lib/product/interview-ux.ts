import type {Run,RunStage} from './types';
export const interviewStages=['Prepare','Frame','Investigate','Decide','Reflect'] as const;
export function interviewStageOf(stage:RunStage){return stage==='primer'?0:['fundamentals','clarify'].includes(stage)?1:['investigate','workbench'].includes(stage)?2:['event','synthesis'].includes(stage)?3:4}
export const nextMove:Record<RunStage,{cue:string;action:string}>={primer:{cue:'Read the brief, choose Type or Speak, then begin when you are ready.',action:'Begin interview'},fundamentals:{cue:'Choose a response to each warm-up question before framing your approach.',action:'Discuss the brief'},clarify:{cue:'Clarify the decision before proposing a solution, then pin the goal.',action:'Pin this goal'},investigate:{cue:'Request a cut that could change your conclusion.',action:'Work through my approach'},workbench:{cue:'Use the relevant workbench to connect evidence to a recommendation.',action:'Defend this direction'},event:{cue:'Address the interviewer’s challenge and name what changes in your recommendation.',action:'Submit my response'},synthesis:{cue:'State one recommendation, its evidence, the trade-off, and what would change your mind.',action:'Commit & see feedback'},feedback:{cue:'Review your decision, evidence and provisional feedback.',action:'Replay my decisions'},replay:{cue:'Inspect the decision trail before calibrating your reasoning.',action:'Calibrate my reasoning'},reflection:{cue:'Compare your self-assessment with the recorded evidence.',action:'Unlock the expert trace'},expert:{cue:'Compare the expert trace, then choose one thing to practise next.',action:'Choose your next move'},complete:{cue:'Retry, practise another scenario, or keep your decision in your portfolio.',action:'Choose another scenario'}};

export const workbenchCue:Record<string,string>={
 'root-cause':'Compare competing causes, tie each to a requested cut, and choose a reversible next check.',
 'product-sense':'Choose a specific user and need, compare directions, then defend the trade-off.',
 strategy:'Compare strategic options against the market and constraints. Name what you will deliberately leave out.',
 'execution-metrics':'Choose the success metric, guardrail and response to the operational constraint.',
 estimation:'Write the equation, state the units and assumptions, then check a plausible range.',
 'ai-technical':'Compare model and architecture options against cost, latency and failure handling.',
 behavioral:'Explain your own actions, the conflict you faced and the evidence of what changed.'
};
