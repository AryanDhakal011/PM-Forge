import rawBacklog from '../../../content/feature-factory/backlog.json';
import rawPeople from '../../../content/feature-factory/people.json';
import rawDialogue from '../../../content/feature-factory/dialogue.json';
export type Person='reva'|'cass'|'nils'|'amara'|'kofi'|'lila';
export type Expression='neutral'|'thinking'|'annoyed'|'approving'|'pressured';
export type Metric='pulse'|'retention'|'features';
export type EventItem={id:string;speaker:Person;title:string;text:string;condition:string;feature:string;kind:string;cooldown:number;window:number;choices:string[]};
export const backlog=rawBacklog;
export const people=rawPeople as (typeof rawPeople[number]&{id:Person})[];
export const personById=Object.fromEntries(people.map(p=>[p.id,p])) as Record<Person,typeof people[number]>;
export const dialogue=rawDialogue as {id:string;speaker:Person|'pa';text:string;expression:Expression}[];
export const feature=(id:string)=>backlog.find(f=>f.id===id)!;
export const week=(day:number)=>Math.min(3,Math.ceil(day/5));
export const dayLabel=(day:number)=>`Week ${week(day)}, ${['Monday','Tuesday','Wednesday','Thursday','Friday'][(day-1)%5]}`;
export const criteria=['tests','stress','p1','retention','rollback'] as const;
export type Criterion=typeof criteria[number];
export const criterionLabels:Record<Criterion,string>={tests:'Tests passed',stress:'Stress test done',p1:'No open P1',retention:'Retention metric defined',rollback:'Rollback rehearsed'};
export async function loadDeck(w:number):Promise<EventItem[]>{const r=w===1?await import('../../../content/feature-factory/events/week-1.json'):w===2?await import('../../../content/feature-factory/events/week-2.json'):await import('../../../content/feature-factory/events/week-3.json');return r.default as EventItem[];}
