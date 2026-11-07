import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.PRODUCT_URL||'http://localhost:3001';
const manifest=JSON.parse(readFileSync('content/silent-churn/audio-manifest.json','utf8'));
const paths=['/','/app','/app/projects','/app/projects/silent-churn','/app/projects/silent-churn/play',...Object.values(manifest.lines).map(line=>line.file),...['room','paper','door','crash'].map(n=>`/projects/silent-churn/audio/${n}.wav`),'/projects/silent-churn/audio/KOKORO-LICENSE.txt'];
const results=[];
for(const path of paths){
 try{const res=await fetch(base+path);results.push({path,status:res.status,type:res.headers.get('content-type')});await res.arrayBuffer()}
 catch(e){results.push({path,error:String(e)})}
}
mkdirSync('docs/silent-churn-verification',{recursive:true});
writeFileSync('docs/silent-churn-verification/routes.json',JSON.stringify(results,null,2));
const bad=results.filter(r=>r.status!==200);
console.log(`Silent Churn: ${results.length} routes and assets; ${bad.length} failures.`);
if(bad.length){console.error(bad);process.exitCode=1}
