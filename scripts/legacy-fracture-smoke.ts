import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {events} from '../src/lib/legacy-fracture/content';
import {simulateScenario,type Strategy} from '../src/lib/legacy-fracture/engine';

async function main(){
const strategies:Strategy[]=[
 {move:'poc',ally:'ops',cutover:'phased-shadow',tapes:'border',pocScopes:['routing','road'],shadow:true,rollback:true,holds:true},
 {move:'expose',ally:'finance',cutover:'overnight',tapes:'none',pocScopes:[],shadow:false,rollback:false,holds:false},
 {move:'walk',ally:'both',cutover:'phased-shadow',tapes:'all',pocScopes:[],shadow:true,rollback:true,holds:true},
 {move:'poc',ally:'finance',cutover:'phased',tapes:'none',pocScopes:['routing','road'],shadow:false,rollback:true,holds:false},
 {move:'expose',ally:'ops',cutover:'phased',tapes:'all',pocScopes:[],shadow:true,rollback:true,holds:false},
 {move:'walk',ally:'finance',cutover:'overnight',tapes:'border',pocScopes:[],shadow:false,rollback:true,holds:true},
 {move:'poc',ally:'both',cutover:'phased-shadow',tapes:'all',pocScopes:['routing','road'],shadow:true,rollback:true,holds:true},
 {move:'expose',ally:'both',cutover:'overnight',tapes:'none',pocScopes:[],shadow:false,rollback:true,holds:false},
 {move:'walk',ally:'ops',cutover:'phased',tapes:'none',pocScopes:[],shadow:false,rollback:false,holds:true},
 {move:'poc',ally:'ops',cutover:'overnight',tapes:'border',pocScopes:['routing','road'],shadow:false,rollback:true,holds:false},
];
const seeds=[41,21812,577,9081,314159];
const seen=new Set<string>(),paths=[];
for(let i=0;i<strategies.length;i++){
 const seed=seeds[i%seeds.length],strategy=strategies[i],s=await simulateScenario(seed,strategy);
 assert.equal(s.scene,'S23',`path ${i+1} did not reach review`);
 assert.ok(s.outcome,`path ${i+1} has no outcome`);
 assert.ok(s.week<=9,`path ${i+1} missed peak`);
 assert.ok(s.receipts.every(r=>r.effects.every(e=>Number.isFinite(e.before)&&Number.isFinite(e.after))));
 if(strategy.cutover==='overnight'&&!s.discovered.includes('LEDGER_SYNC')){assert.ok(s.misbillingDays>=3&&s.misbillingDays<=6);assert.equal(s.borderClearance,false)}
 for(const id of s.eventsSeen)seen.add(id);
 paths.push({path:i+1,seed,strategy,outcome:s.outcome,week:s.week,parity:s.parity,mandate:s.mandate,friction:s.friction,threadFound:s.discovered.includes('LEDGER_SYNC'),misbillingDays:s.misbillingDays,borderClearance:s.borderClearance,events:s.eventsSeen,receipts:s.receipts.length});
}
const report={paths,coverage:{eventsFired:[...seen].sort(),eventsUnfired:events.map(e=>e.id).filter(id=>!seen.has(id))}};
mkdirSync('docs/legacy-fracture-verification',{recursive:true});
writeFileSync('docs/legacy-fracture-verification/balance.json',JSON.stringify(report,null,2));
console.log(`Legacy Fracture: ${paths.length} complete seeded paths; ${seen.size}/${events.length} event types observed. Unfired events recorded.`);
}
void main().catch(e=>{console.error(e);process.exitCode=1});

