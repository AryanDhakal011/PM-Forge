import test from 'node:test';
import assert from 'node:assert/strict';
import {DictationSession, type DictationPhase, type Recognizer, type RecognitionResultEvent} from '../src/lib/hot-seat/dictation';

class FakeRecognition implements Recognizer {
  continuous = false; interimResults = false; lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: {error: string}) => void) | null = null;
  onresult: ((event: RecognitionResultEvent) => void) | null = null;
  starts = 0; aborts = 0;
  start() { this.starts++; }
  abort() { this.aborts++; }
  result(final: string, partial = '') {
    this.onresult?.({results: [{isFinal: true, 0: {transcript: final}}, {isFinal: false, 0: {transcript: partial}}]});
  }
}
function setup() {
  const recognizers: FakeRecognition[] = [], phases: DictationPhase[] = [], commits: string[] = [];
  const notices: {text: string; error: boolean}[] = [], previews: string[] = [];
  const session = new DictationSession(() => { const r = new FakeRecognition(); recognizers.push(r); return r; }, {
    phase: phase => phases.push(phase), preview: text => previews.push(text),
    commit: text => commits.push(text), notice: (text, error) => notices.push({text, error}),
  });
  return {session, recognizers, phases, commits, notices, previews};
}

test('does not claim to listen until the browser starts, and double start creates one recognizer', () => {
  const h = setup();
  try {
    h.session.start(); h.session.start();
    assert.deepEqual(h.phases, ['starting']); assert.equal(h.recognizers.length, 1);
    h.recognizers[0].onstart?.(); assert.equal(h.phases.at(-1), 'listening');
  } finally { h.session.dispose(); }
});
test('stop preserves final and interim words once and rejects late results from the old attempt', () => {
  const h = setup();
  try {
    h.session.start(); const r = h.recognizers[0]; const staleResult = r.onresult, staleEnd = r.onend;
    r.onstart?.(); r.result('Compare cohorts', 'before deciding');
    h.session.stop(); h.session.stop(); staleEnd?.();
    staleResult?.({results: [{isFinal: true, 0: {transcript: 'stale words'}}]});
    assert.deepEqual(h.commits, ['Compare cohorts before deciding']);
    assert.equal(h.previews.at(-1), ''); assert.equal(h.phases.at(-1), 'idle');
    h.session.start(); r.result('should be ignored'); assert.equal(h.recognizers.length, 2);
    assert.deepEqual(h.commits, ['Compare cohorts before deciding']);
  } finally { h.session.dispose(); }
});
test('silence and unexpected abort recover after end, with a bounded empty-attempt limit', context => {
  context.mock.timers.enable({apis: ['setTimeout']});
  const h = setup();
  try {
    h.session.start();
    for(let i=0; i<3; i++) {
      const r = h.recognizers[i]; r.onstart?.(); r.onerror?.({error: i===1 ? 'aborted' : 'no-speech'});
      assert.equal(h.phases.at(-1), 'listening');
      r.onend?.(); context.mock.timers.tick(350);
    }
    assert.equal(h.recognizers.length, 3); assert.equal(h.phases.at(-1), 'idle');
    assert.match(h.notices.at(-1)!.text, /three attempts/); assert.equal(h.notices.at(-1)!.error, true);
  } finally { h.session.dispose(); }
});
test('browser segmentation preserves text and keeps listening until explicit stop', context => {
  context.mock.timers.enable({apis: ['setTimeout']});
  const h = setup();
  try {
    h.session.start(); h.recognizers[0].onstart?.(); h.recognizers[0].result('First segment');
    h.recognizers[0].onend?.(); context.mock.timers.tick(350);
    h.recognizers[1].onstart?.(); h.recognizers[1].result('Second segment'); h.session.stop();
    assert.deepEqual(h.commits, ['First segment', 'Second segment']);
    context.mock.timers.tick(1000); assert.equal(h.recognizers.length, 2);
  } finally { h.session.dispose(); }
});
for(const [code, message] of [['network', /could not connect/], ['not-allowed', /permission/], ['service-not-allowed', /blocked/], ['audio-capture', /input device/], ['language-not-supported', /English/]] as const) {
  test(`${code} preserves captured words and gives an actionable error without retrying`, context => {
    context.mock.timers.enable({apis: ['setTimeout']}); const h = setup();
    try {
      h.session.start(); const r = h.recognizers[0]; r.onstart?.(); r.result('Keep these words');
      const staleEnd = r.onend; r.onerror?.({error: code}); staleEnd?.(); context.mock.timers.tick(20_000);
      assert.deepEqual(h.commits, ['Keep these words']); assert.equal(h.phases.at(-1), 'idle');
      assert.equal(h.recognizers.length, 1); assert.match(h.notices.at(-1)!.text, message);
      assert.equal(h.notices.at(-1)!.error, true);
    } finally { h.session.dispose(); }
  });
}
test('cancel during startup or reconnection cannot resurrect capture', context => {
  context.mock.timers.enable({apis: ['setTimeout']}); const h = setup();
  try {
    h.session.start(); const staleStart = h.recognizers[0].onstart;
    h.session.stop(); staleStart?.(); assert.equal(h.phases.at(-1), 'idle');
    h.session.start(); h.recognizers[1].onend?.(); h.session.stop(); context.mock.timers.tick(2000);
    assert.equal(h.recognizers.length, 2); assert.equal(h.phases.at(-1), 'idle');
  } finally { h.session.dispose(); }
});
test('startup timeout and two-minute limit release capture without losing the draft', context => {
  context.mock.timers.enable({apis: ['setTimeout']}); const h = setup();
  try {
    h.session.start(); context.mock.timers.tick(10_000);
    assert.equal(h.phases.at(-1), 'idle'); assert.match(h.notices.at(-1)!.text, /did not start/);
    h.session.start(); h.recognizers[1].onstart?.(); h.recognizers[1].result('A long response');
    context.mock.timers.tick(120_000); assert.deepEqual(h.commits, ['A long response']);
    assert.equal(h.phases.at(-1), 'idle'); assert.match(h.notices.at(-1)!.text, /two minutes/);
  } finally { h.session.dispose(); }
});
