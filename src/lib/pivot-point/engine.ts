import {BUDGET,WAITLIST,cases,events,launchMoments,letterTemplates,patients,reports,sceneById,type Speaker} from './content';
export type Route='flagship'|'community'|'hybrid'|'premium';
export type Design={hubs:number;sites:number;specialists:number;workers:number;share:number;eligibility:number;travel:number;telehealth:number;supervision:number;escalation:number;audit:number;premium:boolean};
export type Receipt={id:string;scene:string;title:string;choice:string;because:string;text:string};
export type Reaction={speaker:Speaker;text:string;expression:'approving'|'thinking'|'pressured'|'annoyed'};
export type State={version:1;id:string;seed:number;scene:string;line:number;month:number;chapter:number;attention:number;difficulty:'guided'|'standard'|'sharp';design:Design;trust:Record<string,number>;reports:string[];practice:string[];assignments:Record<string,{program:string;reason:string}>;receipts:Receipt[];reaction:Reaction|null;history:string[];direction:Route;premiumUnlocked:boolean;lens:string;costMode:string;reason:string;draft:string;evidence:string[];boardEvidence:string[];simulation:{retention:number;adoption:number;supervision:number;played:boolean};launch:{moment:number;remaining:number;actions:string[];resolved:number;incidents:number};eventsSeen:string[];credibility:number;rewinds:number[];checkpoint:State|null;completed:boolean;final:string;telemetry:{scene:string;action:string}[]};
export type Action={type:string;id?:string;value?:number;text?:string};
export const baseDesign:Design={hubs:1,sites:0,specialists:16,workers:12,share:100,eligibility:1,travel:0,telehealth:0,supervision:0,escalation:0,audit:0,premium:false};
export function createState(seed=5105,difficulty:State['difficulty']='guided'):State{return {version:1,id:`pivot-${seed>>>0}`,seed:seed>>>0,scene:'S01',line:0,month:1,chapter:1,attention:6,difficulty,design:{...baseDesign},trust:{kapoor:55,hamid:50,tamsin:55,esi:50,jun:55,bernard:50,staff:60},reports:[],practice:[],assignments:{},receipts:[],reaction:null,history:[],direction:'flagship',premiumUnlocked:false,lens:'Distance',costMode:'patient',reason:'Fairness',draft:'',evidence:[],boardEvidence:[],simulation:{retention:85,adoption:75,supervision:75,played:false},launch:{moment:0,remaining:3,actions:[],resolved:0,incidents:0},eventsSeen:[],credibility:70,rewinds:[],checkpoint:null,completed:false,final:'',telemetry:[]}}
export function random(seed:number,index=0){let n=(seed+Math.imul(index+1,0x9e3779b9))>>>0;n^=n>>>16;n=Math.imul(n,0x21f0aaad);n^=n>>>15;n=Math.imul(n,0x735a2d97);return ((n^(n>>>15))>>>0)/4294967296}
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function safeguards(d:Design){return d.supervision>0&&d.escalation>0&&d.audit>0}
function capacityForecast(d:Design){
 const safe=safeguards(d),budget=BUDGET+(d.premium?1200000:0),travelCost=d.travel*9000,available=Math.max(0,budget-travelCost),flagBudget=available*d.share/100,communityBudget=available-flagBudget;
 const overhead=(d.supervision===10?.07:d.supervision===20?.04:0)+(d.escalation===2?.03:d.escalation===1?.015:0)+(d.audit===1?.02:d.audit===2?.01:0);
 const eligible=Math.floor(patients.filter(p=>p.severity>=d.eligibility).length/1000*WAITLIST);
 const flagship=Math.floor(Math.min(flagBudget/9000,d.hubs*400,d.specialists*25,eligible));
 const community=Math.floor(Math.min(communityBudget/(900*(1+overhead)),d.sites*350,d.workers*100,Math.max(0,eligible-flagship)));
 const reach=flagship+community,recoveryCommunity=.54+(d.supervision>0?.04:0)+(d.escalation>0?.03:0)+(d.audit>0?.02:0);
 const recovered=Math.round(flagship*.82+community*recoveryCommunity),recovery=reach?Math.round((flagship*.82+community*recoveryCommunity)/reach*100):0;
 const spent=Math.round(flagship*9000+community*900*(1+overhead)+travelCost),qualityRisk=clamp(40-(d.supervision===10?15:d.supervision===20?9:0)-(d.escalation===2?12:d.escalation===1?6:0)-(d.audit===1?8:d.audit===2?4:0)+(community&&!safe?15:0));
 const underserved=reach?clamp(Math.round((flagship*(.08+d.travel*.003)+community*(.62+d.telehealth*.001))/reach*100)-(d.premium?12:0)):0;
 return {flagship,community,reach,recovered,recovery,left:WAITLIST-reach,spent,budget,unused:budget-spent,costPerRecovered:recovered?Math.round(spent/recovered):0,qualityRisk,underserved,talent:100-(d.premium?18:0),staffLoad:clamp(Math.round((flagship/Math.max(1,d.specialists*25)+community/Math.max(1,d.workers*100))*50)),safe,recoveryCommunity};
}
export function designFor(route:Route):Design{return {...baseDesign,...(route==='community'?{share:0,hubs:0,sites:10,workers:35}:route==='hybrid'?{share:30,hubs:1,sites:8,workers:28}:route==='premium'?{share:65,hubs:2,sites:5,workers:20,premium:true}:{} )}}
const coverageCache=new Map<string,{ids:Set<string>;threshold:number;underserved:number}>();
function accessScore(d:Design,p:{distance:number;severity:number;rank:number}){
 const localShare=(100-d.share)/100,remotePenalty=p.distance>25?Math.max(.15,3-localShare*2.3-d.travel*.06-d.telehealth*.008+(d.premium?.4:0)):.8;
 return p.rank*remotePenalty;
}
function coverage(d:Design){
 const key=JSON.stringify(d),cached=coverageCache.get(key);if(cached)return cached;
 const f=capacityForecast(d),eligible=patients.filter(p=>p.severity>=d.eligibility).sort((a,b)=>accessScore(d,a)-accessScore(d,b));
 const selected=eligible.slice(0,Math.round(f.reach/WAITLIST*1000)),ids=new Set(selected.map(p=>p.id)),threshold=selected.length?accessScore(d,selected.at(-1)!):-1;
 const result={ids,threshold,underserved:Math.round(selected.filter(p=>p.distance>25).length/410*100)};if(coverageCache.size>=24)coverageCache.delete(coverageCache.keys().next().value!);coverageCache.set(key,result);return result;
}
export function forecast(d:Design){return {...capacityForecast(d),underserved:coverage(d).underserved}}
export function reached(d:Design,p:{id?:string;distance:number;severity:number;rank:number}){
 const c=coverage(d);return p.id?.startsWith('L')?c.ids.has(p.id):p.severity>=d.eligibility&&accessScore(d,p)<=c.threshold;
}
export function letters(s:State){return letterTemplates.map(t=>{const p=cases.find(c=>c.id===t.patient)!;const yes=reached(s.design,p);return {patient:p.name,id:p.id,reached:yes,month:s.month>=12?12:6,text:yes?t.reached:t.missed,context:yes?'A place in your model':'Still outside the model’s reach'}})}
export function ending(s:State){const f=forecast(s.design);if(s.design.premium)return 'Talent drain';if(f.community===0)return 'Excellence for few';if(!f.safe)return 'Resource strain';if(f.flagship>0&&s.evidence.length>=3&&s.boardEvidence.length>=2)return 'Balanced and defended';return 'Reach with care'}
export function archetype(s:State){const f=forecast(s.design);if(s.design.premium)return 'The Financier';if(!f.community)return 'The Specialist';if(f.flagship&&f.safe&&s.evidence.length===3&&s.boardEvidence.length===2&&f.underserved>55&&s.launch.incidents===0)return 'The Systems Doctor';return f.flagship&&f.safe?'The Steward':'The Humanitarian'}
export function availableEvidence(s:State){return [...s.reports,...(s.simulation.played?['scale']:[])];}
export function evidenceLabel(id:string){return id==='scale'?'Three-year scalability test':reports.find(r=>r.id===id)?.title||id}
export function boardVote(s:State){const f=forecast(s.design);return [{person:'kapoor' as const,yes:f.safe&&s.evidence.includes('scale'),reason:f.safe&&s.evidence.includes('scale')?'Safeguards and scalability evidence support the standard.':'Clinical support remains conditional.'},{person:'hamid' as const,yes:f.spent<=f.budget&&f.reach>0,reason:'The funded model fits the annual budget.'},{person:'tamsin' as const,yes:s.boardEvidence.length===2&&s.receipts.some(r=>r.id==='BOARD'),reason:s.design.premium?'The premium-access and talent tradeoff must remain public.':'The accepted downside is recorded with evidence.'}]}
function receipt(s:State,id:string,title:string,choice:string,because:string){s.receipts.push({id,scene:s.scene,title,choice,because,text:s.draft.slice(0,140)});s.draft=''}
function react(s:State,speaker:Speaker,text:string,expression:Reaction['expression']='thinking'){s.reaction={speaker,text,expression};s.history.push(text)}
function goto(s:State,id:string){s.scene=id;s.line=0;s.reaction=null;const n=Number(id.slice(1));const month=n<=7?1:n<=10?2:n<=14?3:n<=16?5:n<=20?6:n<=23?9:12;if(month!==s.month){s.month=month;s.attention=6}const chapter=n<=14?1:n<=20?2:3;if(chapter!==s.chapter){s.chapter=chapter;s.checkpoint=null}if(!s.checkpoint&&['S08','S16','S22'].includes(id))s.checkpoint={...structuredClone(s),checkpoint:null};}
export function readiness(s:State){switch(s.scene){case'S07':return s.practice.length===4;case'S09':return s.reports.length===3;case'S10':return s.practice.includes('lens-real');case'S11':return s.practice.includes('ledger');case'S12':return Object.keys(s.assignments).length===12;case'S17':return s.simulation.played;case'S19':return s.evidence.length===3;case'S22':return s.launch.moment>=5;case'S23':return s.boardEvidence.length===2&&s.draft.trim().length>=8;default:return true}}
export function sceneLines(s:State){const f=forecast(s.design),base=sceneById[s.scene].lines;
 if(s.scene==='S14')return [...(s.direction==='flagship'?[{speaker:'kapoor' as Speaker,text:'Thank you.',expression:'approving' as const},{speaker:'hamid' as Speaker,text:'Four hundred people. For three thousand names.',expression:'pressured' as const}]:s.direction==='premium'?[{speaker:'hamid' as Speaker,text:'It pays for the rest.',expression:'approving' as const},{speaker:'kapoor' as Speaker,text:'Two tiers. Is that who we are?',expression:'pressured' as const}]:[{speaker:'esi' as Speaker,text:'Finally.',expression:'approving' as const},{speaker:'kapoor' as Speaker,text:'I worry about quality. Show me safeguards.',expression:'pressured' as const}]),{speaker:'jun' as Speaker,text:`Your model reaches ${f.reach.toLocaleString()} people. ${f.left.toLocaleString()} remain waiting.`,expression:'thinking' as const}];
 if(s.scene==='S16')return [{speaker:'kapoor' as Speaker,text:s.design.premium?'My specialists feel like a luxury brand.':f.community?'Recovery drops. You promised guardrails.':'You protected the standard.',expression:'pressured' as const}];
 if(s.scene==='S20')return [{speaker:'kapoor' as Speaker,text:f.safe&&s.evidence.includes('scale')?'That is a model I can sign. Launch the first site.':f.community?'The quality conditions remain unresolved. My support is conditional.':'The standard holds. Access remains our unanswered question.',expression:f.safe?'approving' as const:'pressured' as const}];
 if(s.scene==='S24')return [{speaker:'narrator' as Speaker,text:`${ending(s)}. ${f.reach.toLocaleString()} served. ${f.recovered.toLocaleString()} expected recoveries.`,expression:'thinking' as const}];
 return base;
}
export function consequences(s:State){const f=forecast(s.design),route=s.design.premium?'premium':f.flagship&&f.community?'hybrid':f.community?'community':'flagship';return events.filter(e=>e.chapter===s.chapter&&e.route===route).map(e=>({...e,because:`Because your model allocates ${s.design.share}% to intensive care${s.design.premium?' and opens a premium hub':''}.`}));}
export function dataLines(s:State){const f=forecast(s.design);return [
 `Your model reaches ${f.reach} of ${WAITLIST} people.`,`${f.left} remain outside funded capacity.`,`${f.recovered} recoveries are expected, not guaranteed.`,`${f.recovery}% is the weighted recovery estimate.`,`${f.underserved}% is the underserved-access estimate.`,`${f.flagship} intensive places are funded.`,`${f.community} community places are funded.`,`${f.costPerRecovered.toLocaleString()} is the cost per expected recovery.`,`${f.unused.toLocaleString()} remains unallocated.`,`${s.design.sites} community sites are planned.`,`${s.design.hubs} intensive hubs are planned.`,`${s.design.workers} community workers are funded.`,`${s.design.specialists} specialists are planned.`,`${s.design.travel}% travel support is selected.`,`${s.design.telehealth}% remote care is selected.`,`${f.qualityRisk}/100 is the quality risk estimate.`,`${f.staffLoad}/100 is the staff load estimate.`,`${f.talent}/100 staff retention remains before launch.`,`${s.reports.length} reports informed the proposal.`,`${7-s.reports.length} reports remain unopened.`,`${s.evidence.length} evidence cards support design review.`,`${s.boardEvidence.length} evidence cards support the board decision.`,`${s.launch.resolved} launch moments received a matching intervention.`,`${s.launch.incidents} operational follow-ups remain after launch.`,`${s.credibility}/100 credibility remains.`,`${s.attention}/6 attention remains this month.`,`${s.simulation.retention}% retention was tested in the scale model.`]}
