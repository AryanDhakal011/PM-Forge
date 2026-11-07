import sceneData from '../../../content/pivot-point/scenes/index.json';
import peopleData from '../../../content/pivot-point/people.json';
import patientData from '../../../content/pivot-point/patients.json';
import caseData from '../../../content/pivot-point/cases.json';
import reportData from '../../../content/pivot-point/reports.json';
import eventData from '../../../content/pivot-point/events/deck.json';
import letterData from '../../../content/pivot-point/letters.json';
export type Person='kapoor'|'hamid'|'tamsin'|'esi'|'jun'|'bernard'|'raman'|'sita'|'alvarez';
export type Speaker=Person|'coach'|'narrator';
export type Expression='neutral'|'thinking'|'annoyed'|'approving'|'pressured';
export type Scene={id:string;type:string;background:string;goal:string;tools:string[];lines:{speaker:Speaker;text:string;expression:Expression}[]};
export const scenes=sceneData as Scene[];
export const people=peopleData as (typeof peopleData[number]&{id:Person})[];
export const personById=Object.fromEntries(people.map(p=>[p.id,p])) as Record<Person,typeof people[number]>;
export const patients=patientData;
export const cases=caseData;
export const reports=reportData;
export const events=eventData;
export const letterTemplates=letterData;
export const sceneById=Object.fromEntries(scenes.map(s=>[s.id,s]));
export const LABEL='Simulated health network, authored scenarios, expert review pending';
export const WAITLIST=3214;
export const BUDGET=3600000;
export const launchMoments=[
 {title:'08:00 · The first queue',text:'The intake desk is filling. A colleague offers to stay.',need:'staff',speaker:'esi'},
 {title:'09:30 · A referral question',text:'A local worker needs a specialist’s assessment.',need:'escalate',speaker:'kapoor'},
 {title:'11:00 · Supervision visit',text:'The supervisor asks to review the morning’s cases.',need:'watch',speaker:'esi'},
 {title:'14:00 · The missed appointment',text:'A shift worker can arrive only after closing.',need:'hours',speaker:'esi'},
 {title:'16:30 · A family at the door',text:'They ask about the next available place.',need:'watch',speaker:'esi'}
];
