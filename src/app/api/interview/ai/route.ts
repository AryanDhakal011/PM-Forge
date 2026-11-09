import {cloudEnabled} from '@/lib/cloud/config';
import {cloudAICapability,cloudAIUnavailable} from '@/lib/cloud/availability';
import {randomBytes} from 'node:crypto';
import {AILedger,digest} from '@/lib/interview-ai/ledger';
import {aiConfig,availability} from '@/lib/interview-ai/config';
import {AIError} from '@/lib/interview-ai/provider';
import {requestSchema,handleAI} from '@/lib/interview-ai/service';
import {memberSession,validOrigin,clientKey} from '@/lib/product/server';
import {limitedBody} from '@/lib/portfolio/request';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const localHost=(request:Request)=>['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname);
export async function GET(request:Request){
 if(cloudEnabled())return cloudAICapability();const c=aiConfig(),ledger=new AILedger(),reason=(c.localTest&&!localHost(request)?'Local AI testing is only available on this computer.':null)||availability(c)|| (ledger.control('kill')==='true'?'AI interviews are paused by the operator.':null);return Response.json({available:!reason,reason,localTest:c.localTest,mode:c.mode,model:c.model,mock:c.mock,maxTurns:c.maxTurns,timeboxSeconds:c.timebox,dailySessions:c.dailySessions,regions:c.regions,personalAllowed:c.mode==='production'&&c.personalApproved,dataUse:c.mode==='free-pilot'?'Only approved fictional case positions and unlocked scenario facts go to Google. Private scratch notes are kept on this device. Google may use unpaid-service inputs and outputs to improve its services.':'Your committed answers and necessary unlocked case context are sent to the configured provider. Provider processing is separate from publishing or account sync.'},{headers})}
export async function POST(request:Request){
 if(cloudEnabled())return cloudAIUnavailable();
 if(aiConfig().localTest&&!localHost(request))return Response.json({error:'local-test-only'},{status:403,headers});
 if(!validOrigin(request))return Response.json({error:'origin-rejected'},{status:403,headers});
 let cookie:string|undefined,quotaOwner:string|undefined;
 try{
  const bytes=await limitedBody(request,160000),input=requestSchema.parse(JSON.parse(new TextDecoder().decode(bytes))),ledger=new AILedger();
  ledger.db.exec('CREATE TABLE IF NOT EXISTS ai_api_limits (key TEXT PRIMARY KEY,at INTEGER NOT NULL,count INTEGER NOT NULL)');
  const admitted=ledger.transaction(()=>{const now=Date.now();ledger.db.prepare('DELETE FROM ai_api_limits WHERE at<?').run(now-60000);for(const [key,max] of [[digest(ledger.control('encryption')+clientKey(request)),120],['global',1200]] as const){ledger.db.prepare('INSERT INTO ai_api_limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now);const row=ledger.db.prepare('SELECT count FROM ai_api_limits WHERE key=?').get(key) as {count:number};if(row.count>max)return false}return true});
  if(!admitted)throw new AIError('request-limit',429,60);
  if(input.action==='start'&&availability(aiConfig()))throw new AIError('ai-not-configured',503);
  const token=request.headers.get('cookie')?.match(/(?:^|;\s*)pmforge_ai_guest=([a-f0-9]{64})(?:;|$)/)?.[1],guest=token?ledger.db.prepare('SELECT owner FROM ai_guests WHERE token_hash=? AND expires>?').get(digest(token),Date.now()) as {owner:string}|undefined:undefined;
  const member=await memberSession(request);let owner=member?'member:'+member.user.id:'';
  // Signing in does not revoke the device's right to erase its old guest session.
  // This exception permits deletion only, never reads or continued generation.
  if(input.action==='delete'&&guest&&ledger.db.prepare('SELECT 1 FROM ai_sessions WHERE run_id=? AND owner=?').get(input.run.id,guest.owner))owner=guest.owner;
  if(!owner){
   if(guest)owner=guest.owner;
   else if(input.action==='start'){const credential=randomBytes(32).toString('hex');owner='guest:'+crypto.randomUUID();ledger.db.prepare('INSERT INTO ai_guests VALUES(?,?,?)').run(digest(credential),owner,Date.now()+86400000);cookie=`pmforge_ai_guest=${credential}; Path=/api/interview/ai; HttpOnly; SameSite=Strict; Max-Age=86400${process.env.BETTER_AUTH_URL?.startsWith('https://')||new URL(request.url).protocol==='https:'?'; Secure':''}`}
   else throw new AIError('guest-session-required',401);
   if(input.action==='start')quotaOwner=digest(ledger.control('encryption')+':ip:'+clientKey(request));
  }
  const result=await handleAI(input,owner,ledger,aiConfig(),quotaOwner);return Response.json(result,{headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{})}});
 }catch(error){const failure=error instanceof AIError?error:new AIError(error instanceof Error&&/limit|large/i.test(error.message)?'request-too-large':'invalid-request',error instanceof Error&&/limit|large/i.test(error.message)?413:400);return Response.json({error:failure.code,retryAfter:failure.retryAfter},{status:failure.status,headers:{...headers,...(failure.retryAfter?{'Retry-After':String(failure.retryAfter)}:{}),...(cookie?{'Set-Cookie':cookie}:{})}})}
}
