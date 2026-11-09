import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {companies,personas} from '../src/lib/hot-seat/content';
import {createSeat} from '../src/lib/hot-seat/model';
async function main(){
const {KokoroTTS}=await import('kokoro-js');
const {StyleTextToSpeech2Model,AutoTokenizer}=await import('@huggingface/transformers');
const out='public/hot-seat/library-v1';await mkdir(out,{recursive:true});
const began=performance.now();
const modelId='onnx-community/Kokoro-82M-v1.0-ONNX';
// Keep the exact Kokoro engine; bound ONNX CPU threads to avoid large-machine oversubscription.
const [model,tokenizer]=await Promise.all([StyleTextToSpeech2Model.from_pretrained(modelId,{dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:4,interOpNumThreads:1}}),AutoTokenizer.from_pretrained(modelId)]);
const tts=new KokoroTTS(model,tokenizer);
const modelLoadMs=performance.now()-began;
const lines=new Set<string>(['Got it.','Right.','Okay.','Take your time. You can also ask me to rephrase.','The conversation is complete. Let’s look at the reasoning you documented. This review is provisional, not a hiring verdict.']);
for(const text of ['We will stop here and review the reasoning you documented. This is provisional practice feedback, not a hiring verdict.','What would you do differently after hearing the challenge?','How would you define that measure, and what would keep you from optimizing the wrong thing?','What would make that test change your decision?','How would you explain the opportunity cost to the stakeholder who disagrees?'])lines.add(text);
const manifest:{version:string;profile:Record<string,unknown>;clips:{voice:string;text:string;path:string;sha256:string;durationMs:number;synthesisMs:number}[]}={version:'kokoro-female-v2',profile:{engine:'kokoro-js',package:'1.2.1',model:'Kokoro-82M-v1.0-ONNX',dtype:'q8',speed:.98,sampleRate:24000},clips:[]};
try{const old=JSON.parse(await readFile(out+'/manifest.json','utf8'));if(old.version===manifest.version&&JSON.stringify(old.profile)===JSON.stringify(manifest.profile))manifest.clips=old.clips;}catch{}
let renderedNow=0;
for(const p of personas.filter(p=>p.id!=='ellis')){
  const texts=new Set([...lines,p.sample]);
  for(const c of companies)for(let variant=0;variant<c.openers.length;variant++)texts.add(createSeat('audio-build',{company:c.id,persona:p.id,pressure:'direct',minutes:10},'audio-build',variant).turns[0].text);
  for(const text of texts){
    if(manifest.clips.some(clip=>clip.voice===p.voice&&clip.text===text))continue;
    const started=performance.now(),audio=await tts.generate(text,{voice:p.voice,speed:.98});
    const bytes=Buffer.alloc(44+audio.audio.length*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(audio.sampling_rate,24);bytes.writeUInt32LE(audio.sampling_rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);for(let i=0;i<audio.audio.length;i++)bytes.writeInt16LE(Math.trunc(Math.max(-1,Math.min(1,audio.audio[i]))*32767),44+i*2);
    const hash=createHash('sha256').update(bytes).digest('hex'),path=p.voice+'/'+hash.slice(0,16)+'.wav';
    await mkdir(out+'/'+p.voice,{recursive:true});await writeFile(out+'/'+path,bytes);
    manifest.clips.push({voice:p.voice,text,path,sha256:hash,durationMs:audio.audio.length/audio.sampling_rate*1000,synthesisMs:performance.now()-started});
    renderedNow++;await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));
    if(manifest.clips.length%10===0)console.log(`Rendered ${manifest.clips.length} matching Kokoro q8 clips.`);
  }
}
await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));
await mkdir('docs/speed-verification',{recursive:true});await writeFile('docs/speed-verification/audio-build.json',JSON.stringify({at:new Date().toISOString(),modelLoadMs,thisBuildMs:performance.now()-began,totalRecordedSynthesisMs:manifest.clips.reduce((sum,c)=>sum+c.synthesisMs,0),renderedNow,clips:manifest.clips.length,engine:manifest.profile,externalSpeechCalls:0},null,2));
console.log(`Rendered ${manifest.clips.length} local q8 clips; no speech API charges.`);
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
