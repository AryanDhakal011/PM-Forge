import assert from 'node:assert/strict';
import {cases} from '../src/lib/pivot-point/content';
import {createState,reduce,type Action,type Route,type State} from '../src/lib/pivot-point/engine';
export type Strategy={route:Route;safe?:boolean;reports?:string[];scaleEvidence?:boolean;intervene?:boolean;seed?:number;maxHubs?:boolean};
export function playScenario(strategy:Strategy):State{
 let s=createState(strategy.seed??5105);s.id='test-'+s.seed+'-'+strategy.route;
 const act=(a:Action)=>{if(s.reaction)s=reduce(s,{type:'reaction'});s=reduce(s,a)};
 const through=(target:string)=>{let steps=0;while(s.scene!==target&&steps++<80){const prev=s.scene+'-'+s.line+'-'+!!s.reaction;act({type:'next'});if(prev===s.scene+'-'+s.line+'-'+!!s.reaction)throw Error(`Stuck at ${s.scene} heading to ${target}`)}assert.equal(s.scene,target)};
 through('S02');act({type:'first',id:'community'});act({type:'reply',id:'left'});act({type:'reply',id:'change'});act({type:'reply',id:'numbers'});act({type:'walk',id:'esi'});
 for(const id of ['lens','case','lever','frontier'])act({type:'practice',id});through('S08');act({type:'planner',id:'people'});
 for(const id of strategy.reports??['outcomes','equity','staff'])act({type:'report',id});through('S10');act({type:'lens',id:'Distance'});through('S11');act({type:'cost-mode',id:'recovered'});through('S12');
 cases.forEach((p,i)=>act({type:'assign',id:p.id,text:i<5?'flagship':i<10?'community':'waitlist'}));through('S13');act({type:'draft',text:'Reach working families while accepting lower average recovery.'});act({type:'direction',id:strategy.route==='hybrid'?'community':strategy.route});through('S16');act({type:'reply',id:'listen'});assert.equal(s.scene,'S17');
 if(strategy.route==='hybrid')act({type:'preset',id:'hybrid'});if(strategy.maxHubs)act({type:'design',id:'hubs',value:3});act({type:'simulate'});through('S18');
 if(strategy.safe!==false)for(const [id,value] of [['supervision',10],['escalation',2],['audit',1]] as const)act({type:'guard',id,value});act({type:'guard-confirm'});
 const evidence=strategy.scaleEvidence===false?s.reports:[s.reports[0],s.reports[1],'scale'];for(const id of evidence)act({type:'evidence',id});act({type:'present'});through('S22');
 for(const id of strategy.intervene===false?['watch','watch','watch','watch','watch']:['staff','escalate','watch','hours','watch'])act({type:'launch',id});through('S23');for(const id of s.reports.slice(0,2))act({type:'evidence',id});act({type:'draft',text:'We accept fewer intensive places to fund broader local access.'});act({type:'vote'});through('S25');act({type:'final',id:'workers'});act({type:'reaction'});assert.equal(s.scene,'S26');assert.equal(s.completed,true);return s;
}
