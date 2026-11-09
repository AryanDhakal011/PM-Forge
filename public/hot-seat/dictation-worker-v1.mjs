import {pipeline,env} from './runtime-v2/transformers.web.js';
env.backends.onnx.wasm.wasmPaths=new URL('./runtime-v2/',import.meta.url).href;
env.backends.onnx.wasm.numThreads=1;
let model,queue=Promise.resolve();
async function ready(){if(!model)model=pipeline('automatic-speech-recognition','onnx-community/whisper-tiny.en',{revision:'2575352d61be1bf7225cf8f8b268a4678025fc58',dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')postMessage({progress:p.progress,file:p.file});}});try{return await model;}catch(e){model=null;throw e;}}
onmessage=({data})=>{queue=queue.catch(()=>{}).then(async()=>{try{const transcriber=await ready();if(data.type==='prepare'){postMessage({id:data.id,ready:true});return;}if(data.type!=='transcribe'||!(data.samples instanceof Float32Array)||data.samples.length>16000*61)throw Error();const start=performance.now();const output=await transcriber(data.samples,{chunk_length_s:20,stride_length_s:3,return_timestamps:false,max_new_tokens:256});postMessage({id:data.id,text:output.text,latencyMs:performance.now()-start});}catch{postMessage({id:data.id,error:'On-device dictation could not finish. Keep your draft and retry, or type.'});}});};
