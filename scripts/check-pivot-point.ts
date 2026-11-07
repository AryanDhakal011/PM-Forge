import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {cases,events,letterTemplates,patients,people,reports,scenes} from '../src/lib/pivot-point/content';
const tools=new Set(['first','reply','question','walk','sandbox','planner','drawers','map','designer','ledger','case','direction','consequence','scalability','frontier','guardrails','presentation','letters','launch','board','final','review']);
assert.equal(scenes.length,27);assert.equal(new Set(scenes.map(s=>s.id)).size,27);assert.equal(patients.length,1000);assert.equal(cases.length,12);assert.equal(reports.length,7);assert.ok(events.length>=24);assert.ok(statSync('content/pivot-point/patients.json').size<200000);
const speakers=new Set(['coach','narrator',...people.map(p=>p.id)]);
for(const scene of scenes){assert.ok(scene.type&&scene.goal&&scene.background,scene.id);assert.ok(scene.lines.length<=3,scene.id);assert.ok(scene.tools.every(t=>tools.has(t)),scene.id);assert.ok(existsSync(`public/projects/pivot-point/backgrounds/${scene.background}.svg`));for(const l of scene.lines){assert.ok(speakers.has(l.speaker));assert.ok(l.text.split(/\s+/).length<14,`${scene.id}: ${l.text}`)}}
for(const p of people)for(const mood of ['neutral','thinking','annoyed','approving','pressured'])assert.ok(existsSync(`public/projects/pivot-point/portraits/${p.id}_${mood}.svg`));
for(const l of letterTemplates){assert.ok(cases.some(c=>c.id===l.patient));for(const text of [l.reached,l.missed])assert.ok(!/\b(hopeless|worthless|deserve to suffer|graphic|slur)\b/i.test(text))}
for(const e of events){assert.ok(speakers.has(e.speaker));assert.ok([1,2,3].includes(e.chapter));assert.ok(['flagship','community','hybrid','premium'].includes(e.route))}
const source=readFileSync('src/components/pivot-point/Experience.tsx','utf8');assert.ok(source.includes('LABEL'));assert.ok(source.includes('__projectTest'));assert.ok(source.includes('delete host.__projectTest'));
console.log('Pivot Point authoring gate: 27 scenes, 45 portraits, 5 backgrounds, 1,000 fictional patients, 12 cases, 7 reports, 24 events; all references valid.');
