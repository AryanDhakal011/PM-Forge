'use client';
import {safeSnapshot,type AIState} from './model';
import type {Run} from '../product/types';
export type Capabilities={localTest?:boolean;available:boolean;reason:string|null;mode:'guided'|'free-pilot'|'production';model:string;mock:boolean;maxTurns:number;timeboxSeconds:number;dailySessions:number;regions:string[];personalAllowed:boolean;dataUse:string};
export const errorCopy:Record<string,string>={
 'ai-not-configured':'AI interviews are unavailable right now. Your work is saved; guided practice is ready.',
 'operator-paused':'The operator paused AI interviews. Your answer is intact.',
 'provider-timeout':'The provider took too long. Your answer is saved; retry or continue guided.',
 'provider-quota':'The provider’s free capacity is exhausted. Retry later or continue guided.',
 'project-capacity':'The free AI rooms are at capacity. Your answer is saved.',
 'room-at-capacity':'The AI rooms are full at the moment. Guided practice is always available.',
 'daily-session-limit':'You’ve used today’s AI sessions. Keep practising in guided mode.',
 'guest-daily-limit':'This connection has used today’s guest AI sessions. Guided practice remains open.',
 'turn-limit':'You’ve reached this interview’s AI turn allowance. Finish with the workbench and guided feedback.',
 'budget-limit':'The approved AI budget is fully reserved. Continue guided without losing your work.',
 'guest-session-required':'This browser’s private AI session is unavailable. Continue guided; your local transcript is intact.',
 'provider-configuration':'The provider configuration needs attention. Your answer is safe; continue guided.',
 'provider-model-unavailable':'The selected model is unavailable. No substitute provider was used.',
 'provider-access':'The provider connection needs operator attention. Your answer is saved.',
 'retry-limit':'This answer has reached its retry allowance. Continue guided; your response is preserved.',
 'session-expired':'The private AI session expired. Your local transcript and guided interview remain available.',
 'native-stage-requirements':'Complete this stage’s workbench requirements before continuing.',
 'evidence-not-eligible':'That evidence is not available yet. Review its request requirements.',
 'revision-conflict':'This AI session changed in another tab. Check its saved reply or continue guided.',
 'configuration-changed':'The AI configuration changed since this session began. Continue guided, then start a fresh AI interview.',
 'run-state-conflict':'The saved interview stage differs from this screen. Reload your run or continue guided.',
};
export class AIClientError extends Error{constructor(public code:string,public retryAt=0){super(errorCopy[code]||'The AI reply could not be verified. Your answer is saved. Retry or continue guided.')}}
export async function aiRequest<T>(action:string,run:Run,ai:AIState,mode:string,extra:Record<string,unknown>={}):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/interview/ai',{method:'POST',keepalive:action==='release',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,run:safeSnapshot(run,mode==='free-pilot'),expectedRevision:ai.serverRevision,...extra}),signal:AbortSignal.timeout(35000)})}catch{throw new AIClientError('network-unavailable')}
 const data=await response.json();if(!response.ok)throw new AIClientError(data.error,Date.now()+(data.retryAfter||0)*1000);return data as T;
}
export async function mirrorAdvance(run:Run):Promise<Run>{
 const ai=run.live?.ai;if(!ai?.enabled)return run;
 const cap:Capabilities=await fetch('/api/interview/ai',{cache:'no-store'}).then(r=>r.json());
 let current=ai;
 if(run.stage==='primer'){
  const result=await aiRequest<{session:{serverRevision:number;maxTurns:number;timeboxSeconds:number}}>('start',run,current,cap.mode,{consent:{adult:ai.adult,dataConsent:ai.dataConsent,region:ai.region,style:ai.style}});
  current={...current,serverRevision:result.session.serverRevision,maxTurns:result.session.maxTurns,timeboxSeconds:result.session.timeboxSeconds};
 }
 const result=await aiRequest<{session:{serverRevision:number}}>('advance',run,current,cap.mode,{requestId:'advance-'+run.id+'-'+run.stage+'-'+run.eventIndex});
 return {...run,live:{...run.live!,ai:{...current,serverRevision:result.session.serverRevision,error:undefined}}};
}
export async function releaseAI(run:Run){if(!run.live?.ai?.enabled)return;try{const cap:Capabilities=await fetch('/api/interview/ai',{cache:'no-store'}).then(r=>r.json());await aiRequest('release',run,run.live.ai,cap.mode)}catch{/* Room leases expire even when the client is offline. */}}
