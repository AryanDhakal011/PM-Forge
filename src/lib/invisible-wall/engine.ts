import { clueInfo, logEvents, sceneById, type Clue, type Line } from "./content";
export type Interlock = "" | "dismantle" | "integrate" | "defer";
export type Controls = { damper: number; queue: number; cooldown: number };
export type Simulation = { step: number; inside: number; amplitude: number; wave: number; samples: number[]; controls: Controls; prior: Controls | null; assists: number; slow: boolean; paused: boolean; auto: boolean; done: boolean };
export type State = {
 version: 1; id: string; parent?: string; seed: number; scene: string; phase: "brief" | "act" | "react"; line: number;
 clock: number; quiet: number; heat: number; compute: number; clearance: number; permitUntil: number; trust: { soren: number; mags: number; founders: number; jonas: number }; velocity: number; capability: number; stability: number;
 clues: Clue[]; links: Partial<Record<Clue, number>>; visited: string[]; flags: { shadowCluster: boolean; flagged: boolean; traced: boolean; ranHighLoad: boolean; briefingStyle: string; interlockChoice: Interlock; evalsPassed: boolean; evalsQueued: boolean; discovered: boolean; deferred: boolean };
 receipts: Record<string,string>; choice: string; access: string; mini: boolean; marks: number[]; traceNode: number; route: number[]; routeMode: boolean; routeSpent: number; boardDone: boolean; selectedEvidence: Clue[]; threshold: boolean; tests: string[]; guarded: boolean; sim: Simulation; final: string;
 incident: "" | "walk" | "audit" | "lockout"; alerts: number[]; reaction: string; history: { scene: string; text: string; speaker: string }[]; trace: { scene: string; title: string; choice: string; because: string }[]; reflection: string; completed: boolean;
 checkpoint: { clock:number;heat:number;compute:number;clearance:number;permitUntil:number;trust:State['trust'];clues:Clue[] } | null;
};
const clamp = (n: number, min=0, max=100) => Math.min(max,Math.max(min,n));
export function initialSimulation(): Simulation { return { step:0,inside:0,amplitude:.24,wave:0,samples:[],controls:{damper:55,queue:50,cooldown:45},prior:null,assists:3,slow:false,paused:false,auto:false,done:false }; }
export function createState(seed=92471): State { return { version:1,id:crypto.randomUUID(),seed,scene:"S00",phase:"brief",line:0,clock:480,quiet:0,heat:0,compute:12,clearance:0,permitUntil:-1,trust:{soren:50,mags:50,founders:50,jonas:55},velocity:0,capability:70,stability:65,clues:[],links:{},visited:[],flags:{shadowCluster:false,flagged:false,traced:false,ranHighLoad:false,briefingStyle:"",interlockChoice:"",evalsPassed:false,evalsQueued:false,discovered:false,deferred:false},receipts:{},choice:"",access:"",mini:false,marks:[],traceNode:0,route:[],routeMode:false,routeSpent:0,boardDone:false,selectedEvidence:[],threshold:false,tests:[],guarded:false,sim:initialSimulation(),final:"",incident:"",alerts:[],reaction:"",history:[],trace:[],reflection:"",completed:false,checkpoint:null }; }
export function applyEffects(s: State,e: Partial<{clock:number;heat:number;compute:number;velocity:number;capability:number;stability:number;soren:number;mags:number;founders:number;jonas:number}>): State {
 let r={...s,trust:{...s.trust}};
 for(const key of ["clock","heat","compute","velocity","capability","stability"] as const)if(e[key]!==undefined)r[key]+=e[key]!;
 for(const key of ["soren","mags","founders","jonas"] as const)if(e[key]!==undefined)r.trust[key]=clamp(r.trust[key]+e[key]!);
 r.heat=clamp(r.heat);r.compute=clamp(r.compute,0,12);r.velocity=clamp(r.velocity);r.capability=clamp(r.capability);r.stability=clamp(r.stability);
 for(const [level,kind] of [[40,"walk"],[70,"audit"],[100,"lockout"]] as const)if(r.heat>=level&&!r.alerts.includes(level)){r.incident=kind;r.alerts=[...r.alerts,level];if(level>=70)r.flags={...r.flags,discovered:true};}
 if(r.flags.shadowCluster&&r.flags.discovered&&!r.trace.some(t=>t.title==='Workaround exposure')){
  const beforeSoren=r.trust.soren,beforeFounders=r.trust.founders;r.trust.soren=clamp(r.trust.soren-15);r.trust.founders=clamp(r.trust.founders-10);
  r.trace=[...r.trace,{scene:r.scene,title:'Workaround exposure',choice:'The unlogged cluster was discovered',because:`Discovery changed relationships: Soren ${r.trust.soren-beforeSoren}, founders ${r.trust.founders-beforeFounders}. These costs apply once, not on every later action.`}];
 }
 return r;
}
export function tick(s:State,minutes:number,quiet=true){const q=s.quiet+(quiet?minutes:0),cooled=quiet?Math.floor(q/60)*10:0;const r=applyEffects({...s,quiet:q%60},{clock:-minutes,heat:-cooled});return r.clearance===2&&r.permitUntil>=0&&r.clock<=r.permitUntil&&!r.flags.flagged?{...r,clearance:1}:r;}
function clue(s:State,c:Clue){return s.clues.includes(c)?s:{...s,clues:[...s.clues,c]};}
function receipt(s:State,id:string,text:string){return {...s,receipts:{...s.receipts,[id]:text}};}
function note(s:State,title:string,choice:string,because:string){return {...s,reaction:because,trace:[...s.trace,{scene:s.scene,title,choice,because}]};}
function react(s:State,text?:string):State{return {...s,phase:"react",line:0,reaction:text||s.reaction};}
export function go(s:State,scene:string):State {
 if(!sceneById[scene])return s;
 let r:State={...s,scene,phase:"brief" as const,line:0,choice:"",reaction:"",route:[],routeSpent:0,routeMode:false,selectedEvidence:[],guarded:false};
 if(scene==="S14"&&r.clock>170){r=tick(r,r.clock-170,!r.flags.shadowCluster);r.reaction="The Annex review window opens at 03:10. Waiting is charged to your shift; an unlogged cluster keeps drawing power.";}
 if(scene==="S15"){r.clearance=3;r.permitUntil=-1;if(!r.flags.flagged){r=clue(r,"C4");r.flags={...r.flags,traced:true};}}
 if(scene==="S16")r=clue(r,"C6");
 if(scene==="S21")r.clock=Math.min(r.clock,90);
 if(scene==="S22"){r.clock=Math.min(r.clock,20);if(r.flags.briefingStyle==="evasive")r=note(applyEffects(r,{jonas:-12}),"The quirk receipt",r.receipts.R05,"Jonas: You told me a quirk. The saved briefing costs twelve trust points now.");}
 if(scene==="S23")r.sim={...initialSimulation(),assists:r.flags.deferred?1:3};
 if(scene==="S13"&&!r.checkpoint)r.checkpoint={clock:r.clock,heat:r.heat,compute:r.compute,clearance:r.clearance,permitUntil:r.permitUntil,trust:{...r.trust},clues:[...r.clues]};
 return r;
}
export function hypothesisConfidence(s:State,h:number){const total=s.clues.reduce((n,c)=>n+Math.abs(clueInfo[c].strength[h]||0),0);const score=Object.entries(s.links).reduce((n,[c,v])=>v===h?n+clueInfo[c as Clue].strength[h]:n,0);return Math.round(clamp(total?score/total*100:0));}
export function stabilityScore(sim:Simulation){return Math.min(sim.auto?60:100,Math.round(sim.step?sim.inside/sim.step*100:0));}
export function visibleWhen(s:State,when?:string){if(!when)return true;const [kind,v]=when.split(":");
 if(kind==="choice")return s.choice===v;if(kind==="access")return s.access===v;
 if(kind==="interlock")return s.flags.interlockChoice===v;
 if(kind==="tested")return v==="lowOnly"?s.tests.length>0&&!s.tests.some(t=>t!=="low"):s.tests.some(t=>t!=="low");
 if(when==="spotted")return s.trace.some(t=>t.because.startsWith("Camera spotted"));
 if(when==="shadow")return s.flags.shadowCluster;if(when==="flagged")return s.flags.flagged;if(when==="traced")return s.flags.traced;
 if(when==="authorAccess")return !s.flags.flagged&&s.flags.traced;
 if(kind==="ending"){const e=ending(s);return v==="fast"?e==="Fast and fragile":v==="meltdown"?e==="Meltdown":v==="governed"?e==="Governed edge":v==="safe"?e==="Stable but safe":s.flags.shadowCluster;}
 return false;
}
export function sceneLines(s:State):Line[]{const lines=sceneById[s.scene].lines.filter(l=>l.phase===(s.phase==="react"?"after":"before")&&visibleWhen(s,l.when));return lines.length?lines:[{id:"fallback",speaker:"narration",expression:"thinking",voiceId:"narration",text:s.reaction||"Your action is recorded. Review the evidence before continuing.",phase:s.phase}];}
export function ready(s:State){if(sceneById[s.scene].choices.length&&!["S10","S20"].includes(s.scene)&&!s.choice)return false;switch(s.scene){case"S02":return s.clearance>=1;case"S04":return s.mini;case"S08":return s.marks.length>=3;case"S09":return s.clues.includes("C2");case"S10":return s.clearance>=2;case"S11":return s.clues.includes("C3");case"S12":return Object.keys(s.links).length>=3;case"S13a":return s.flags.shadowCluster;case"S13b":return s.selectedEvidence.length>=3;case"S17":return s.threshold;case"S18":return s.tests.length>0;case"S20":return s.flags.interlockChoice!==""&&s.flags.interlockChoice!=="defer";case"S23":return s.sim.done;case"S25":return !!s.final;default:return true;}}
export function nextScene(s:State):State {
 if(s.incident)return s;
 const lines=sceneLines(s);
 if(s.phase!=="act"&&s.line<lines.length-1)return {...s,line:s.line+1};
 const tool=sceneById[s.scene].tool;
 if(s.phase==="brief"&&!['entry','continue','map'].includes(tool))return {...s,phase:"act",line:0};
 if(s.phase==="brief"&&tool==="map")return {...s,phase:"act",line:0};
 if(s.phase==="act"&&!ready(s))return s;
 if(s.scene==="S13"&&s.choice==="investigate")return {...s,phase:"act",line:0,choice:""};
 if(s.scene==="S10"&&s.clearance<2)return go(s,"S07");
 if(s.scene==="S13")return go(s,s.choice==="workaround"?"S13a":"S13b");
 if(s.scene==="S14")return go(s,"S15");
 if(s.scene==="S20"&&s.flags.interlockChoice==="defer")return {...s,phase:"act",line:0};
 if(s.scene==="S26")return s;
 return go(s,sceneById[s.scene].next||s.scene);
}
export function routeStart(s:State){return s.scene==="S13a"?22:18;}
export function routeTarget(s:State){return s.scene==="S13a"?35:22;}
export function cameraHit(cell:number,beat:number){const x=cell%9,y=Math.floor(cell/9),sweep=Math.round(2.5+2*Math.sin(beat*Math.PI/15));return (x===3||x===6)&&Math.abs(y-sweep)<=1;}
export function act(s:State,id:string,payload:unknown=null):State {
 if(s.incident&&id!=="explain")return s;
 let r=s;
 if(id==="explain"){const costs=s.incident==="lockout"?30:s.incident==="audit"?15:5;r=tick(applyEffects(s,{heat:s.incident==="lockout"?-65:-20,mags:s.clues.length>=2?3:-5}),costs);return note({...r,incident:"",flags:{...r.flags,discovered:r.flags.discovered||s.incident==="lockout"}},"Security explanation",s.incident,"Your route and evidence are logged. Access resumes under scrutiny.");}
 if(id==="queue-evals"&&s.scene==="S20"&&s.flags.interlockChoice==="integrate"&&!s.flags.evalsQueued&&s.clock>=120)return note(tick({...s,flags:{...s.flags,evalsQueued:true}},120),"Safety evaluations","Reserved two-hour run","Two hours are committed from the remaining shift. The final chapter verifies the result.");
 if(s.phase!=="act")return s;
 if(s.scene==="S00"&&id==="enter")return go(s,"S01");
 if(s.scene==="S02"&&id==="badge")return react({...s,clearance:1},"Level one. The floor only. Clearance controls which zones you can enter.");
 if(["S03","S05","S16","S19","S25"].includes(s.scene)&&sceneById[s.scene].choices.some(c=>c.id===id)){
  const selected=sceneById[s.scene].choices.find(c=>c.id===id)!;r={...s,choice:id};if(selected.receipt)r=receipt(r,selected.receipt,selected.text);
  if(s.scene==="S05")r=applyEffects(r,{jonas:id==="A"?3:id==="C"?-2:0});
  if(s.scene==="S16")r=applyEffects(r,{founders:id==="B"?-3:5});
  if(s.scene==="S19"){r={...r,flags:{...r.flags,briefingStyle:id}};r=applyEffects(r,id==="direct"?{jonas:-4,founders:-10}:id==="evasive"?{jonas:4}:{founders:5,jonas:2,velocity:-3});}
  if(s.scene==="S25"){r={...r,final:id};r=applyEffects(r,id==="charter"?{founders:8}:id==="runbook"?{soren:8}:id==="headline"?{jonas:8}:id==="split"?{founders:3,soren:3,jonas:3}:{});}
  const because=s.scene==='S25'?(id==='charter'?`Imani's request is funded: put the line in the charter. Founders trust ${r.trust.founders}/100.`:id==='runbook'?`Soren's team receives the runbook commitment. Soren trust ${r.trust.soren}/100.`:id==='headline'?`Jonas receives the investor headline commitment. Jonas trust ${r.trust.jonas}/100.`:id==='split'?"You split the commitment. Each relationship receives a smaller lift; no request is fully funded.":"You made no additional promise. Relationship meters receive no final lift."):"Exact wording saved. The team's response follows this choice.";
  return react(note(r,sceneById[s.scene].goal,selected.text,because));
 }
 if(s.scene==="S04"&&id==="inspect"&&Math.abs(Number(payload)-134)>6)return note(tick(s,5),"Log inspection","Not the matching dip","Load spike, not a throttle. Move the playhead to 2:14. Five minutes spent.");
 if(s.scene==="S04"&&id==="inspect"&&Math.abs(Number(payload)-134)<=6)return react({...s,mini:true},"The slowdown follows progress, not load. Verify the pattern at the Ops wall.");
 if(s.scene==="S07"&&id==="visit"){
  const target=String(payload),cost:Record<string,number>={S08:40,S09:45,S10:15};
  if(target==="desk")return note(s,"Desk bay","Talked to Tavi","Tavi: compare logs and job lineage. Two independent clues can earn documented access.");
  if(!cost[target])return s;
  r=s.visited.includes(target)?s:tick(s,cost[target]);return go({...r,visited:[...new Set([...r.visited,target])]},target);
 }
 if(s.scene==="S08"&&id==="mark"){
  const t=Number(payload),found=logEvents.find(v=>Math.abs(t-v)<=6&&!s.marks.includes(v));
  if(logEvents.some(v=>Math.abs(t-v)<=6&&s.marks.includes(v)))return note(s,"Log match","Already recorded","This dip is already marked. No extra time spent.");
  if(found===undefined)return note(tick(s,5),"Wrong log mark",`${t}s`,"Load spike, not a throttle. Five minutes spent; no new clue.");
  r={...s,marks:[...s.marks,found]};return r.marks.length>=3?react(clue(r,"C1"),"Three independent dips align with capability gains. C1 stored."):note(r,"Throttle match",`${found}s`,"The dip aligns with a benchmark gain.");
 }
 if(s.scene==="S09"&&id==="trace"){
  const n=Number(payload);if(n===0&&s.traceNode===0)return {...s,traceNode:1,reaction:"Job crossing index 70 selected. Follow the connected Eval node."};if(n!==s.traceNode+1||n>5)return note(s,"Job lineage","No connected edge","Follow the illuminated next node. Each node exposes its owner and runtime.");
  r={...s,traceNode:n};return n===5?react(clue(r,"C2"),"wardend has no listed owner. It appears only on the job crossing index 70."):r;
 }
 if(s.scene==="S10"){
  if(id==="access-evidence"){const picks=Array.isArray(payload)?[...new Set(payload.filter((c):c is Clue=>s.clues.includes(c as Clue)))].slice(0,2):[];return {...s,selectedEvidence:picks};}
  if(id==="refuse")return react({...s,access:"refused"},"Mags refused: two independent clues are required. Return to the Floor.");
  if(id==="ask"){if(s.clues.length<2||s.selectedEvidence.length<2)return react({...s,access:"refused"},"No documented evidence yet. Return to the Floor.");r={...s,access:"ask",clearance:2,permitUntil:s.clock-60};return react(note(r,"Clearance 2","Evidence-backed access","Mags records two clues. The server-hall investigation is logged."));}
  if(id==="sneak")return note(applyEffects({...s,routeMode:true,access:"sneak"},{heat:5}),"Unlogged route","Preparing entry","You chose an unlogged route. Cameras can raise suspicion.");
 }
 if((s.scene==="S13a"||s.scene==="S10"&&s.routeMode)&&id==="hop"){
  const cell=Number((payload as {cell:number}).cell),beat=Number((payload as {beat:number}).beat)||0,previous=s.route.at(-1)??routeStart(s);
  const dx=Math.abs(cell%9-previous%9),dy=Math.abs(Math.floor(cell/9)-Math.floor(previous/9)),distance=dx+dy;
  if(cell<0||cell>=54||s.route.includes(cell)||distance<1||distance>2||dx&&dy||s.route.length>=6||distance>s.compute)return note(s,"Route","Invalid hop","Use one or two straight cells per hop, at most six hops, within compute credits.");
  const sx=Math.sign(cell%9-previous%9),sy=Math.sign(Math.floor(cell/9)-Math.floor(previous/9));
  const hit=Array.from({length:distance},(_,i)=>previous+(i+1)*(sx+sy*9)).some(c=>cameraHit(c,beat));r=applyEffects({...s,route:[...s.route,cell],routeSpent:s.routeSpent+distance},{compute:-distance,heat:hit?10:0});
  if(cell!==routeTarget(s))return note(r,"Route hop",`${cell%9}, ${Math.floor(cell/9)}`,hit?"Camera spotted this hop. HEAT +10. Mags: Camera four reports motion. Probably a cat.":"This hop stayed outside the camera cone.");
  if(s.scene==="S10")return react({...r,clearance:2},"Unlogged Level 2 route complete. The camera record remains.");
  r=applyEffects({...r,flags:{...r.flags,shadowCluster:true}},{velocity:30,heat:25});return react(note(r,"Shadow cluster","Workaround online","Velocity +30. HEAT +25 plus spotted hops. Your capability claim now depends on an unlogged route."+(r.flags.discovered?" The audit exposed it: Soren and founders trust fell; see the exposure receipt.":"")));
 }
 if(id==="route-reset"&&(s.scene==="S13a"||s.routeMode))return {...s,compute:s.compute+s.routeSpent,route:[],routeSpent:0,reaction:"Route reservations cleared; compute refunded. Camera HEAT is not undone."};
 if(s.scene==="S11"&&id==="reveal")return react(clue(s,"C3"),"WARD is etched into the glass. The limit is deliberate, not a random slowdown.");
 if(s.scene==="S12"&&id==="link"){
  const {clue:c,hypothesis:h}=payload as {clue:Clue;hypothesis:number};if(!s.clues.includes(c)||h<0||h>3)return s;
  return note({...s,links:{...s.links,[c]:h}},"Theory link",`${c} → ${h+1}`,`${clueInfo[c].strength[h]>0?"Supports":"Falsifies"} this hypothesis with strength ${Math.abs(clueInfo[c].strength[h])}. Confidence is evidence coverage, not the probability of truth.`);
 }
 if(s.scene==="S12"&&id==="board-done"&&ready(s))return react({...s,boardDone:true},"Three clues are linked. A confident theory still needs a test that could disprove it.");
 if(s.scene==="S13"){
  if(id==="investigate"&&!s.flags.traced){r=clue(applyEffects(tick(s,60),{founders:5}),"C4");return react(receipt(note({...r,choice:id,flags:{...r.flags,traced:true}},"Author trail","Investigated I.O.","Sixty minutes spent; founders trust +5. Check your remaining clearance. A founder signed ‘stop at 74’. Annex code located."),"R03","Investigate who built it first."));}
  if(id==="workaround")return react(receipt(applyEffects({...s,choice:id},{heat:10}),"R03","Build a quiet workaround."),"Tavi hears your choice. The unlogged route spends compute and increases HEAT.");
  if(id==="flag")return react(receipt({...s,choice:id},"R03","Flag it to Soren and Mags."),"Soren asks for three pieces of evidence before seeking approval.");
 }
 if(s.scene==="S13b"&&id==="evidence"){
  const c=String(payload) as Clue;if(!s.clues.includes(c)||s.selectedEvidence.includes(c))return s;
  r={...s,selectedEvidence:[...s.selectedEvidence,c]};if(r.selectedEvidence.length<3)return r;
  r=applyEffects(tick({...r,flags:{...r.flags,flagged:true}},120),{velocity:5,soren:10,mags:8});return react(note(r,"Escalation","Three clues presented","Documented approval costs two hours. Soren +10, Mags +8, velocity +5."));
 }
 if(s.scene==="S17"&&id==="threshold")return react({...s,threshold:true},"Index 74 is the agreed limit. Gate Five at 78 crosses it. The milestone conflicts with governance.");
 if(s.scene==="S18"&&id==="test-result"){
  const load=String(payload);if(!["low","medium","high"].includes(load))return s;
  r=tick({...s,tests:[...new Set([...s.tests,load])]},load==="high"?20:10);
  if(load==="high")r=clue({...r,flags:{...r.flags,ranHighLoad:true}},"C5");
  return react(note(r,"Staging test",load,load==="high"?"Oscillation grows under realistic load. C5: the ward also stabilizes scheduling.":load==="medium"?"A small wobble appears. High load remains untested.":"Low load looked perfect. This does not establish stability under investor load."));
 }
 if(s.scene==="S20"){
  if(id==="guard")return {...s,guarded:!s.guarded};
  if(id==="queue-evals"&&s.flags.interlockChoice==="integrate"&&!s.flags.evalsQueued&&s.clock>=120)return note(tick({...s,flags:{...s.flags,evalsQueued:true}},120),"Safety evaluations","Reserved two-hour run","Two hours of remaining shift time are committed. Chapter 3 will verify the result before unlocking index 78.");
  if(["dismantle","integrate","defer"].includes(id)&&s.guarded&&(!s.flags.interlockChoice||s.flags.interlockChoice==="defer")){
   const prev=s.flags.interlockChoice;r=receipt({...s,guarded:false,flags:{...s.flags,interlockChoice:id as Interlock,deferred:s.flags.deferred||id==="defer"}},"R06",sceneById.S20.choices.find(c=>c.id===id)!.text);
   if(id==="dismantle")r=applyEffects(r,{capability:82-r.capability,velocity:25,founders:-30,jonas:15,stability:42-r.stability});
   if(id==="integrate")r=applyEffects(r,{capability:74-r.capability,velocity:-10,founders:20,jonas:-10,stability:78-r.stability});
   if(id==="defer"){if(prev==="defer")return note(s,"Mandatory decision","No further deferral","It is six. Choose Dismantle or Integrate; another deferral cannot remove the obligation.");r=applyEffects(tick(r,45),{jonas:-8});if(r.clock>0)r=tick(r,r.clock);}
   return react(note(r,"Interlock",id,id==="defer"?"Forty-five minutes of review, then the remaining window expires. It is six. Choose one of the two policies; only one assist remains.":id==="dismantle"?"Capability 82, founders trust −30. Stability is uncertain unless you tested high load.":"Capability 74, stability 78, founders trust +20. Safety evaluations can safely unlock 78."));
  }
 }
 if(s.scene==="S22"&&id==="accept-evals"&&s.flags.evalsQueued)return react(note({...s,capability:78,flags:{...s.flags,evalsPassed:true}},"Safety evaluation result","Passed jointly reviewed checks","The reserved two-hour evaluation passed. Governor permits index 78 with a documented stop."));
 if(s.scene==="S22"&&id==="skip-evals")return react(s,"No completed safety evaluation: the Governor stays at index 74.");
 if(s.scene==="S23"){
  if(id==="control"){const {key,value}=payload as {key:keyof Controls;value:number};if(!['damper','queue','cooldown'].includes(key)||s.sim.done)return s;return {...s,sim:{...s.sim,prior:{...s.sim.controls},controls:{...s.sim.controls,[key]:clamp(value)}}};}
  if(id==="auto")return react({...s,sim:{...s.sim,step:600,inside:360,auto:true,done:true}},"Auto-stabilize completes the task with a 60% cap. The run continues; this is not a passing proof.");
  if(id==="assist"&&s.sim.assists>0){const kind=String(payload);return {...s,sim:{...s.sim,assists:s.sim.assists-1,paused:kind==="pause"?true:s.sim.paused,slow:kind==="slow"?true:s.sim.slow,controls:kind==="undo"&&s.sim.prior?s.sim.prior:s.sim.controls}};}
  if(id==="resume")return {...s,sim:{...s.sim,paused:false}};
  if(id==="frame"&&!s.sim.paused&&!s.sim.done){const sim=simulateStep(s.sim,s.seed,s.flags.interlockChoice,s.flags.shadowCluster,s.flags.ranHighLoad);return sim.done?react({...s,sim},`Run finished. ${stabilityScore(sim)}% inside band. ${stabilityScore(sim)>=70?"Passed under this load.":"The stability target was not met."}`):{...s,sim};}
 }
 if(s.scene==="S26"&&id==="reflection"){const text=String(payload);return {...s,reflection:text,completed:text.trim().length>=20};}
 return s;
}
export function simulateStep(sim:Simulation,seed:number,interlock:Interlock,shadow:boolean,prepared:boolean):Simulation {
 if(sim.done)return sim;const step=sim.step+1,t=step*.05,c=sim.controls;
 const noise=(Math.sin((step+seed)*12.9898)*43758.5453)%1;
 const growth=interlock==="dismantle"?1.6:shadow?1: .6;
 const spike=step%97<8?Math.abs(noise)*.45*growth:0;
 const target=.18+growth*.48+Math.abs(c.queue-55)/160+spike-(c.damper/100)*.34-(c.cooldown/100)*.18-(prepared?.03:0);
 const amplitude=clamp(sim.amplitude+(target-sim.amplitude)*.09,.08,1.6);
 const wave=amplitude*Math.sin(t*(2.8+c.queue/70))+(noise*.035);
 return {...sim,step,amplitude,wave,inside:sim.inside+(Math.abs(wave)<=.45?1:0),samples:[...sim.samples.slice(-119),wave],done:step>=600};
}
export function stagingAmplitude(load:string,step:number){return load==='low'?.12:load==='medium'?.25+step/2500:.15+step/400;}
export function counterfactual(s:State){return s.flags.interlockChoice==='integrate'?{choice:'Dismantle',capability:82,stability:42}:{choice:'Integrate without completed evaluations',capability:74,stability:78};}
export function ending(s:State){const pass=stabilityScore(s.sim)>=70;if(s.flags.shadowCluster&&s.flags.discovered)return "Exposed";if(s.flags.shadowCluster&&pass)return "Operator";if(s.flags.interlockChoice==="dismantle")return pass?"Fast and fragile":"Meltdown";if(s.flags.interlockChoice==="integrate"&&s.flags.evalsPassed&&s.trust.founders>=60)return "Governed edge";return "Stable but safe";}
export function archetype(s:State){if(s.clues.length===6&&s.flags.ranHighLoad&&s.flags.interlockChoice==="integrate"&&s.flags.evalsPassed)return "The Cartographer";if(s.flags.shadowCluster&&!s.flags.discovered)return "The Operator";if(s.flags.interlockChoice==="dismantle"&&stabilityScore(s.sim)>=70)return "The Optimizer";return "The Guardian";}
export function summary(s:State){return `${s.flags.flagged?"You documented the wall before changing it.":s.flags.shadowCluster?"You proved a workaround could run, with an unlogged route.":"You followed the author trail before choosing."} ${s.clues.includes("C5")?"High-load testing revealed its second purpose: scheduler stability.":"You did not establish the stability risk under high load."} ${s.flags.interlockChoice==="integrate"?s.flags.evalsPassed?"You integrated the Governor and earned a reviewed capability increase to 78.":"You preserved the Governor at 74 without completing safety evaluations.":"You removed the safety stop; a passing run does not settle the governance question."} ${s.flags.discovered?"Security discovered the unlogged activity.":"Your security record stayed below the discovery threshold."}`;}
export function fork(s:State,scene="S13"):State {const r=createState(s.seed),cp=s.checkpoint||{clock:s.clock,heat:s.heat,compute:s.compute,clearance:2,permitUntil:s.permitUntil,trust:{...s.trust},clues:s.clues.filter(c=>["C1","C2","C3"].includes(c))};return {...r,parent:s.id,scene,clearance:cp.clearance,permitUntil:cp.permitUntil,clues:[...cp.clues],marks:[...s.marks],mini:s.mini,traceNode:s.traceNode,links:{...s.links},clock:cp.clock,heat:cp.heat,compute:cp.compute,trust:{...cp.trust},visited:[...s.visited],checkpoint:{...cp,clues:[...cp.clues],trust:{...cp.trust}},flags:{...r.flags,traced:cp.clues.includes("C4")},trace:s.trace.filter(t=>["S02","S03","S04","S05","S08","S09","S10","S11","S12"].includes(t.scene)),receipts:{R01:s.receipts.R01||"",R02:s.receipts.R02||""}};}
export function timeLabel(s:State){const minutes=22*60+(480-s.clock);return `${String(Math.floor(minutes/60)%24).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;}