export function reduce(previous:State,a:Action):State{
 const s=structuredClone(previous),id=a.id||'',value=a.value??0,n=Number(s.scene.slice(1));
 if(a.type==='draft'){s.draft=(a.text||'').slice(0,140);return s}
 if(a.type==='reaction'){s.reaction=null;return s}
 if(s.reaction)return previous;
 if(a.type==='rewind'){if(!s.checkpoint||s.rewinds.includes(s.chapter))return previous;const r=structuredClone(s.checkpoint);r.rewinds=[...s.rewinds,s.chapter];r.credibility=Math.max(0,s.credibility-10);r.id=s.id;r.checkpoint=null;react(r,'tamsin','We can revisit this. Explain why the plan changed.','pressured');return r}
 if(a.type==='next'){
  const lines=sceneLines(s);if(s.line<lines.length-1){s.history.push(lines[s.line].text);s.line++;return s}
  if(!readiness(s)||['S02','S03','S04','S05','S06','S08','S13','S16','S19','S23','S25','S26'].includes(s.scene))return previous;
  if(s.scene==='S18'&&forecast(s.design).community&&!s.practice.includes('guardrails-confirmed'))return previous;
  if(n<26)goto(s,`S${String(n+1).padStart(2,'0')}`);return s;
 }
 if(a.type==='skip-lines'){s.line=sceneLines(s).length-1;return s}
 if(a.type==='lens'&&['S07','S10'].includes(s.scene)&&['Severity','Distance','Income','Condition'].includes(id)){s.lens=id;if(s.scene==='S10'&&!s.practice.includes('lens-real'))s.practice.push('lens-real')}
 else if(a.type==='practice'&&s.scene==='S07'&&['lens','case','lever','frontier'].includes(id)){if(!s.practice.includes(id))s.practice.push(id);if(s.practice.length===4)react(s,'coach','That’s the loop. The real year starts now.','approving')}
 else if(a.type==='first'&&s.scene==='S02'&&['flagship','community'].includes(id)){receipt(s,'P01','Raman’s first place',id,'You chose between travel burden and recovery depth.');goto(s,'S03');react(s,'raman',id==='flagship'?'Strong recovery odds. The trip is hard.':'Care next week. Slightly lower odds.')}
 else if(a.type==='reply'&&['S03','S04','S05','S16'].includes(s.scene)){
  const options:Record<string,Record<string,[string,string]>>={S03:{best:['I’ll find the best model.','Good.'],left:['Who gets left out today?','Esi will show you.'],board:['What is the board afraid of?','Headlines. Two-tier care.']},S04:{worry:['What worries you?','Quality dropping where nobody is watching.'],best:['What does the program do best?','Intensive support. Consistent specialist attention.'],change:['What would change your mind?','Evidence. And safeguards that work.']},S05:{numbers:['Show me the numbers.','Finally.'],funds:['Premium care for some funds care for others?','That’s the idea.'],later:['Not yet.','Not yet is also a cost.']},S16:{listen:['Walk me through your concern.','I need to know who catches a missed referral.'],safeguards:['Here is the safeguard plan.','Show me supervision, escalation, and audit capacity.'],wait:['The waitlist cannot wait.','Neither can quality. Make both visible.']}};
  const pair=options[s.scene][id];if(!pair)return previous;const person=s.scene==='S03'?'tamsin':s.scene==='S05'?'hamid':'kapoor';if(s.scene==='S05'&&id!=='later')s.premiumUnlocked=true;receipt(s,s.scene==='S03'?'P02':s.scene==='S05'?'P03':s.scene==='S16'?'P05':'Q01','Conversation',pair[0],'Your question determined which concern was discussed.');goto(s,`S${String(n+1).padStart(2,'0')}`);react(s,person,pair[1],id==='wait'?'pressured':'thinking');
 }
 else if(a.type==='walk'&&s.scene==='S06'&&['esi','jun'].includes(id)){s.attention-=2;s.trust[id]+=10;receipt(s,'W01','First walk',id,'Two attention points bought a different view of the problem.');goto(s,'S07');react(s,id as Speaker,id==='esi'?'Raman knows every bus timetable. None fits his shop.':'The registry records attendance. It does not explain absence.')}
 else if(a.type==='planner'&&s.scene==='S08'&&['people','outcomes','cost'].includes(id)){receipt(s,'PLAN','Monthly focus',id,'Your focus guides the questions; report choices remain yours.');goto(s,'S09')}
 else if(a.type==='report'&&s.scene==='S09'&&reports.some(r=>r.id===id)&&!s.reports.includes(id)&&s.reports.length<3&&s.attention>0){s.reports.push(id);s.attention--;const report=reports.find(r=>r.id===id)!;react(s,report.speaker as Speaker,report.reaction,'thinking')}
 else if(a.type==='cost-mode'&&s.scene==='S11'&&['patient','recovered'].includes(id)){s.costMode=id;if(!s.practice.includes('ledger'))s.practice.push('ledger')}
 else if(a.type==='reason'&&s.scene==='S12'&&['Severity','Distance','Risk','Fairness'].includes(id))s.reason=id;
 else if(a.type==='assign'&&s.scene==='S12'&&cases.some(c=>c.id===id)&&['flagship','community','waitlist'].includes(a.text||'')){
  if(a.text==='flagship'&&Object.entries(s.assignments).filter(([key,v])=>key!==id&&v.program==='flagship').length>=7)return previous;
  s.assignments[id]={program:a.text!,reason:s.reason};
 }
 else if(a.type==='direction'&&s.scene==='S13'&&['flagship','community','premium'].includes(id)&&s.draft.trim().length>=8){
  if(id==='premium'&&!s.premiumUnlocked)return previous;s.direction=id as Route;s.design=designFor(id as Route);receipt(s,'P04','Direction',id,'You allocated the fixed budget and recorded the downside.');s.trust.kapoor=clamp(s.trust.kapoor+(id==='flagship'?15:-10));s.trust.esi=clamp(s.trust.esi+(id==='community'?15:id==='premium'?-15:0));s.trust.hamid=clamp(s.trust.hamid+(id==='premium'?15:id==='community'?5:-10));if(id==='premium')s.trust.staff-=18;goto(s,'S14');react(s,id==='flagship'?'hamid':id==='premium'?'kapoor':'esi',id==='flagship'?'Four hundred people. For three thousand names.':id==='premium'?'Two tiers. Is that who we are?':'Finally. Now show me the safeguards.',id==='community'?'approving':'pressured');
 }
 else if(a.type==='design'&&['S10','S17','S19'].includes(s.scene)){
  const limits:Record<string,[number,number]>={hubs:[0,3],sites:[0,12],specialists:[0,48],workers:[0,40],share:[0,100],eligibility:[1,5],travel:[0,20],telehealth:[0,60]};if(!limits[id])return previous;s.design={...s.design,[id]:Math.round(clamp(value,...limits[id]))};
 }
 else if(a.type==='preset'&&['S10','S17','S19'].includes(s.scene)&&['flagship','community','hybrid','premium'].includes(id)){if(id==='premium'&&!s.premiumUnlocked)return previous;const old=s.design;s.design={...designFor(id as Route),supervision:old.supervision,escalation:old.escalation,audit:old.audit}}
 else if(a.type==='reset-design'&&['S10','S17','S19'].includes(s.scene))s.design=designFor(s.direction);
 else if(a.type==='sensitivity'&&s.scene==='S17'&&['retention','adoption','supervision'].includes(id)){s.simulation={...s.simulation,[id]:clamp(value,40,100),played:false}}
 else if(a.type==='simulate'&&s.scene==='S17'&&s.attention>0){s.attention--;s.simulation.played=true;react(s,'jun',`At ${s.simulation.retention}% retention, supervision is still your widest uncertainty.`)}
 else if(a.type==='guard'&&s.scene==='S18'){
  if(!({supervision:[0,10,20],escalation:[0,1,2],audit:[0,1,2]} as Record<string,number[]>)[id]?.includes(value))return previous;s.design={...s.design,[id]:value};
 }
 else if(a.type==='guard-confirm'&&s.scene==='S18'){s.practice.push('guardrails-confirmed');receipt(s,'GUARD','Quality commitments',safeguards(s.design)?'Funded safeguards':'Limited safeguards','Supervision, escalation, and audit choices change cost and quality risk.');goto(s,'S19');react(s,'kapoor',safeguards(s.design)?'That is a model I can sign.':'My support remains conditional. Record that risk.',safeguards(s.design)?'approving':'pressured')}
 else if(a.type==='evidence'&&['S19','S23'].includes(s.scene)&&availableEvidence(s).includes(id)){
  const key=s.scene==='S19'?'evidence':'boardEvidence',limit=s.scene==='S19'?3:2;const items=s[key];if(items.includes(id))s[key]=items.filter(x=>x!==id);else if(items.length<limit)items.push(id);
 }
 else if(a.type==='present'&&s.scene==='S19'&&readiness(s)&&forecast(s.design).reach>0){const f=forecast(s.design),support=f.safe&&s.evidence.includes('scale');s.trust.kapoor=clamp(s.trust.kapoor+(support?20:-5));receipt(s,'DESIGN','Design review',`${f.flagship} intensive / ${f.community} community`,support?'Safeguards and scalability evidence earned clinical support.':'Clinical support remains conditional without safeguards and scalability evidence.');goto(s,'S20');react(s,'kapoor',s.design.premium?'Three of my specialists are looking elsewhere.':support?'Launch the first site.':f.community?'Show me how you will close the quality gap.':'You protected the standard. Show the board the access cost.',support?'approving':'pressured')}
 else if(a.type==='launch'&&s.scene==='S22'&&s.launch.moment<5&&['staff','escalate','hours','watch'].includes(id)){
  if(id!=='watch'&&s.launch.remaining===0)return previous;const moment=launchMoments[s.launch.moment],match=id===moment.need;if(id!=='watch')s.launch.remaining--;if(match&&id!=='watch')s.launch.resolved++;
  const risk=forecast(s.design).qualityRisk/200,incident=random(s.seed,s.launch.moment)<Math.max(0,risk-(match?.1:0));if(incident)s.launch.incidents++;s.launch.actions.push(id);s.launch.moment++;
  receipt(s,`L${s.launch.moment}`,'Launch moment',`${moment.title}: ${id}`,match?'Your intervention matched the operational need.':`The ${moment.need} need remains; follow-up depends on funded safeguards.`);react(s,moment.speaker as Speaker,match?id==='watch'?'The team handles this within the plan.':'That helped. The team has room to respond.':incident?'This needs follow-up. Log it for the review.':'We will carry that constraint into tomorrow.',match?'approving':'pressured');
 }
 else if(a.type==='vote'&&s.scene==='S23'&&readiness(s)){receipt(s,'BOARD','Board tradeoff',s.draft,'You linked two reports you actually opened to the accepted downside.');s.trust.bernard=clamp(50+(s.boardEvidence.length*10)-(s.launch.incidents*5));goto(s,'S24');react(s,'bernard','That is a defensible trade-off. Publish the conditions.','approving')}
 else if(a.type==='final'&&s.scene==='S25'&&['workers','specialists','publish','split','none'].includes(id)){s.final=id;receipt(s,'FINAL','Next year’s protection',id,'Your final commitment allocates leadership attention, not an invented extra budget.');if(id==='workers')s.trust.esi=clamp(s.trust.esi+10);if(id==='specialists')s.trust.kapoor=clamp(s.trust.kapoor+10);if(id==='publish')s.trust.bernard=clamp(s.trust.bernard+10);goto(s,'S26');s.completed=true;react(s,'tamsin','Keep the promise visible. We review it next quarter.','approving')}
 else return previous;
 s.telemetry.push({scene:previous.scene,action:a.type+(id?':'+id:'')});return s;
}
export function simulate(seed:number,route:Route,safe=true):State{
 let s=createState(seed);s.id=`comparison-${seed}-${route}`;s.design=designFor(route);s.direction=route;if(safe){s.design.supervision=10;s.design.escalation=2;s.design.audit=1}s.reports=['outcomes','equity','staff'];s.simulation.played=true;s.evidence=['outcomes','equity','scale'];s.boardEvidence=['equity','outcomes'];s.scene='S26';s.month=12;s.chapter=3;s.completed=true;return s;
}
