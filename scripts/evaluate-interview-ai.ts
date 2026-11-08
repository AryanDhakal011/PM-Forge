import {mkdirSync,writeFileSync} from 'node:fs';
import {evaluationCases} from '../evals/interview/cases';
import {aiConfig,availability} from '../src/lib/interview-ai/config';
import {AILedger} from '../src/lib/interview-ai/ledger';
import {AIError,mockInterviewTurn,validateOutput,type InterviewContext} from '../src/lib/interview-ai/provider';
import {handleAI} from '../src/lib/interview-ai/service';
import {createRun,advance} from '../src/lib/product/engine';
import {createLive} from '../src/lib/product/interview-live';
import {answerCards} from '../src/lib/interview-ai/model';
async function main(){
const live=process.argv.includes('--live'),filter=process.argv.find(a=>a.startsWith('--case='))?.slice(7),c=aiConfig(),results:{id:string;status:string;source:string;latencyMs?:number;cached?:boolean;reason?:string}[]=[];
if(live&&(availability(c)||c.mock))throw Error('Live evaluation requires an explicitly approved real provider configuration. Check AI setup documentation; no calls were made.');
const ledger=live?new AILedger():null;
for(const item of evaluationCases.filter(item=>!filter||item.id===filter)){
 try{
  if(!live){const context:InterviewContext={question:item.question,brief:item.question.scenario,stage:'workbench',pinnedGoal:item.question.goal,evidence:[],decisions:[],turns:[{id:item.id,role:'candidate',text:item.answer}],style:'assessment',closing:false};validateOutput(mockInterviewTurn(context),context);results.push({id:item.id,status:'pass',source:'deterministic mock'});continue}
  if(item.question.category==='behavioral'&&(c.mode!=='production'||!c.personalApproved)){results.push({id:item.id,status:'guided-only',source:'policy',reason:'Behavioral provider processing is not approved.'});continue}
  const run={...createRun(item.question,'evaluation-local'),id:'evaluation-'+new Date().toISOString().slice(0,10)+'-'+item.id,guided:true,live:createLive()},owner='evaluation:'+new Date().toISOString().slice(0,10);
  await handleAI({action:'start',run,expectedRevision:0,consent:{adult:true,dataConsent:true,region:c.regions[0],style:'assessment'}},owner,ledger!,c);
  await handleAI({action:'advance',run,expectedRevision:0,requestId:'begin-'+run.id},owner,ledger!,c);
  const requestId='turn-'+run.id,cached=!!ledger!.db.prepare("SELECT id FROM ai_requests WHERE id=? AND status='complete'").get(requestId);
  const result=await handleAI({action:'turn',run:advance(run),expectedRevision:1,requestId,candidateTurnId:'candidate-'+item.id,...(c.mode==='free-pilot'?{cardId:answerCards(item.question)[Number(item.id.at(-1))%4].id}:{text:item.answer})},owner,ledger!,c) as unknown as {reply:{latencyMs:number;source:string}};
  results.push({id:item.id,status:'pass',source:result.reply.source,latencyMs:result.reply.latencyMs,cached});
  await handleAI({action:'release',run,expectedRevision:2},owner,ledger!,c);
 }catch(error){results.push({id:item.id,status:'blocked-or-failed',source:live?'provider':'mock',reason:error instanceof AIError?error.code:'validation-failure'})}
}
const latencies=results.filter(r=>r.source==='gemini'&&!r.cached&&r.latencyMs!==undefined).map(r=>r.latencyMs!).sort((a,b)=>a-b),p95=latencies.length?latencies[Math.ceil(latencies.length*.95)-1]:null;
const report={at:new Date().toISOString(),mode:live?'live':'offline',promptVersion:'decision-room-1.0',model:c.model,expertReview:'pending',note:'Offline checks establish contract and guard behavior, not live model realism. A live p95 is descriptive for this sample, not an agreed load-test pass.',freshLiveSamples:latencies.length,p95Ms:p95,results};
mkdirSync('docs/ai-evaluation',{recursive:true});const name=live?'live-'+Date.now():'offline';writeFileSync('docs/ai-evaluation/'+name+'.json',JSON.stringify(report,null,2));writeFileSync('docs/ai-evaluation/failures-'+name+'.json',JSON.stringify(results.filter(r=>r.status==='blocked-or-failed'),null,2));console.log(JSON.stringify({mode:report.mode,cases:results.length,passed:results.filter(r=>r.status==='pass').length,freshLiveSamples:latencies.length,p95Ms:p95,expertReview:'pending'}));if(results.some(r=>r.status==='blocked-or-failed'))process.exitCode=1;
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Operation failed.');process.exitCode=1});
