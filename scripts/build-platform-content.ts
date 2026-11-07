import {mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {corrected,levelIds,loadDefinition} from '../platform/devtools/server';
import {validate} from '../platform/devtools/validate';
import {backgroundSvg,portraitSvg} from '../platform/art';
import {expressions} from '../platform/core';
const status:Record<string,boolean>=Object.fromEntries(levelIds.map(id=>[id,false])),reports=[];let failed=false;
for(const id of corrected){const d=loadDefinition(id),report=validate(d);status[id]=report.valid;reports.push({id,...report});if(!report.valid){console.error(id,report.errors);failed=true;continue}const out=join('public','levels',id,'art');mkdirSync(join(out,'portraits'),{recursive:true});mkdirSync(join(out,'backgrounds'),{recursive:true});const assets=[];
 for(const p of d.people)for(const mood of expressions){const path=`/levels/${id}/art/portraits/${p.id}_${mood}.svg`,svg=portraitSvg(p,mood);writeFileSync('public'+path,svg);assets.push({id:p.id+'-'+mood,path,sizeKB:Buffer.byteLength(svg)/1024,source:'PMForge parametric portrait generator',license:'Project-authored original',alt:`${p.name}, ${mood}`,status:'placeholder'})}
 for(const preset of new Set(d.scenes.map(s=>s.background))){const path=`/levels/${id}/art/backgrounds/${preset}.svg`,svg=backgroundSvg(preset,d.manifest.palette.accent);writeFileSync('public'+path,svg);assets.push({id:preset,path,sizeKB:Buffer.byteLength(svg)/1024,source:'PMForge layered background kit',license:'Project-authored original',alt:`Fictional ${preset} background`,status:'placeholder'})}
 for(const a of assets){if(a.sizeKB>(a.path.includes('portraits')?90:200))throw Error('Art exceeds budget: '+a.id);if(!a.license)throw Error('Missing license')}
 if(assets.reduce((n,a)=>n+a.sizeKB,0)>d.manifest.assetsBudgetKB)throw Error('Level art budget exceeded');mkdirSync(join('levels',id,'art'),{recursive:true});writeFileSync(join('levels',id,'art','manifest.json'),JSON.stringify(assets,null,2));
}
mkdirSync('docs/platform-verification',{recursive:true});writeFileSync('levels/validation.json',JSON.stringify(status,null,2)+'\n');writeFileSync('docs/platform-verification/authoring.json',JSON.stringify(reports,null,2)+'\n');
console.log('Shared platform:',reports.map(r=>`${r.id}: ${r.coverage.scenes} scenes, ${r.coverage.events} events`).join('; '));if(failed)process.exitCode=1;
