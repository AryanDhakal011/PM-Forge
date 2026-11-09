import test from 'node:test';
import assert from 'node:assert/strict';
import {MicController,microphoneError,resample16k,type MicAdapter} from '../src/lib/hot-seat/microphone-controller';
import {usableDictation} from '../src/lib/hot-seat/dictation-quality';
class Adapter implements MicAdapter {
  acquired=0;closed=0;opened=0;gated=false;fail=false;release?:()=>void;lost?:()=>void;
  async acquire(_level:(n:number)=>void,lost:()=>void){this.acquired++;this.lost=lost;if(this.fail)throw Object.assign(Error(),{name:'NotAllowedError'});if(this.release)await new Promise<void>(resolve=>{this.release=resolve;});}
  open(){this.opened++;this.gated=true;}
  async finish(){this.gated=false;return {samples:new Float32Array([.1,.2]),rate:16000};}
  enabled(){}
  async close(){this.closed++;this.gated=false;}
}
test('repeat turns share one hardware stream; stop releases it',async()=>{
  const a=new Adapter(),clips:number[]=[],mic=new MicController(a,async x=>{clips.push(x.length);});
  await mic.start();await mic.start();assert.equal(a.acquired,1);assert.equal(a.opened,1);
  await mic.finish();assert.equal(mic.snapshot.phase,'ready');assert.equal(mic.snapshot.live,true);
  await mic.start();await mic.finish();assert.equal(a.acquired,1);assert.deepEqual(clips,[2,2]);
  await mic.stop();assert.equal(mic.snapshot.live,false);assert.equal(a.closed,1);
});
test('permission cancellation cannot start capture after a late grant',async()=>{
  const a=new Adapter();a.release=()=>{};const mic=new MicController(a,async()=>{});
  const start=mic.start();assert.equal(mic.snapshot.phase,'arming');await mic.stop('paused');a.release!();await start;
  assert.equal(a.opened,0);assert.equal(mic.snapshot.live,false);assert.equal(mic.snapshot.phase,'paused');
});
test('denied permissions remain an actionable error without a live stream',async()=>{
  const a=new Adapter();a.fail=true;const mic=new MicController(a,async()=>{});await mic.start();
  assert.equal(mic.snapshot.phase,'error');assert.equal(mic.snapshot.live,false);assert.match(mic.snapshot.message,/blocked.*type/);
});
test('stopping mid-answer flushes exactly once and disconnects before transcription',async()=>{
  const a=new Adapter(),mic=new MicController(a,async()=>{assert.equal(a.closed,1);});
  await mic.start();await mic.stop('paused');await mic.finish();assert.equal(mic.snapshot.phase,'paused');assert.equal(a.closed,1);
});
test('recognition failure never leaves hardware running after stop',async()=>{
  const a=new Adapter(),mic=new MicController(a,async()=>{throw Error('Recognition failed; type instead.');});
  await mic.start();await mic.stop();assert.equal(mic.snapshot.live,false);assert.equal(a.closed,2);assert.match(mic.snapshot.message,/type instead/);
});
test('leaving during recognition closes capture immediately but drains the saved draft before worker disposal',async()=>{
  const a=new Adapter();let complete!:()=>void,saved=false;
  const mic=new MicController(a,async()=>{await new Promise<void>(resolve=>{complete=resolve;});saved=true;});
  await mic.start();const finish=mic.finish();await Promise.resolve();const stopped=mic.stop('paused');
  await Promise.resolve();assert.equal(a.gated,false);assert.equal(mic.snapshot.live,false);assert.equal(saved,false);
  complete();await stopped;await finish;assert.equal(saved,true);assert.equal(mic.snapshot.phase,'paused');
});
test('a hold closes the gate, a tap latches, mismatched and cancelled releases are safe',async()=>{
  const a=new Adapter(),mic=new MicController(a,async()=>{});
  mic.press('pointer',0);await Promise.resolve();mic.release('keyboard',600);assert.equal(a.gated,true);
  mic.release('pointer',100);assert.equal(a.gated,true);
  await mic.stop();mic.press('pointer',1000);await Promise.resolve();mic.release('pointer',1600);await Promise.resolve();assert.equal(a.gated,false);
  await mic.stop();mic.press('keyboard',2000);await Promise.resolve();mic.release('keyboard',2100,true);await Promise.resolve();assert.equal(a.gated,false);await mic.stop();
});
test('resampling preserves duration, silence and constant amplitude',()=>{
  assert.equal(resample16k(new Float32Array(48000),48000).length,16000);
  assert.ok(resample16k(new Float32Array(480).fill(.25),48000).every(n=>n===.25));
  assert.match(microphoneError({name:'NotReadableError'}),/Another app/);
  assert.match(microphoneError({name:'NotFoundError'}),/find a microphone/);
});
test('obvious hallucinated repetition and implausible speech rate do not enter the draft',()=>{
  assert.equal(usableDictation('I would check retention by cohort before changing the onboarding flow.',4),true);
  assert.equal(usableDictation('I am so sorry. '.repeat(20),60),false);
  assert.equal(usableDictation('one '.repeat(40),1),false);
  assert.equal(usableDictation('',10),false);
});
