import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {checklist,deliveries,dialogue,edges,events,nodes,people,sceneById,scenes,tapes,waveModules} from '../src/lib/legacy-fracture/content';
import {simulatePolicy} from '../src/lib/legacy-fracture/engine';
const raw=(p:string)=>JSON.parse(readFileSync('content/legacy-fracture/'+p,'utf8'));
async function main(){
 assert.equal(scenes.length,25);assert.equal(people.length,6);assert.equal(nodes.length,24);assert.equal(deliveries.length,40);assert.ok(events.length>=24);
 assert.equal(new Set(scenes.map(s=>s.id)).size,25);
 const speakers=new Set(['narrator','coach',...people.map(p=>p.id)]);
 const toolNames=new Set(['sort','reply','question','walk','practice','planner','reel','tape','map','move','poc','board','consequence','coalition','migration','cutover','fleet','outcome','final','review']);
 for(const scene of scenes){assert.ok(scene.type&&scene.background&&scene.goal,scene.id);assert.ok(scene.tools.every(t=>toolNames.has(t)),scene.id);assert.ok(scene.lines.length<=3,scene.id);for(const line of scene.lines){assert.ok(speakers.has(line.speaker),scene.id);assert.ok(line.text.split(/\s+/).length<14,scene.id+' '+line.text);assert.ok(['neutral','thinking','annoyed','approving','pressured'].includes(line.expression),scene.id)}}
 const ids=new Set(dialogue.map(x=>x.id));assert.equal(ids.size,dialogue.length);const manifest=raw('audio-manifest.json'),runtime=raw('audio-runtime.json');assert.equal(Object.keys(manifest.lines).length,dialogue.length);
 for(const line of dialogue){assert.ok(speakers.has(line.speaker),line.id);assert.ok(line.text.split(/\s+/).length<14,line.id);assert.equal(manifest.lines[line.id]?.caption,line.text,line.id);assert.equal(runtime[line.id]?.file,manifest.lines[line.id]?.file,line.id);assert.ok(existsSync('public'+runtime[line.id].file),line.id)}
 for(const scene of scenes)for(let i=0;i<scene.lines.length;i++)assert.ok(ids.has(scene.id+'-'+i),scene.id+' line '+i);
 for(const name of ['dispatch','depot','server','board','night'])assert.ok(scenes.some(x=>x.background===name));
 for(const name of ['bell','clock','paper','truck','tape','hum','switch','silence'])assert.ok(existsSync('public/projects/legacy-fracture/audio/'+name+'.wav'));
 assert.ok(existsSync('public/projects/legacy-fracture/audio/KOKORO-LICENSE.txt'));
 assert.equal(new Set(nodes.map(n=>n.id)).size,24);const nodeIds=new Set(nodes.map(n=>n.id));for(const edge of edges){assert.ok(nodeIds.has(edge.source)&&nodeIds.has(edge.target));assert.ok(['known','audit','oral','oral-or-map'].includes(edge.discovery))}assert.ok(edges.some(e=>e.source==='LEDGER_SYNC'&&e.target==='BILLING'&&e.discovery==='oral-or-map'));
 assert.ok(tapes.some(t=>t.id==='border'));assert.ok(sceneById.S10.tools.includes('map'));assert.ok(waveModules.includes('LEDGER_SYNC'));assert.equal(checklist.length,4);
 for(const e of events){assert.ok(speakers.has(e.speaker));assert.ok([1,2,3].includes(e.chapter));assert.ok(['always','thread-known','thread-unknown','ops','finance','shadow','overnight','friction-high','parity-low'].includes(e.condition),e.id)}
 const template=raw('templates.json');for(const mood of ['warm','neutral','cold'])for(const line of template.variants[mood])for(const match of line.matchAll(/\{(\w+)\}/g))assert.ok(template.slots.includes(match[1]));
 const a=await simulatePolicy(41,'Quiet POC + phased'),b=await simulatePolicy(41,'Expose + overnight');
 assert.equal(a.scene,'S23');assert.equal(b.scene,'S23');assert.notEqual(a.outcome,b.outcome);assert.ok(a.history.filter(h=>/\d|“/.test(h.text)).length>=25);assert.ok(b.history.filter(h=>/\d|“/.test(h.text)).length>=25);
 console.log('Legacy Fracture: 25 scenes, 24 modules, 40 deliveries, 27 events, 69 caption-matched clips, two complete contrasting replays.');
}
void main().catch(e=>{console.error(e);process.exitCode=1});
