import assert from "node:assert/strict";
import { act, archetype, createState, ending, go, nextScene, type State } from "../src/lib/invisible-wall/engine";
export function smoke(path:'golden'|'flag'|'workaround'|'meltdown'='golden'){
 let r=go(createState(9723),'S01'),iterations=0;const visited=new Set<string>();
 while(r.scene!=='S26'&&iterations++<500){visited.add(r.scene);
  if(r.incident){r=act(r,'explain');continue;}
  if(r.scene==='S20'&&r.phase==='react'&&r.flags.interlockChoice==='integrate'&&!r.flags.evalsQueued&&r.clock>=120&&path==='golden'){r=act(r,'queue-evals');continue;}
  if(r.phase!=='act'){r=nextScene(r);continue;}
  const choose=(id:string,payload?:unknown)=>{r=act(r,id,payload)};
  switch(r.scene){
   case'S02':choose('badge');break;case'S03':choose('B');break;case'S04':choose('inspect',134);break;case'S05':choose('B');break;
   case'S07':choose('visit',!r.clues.includes('C1')?'S08':!r.clues.includes('C2')?'S09':'S10');break;
   case'S08':for(const t of [134,286,438])choose('mark',t);break;
   case'S09':for(let i=1;i<=5;i++)choose('trace',i);break;
   case'S10':choose('access-evidence',['C1','C2']);choose('ask');break;
   case'S11':choose('reveal');break;
   case'S12':for(const c of r.clues.slice(0,3))choose('link',{clue:c,hypothesis:2});choose('board-done');break;
   case'S13':choose(path==='golden'&&!r.flags.traced?'investigate':path==='workaround'?'workaround':'flag');break;
   case'S13a':for(const cell of [24,26,35])choose('hop',{cell,beat:0});break;
   case'S13b':for(const c of r.clues.slice(0,3))choose('evidence',c);break;
   case'S16':choose('A');break;case'S17':choose('threshold');break;
   case'S18':choose('test-result',path==='meltdown'?'low':'high');break;
   case'S19':choose('governance');break;
   case'S20':choose('guard');choose(path==='meltdown'||path==='workaround'?'dismantle':'integrate');break;
   case'S22':choose(r.flags.evalsQueued?'accept-evals':'skip-evals');break;
   case'S23':if(path!=='meltdown')for(const [key,value]of Object.entries({damper:100,queue:55,cooldown:100}))choose('control',{key,value});for(let i=0;i<600;i++)choose('frame');break;
   case'S25':choose('charter');break;
   default:throw Error('No smoke action for '+r.scene);
  }
 }
 assert.equal(r.scene,'S26',`${path} stuck at ${r.scene}/${r.phase} after ${iterations} actions`);assert.ok(iterations<500);
 console.log(`${path}: ${visited.size} scenes → ${ending(r)} / ${archetype(r)}; ${iterations} actions.`);return r;
}
if(process.argv[1]?.includes('invisible-wall-smoke'))for(const p of ['golden','flag','workaround','meltdown'] as const)smoke(p);
