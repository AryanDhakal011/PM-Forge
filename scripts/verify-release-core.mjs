import {spawn} from 'node:child_process';
import {readdir,mkdir,writeFile} from 'node:fs/promises';
const tests=(await readdir('tests')).filter(name=>name.endsWith('.test.ts')).map(name=>'tests/'+name);
const started=Date.now(),child=spawn(process.execPath,['--conditions=react-server','--import','tsx','--test','--test-concurrency=4',...tests],{windowsHide:true});let output='';
for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{output+=data;if(output.length>5_000_000)output=output.slice(-4_000_000);});
const code=await new Promise(resolve=>child.on('close',resolve));
const metric=key=>Number(output.match(new RegExp('(?:ℹ|#) '+key+' (\\d+)'))?.[1]||0);
const report={at:new Date().toISOString(),command:'node --conditions=react-server --import tsx --test --test-concurrency=4 tests/*.test.ts',files:tests.length,tests:metric('tests'),passed:metric('pass'),failed:metric('fail'),skipped:metric('skipped'),exitCode:code,durationMs:Date.now()-started};
await mkdir('docs/production-verification',{recursive:true});await writeFile('docs/production-verification/checks.json',JSON.stringify(report,null,2));console.log(report);if(code!==0){console.error(output.slice(-12000));process.exitCode=1;}
