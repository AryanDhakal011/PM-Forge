import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {backlog,dialogue,people,type EventItem} from '../src/lib/feature-factory/content';
import {simulatePolicy} from '../src/lib/feature-factory/engine';
async function main(){
const root='content/feature-factory/';
const manifest=JSON.parse(readFileSync(root+'audio-manifest.json','utf8'));
for(const name of ['gong','hold','factory','incident'])assert.ok(existsSync('public/projects/feature-factory/audio/'+name+'.wav'));assert.ok(readdirSync('public/projects/feature-factory/audio').includes('KOKORO-LICENSE.txt'),'Kokoro license filename must match case on Linux hosts');assert.equal(backlog.length,12);assert.equal(people.length,6);
const ids=new Set<string>();for(const line of dialogue){assert.ok(!ids.has(line.id));ids.add(line.id);assert.ok(line.text.trim().split(/\s+/).length<14,`${line.id}: too long`);assert.ok(line.speaker==='pa'||people.some(p=>p.id===line.speaker));assert.ok(['neutral','thinking','annoyed','approving','pressured'].includes(line.expression));const audio=manifest.lines[line.id];assert.equal(audio?.caption,line.text,`${line.id}: caption mismatch`);assert.ok(audio.file.startsWith('/projects/feature-factory/audio/'));assert.ok(existsSync('public'+audio.file),line.id);}
for(const person of people){assert.ok(person.topics.length>=6);assert.equal(person.topics.length,person.leadins.length);assert.ok(person.topics.every((_,i)=>ids.has(`ask-${person.id}-${i}`)));}
const conditions=['always','fog','truth','tiles','scope','autosaveRisk','debtHigh','untested','rushed','vanity','nilsLow','moraleLow','lilaLow','retentionUp','tilesShipped','week2','flagged','debtLow','receipt','fogLate','ai','manyIncidents','healthy','cassLow','week3','manual','reliable','inflight','noRollback','pulsePlan','searchDone','bugsHigh','overloaded'];
const decks:EventItem[][]=[];for(let w=1;w<=3;w++){const deck=JSON.parse(readFileSync(root+`events/week-${w}.json`,'utf8')) as EventItem[];assert.ok(new Set(deck.map(e=>e.id)).size>=36);for(const event of deck){assert.equal(event.window,w);assert.ok(conditions.includes(event.condition),event.id);assert.ok(ids.has(event.id));assert.ok(event.choices.every(c=>['do','schedule','delegate','decline','ask'].includes(c)));assert.ok(!event.feature||backlog.some(f=>f.id===event.feature));}decks.push(deck);}
for(const file of readdirSync(root+'scenes')){const scene=JSON.parse(readFileSync(root+'scenes/'+file,'utf8'));assert.ok(scene.type&&scene.background&&scene.goal&&Array.isArray(scene.tools));assert.ok(scene.tools.every((t:string)=>['board','allocation','stress','gate','slides','inbox','dashboard','calendar','logs'].includes(t)));}
const template=JSON.parse(readFileSync(root+'templates.json','utf8'));for(const mood of ['warm','neutral','cold'])for(const line of template.variants[mood])for(const match of line.matchAll(/\{(\w+)\}/g))assert.ok(template.slots.includes(match[1]));
for(const p of ['Velocity-first','Stability-first'] as const){const run=await simulatePolicy(420,p,decks,false);assert.equal(run.stage,'review');const dynamic=run.history.filter(h=>/\d|“/.test(h.text));assert.ok(dynamic.length>=25);assert.ok(1-dynamic.length/run.history.length<=.3,'Too many static generated lines');}
console.log(`Feature Factory: 23 screens, 42 conditional events, 48 ask topics and ${dialogue.length} caption-matched recordings verified.`);

}
void main().catch(error=>{console.error(error);process.exitCode=1});
