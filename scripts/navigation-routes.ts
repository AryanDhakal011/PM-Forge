import {readdirSync} from "node:fs";
import {join,relative,sep} from "node:path";
import {questions} from "../src/lib/product/content";
import {projects} from "../src/lib/projects/content";
import {modules} from "../src/lib/content";
const pages:string[]=[];
function walk(dir:string){for(const e of readdirSync(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())walk(path);else if(e.name==='page.tsx')pages.push('/'+relative('src/app',dir).split(sep).filter(Boolean).join('/'));}}
walk('src/app');
const missing='00000000-0000-4000-8000-000000000000';
const routes=pages.flatMap(path=>{
 if(!path.includes('['))return [path];
 if(path.includes('[projectId]'))return projects.flatMap(p=>{const base=path.replace('[projectId]',p.id);return base.includes('[ch]')?[1,2,3].map(n=>base.replace('[ch]',String(n))):[base.replace('[id]',missing)];});
 if(path.includes('[slug]'))return (path.includes('frameworks')||path.includes('learn')?modules:questions).map(x=>path.replace('[slug]',x.slug));
 return [path.replace('[runId]',missing).replace('[id]',missing)];
});
console.log(JSON.stringify({routes:[...new Set([...routes,'/reset.html'])].sort(),projectIds:projects.map(p=>p.id),questionSlugs:questions.map(q=>q.slug),frameworkSlugs:modules.map(m=>m.slug)},null,2));
