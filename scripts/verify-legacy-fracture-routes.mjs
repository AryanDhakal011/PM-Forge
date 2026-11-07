import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.PRODUCT_URL||'http://localhost:3002';
const manifest=JSON.parse(readFileSync('content/legacy-fracture/audio-manifest.json','utf8'));
const files=['/','/app','/app/projects','/app/projects/legacy-fracture','/app/projects/legacy-fracture/play'];
for(const line of Object.values(manifest.lines))files.push(line.file);
for(const name of ['bell','clock','hum','paper','silence','switch','tape','truck'])files.push('/projects/legacy-fracture/audio/'+name+'.wav');
files.push('/projects/legacy-fracture/CREDITS.txt');
const results=[];for(const path of files){const response=await fetch(base+path);await response.arrayBuffer();results.push({path,status:response.status,type:response.headers.get('content-type')})}
mkdirSync('docs/legacy-fracture-verification',{recursive:true});writeFileSync('docs/legacy-fracture-verification/routes.json',JSON.stringify({base,results},null,2));
const failed=results.filter(x=>x.status!==200);console.log(`Legacy Fracture routes: ${results.length} checked, ${failed.length} failed.`);if(failed.length){console.error(failed);process.exitCode=1}
