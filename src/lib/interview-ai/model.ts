import {z} from 'zod';
import type {Category,Question,Run} from '../product/types';

export const PROMPT_VERSION='decision-room-1.0';
export const id=z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const outputSchema=z.object({
  message:z.string().min(12).max(550),
  intent:z.enum(['clarify','probe','challenge','transition','close']),
  acknowledgedPoint:z.string().min(3).max(240),
  referencedEvidenceIds:z.array(id).max(4),
  referencedTurnIds:z.array(id).min(1).max(4),
  proposedAction:z.enum(['none','open-evidence','review-decision']),
  observations:z.array(z.object({turnId:id,quote:z.string().min(3).max(240),lens:z.enum(['assumption','evidence','tradeoff','decision','uncertainty','reconsideration'])}).strict()).max(3),
}).strict();
export type InterviewOutput=z.infer<typeof outputSchema>;
export type BoundReply=InterviewOutput&{runId:string;requestId:string;candidateTurnId:string;promptVersion:string;scenarioVersion:number;expectedRevision:number;serverRevision:number;source:'gemini'|'mock';latencyMs:number};
export type AIState={version:1;initialGuided?:boolean;serverRunId?:string;enabled:boolean;style:'practice'|'assessment';adult:boolean;dataConsent:boolean;region:string;serverRevision:number;maxTurns:number;timeboxSeconds:number;pending?:{requestId:string;candidateTurnId:string;expectedRevision:number;cardId?:string};replies:BoundReply[];error?:string;retryAt?:number;closed?:boolean;voiceSeconds?:number;voiceRaw?:string};
export const aiStateSchema=z.object({version:z.literal(1),initialGuided:z.boolean().optional(),serverRunId:id.optional(),enabled:z.boolean(),style:z.enum(['practice','assessment']),adult:z.boolean(),dataConsent:z.boolean(),region:z.string().max(3),serverRevision:z.number().int().nonnegative(),maxTurns:z.number().int().min(1).max(16),timeboxSeconds:z.number().int().min(60).max(3600),pending:z.object({requestId:id,candidateTurnId:id,expectedRevision:z.number().int().nonnegative(),cardId:id.optional()}).strict().optional(),replies:z.array(outputSchema.extend({runId:id,requestId:id,candidateTurnId:id,promptVersion:z.string().max(100),scenarioVersion:z.number().int(),expectedRevision:z.number().int(),serverRevision:z.number().int(),source:z.enum(['gemini','mock']),latencyMs:z.number().nonnegative()}).strict()).max(16),error:z.string().max(500).optional(),retryAt:z.number().optional(),closed:z.boolean().optional(),voiceSeconds:z.number().min(0).max(3600).optional(),voiceRaw:z.string().max(20000).optional()}).strict();
export const initialAI=():AIState=>({version:1,enabled:false,style:'assessment',adult:false,dataConsent:false,region:'',serverRevision:0,maxTurns:10,timeboxSeconds:720,replies:[]});
export function detachAIOnImport(run:Run,newId:string):Run{if(newId===run.id||!run.live?.ai)return run;return {...run,live:{...run.live,ai:{...run.live.ai,serverRunId:run.live.ai.serverRunId||run.id,enabled:false,pending:undefined,retryAt:undefined,error:undefined,closed:true}}}}
export const emphasis:Record<Category,string>={
 'root-cause':'measurement validity, segmentation, competing explanations and discriminating checks',
 'product-sense':'specific user needs, problem selection, scope, prioritization and success',
 strategy:'objectives, alternatives, positioning, constraints and opportunity cost',
 'execution-metrics':'metric definitions, causal relationships, guardrails and gaming risks',
 estimation:'decomposition, explicit assumptions, units, sensitivity and sanity checks',
 'ai-technical':'quality, latency, cost, system constraints, failure handling and evaluation',
 behavioral:'personal ownership, decisions, team context, observed outcomes and reflection',
};
const positions:Record<Category,string[]>={
 'root-cause':['I would check whether the metric definition changed.','I would compare an affected cohort with a stable cohort.','I would test a competing explanation before committing.','I would choose a reversible response while gathering evidence.'],
 'product-sense':['I would narrow the target user before proposing a solution.','I would compare the user needs before choosing scope.','I would prioritize a small intervention that can be evaluated.','I would name what to leave out of the first release.'],
 strategy:['I would make the objective explicit before comparing options.','I would compare the opportunity cost of the alternatives.','I would test the positioning assumption before scaling.','I would protect a constraint even if it slows expansion.'],
 'execution-metrics':['I would define the numerator, denominator and time window.','I would choose a counter-metric to catch unintended harm.','I would separate a causal claim from a correlation.','I would check whether optimizing the metric could be gamed.'],
 estimation:['I would decompose the estimate before assigning values.','I would check that the units match the question.','I would vary the least certain assumption.','I would compare the estimate against a plausible range.'],
 'ai-technical':['I would define the quality and latency requirements first.','I would compare a simpler system before adding a model.','I would plan a fallback for uncertain or failed outputs.','I would evaluate the cost and quality trade-off.'],
 behavioral:['I would distinguish my own decision from the team effort.','I would explain the disagreement and the options considered.','I would cite an observable outcome rather than an impression.','I would reconsider one part of my approach next time.'],
};
/** The pilot never forwards arbitrary notes, names, uploads or career stories. */
export function answerCards(q:Question){return [...positions[q.category].map((text,i)=>({id:'position-'+i,text})),...q.choices.map(c=>({id:'choice-'+c.id,text:'I am considering this direction: '+c.label}))];}
export function safeSnapshot(run:Run,pilot:boolean):Run{
  const live=run.live;
  if(!live)return run;
  return {...run,reflectionNote:'',decisions:run.decisions.map(d=>({...d,value:pilot?'':d.value})),story:pilot?{stakes:'',actions:['','',''],result:'',learning:'',later:'',observable:false,ownership:false}:run.story,eventResponse:run.eventResponse,synthesis:pilot?{...run.synthesis,note:''}:run.synthesis,live:{...live,draft:'',turns:[],outline:{},acceptedOutline:{},interruptions:[],pending:undefined,ai:undefined,events:[],reality:live.reality}};
}
