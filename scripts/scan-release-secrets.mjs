import {execFileSync} from 'node:child_process';
import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
const patterns=[['Google key',/(?<![A-Za-z0-9_+\/])AIza[0-9A-Za-z_-]{35}(?![A-Za-z0-9_+\/-])/g],['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['provider key',/\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}/g]];
const findings=[];let files=0;
const secrets=[];
try{for(const line of (await readFile('.env.local','utf8')).split(/\r?\n/)){const m=line.match(/^([A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN))=(.+)$/);if(m&&m[2].trim().length>=20)secrets.push(m[2].trim().replace(/^['"]|['"]$/g,''));}}catch{}
function inspect(text,source){for(const [kind,pattern] of patterns){pattern.lastIndex=0;if(pattern.test(text))findings.push({source,kind});}if(secrets.some(secret=>text.includes(secret)))findings.push({source,kind:'exact private environment value'});}
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8',maxBuffer:100_000_000}).split('\0').filter(Boolean);
for(const file of tracked){try{if(/\.(?:[cm]?[jt]sx?|json|md|yml|yaml|env|txt)$|(?:^|\/)\.[^/]*env[^/]*$/.test(file)){inspect(await readFile(file,'utf8'),file);files++;}}catch{}}
// Inspect complete history patches without printing patch contents or matched credentials.
const history=execFileSync('git',['log','--all','--full-history','-p','--format=commit:%H','--no-ext-diff'],{encoding:'utf8',maxBuffer:512_000_000});
inspect(history,'git-history (all refs; patch scan)');
async function bundle(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+item.name;if(item.isDirectory())await bundle(path);else if(/\.(js|json|map)$/.test(path)){const text=await readFile(path,'utf8');files++;inspect(text,path);if(secrets.some(secret=>text.includes(secret)))findings.push({source:path,kind:'exact private environment value'});}}}
try{await stat('.next/static');await bundle('.next/static');}catch(error){if(error.code==='ENOENT')throw Error('Build the app before scanning browser artifacts.');throw error;}
const report={at:new Date().toISOString(),files,history:'all available local refs, text patches; not an independent entropy scan',findings};
await mkdir('docs/production-verification',{recursive:true});await writeFile('docs/production-verification/secrets.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(findings.length)process.exitCode=1;
