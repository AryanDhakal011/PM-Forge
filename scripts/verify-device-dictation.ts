import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {pipeline} from '@huggingface/transformers';
import {resample16k} from '../src/lib/hot-seat/microphone-controller';
async function main(){
  const bytes=await readFile('public/hot-seat/neural-v2/af_bella/preview.wav');
  let offset=12,rate=0,samples=new Float32Array();
  while(offset+8<=bytes.length){const name=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(name==='fmt '){if(bytes.readUInt16LE(offset+8)!==1||bytes.readUInt16LE(offset+10)!==1||bytes.readUInt16LE(offset+22)!==16)throw Error('Fixture must be mono PCM16.');rate=bytes.readUInt32LE(offset+12);}if(name==='data'){samples=new Float32Array(size/2);for(let i=0;i<samples.length;i++)samples[i]=bytes.readInt16LE(offset+8+i*2)/32768;}offset+=8+size+(size%2);}
  if(!rate||!samples.length)throw Error('Invalid fixture');
  const began=performance.now(),recognizer=await pipeline('automatic-speech-recognition','onnx-community/whisper-tiny.en',{revision:'2575352d61be1bf7225cf8f8b268a4678025fc58',dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:4,interOpNumThreads:1}}),loaded=performance.now();
  const output=await recognizer(resample16k(samples,rate),{chunk_length_s:20,stride_length_s:3,return_timestamps:false,max_new_tokens:256});
  const text=Array.isArray(output)?output.map(o=>o.text).join(' '):output.text;
  const expected="Let's get specific. What would you need to know before making that call?";
  const words=(s:string)=>s.toLowerCase().replace(/[^a-z0-9' ]/g,'').split(/\s+/).filter(Boolean),a=words(expected),b=words(text);
  let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}
  const report={at:new Date().toISOString(),runtime:'Node CPU smoke test; not browser/WASM or live microphone verification',fixture:'public authored Bella preview',model:'whisper-tiny.en q8',loadMs:loaded-began,inferenceMs:performance.now()-loaded,seconds:samples.length/rate,text,expected,wordErrorRate:row[b.length]/a.length};
  await mkdir('docs/speed-verification',{recursive:true});await writeFile('docs/speed-verification/dictation-cpu.json',JSON.stringify(report,null,2));console.log(report);if(report.wordErrorRate>.25)process.exitCode=1;
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
