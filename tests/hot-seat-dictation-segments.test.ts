import test from 'node:test';
import assert from 'node:assert/strict';
import {DictationSegments} from '../src/lib/hot-seat/dictation-segments';

const frame = (amplitude: number) => new Float32Array(100).fill(amplitude);

test('a completed phrase is available before the recording finishes', () => {
  const segments = new DictationSegments(1000);
  for (let i = 0; i < 6; i++) assert.equal(segments.push(frame(.05)), undefined);
  for (let i = 0; i < 3; i++) assert.equal(segments.push(frame(0)), undefined);
  assert.equal(segments.push(frame(0))?.length, 1000);
  for (let i = 0; i < 3; i++) segments.push(frame(.1));
  assert.equal(segments.finish()?.length, 300);
  assert.equal(segments.finish(), undefined);
});

test('continuous speech is bounded and silence is ignored', () => {
  const segments = new DictationSegments(1000);
  for (let i = 0; i < 80; i++) assert.equal(segments.push(frame(0)), undefined);
  for (let i = 0; i < 79; i++) assert.equal(segments.push(frame(.05)), undefined);
  assert.equal(segments.push(frame(.05))?.length, 8000);
  assert.equal(segments.finish(), undefined);
});
