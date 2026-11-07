import rawScenes from '../../../content/legacy-fracture/scenes/index.json';
import rawPeople from '../../../content/legacy-fracture/people.json';
import rawDependencies from '../../../content/legacy-fracture/dependencies.json';
import rawTapes from '../../../content/legacy-fracture/tapes.json';
import rawDeliveries from '../../../content/legacy-fracture/deliveries.json';
import rawEvents from '../../../content/legacy-fracture/events/deck.json';
import rawDialogue from '../../../content/legacy-fracture/dialogue.json';

export type Person='oswald'|'cora'|'isaac'|'renata'|'leif'|'alistair';
export type Speaker=Person|'narrator'|'coach';
export type Expression='neutral'|'thinking'|'annoyed'|'approving'|'pressured';
export type SceneId='S00'|'S01'|'S02'|'S03'|'S04'|'S05'|'S06'|'S07'|'S08'|'S09'|'S10'|'S11'|'S12a'|'S12b'|'S13'|'S14'|'S15'|'S16'|'S17'|'S18'|'S19'|'S20'|'S21'|'S22'|'S23';
export type Scene={id:SceneId;type:string;background:'dispatch'|'depot'|'server'|'board'|'night';goal:string;tools:string[];lines:{speaker:Speaker;text:string;expression:Expression;clip?:string|null}[]};
export type Node={id:string;label:string;zone:'legacy'|'new';discovery:'known'|'audit'|'oral'};
export type Edge={source:string;target:string;discovery:'known'|'audit'|'oral'|'oral-or-map'};
export type Delivery={id:string;planned:number;actual:number;cause:'road'|'override'|'window'|'other';location:string;late:boolean};
export type Event={id:string;chapter:number;speaker:Person;condition:string;text:string};
export const scenes=rawScenes as Scene[];
export const sceneById=Object.fromEntries(scenes.map(s=>[s.id,s])) as Record<SceneId,Scene>;
export const sceneOrder=scenes.map(s=>s.id);
export const people=rawPeople as (typeof rawPeople[number]&{id:Person})[];
export const personById=Object.fromEntries(people.map(p=>[p.id,p])) as Record<Person,typeof people[number]>;
export const nodes=rawDependencies.nodes as Node[];
export const edges=rawDependencies.edges as Edge[];
export const tapes=rawTapes;
export const deliveries=rawDeliveries as Delivery[];
export const events=rawEvents as Event[];
export const dialogue=rawDialogue as {id:string;speaker:Speaker;text:string;expression:Expression}[];
export const dialogueById=Object.fromEntries(dialogue.map(l=>[l.id,l])) as Record<string,typeof dialogue[number]>;
export const fleetMoments=[
 {title:'Five depots report in',speaker:'renata' as Person,text:'The first routes are moving.',hold:'none'},
 {title:'Northern crossing',speaker:'renata' as Person,text:'A clearance code is missing from one manifest.',hold:'pause'},
 {title:'The 2 AM job',speaker:'oswald' as Person,text:'LEDGER_SYNC should write before the border table reads.',hold:'call'},
 {title:'The invoice run',speaker:'isaac' as Person,text:'Two totals disagree. Stop the wrong bill.',hold:'rollback'},
 {title:'Morning peak',speaker:'cora' as Person,text:'The trucks must leave with one source of truth.',hold:'none'},
];
export const waveModules=['ROAD_TABLE','TIME_WINDOWS','OVERRIDE_UI','LEDGER_SYNC'] as const;
export const checklist=['Backups','Rollback script','Dispatch override line','Depot communications'] as const;
export const evidenceCards=[
 {id:'late',label:'11% of deliveries late',requires:'audit'},
 {id:'road',label:'Road table last updated 2019',requires:'road'},
 {id:'override',label:'Nightly batch erases overrides',requires:'override'},
 {id:'window',label:'New-customer windows ignored',requires:'window'},
 {id:'thread',label:'LEDGER_SYNC feeds billing',requires:'thread'},
 {id:'poc',label:'Measured replacement parity',requires:'poc'},
];
export function visibleNodes(discovered:string[]){return nodes.filter(n=>discovered.includes(n.id))}
export function visibleEdges(discovered:string[]){return edges.filter(e=>discovered.includes(e.source)&&discovered.includes(e.target))}
export function blastRadius(id:string,discovered:string[]){const result=new Set<string>(),queue=[id];while(queue.length){const next=queue.shift()!;for(const edge of visibleEdges(discovered)){if(edge.source===next&&!result.has(edge.target)){result.add(edge.target);queue.push(edge.target)}}}result.delete(id);return [...result]}
