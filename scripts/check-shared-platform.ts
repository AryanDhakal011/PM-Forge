import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {corrected,loadDefinition} from '../platform/devtools/server';
import {validate} from '../platform/devtools/validate';
import {assertBounds,runPath} from '../platform/devtools/simulate';
const report=[];
for(const id of corrected){const d=loadDefinition(id),v=validate(d);assert.equal(v.valid,true,v.errors.join('\n'));const paths=[];for(let seed=1;seed<=10;seed++){const run=runPath(d,seed,seed%2?'careful':'bold');assertBounds(d,run.state);assert.ok(run.state.completed);paths.push({seed,ending:run.state.completed.ending,actions:run.steps,receipts:Object.keys(run.state.receipts).length})}report.push({id,scenes:d.scenes.length,paths})}
mkdirSync('docs/platform-verification',{recursive:true});writeFileSync('docs/platform-verification/canonical-paths.json',JSON.stringify(report,null,2));console.log('Shared platform: '+corrected.length*10+' complete canonical paths, valid content, bounds and receipts.');
