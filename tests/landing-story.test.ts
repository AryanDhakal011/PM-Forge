import test from 'node:test';
import assert from 'node:assert/strict';
import {clockStoryFrame} from '../src/lib/landing-story';
test('clock montage lands at Monday 9:02 with matching physical hand angles',()=>{const frame=clockStoryFrame(1);assert.equal(frame.day,'MONDAY');assert.equal(frame.time,'9:02');assert.equal(frame.minuteDegrees%360,12);assert.equal(frame.hourDegrees%360,271)});
test('clock labels remain bounded and agree with hands through forward and reversed scroll',()=>{let previous=0;for(let i=0;i<=100;i++){const f=clockStoryFrame(i/100);const [h,m]=f.time.split(':').map(Number);assert.ok(m>=0&&m<60);assert.equal(f.minuteDegrees,(h*60+m)*6);assert.equal(f.hourDegrees,(h*60+m)/2);assert.ok(f.minuteDegrees>=previous);previous=f.minuteDegrees}assert.deepEqual(clockStoryFrame(-1),clockStoryFrame(0));assert.deepEqual(clockStoryFrame(3),clockStoryFrame(1));assert.deepEqual(clockStoryFrame(NaN),clockStoryFrame(1))});
