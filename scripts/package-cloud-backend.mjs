import {readFile} from 'node:fs/promises';
const folder='supabase/functions/pmforge-backend/';
const definitions=[['backend.ts','src/lib/cloud/backend.ts'],['artifacts.ts','src/lib/cloud/artifacts.ts'],['publication.ts','src/lib/portfolio/publication.ts'],['schemas.ts','src/lib/portfolio/schemas.ts'],['request.ts','src/lib/portfolio/request.ts']];
const files=[];
for(const name of ['index.ts','deno.json'])files.push({name,content:await readFile(folder+name,'utf8')});
for(const [name,path] of definitions){let content=await readFile(path,'utf8');content=content.replaceAll("'../portfolio/publication'","'./publication.ts'").replaceAll("'../portfolio/request'","'./request.ts'").replaceAll("'./artifacts'","'./artifacts.ts'").replaceAll("'./schemas'","'./schemas.ts'");files.push({name,content});}
console.log(JSON.stringify(files));
