import test from 'node:test';
import assert from 'node:assert/strict';
import {SeatVoice} from '../src/components/hot-seat/voice';
const events={state:()=>{},progress:()=>{},level:()=>{},notice:()=>{}};
test('interrupting pending speech terminates synthesis instead of competing with dictation',async()=>{
  const original=globalThis.cancelAnimationFrame;globalThis.cancelAnimationFrame=()=>{};
  try{
    const voice=new SeatVoice(events),internal=voice as any;let terminated=0;
    internal.worker={terminate:()=>{terminated++;}};
    const result=new Promise((_resolve,reject)=>{internal.waiting.set('test',{resolve:()=>{},reject,timer:setTimeout(()=>{},60000)});});
    const rejected=assert.rejects(result,error=>(error as Error).name==='AbortError');
    voice.stop();await rejected;assert.equal(terminated,1);assert.equal(internal.waiting.size,0);assert.equal(internal.worker,undefined);
  }finally{globalThis.cancelAnimationFrame=original;}
});
test('stopping completed playback preserves an idle, warm voice worker',()=>{
  const original=globalThis.cancelAnimationFrame;globalThis.cancelAnimationFrame=()=>{};
  try{const voice=new SeatVoice(events),internal=voice as any;let terminated=0;internal.worker={terminate:()=>{terminated++;}};voice.stop();assert.equal(terminated,0);}finally{globalThis.cancelAnimationFrame=original;}
});
test('an explicit preview gesture resumes a paused audio device; background work cannot unpause it',()=>{
  const voice=new SeatVoice(events),internal=voice as any;let resumed=0;
  internal.ctx={state:'suspended',resume:()=>{resumed++;return Promise.resolve();}};internal.paused=true;
  voice.unlock(false);assert.equal(resumed,0);assert.equal(internal.paused,true);
  voice.unlock();assert.equal(resumed,1);assert.equal(internal.paused,false);
});
