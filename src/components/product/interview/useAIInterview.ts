'use client';
import {useEffect,useRef,useState} from 'react';
import {aiStateSchema,initialAI,PROMPT_VERSION,type AIState,type BoundReply} from '@/lib/interview-ai/model';
import {aiRequest,AIClientError,type Capabilities} from '@/lib/interview-ai/client';
import type {Question,Run} from '@/lib/product/types';
import type {Turn} from '@/lib/product/interview-live';

export type SaveAI=(patch:Partial<Run>)=>Promise<Run|undefined>;
export function useAIInterview(run:Run,q:Question,save:SaveAI){
 const current=useRef({run,save});current.current={run,save};
 const [cap,setCap]=useState<Capabilities|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[now,setNow]=useState(Date.now()),[waitingSince,setWaitingSince]=useState(0);
 const locked=useRef(false);
 useEffect(()=>{let active=true;void fetch('/api/interview/ai',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(active)setCap(c)}).catch(()=>{if(active)setNotice('AI availability could not load. Guided practice is ready.')});return()=>{active=false}},[]);
 useEffect(()=>{if(busy)setWaitingSince(Date.now());if(!busy&&!run.live?.ai?.retryAt)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[busy,run.live?.ai?.retryAt]);
 const update=async(patch:Partial<AIState>)=>{const {run,save}=current.current;const original=run.live?.ai?.initialGuided??!!run.guided;return save({...(run.stage==='primer'&&patch.enabled!==undefined?{guided:patch.enabled?false:original}:{}),live:{...run.live!,ai:{...(run.live?.ai||initialAI()),...patch,...(run.stage==='primer'?{initialGuided:original}:{})}}})};
 const request=async(saved:Run)=>{
  const ai=saved.live!.ai!,pending=ai.pending;if(!pending)return;
  const candidate=saved.live!.turns.find(t=>t.id===pending.candidateTurnId);if(!candidate)return;
  try{
   // The persisted submission identity determines recovery, even before capabilities reload.
   const mode=pending.cardId?'free-pilot':cap?.mode||'production';
   const result=await aiRequest<{reply:BoundReply}>('turn',saved,ai,mode,{requestId:pending.requestId,candidateTurnId:pending.candidateTurnId,...(pending.cardId?{cardId:pending.cardId}:{text:candidate.raw})});
   const reply=aiStateSchema.shape.replies.element.parse(result.reply);
   if(reply.runId!==saved.id||reply.requestId!==pending.requestId||reply.candidateTurnId!==candidate.id||reply.expectedRevision!==pending.expectedRevision||reply.promptVersion!==PROMPT_VERSION||reply.scenarioVersion!==q.version)throw new AIClientError('invalid-reply-binding');
   const latest=current.current.run,l=latest.live!,state=l.ai!;
   if(state.replies.some(r=>r.requestId===reply.requestId)){await update({pending:undefined,error:undefined});return}
   const turn:Turn={id:'ai-'+reply.requestId,role:'interviewer',raw:reply.message,at:new Date().toISOString(),seconds:0,source:'system',stage:latest.stage};
   const persisted=await current.current.save({live:{...l,turns:[...l.turns,turn].slice(-290),ai:{...state,pending:undefined,error:undefined,retryAt:undefined,serverRevision:reply.serverRevision,replies:[...state.replies,reply].slice(-16),closed:reply.intent==='close'}}});
   setNotice(!persisted?'The reply is on this screen but has not saved yet. Keep this tab open and retry saving.':state.enabled?'New reply ready.':'A late AI reply was saved in the transcript. Guided practice continues.');
  }catch(error){const e=error instanceof AIClientError?error:new AIClientError('invalid-provider-output');await update({error:e.message,retryAt:e.retryAt});setNotice('Your answer is saved. The AI reply needs attention.')}
 };
 const submit=async(raw:string,cardId?:string)=>{
  if(locked.current||current.current.run.live?.ai?.pending)return;
  locked.current=true;setBusy(true);setNotice('Saving your answer…');
  try{const {run,save}=current.current,l=run.live!,ai=l.ai!;const candidate:Turn={id:crypto.randomUUID(),role:'candidate',raw,at:new Date().toISOString(),seconds:ai.voiceRaw===raw?(ai.voiceSeconds||0):0,source:cap?.mode==='free-pilot'?'case-position':ai.voiceRaw===raw?'voice':'typed',stage:run.stage,...(ai.voiceRaw&&cap?.mode!=='free-pilot'?{originalVoice:{raw:ai.voiceRaw,seconds:ai.voiceSeconds||0}}:{})};
   const pending={requestId:crypto.randomUUID(),candidateTurnId:candidate.id,expectedRevision:ai.serverRevision,cardId};
   const saved=await save({live:{...l,draft:cap?.mode==='free-pilot'?l.draft:'',turns:[...l.turns,candidate].slice(-290),clarifications:q.category==='root-cause'&&cardId?[...new Set([...l.clarifications,cardId==='position-0'?'metric-definition':cardId==='position-1'?'cohort-comparison':cardId])].slice(0,10):l.clarifications,ai:{...ai,pending,error:undefined,retryAt:undefined,voiceSeconds:cap?.mode==='free-pilot'?ai.voiceSeconds:0,voiceRaw:cap?.mode==='free-pilot'?ai.voiceRaw:''}}});
   if(!saved){setNotice('Your answer has not saved to disk yet. Retry saving before requesting AI.');return}
   setNotice('Preparing a follow-up…');await request(saved);
  }finally{locked.current=false;setBusy(false)}
 };
 const retry=async()=>{if(locked.current)return;locked.current=true;setBusy(true);try{const saved=await current.current.save({live:current.current.run.live});if(saved)await request(saved)}finally{locked.current=false;setBusy(false)}};
 const guided=async()=>{const {run}=current.current,ai=run.live?.ai;if(!ai)return;await update({enabled:false,pending:undefined,error:undefined,retryAt:undefined});setNotice('Guided practice. No further AI calls will be made.');void aiRequest('release',run,ai,cap?.mode||'guided').catch(()=>{})};
 const erase=async()=>{const {run}=current.current,ai=run.live?.ai;if(!ai)return;try{await aiRequest('delete',{...run,id:ai.serverRunId||run.id},ai,cap?.mode||'guided');await guided();setNotice('Private AI session deleted from the server. Your local transcript remains under your control.')}catch{setNotice('Server deletion did not finish. Retry when connected; your local work is unchanged.')}};
 return {cap,busy,slow:busy&&waitingSince>0&&now-waitingSince>=4000,notice,now,submit,retry,guided,erase,update};
}
