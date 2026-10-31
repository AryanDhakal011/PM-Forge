import {spawn} from "node:child_process";
import {cp,mkdir,readFile,readdir,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve,relative,join} from "node:path";
const require=createRequire(import.meta.url),root=process.cwd(),build=join(root,'.next');
let buildId;
try{buildId=(await readFile(join(build,'BUILD_ID'),'utf8')).trim();}catch{throw Error('No production build found. Run npm run build, then npm start.');}
if(!/^[a-zA-Z0-9_-]+$/.test(buildId))throw Error('Invalid production build identifier.');
const snapshotRelative=join('.pmforge-preview',`${buildId}-${process.pid}`),snapshot=resolve(root,snapshotRelative);
if(relative(root,snapshot).startsWith('..'))throw Error('Preview snapshot escaped the project.');
await mkdir(snapshot,{recursive:true});
const ignored=new Set(['dev','cache','types','diagnostics','lock','trace','trace-build']);
for(const name of await readdir(build))if(!ignored.has(name))await cp(join(build,name),join(snapshot,name),{recursive:true});
await writeFile(join(snapshot,'preview-provenance.json'),JSON.stringify({buildId,createdAt:new Date().toISOString(),source:'.next'},null,2));
console.log(`PMForge preview pinned to build ${buildId}. Rebuilds will not change this running preview.`);
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start',...process.argv.slice(2)],{cwd:root,env:{...process.env,PMFORGE_PREVIEW_DIR:snapshotRelative},stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
