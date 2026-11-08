import {GoogleGenAI} from '@google/genai';
import {AILedger} from '../src/lib/interview-ai/ledger';
import {aiConfig,availability} from '../src/lib/interview-ai/config';
async function main(){
const action=process.argv[2]||'status',ledger=new AILedger(),c=aiConfig();
if(action==='kill'){ledger.setControl('kill','true');console.log('Shared AI admission is paused. In-flight requests may finish. Guided practice remains available.')}
else if(action==='resume'){ledger.setControl('kill','false');console.log('Shared pause cleared. Environment, terms, quota and budget checks still apply.')}
else if(action==='cleanup'){ledger.transaction(()=>ledger.cleanup());console.log('Expired private AI sessions and old operational records removed.')}
else if(action==='verify-model'){
 if(!c.key)throw Error('Install GEMINI_API_KEY on the server first.');
 try{const client=new GoogleGenAI({apiKey:c.key}),model=await client.models.get({model:c.model});console.log(JSON.stringify({model:model.name,methods:model.supportedActions,note:'Metadata access only. This does not verify billing, available project quota, generation quality or latency.'}))}catch{console.log('Model metadata access failed. Check the key, its API restrictions and the configured model. No key or upstream error body is logged.');process.exitCode=1}
}else if(action==='status'){
 const usage=ledger.db.prepare('SELECT outcome,COUNT(*) attempts,SUM(input_tokens) input_tokens,SUM(output_tokens) output_tokens,SUM(thought_tokens) thought_tokens,SUM(cost_micro)/1000000.0 reserved_usd FROM ai_usage GROUP BY outcome').all();
 console.log(JSON.stringify({mode:c.mode,model:c.model,externalAdmission:availability(c)||'configured',sharedPause:ledger.control('kill')==='true',circuitUntil:Number(ledger.control('circuit-until'))||null,limits:{maxTurns:c.maxTurns,dailySessions:c.dailySessions,concurrent:c.concurrent,rpm:c.rpm,tpm:c.tpm,rpd:c.rpd,monthlyBudget:c.monthlyBudget},usage},null,2));
}else throw Error('Use status, kill, resume, cleanup or verify-model.');
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Operation failed.');process.exitCode=1});
