import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const tasks=['test','test:auth','test:ai','test:interview-live','test:portfolio','test:platform','test:deadlock','test:sacred-no','test:ghost-metric','test:trojan-horse','test:invisible-wall','test:feature-factory','test:silent-churn','test:legacy-fracture','test:pivot-point'];
const report=[],directory='docs/release-qa';mkdirSync(directory,{recursive:true});
if(!process.env.npm_execpath)throw Error('Run this through npm run qa:release.');
for(const task of tasks){const started=Date.now();let output='';const result=await new Promise(resolve=>{const child=spawn(process.execPath,[process.env.npm_execpath,'run',task],{windowsHide:true,env:process.env});child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('error',()=>resolve(1));child.on('exit',code=>resolve(code??1))});writeFileSync(directory+'/'+task.replace(':','-')+'.log',output);report.push({task,exitCode:result,seconds:Math.round((Date.now()-started)/100)/10});console.log(task+': '+(result===0?'PASS':'FAIL'));}
writeFileSync(directory+'/unit-suites.json',JSON.stringify({at:new Date().toISOString(),suites:report},null,2));if(report.some(r=>r.exitCode!==0))process.exitCode=1;
