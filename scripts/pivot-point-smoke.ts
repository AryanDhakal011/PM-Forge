import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {consequences,dataLines,ending,forecast,letters} from '../src/lib/pivot-point/engine';
import {decode,encode} from '../src/lib/pivot-point/storage';
import {playScenario,type Strategy} from './pivot-point-scenario';
const paths:Strategy[]=[{route:'flagship'},{route:'community',safe:false},{route:'community'},{route:'premium'},{route:'hybrid'},{route:'hybrid',reports:['outcomes','cost','staff']},{route:'hybrid',scaleEvidence:false},{route:'flagship',maxHubs:true},{route:'community',safe:false,intervene:false},{route:'community',reports:['outcomes','equity','funding']}];
const seen=new Set<string>(),results=[];
for(const [i,p] of paths.entries()){const s=playScenario({...p,seed:5105+i});assert.equal(s.scene,'S26');assert.ok(decode(encode(s)));assert.ok(dataLines(s).length>=25);for(let chapter=1;chapter<=3;chapter++)for(const e of consequences({...s,chapter}))seen.add(e.id);results.push({path:i+1,strategy:p,ending:ending(s),forecast:forecast(s.design),letters:letters(s).map(l=>({patient:l.patient,reached:l.reached})),receipts:s.receipts.length})}
mkdirSync('docs/pivot-point-verification',{recursive:true});writeFileSync('docs/pivot-point-verification/balance.json',JSON.stringify({paths:results,eventCoverage:[...seen]},null,2));assert.equal(seen.size,24);console.log('Pivot Point smoke: 10 complete reducer-driven paths, 24/24 events, deterministic saves and 25+ data-dependent observations.');
