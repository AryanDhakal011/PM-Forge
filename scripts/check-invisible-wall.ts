import { readFileSync, existsSync } from "node:fs";
import { scenes, people, clueInfo } from "../src/lib/invisible-wall/content";
const manifest=JSON.parse(readFileSync('content/invisible-wall/audio-manifest.json','utf8'));
const ids=new Set(scenes.map(s=>s.id)),lineIds=new Set<string>();
const tools=['entry','continue','badge','reply','mini-log','map','logs','trace','access','uvlens','board','action','route','brief','theory','threshold','staging','briefing','interlock','evals','stability','final','debrief'];
const expressions=['neutral','thinking','pressured','annoyed','approving'];
const conditions=['choice','access','interlock','ending','tested'];
for(const s of scenes){
 if(!s.type||!['terminal','floor','server','annex'].includes(s.background)||!s.goal||!s.canStill||!s.lines.length||!s.speakers.length||!tools.includes(s.tool))throw Error('Incomplete scene '+s.id);
 if(s.next&&!ids.has(s.next))throw Error('Dangling next '+s.id);
 const artifact=JSON.parse(readFileSync(`content/invisible-wall/scenes/${s.id}.json`,'utf8'));if(JSON.stringify(artifact)!==JSON.stringify(s))throw Error('Stale individual scene '+s.id);
 for(const l of s.lines){
  if(lineIds.has(l.id)||!people[l.speaker]||!expressions.includes(l.expression)||l.text.trim().split(/\s+/).length>=14)throw Error('Duplicate, uncast or oversized line '+l.id);
  lineIds.add(l.id);if(l.when&&!conditions.includes(l.when.split(':')[0])&&!['shadow','flagged','traced','authorAccess','spotted'].includes(l.when))throw Error('Unknown line flag '+l.id);
  const clip=manifest.lines[l.id];if(clip?.caption!==l.text||clip?.speaker!==l.speaker||!existsSync('public'+clip.file))throw Error('Missing/stale voice '+l.id);
 }
 for(const phase of ['before','after'])if(s.lines.filter(l=>l.phase===phase&&!l.when).length>3)throw Error('Too many consecutive noninteractive lines '+s.id);
 for(const c of s.choices){if(c.next&&!ids.has(c.next))throw Error('Dangling choice '+s.id);if(c.receipt&&!/^R0[1-6]$/.test(c.receipt))throw Error('Undefined receipt '+s.id);}
}
if(Object.keys(clueInfo).join(',')!=='C1,C2,C3,C4,C5,C6')throw Error('Clue definitions incomplete');
console.log(`Invisible Wall: ${scenes.length} complete scenes, ${lineIds.size} caption-matched recordings; references and placeholders verified.`);
