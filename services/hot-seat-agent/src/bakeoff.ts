import {writeFile,mkdir} from 'node:fs/promises';
import {voiceEvaluationLines,candidateEvaluationCases} from '../../../src/lib/hot-seat/realtime/evaluation';
import {percentile} from '../../../src/lib/hot-seat/realtime/chunks';

// Importing this file does not call a provider. Default invocation only prepares the human-review sheet.
const live=process.argv.includes('--live');
const report={generatedAt:new Date().toISOString(),location:process.env.PMFORGE_BAKEOFF_LOCATION||'unassigned',status:'not-measured',voices:voiceEvaluationLines,interviews:candidateEvaluationCases,results:[] as unknown[],humanReview:{listeners:0,meanNaturalness:null,roboticRate:null,winner:null}};
if(live) {
  if(Number(process.env.PMFORGE_BAKEOFF_APPROVED_USD)<=0||process.env.PMFORGE_BAKEOFF_APPROVED_USD===undefined)throw Error('A separate positive bake-off budget must be explicitly approved.');
  if(!process.env.INWORLD_API_KEY||!process.env.PMFORGE_BAKEOFF_VOICE||!process.env.PMFORGE_BAKEOFF_LOCATION)throw Error('Supply the provider key, audition voice ID and measurement location.');
  const {TTS}=await import('@livekit/agents-plugin-inworld');
  const tts=new TTS({model:'inworld-tts-2',voice:process.env.PMFORGE_BAKEOFF_VOICE,timestampType:'WORD'});
  const runs=Math.min(30,Math.max(1,Number(process.env.PMFORGE_BAKEOFF_RUNS)||1));
  const approved=Number(process.env.PMFORGE_BAKEOFF_APPROVED_USD);
  const estimated=runs*voiceEvaluationLines[22].length*25/1_000_000;
  if(!Number.isFinite(approved)||estimated>approved)throw Error('The planned calls exceed the approved bake-off amount at the documented on-demand rate; verify current account prices before running.');
  const times:number[]=[];
  try {
    for(let i=0;i<runs;i++) {
      const at=performance.now();let first:number|null=null,samples=0;
      const stream=tts.stream();
      const consume=(async()=>{for await(const event of stream){if(typeof event==='object'&&'frame'in event){first??=performance.now()-at;samples+=event.frame.samplesPerChannel;}}})();
      stream.pushText(voiceEvaluationLines[22]);stream.flush();stream.endInput();
      await consume;
      if(first!==null)times.push(first);
      report.results.push({provider:'inworld',model:'inworld-tts-2',voice:process.env.PMFORGE_BAKEOFF_VOICE,run:i,ttfbMs:first,samples});
    }
  }finally{await tts.close();}
  report.status='primary-tts-only; no comparative winner';
  report.results.push({summary:{p50Ms:percentile(times,.5),p95Ms:percentile(times,.95),samples:times.length}});
}
await mkdir('reports',{recursive:true});await writeFile('reports/voice-bakeoff.json',JSON.stringify(report,null,2));
console.log(live?'Primary TTS measurements written. Comparative listening and LLM/STT tests remain required.':'Prepared 24 voice lines and 10 interview cases. No external calls, latency results, or winner claimed.');
