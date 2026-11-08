import {mkdirSync,writeFileSync} from 'node:fs';
import {aiConfig} from '../src/lib/interview-ai/config';
import {AILedger} from '../src/lib/interview-ai/ledger';
import {handleAI} from '../src/lib/interview-ai/service';
import {createRun,advance} from '../src/lib/product/engine';
import {createLive} from '../src/lib/product/interview-live';
import {questions} from '../src/lib/product/content';
import {AIError} from '../src/lib/interview-ai/provider';
async function main(){
 if(!process.argv.includes('--confirmed-free'))throw Error('Confirm the project is Free with billing disabled before this single controlled probe.');
 const compatibility=process.argv.includes('--generate-content'),model=process.argv.find(a=>a.startsWith('--model='))?.slice(8)||aiConfig().model,modelSuffix=model===aiConfig().model?'':model.replace(/[^a-z0-9-]/g,'-')+'-';
 const c={...aiConfig(),model,transport:compatibility?'generate-content':'interactions',mode:'free-pilot' as const,mock:false,monthlyBudget:0,freeVerified:true,termsApproved:true,regions:['NP'],rpm:1,tpm:40000,rpd:8,maxTurns:2,concurrent:1,dailySessions:3};
 if(!c.key)throw Error('Install the server API key first.');
 // These are restrictive local probe ceilings, NOT verified provider project quotas.
 // The durable global RPD gate permits a small bounded set of attempts today, including retries.
 const ledger=new AILedger(),day=new Date().toISOString().slice(0,10),run={...createRun(questions.find(q=>q.id==='RCA-E-1')!,'controlled-probe-local'),id:'controlled-probe-'+(compatibility?'compat-':'')+modelSuffix+day,guided:true,live:createLive()},owner='controlled-probe:'+day;
 const report:Record<string,unknown>={at:new Date().toISOString(),model:c.model,transport:c.transport,mode:'bounded controlled fictional probe',projectPlan:'Free — owner confirmed',actualProjectQuotas:'not supplied',maximumExternalAttempts:5,publicAdmission:'closed',p95Target:'not established by one sample'};
 try{
  await handleAI({action:'start',run,expectedRevision:0,consent:{adult:true,dataConsent:true,region:'NP',style:'assessment'}},owner,ledger,c);
  await handleAI({action:'advance',run,expectedRevision:0,requestId:'begin-'+run.id},owner,ledger,c);
  const result=await handleAI({action:'turn',run:advance(run),expectedRevision:1,requestId:'turn-'+run.id,candidateTurnId:'candidate-'+run.id,cardId:'position-0'},owner,ledger,c) as unknown as {reply:{source:string;message:string;latencyMs:number}};
  Object.assign(report,{status:'validated-reply',source:result.reply.source,latencyMs:result.reply.latencyMs,message:result.reply.message});
 }catch(error){Object.assign(report,{status:'blocked-or-failed',reason:error instanceof AIError?error.code:'validation-failure',providerStatus:error instanceof AIError?error.providerStatus:undefined});process.exitCode=1}
 finally{ledger.db.prepare('UPDATE ai_sessions SET active_until=0 WHERE run_id=?').run(run.id);mkdirSync('docs/ai-evaluation',{recursive:true});writeFileSync('docs/ai-evaluation/controlled-live-probe'+(compatibility?'-compat':'')+(modelSuffix?'-'+modelSuffix:'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
}
void main().catch(()=>{console.error('Controlled probe could not finish. Check server configuration. No secret or upstream error body is logged.');process.exitCode=1});
