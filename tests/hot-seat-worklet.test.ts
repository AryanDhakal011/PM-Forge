import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('actual worklet captures pre-roll, closes gate, reports real levels and emits silence to speakers',()=>{
  let Processor:any;const messages:any[]=[];
  class Base {port={onmessage:null as any,postMessage:(data:any)=>messages.push(data)};}
  runInNewContext(readFileSync('public/hot-seat/microphone-worklet-v1.js','utf8'),{sampleRate:48000,AudioWorkletProcessor:Base,registerProcessor:(_name:string,ctor:any)=>{Processor=ctor;},Float32Array,Math});
  const processor=new Processor(),block=new Float32Array(128).fill(.2),output=new Float32Array(128).fill(1);
  for(let i=0;i<210;i++)processor.process([[block]],[[output]]);
  assert.ok(output.every(n=>n===0));assert.ok(messages.some(m=>m.level>0));assert.equal(messages.some(m=>m.samples),false);
  processor.port.onmessage({data:{open:true}});
  for(let i=0;i<40;i++)processor.process([[block]],[[output]]);
  processor.port.onmessage({data:{open:false}});
  assert.ok(messages.some(m=>m.finished));const length=messages.reduce((sum,m)=>sum+(m.samples?.length||0),0);
  assert.equal(length,24000+40*128);
  const count=messages.filter(m=>m.samples).length;
  for(let i=0;i<60;i++)processor.process([[block]],[[output]]);
  assert.equal(messages.filter(m=>m.samples).length,count);
});
