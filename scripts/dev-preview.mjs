import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),args=process.argv.slice(2);
if(!args.some(arg=>arg==='--port'||arg==='-p'||arg.startsWith('--port=')))args.push('--port','3002');
if(!args.some(arg=>arg==='--hostname'||arg==='-H'||arg.startsWith('--hostname=')))args.push('--hostname','127.0.0.1');
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev',...args],{stdio:'inherit',windowsHide:true,env:{...process.env,PMFORGE_PREVIEW_DIR:process.env.PMFORGE_PREVIEW_DIR||'.next-development'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',error=>{console.error(error.message);process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??1});
