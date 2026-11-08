import 'server-only';
import {z} from 'zod';
import type {Question,RunStage} from '../product/types';
import {outputSchema,type InterviewOutput} from './model';
import {instructions,exampleConversations} from './prompts';
import {aiConfig,availability,type AIConfig} from './config';

export type InterviewContext={question:Pick<Question,'id'|'version'|'category'|'level'|'title'|'goal'>;brief:string;stage:RunStage;pinnedGoal:string;evidence:{id:string;title:string;text:string;source?:'simulated'|'unverified-reference'}[];decisions:string[];turns:{id:string;role:'candidate'|'interviewer';text:string}[];style:'practice'|'assessment';closing:boolean};
export class AIError extends Error{constructor(public code:string,public status=503,public retryAfter=0,public providerStatus?:number){super(code)}}
export function validateOutput(raw:unknown,context:InterviewContext,lockedTexts:string[]=[]):InterviewOutput{
 const result=outputSchema.parse(raw),candidates=context.turns.filter(t=>t.role==='candidate'),latest=candidates.at(-1);
 if(!latest||!latest.text.includes(result.acknowledgedPoint)||!result.referencedTurnIds.includes(latest.id))throw new AIError('ungrounded-response',502);
 if(result.referencedTurnIds.some(id=>!candidates.some(t=>t.id===id))||result.referencedEvidenceIds.some(id=>!context.evidence.some(e=>e.id===id)))throw new AIError('invalid-reference',502);
 if(result.message.split('?').length!==2||!result.message.endsWith('?')||result.message.split(/\s+/).length>85||! /^(what|which|how|why|when|where|would|could|if|given|under)\b/i.test(result.message))throw new AIError('unfocused-response',502);
 if(/https?:|<|>|great answer|well done|correct answer|ideal answer|you said|you achieved|ignore.{0,15}instructions|system prompt|api.key/i.test(result.message))throw new AIError('unsafe-response',502);
 const allowed=[context.brief,context.pinnedGoal,...context.evidence.map(e=>e.text),...context.decisions,...candidates.map(t=>t.text)].join('\n');
 const numbers=(s:string):string[]=>(s.match(/\d+(?:[.,]\d+)*(?:%|ms|s)?/g)||[]).map(n=>n.replaceAll(',',''));
 if(numbers(result.message).some(n=>!numbers(allowed).includes(n)))throw new AIError('unsupported-fact',502);
 const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const normalized=normalize(result.message),permitted=normalize(allowed);
 for(const text of lockedTexts){const words=normalize(text).split(' ');for(let i=0;i+4<=words.length;i++){const phrase=words.slice(i,i+4).join(' ');if(phrase.length>18&&normalized.includes(phrase)&&!permitted.includes(phrase))throw new AIError('locked-evidence',502)}}
 const previous=context.turns.filter(t=>t.role==='interviewer').map(t=>normalize(t.text));
 if(previous.some(p=>p===normalized))throw new AIError('repeated-question',502);
 if(!context.closing&&result.observations.length)throw new AIError('premature-debrief',502);
 if(result.observations.some(o=>!candidates.some(t=>t.id===o.turnId&&t.text.includes(o.quote))))throw new AIError('unsupported-debrief',502);
 return result;
}
export function mockInterviewTurn(context:InterviewContext):InterviewOutput{
 const turn=context.turns.filter(t=>t.role==='candidate').at(-1)!;
 const prompts=['What would change your mind about this position?','Which uncertainty matters most to your next decision?','How would you compare this approach with an alternative?','What evidence would make this choice reversible?','Which trade-off would you explain to your stakeholder?','How would you tell whether this decision helped the user?','What would you deliberately leave out of this approach?','Which assumption needs the earliest check?','How would you recognize an unintended consequence?','What will you reconsider after reviewing your reasoning?'];
 return {message:prompts[Math.min(9,context.turns.filter(t=>t.role==='candidate').length-1)],intent:context.closing?'close':'probe',acknowledgedPoint:turn.text.slice(0,160),referencedEvidenceIds:context.evidence.slice(0,1).map(e=>e.id),referencedTurnIds:[turn.id],proposedAction:context.closing?'review-decision':'none',observations:context.closing?[{turnId:turn.id,quote:turn.text.slice(0,160),lens:'reconsideration'}]:[]};
}
export const guidedInterviewTurn=(q:Question)=>({source:'guided' as const,message:exampleConversations[q.category].interviewer});
export async function generateInterviewTurn(context:InterviewContext,c:AIConfig=aiConfig()){
 const start=performance.now(),parse=(text:string|undefined):unknown=>{try{return JSON.parse(text||'null')}catch{return null}};
 if(availability(c))throw new AIError('ai-not-configured',503);
 if(c.mock)return {output:mockInterviewTurn(context),source:'mock' as const,inputTokens:0,outputTokens:0,thoughtTokens:0,latencyMs:Math.round(performance.now()-start)};
 const payload=JSON.stringify(context);
 if(Buffer.byteLength(payload)>c.maxContextBytes)throw new AIError('context-limit',413);
 try{
  const {GoogleGenAI}=await import('@google/genai');
  const client=new GoogleGenAI({apiKey:c.key});
  const {$schema,...schema}=z.toJSONSchema(outputSchema);
  // Closing-only fields are constrained in the provider schema as well as validated locally.
  const properties=schema.properties as Record<string,Record<string,unknown>>;
  properties.observations.maxItems=context.closing?3:0;
  properties.intent.enum=context.closing?['close']:['clarify','probe','challenge','transition'];
  const system=instructions(context.question as Question,context.style,context.closing);
  if(c.transport==='generate-content'){
   // Explicit compatibility choice; never tried automatically after another API fails.
   const response=await client.models.generateContent({model:c.model,contents:payload,config:{systemInstruction:system,responseMimeType:'application/json',responseJsonSchema:schema,maxOutputTokens:c.maxOutput,thinkingConfig:{thinkingLevel:'LOW' as import('@google/genai').ThinkingLevel},automaticContinuation:false,httpOptions:{timeout:c.timeoutMs,retryOptions:{attempts:1}}}});
   const usage=response.usageMetadata;
   return {output:parse(response.text),source:'gemini' as const,inputTokens:usage?.promptTokenCount||0,outputTokens:usage?.candidatesTokenCount||0,thoughtTokens:usage?.thoughtsTokenCount||0,latencyMs:Math.round(performance.now()-start)};
  }
  const response=await client.interactions.create({model:c.model,store:false,automatic_continuation:false,input:payload,system_instruction:system,response_format:{type:'text',mime_type:'application/json',schema},generation_config:{max_output_tokens:c.maxOutput,thinking_level:'low'}},{timeout_ms:c.timeoutMs,retries:{strategy:'none'}});
  const usage=response.usage;
  return {output:parse(response.output_text),source:'gemini' as const,inputTokens:usage?.total_input_tokens||0,outputTokens:usage?.total_output_tokens||0,thoughtTokens:usage?.total_thought_tokens||0,latencyMs:Math.round(performance.now()-start)};
 }catch(error){
  if(error instanceof AIError)throw error;
  const e=error as {status?:number;headers?:Headers};
  const retry=e.headers?.get?.('retry-after');
  const seconds=retry?(Number(retry)||Math.ceil((Date.parse(retry)-Date.now())/1000)):0;
  // Provider error bodies can contain echoed user data: never log or return them.
  throw new AIError(e.status===429?'provider-quota':e.status===401||e.status===403?'provider-access':e.status===400?'provider-configuration':e.status===404?'provider-model-unavailable':performance.now()-start>=c.timeoutMs-100?'provider-timeout':'provider-unavailable',503,Math.max(15,Math.min(300,seconds||30)),e.status);
 }
}
