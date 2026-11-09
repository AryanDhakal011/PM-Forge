import {readFile,writeFile,copyFile,readdir,unlink} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('public/hot-seat/library-v1'),manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));
if(manifest.profile.dtype!=='q8'||manifest.profile.speed!==.98||manifest.profile.engine!=='kokoro-js')throw Error('Unexpected voice profile');
for(const clip of manifest.clips){
  if(!/^af_(bella|sarah)\/[a-f0-9]{16}\.wav$/.test(clip.path))throw Error('Invalid clip path');
  const original=await readFile(root+'/'+clip.path);
  if(original.toString('ascii',0,4)!=='RIFF'||original.toString('ascii',36,40)!=='data'||original.readUInt32LE(24)!==24000||original.readUInt16LE(22)!==1)throw Error('Unsupported WAV source');
  if(original.readUInt16LE(20)===1&&original.readUInt16LE(34)===16)continue;
  if(original.readUInt16LE(20)!==3||original.readUInt16LE(34)!==32)throw Error('Unsupported sample encoding');
  const count=(original.length-44)/4,bytes=Buffer.alloc(44+count*2);original.copy(bytes,0,0,44);bytes.writeUInt32LE(bytes.length-8,4);bytes.writeUInt16LE(1,20);bytes.writeUInt32LE(48000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.writeUInt32LE(bytes.length-44,40);
  for(let i=0;i<count;i++)bytes.writeInt16LE(Math.trunc(Math.max(-1,Math.min(1,original.readFloatLE(44+i*4)))*32767),44+i*2);
  clip.sha256=createHash('sha256').update(bytes).digest('hex');clip.path=clip.voice+'/'+clip.sha256.slice(0,16)+'.wav';await writeFile(root+'/'+clip.path,bytes);
}
manifest.format='mono-pcm16-wav';await writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2));
const previews=JSON.parse(await readFile('public/hot-seat/neural-v2/manifest.json','utf8'));
for(const old of previews.previews){const clip=manifest.clips.find(c=>c.voice===old.voice&&c.text===old.text);if(!clip)throw Error('Missing matching preview');await copyFile(root+'/'+clip.path,'public/hot-seat/neural-v2/'+old.path);old.sha256=clip.sha256;}
previews.profile=manifest.profile;await writeFile('public/hot-seat/neural-v2/manifest.json',JSON.stringify(previews,null,2));
// Remove only obsolete generated WAV files in this exact workspace library, never a recursive directory operation.
const active=new Set(manifest.clips.map(c=>c.path));let removed=0;
for(const voice of ['af_bella','af_sarah'])for(const name of await readdir(root+'/'+voice)){if(!/^[a-f0-9]{16}\.wav$/.test(name)||active.has(voice+'/'+name))continue;const target=resolve(root,voice,name),inside=relative(root,target);if(inside.startsWith('..'+sep)||inside==='..'||!inside)throw Error('Library path escaped');await unlink(target);removed++;}
console.log(`Matched both previews to the exact live q8 profile; removed ${removed} obsolete generated clips.`);
