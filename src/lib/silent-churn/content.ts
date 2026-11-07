import rawPeople from '../../../content/silent-churn/people.json';
import rawObjections from '../../../content/silent-churn/objections.json';
import rawCommitments from '../../../content/silent-churn/commitments.json';
import rawDialogue from '../../../content/silent-churn/dialogue.json';
import datasetIndex from '../../../content/silent-churn/datasets.json';
export type Person='elliot'|'walter'|'dolores'|'anand'|'beatrice'|'gideon'|'marta'|'tobias';
export type Exec='walter'|'dolores'|'anand'|'beatrice'|'gideon';
export type Difficulty='guided'|'standard'|'sharp';
export type Concern='COST'|'RISK'|'STABILITY'|'BROKERS'|'COMPLIANCE'|'GENERAL';
export type Expression='neutral'|'thinking'|'annoyed'|'approving';
export type Dataset={id:string;title:string;question:string;concern:Concern;full:string;quick:string;fragment:string};
export type Event={id:string;speaker:Person;title:string;text:string;condition:string;dataset:string};
export const people=rawPeople as (typeof rawPeople[number]&{id:Person})[];
export const personById=Object.fromEntries(people.map(p=>[p.id,p])) as Record<Person,typeof people[number]>;
export const execs:Exec[]=['walter','dolores','anand','beatrice','gideon'];
export const concerns:Record<Exec,Concern[]>={walter:['COST'],dolores:['COST','RISK'],anand:['STABILITY'],beatrice:['BROKERS'],gideon:['COMPLIANCE']};
export const objections=rawObjections as {id:string;person:Exec;text:string;evidence:string[];commitments:string[];reframe?:string}[];
export const commitments=rawCommitments as (typeof rawCommitments[number]&{concern:Concern})[];
export const dialogue=rawDialogue as {id:string;speaker:Person|'pa'|'broker';text:string;expression:Expression}[];
export const datasets=datasetIndex;
export const blocks=['problem','evidence','proposal','ask','risks'] as const;
export type Block=typeof blocks[number];
export const planCards=[{id:'pilot',title:'Capped 5% pilot'},{id:'side-feed',title:'Flagged feed beside the core'},{id:'rollback',title:'Rehearsed rollback'},{id:'wording',title:'Approved factual templates'},{id:'warn-core',title:'Disclose core-change risk'}];
export const influence:[Exec,Exec,number][]=[['beatrice','walter',.5],['walter','dolores',.25],['anand','gideon',.25],['gideon','dolores',.25],['dolores','beatrice',.25]];
export const dayName=(d:number)=>['Monday','Tuesday','Wednesday','Thursday','Friday'][(d-1)%5];
export const stanceLabel=(n:number)=>n<0?'Against':n<1?'Neutral':n<1.75?'For':'Sponsor';
export async function loadChapter(chapter:number):Promise<Dataset[]>{const r=chapter===1?await import('../../../content/silent-churn/datasets/chapter-1.json'):chapter===2?await import('../../../content/silent-churn/datasets/chapter-2.json'):await import('../../../content/silent-churn/datasets/chapter-3.json');return r.default as Dataset[];}
export async function loadEvents():Promise<Event[]>{return (await import('../../../content/silent-churn/events/deck.json')).default as Event[];}
