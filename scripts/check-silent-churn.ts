import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {blocks,commitments,datasets,dialogue,execs,objections,people,planCards,type Event} from '../src/lib/silent-churn/content';
import {simulatePolicy} from '../src/lib/silent-churn/engine';

async function main(){
const root='content/silent-churn/';
const json=(file:string)=>JSON.parse(readFileSync(root+file,'utf8'));
const manifest=json('audio-manifest.json');
const runtime=json('audio-runtime.json');
assert.equal(Object.keys(runtime).length,dialogue.length);
assert.equal(people.length,8);
assert.equal(dialogue.length,151);
assert.equal(datasets.length,8);
assert.equal(objections.length,25);
const ids=new Set<string>();
for(const line of dialogue){
 assert.ok(!ids.has(line.id),line.id);ids.add(line.id);
 assert.ok(line.text.trim().split(/\s+/).length<14,line.id);
 assert.ok(['neutral','thinking','annoyed','approving'].includes(line.expression),line.id);
 assert.ok(['pa','broker',...people.map(p=>p.id)].includes(line.speaker),line.id);
 assert.equal(manifest.lines[line.id]?.caption,line.text,line.id);
 assert.equal(runtime[line.id]?.file,manifest.lines[line.id]?.file,line.id);
 assert.equal(runtime[line.id]?.signature,manifest.lines[line.id]?.signature.slice(0,12),line.id);
 assert.ok(existsSync('public'+manifest.lines[line.id].file),line.id);
}
for(const person of people){
 assert.equal(person.topics.length,6,person.id);
 for(let i=0;i<6;i++)assert.ok(ids.has(`ask-${person.id}-${i}`),person.id);
}
const datasetIds=new Set(datasets.map(d=>d.id));
const cardIds=new Set([...commitments.map(c=>c.id),...planCards.map(c=>c.id)]);
for(const o of objections){
 assert.ok(execs.includes(o.person),o.id);
 assert.ok(o.evidence.every(e=>datasetIds.has(e)||cardIds.has(e)),o.id);
 assert.ok(o.commitments.every(e=>cardIds.has(e)),o.id);
 assert.ok(ids.has(o.id),o.id);
}
for(const p of execs)assert.equal(objections.filter(o=>o.person===p).length,5,p);
const deck=json('events/deck.json') as Event[];
assert.ok(deck.length>=30);
assert.equal(new Set(deck.map(e=>e.id)).size,deck.length);
for(const e of deck){
 assert.ok(people.some(p=>p.id===e.speaker),e.id);
 assert.ok(datasetIds.has(e.dataset),e.id);
 assert.ok(ids.has(e.id),e.id);
}
const scenes=readdirSync(root+'scenes').filter(f=>f.endsWith('.json'));
assert.ok(scenes.length>=19);
for(const file of scenes){const scene=json('scenes/'+file);assert.ok(scene.id&&scene.goal&&scene.background&&Array.isArray(scene.tools),file);}
const template=json('templates.json');
for(const mood of ['warm','neutral','cold'])for(const line of template.variants[mood])for(const match of line.matchAll(/\{(\w+)\}/g))assert.ok(template.slots.includes(match[1]),match[1]);
for(const name of ['room','paper','door','crash'])assert.ok(existsSync(`public/projects/silent-churn/audio/${name}.wav`),name);
assert.ok(existsSync('public/projects/silent-churn/audio/KOKORO-LICENSE.txt'));
for(const policy of ['Coalition-first','Bold'] as const){
 const result=await simulatePolicy(41,policy,json('datasets/chapter-3.json'),deck,false);
 assert.equal(result.stage,'review',policy);
 assert.equal(result.queue.length,policy==='Coalition-first'?15:23,policy);
 assert.ok(result.history.filter(h=>/\d|“/.test(h.text)).length>=25,policy);
}
console.log(`Silent Churn: ${scenes.length} screens, ${deck.length} conditional events, 48 topics, 25 objections, 151 caption-matched clips, two complete policy replays.`);

}
void main().catch(e=>{console.error(e);process.exitCode=1});
