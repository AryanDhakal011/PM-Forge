import 'server-only';
import {z} from 'zod';
import {runSchema} from '../product/schema';
import {createRun,advance,stageIssue,requestEvidence} from '../product/engine';
import {getQuestion} from '../product/content';
import {questionForRun} from '../product/variants';
import {createLive} from '../product/interview-live';
import type {Run} from '../product/types';
import {answerCards,PROMPT_VERSION,id,initialAI,type BoundReply} from './model';
import {AILedger,digest,type SessionRow,type RequestRow} from './ledger';
import {aiConfig,availability,type AIConfig} from './config';
import {AIError,generateInterviewTurn,validateOutput,type InterviewContext} from './provider';

export const requestSchema=z.object({action:z.enum(['start','advance','turn','status','release','delete']),run:runSchema,expectedRevision:z.number().int().nonnegative(),requestId:id.optional(),candidateTurnId:id.optional(),cardId:id.optional(),text:z.string().max(5000).optional(),consent:z.object({adult:z.boolean(),dataConsent:z.boolean(),region:z.string().length(2),style:z.enum(['practice','assessment'])}).strict().optional()}).strict();
export type AIRequest=z.infer<typeof requestSchema>;
export const sessionInfo=(row:SessionRow,c:AIConfig)=>({serverRevision:row.revision,turns:row.turns,maxTurns:c.maxTurns,timeboxSeconds:c.timebox,mode:row.mode,style:row.style,expiresAt:row.expires});

/** Only user-controlled fields enter here. All facts, costs and progression are reconstructed. */
export function adoptNative(previous:Run,incoming:Run){
 const q=questionForRun(previous)!;
 if(incoming.id!==previous.id||incoming.ownerId!==previous.ownerId||incoming.questionId!==previous.questionId||incoming.contentVersion!==previous.contentVersion||incoming.seed!==previous.seed||incoming.eventIndex!==previous.eventIndex||!!incoming.guided!==!!previous.guided||incoming.stage!==previous.stage||JSON.stringify(incoming.locked)!==JSON.stringify(previous.locked))throw new AIError('run-state-conflict',409);
 if(incoming.choiceId&&!q.choices.some(c=>c.id===incoming.choiceId))throw new AIError('invalid-choice',400);
 if(incoming.synthesis.decision&&!q.choices.some(c=>c.id===incoming.synthesis.decision))throw new AIError('invalid-choice',400);
 if(new Set(incoming.evidenceIds).size!==incoming.evidenceIds.length||previous.evidenceIds.some(id=>!incoming.evidenceIds.includes(id)))throw new AIError('evidence-state-conflict',409);
 let next:Run={...incoming,id:previous.id,ownerId:previous.ownerId,stage:previous.stage,locked:previous.locked,completedAt:previous.completedAt,decisions:previous.decisions,live:incoming.live?{...incoming.live,ai:previous.live?.ai,draft:'',turns:[],pending:undefined,outline:{},acceptedOutline:{},events:[]}:createLive(),evidenceIds:previous.evidenceIds};
 for(const evidence of incoming.evidenceIds.filter(id=>!previous.evidenceIds.includes(id))){const requested=requestEvidence(next,evidence);if(!requested.evidenceIds.includes(evidence))throw new AIError('evidence-not-eligible',409);next=requested}
 return next;
}
export function contextFor(row:SessionRow,run:Run,history:InterviewContext['turns'],c:AIConfig):InterviewContext{
 const q=questionForRun(run)!;
 const excerpt=(text:string,max:number)=>text.length<=max?text:text.slice(0,max).replace(/\s+\S*$/,'')+' [excerpt]';
 const recent=history.slice(-7);
 const context:InterviewContext={question:{id:q.id,version:q.version,category:q.category,level:q.level,title:q.title,goal:q.goal},brief:excerpt(q.scenario,1400),stage:run.stage,pinnedGoal:run.objectivePinned?q.goal:'',evidence:q.evidence.filter(e=>run.evidenceIds.includes(e.id)).map(e=>({id:e.id,title:e.title,text:excerpt(e.text,1000),source:e.tag==='REFERENCE'?'unverified-reference':'simulated'})),decisions:[q.choices.find(choice=>choice.id===run.choiceId)?.label,run.synthesis.decision?q.choices.find(choice=>choice.id===run.synthesis.decision)?.label:''].filter((s):s is string=>!!s),turns:recent.map((t,i)=>({...t,text:i===recent.length-1?t.text:excerpt(t.text,800)})),style:row.style,closing:row.turns+1>=c.maxTurns||['synthesis','feedback','replay','reflection','expert','complete'].includes(run.stage)||run.elapsedSeconds>=c.timebox};
 while(Buffer.byteLength(JSON.stringify(context))>c.maxContextBytes&&context.turns.length>1)context.turns.shift();
 for(const size of [600,400,200]){if(Buffer.byteLength(JSON.stringify(context))<=c.maxContextBytes)break;context.evidence=context.evidence.map(e=>({...e,text:excerpt(e.text,size)}))}
 return context;
}
export async function handleAI(input:AIRequest,owner:string,ledger=new AILedger(),c:AIConfig=aiConfig(),quotaOwner?:string){
 const incoming=input.run as Run;
 const unavailable=availability(c);
 if(input.action==='start'){
  if(unavailable)throw new AIError('ai-not-configured',503);
  const consent=input.consent;
  if(!consent?.adult||!consent.dataConsent||!c.regions.includes(consent.region))throw new AIError('eligibility-required',403);
  const q=getQuestion(incoming.questionId);if(!q||q.version!==incoming.contentVersion||incoming.stage!=='primer')throw new AIError('start-from-prepare',409);
  if(q.category==='behavioral'&&(c.mode!=='production'||!c.personalApproved))throw new AIError('personal-stories-stay-guided',403);
  const canonical={...createRun(q,incoming.ownerId,incoming.seed),id:incoming.id,guided:!!incoming.guided,live:{...createLive(),ai:{...initialAI(),enabled:true,adult:true,dataConsent:true,region:consent.region,style:consent.style}}};
  const row=ledger.start(canonical,owner,c,consent.style,quotaOwner,consent.region);return {session:sessionInfo(row,c)};
 }
 let row=ledger.row(incoming.id,owner);
 if(input.action==='delete'){ledger.transaction(()=>ledger.erase(row.run_id));return {deleted:true}}
 if(input.action==='release'){ledger.db.prepare('UPDATE ai_sessions SET active_until=MAX(lease_until,0) WHERE run_id=?').run(row.run_id);return {released:true}}
 if(input.action==='status')return {session:sessionInfo(row,c)};
 const previous=ledger.read<Run>(row.state);
 if(incoming.ownerId!==row.local_owner)throw new AIError('local-owner-conflict',409);
 if(input.action==='advance'){
  return ledger.transaction(()=>{row=ledger.row(incoming.id,owner);if(!input.requestId)throw new AIError('missing-action-identity',400);const operation=ledger.db.prepare('SELECT * FROM ai_native WHERE id=? AND run_id=?').get(input.requestId,incoming.id) as {expected:number;result:string}|undefined;if(operation){if(operation.expected!==input.expectedRevision)throw new AIError('idempotency-conflict',409);return ledger.read<{session:ReturnType<typeof sessionInfo>;stage:Run['stage']}>(operation.result)}if(row.revision!==input.expectedRevision)throw new AIError('revision-conflict',409);if(unavailable)throw new AIError('ai-not-configured',503);ledger.assertPolicy(row,c);ledger.admit(c);ledger.ensureRoom(row,c);const next=adoptNative(ledger.read<Run>(row.state),incoming),issue=stageIssue(next);if(issue)throw new AIError('native-stage-requirements',409);const advanced=advance(next),saved=ledger.saveState(row,advanced,true),result={session:sessionInfo(saved,c),stage:advanced.stage};ledger.db.prepare('INSERT INTO ai_native VALUES(?,?,?,?)').run(input.requestId,incoming.id,input.expectedRevision,ledger.seal(result));return result});
 }
 if(!input.requestId||!input.candidateTurnId)throw new AIError('missing-turn-identity',400);
 const existing=ledger.db.prepare('SELECT * FROM ai_requests WHERE id=?').get(input.requestId) as RequestRow|undefined;
 const q=questionForRun(previous)!;
 if(c.mode==='free-pilot'&&input.text)throw new AIError('pilot-uses-case-positions',400);
 const candidate=c.mode==='free-pilot'?answerCards(q).find(card=>card.id===input.cardId)?.text:input.text;
 if(!candidate||candidate.trim().split(/\s+/).length<4)throw new AIError('answer-required',400);
 const hash=digest(JSON.stringify({owner,run:row.run_id,turn:input.candidateTurnId,expected:input.expectedRevision,candidate,prompt:PROMPT_VERSION,version:q.version}));
 if(existing){if(existing.run_id!==row.run_id||existing.hash!==hash||existing.turn_id!==input.candidateTurnId)throw new AIError('idempotency-conflict',409);if(existing.status==='complete')return {reply:ledger.read<BoundReply>(existing.result!),session:sessionInfo(row,c)}}
 if(unavailable)throw new AIError('ai-not-configured',503);
 if(q.category==='behavioral'&&(c.mode!=='production'||!c.personalApproved))throw new AIError('personal-stories-stay-guided',403);
 const state=existing?previous:adoptNative(previous,incoming);
 if(state.status==='paused'||state.stage==='primer')throw new AIError('interview-not-active',409);
 const history=ledger.history(row.run_id);
 if(!history.some(t=>t.id===input.candidateTurnId))history.push({id:input.candidateTurnId,role:'candidate',text:candidate});
 const context=contextFor(existing?{...row,turns:Math.max(0,row.turns-1)}:row,state,history,c),contextBytes=Buffer.byteLength(JSON.stringify(context));
 if(contextBytes>c.maxContextBytes)throw new AIError('context-limit',413);
 const reserved=ledger.reserve(row,{requestId:input.requestId,turnId:input.candidateTurnId,hash,expected:input.expectedRevision,candidate,state,tokens:contextBytes+6000+Math.max(c.maxOutput,c.billableOutputReserve)},c);
 if(reserved.cached)return {reply:reserved.cached,session:sessionInfo(ledger.row(row.run_id,owner),c)};
 const usage={inputTokens:0,outputTokens:0,thoughtTokens:0,latencyMs:0},start=performance.now();
 try{
  const generated=await generateInterviewTurn(context,c);Object.assign(usage,{inputTokens:generated.inputTokens,outputTokens:generated.outputTokens,thoughtTokens:generated.thoughtTokens,latencyMs:generated.latencyMs});
  const output=validateOutput(generated.output,context,q.evidence.filter(e=>!state.evidenceIds.includes(e.id)).map(e=>e.text));
  if(context.closing&&output.intent!=='close'||!context.closing&&output.intent==='close')throw new AIError('incorrect-interview-arc',502);
  const reply:BoundReply={...output,runId:row.run_id,requestId:input.requestId,candidateTurnId:input.candidateTurnId,promptVersion:PROMPT_VERSION,scenarioVersion:q.version,expectedRevision:input.expectedRevision,serverRevision:row.revision+1,source:generated.source,latencyMs:generated.latencyMs};
  ledger.finish(row.run_id,owner,input.requestId,reserved.attemptId,reply,usage);
  return {reply,session:sessionInfo(ledger.row(row.run_id,owner),c)};
 }catch(error){const failure=error instanceof AIError?error:new AIError('invalid-provider-output',502,15);usage.latencyMs=Math.round(performance.now()-start);ledger.finish(row.run_id,owner,input.requestId,reserved.attemptId,null,usage,failure);throw failure}
}
