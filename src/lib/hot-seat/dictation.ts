export type DictationPhase = 'idle' | 'starting' | 'listening';
export type RecognitionResultEvent = {results: ArrayLike<{isFinal: boolean; 0: {transcript: string}}>};
export type Recognizer = {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; abort(): void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
};
type Events = {
  phase(phase: DictationPhase): void; preview(text: string): void;
  commit(text: string, seconds: number): void;
  notice(text: string, error: boolean): void;
};
export function dictationError(code: string) {
  switch(code) {
    case 'not-allowed': case 'service-not-allowed':
      return 'Browser dictation permission was denied or the speech service is blocked. Allow microphone access in your browser settings, then retry. Your draft is safe.';
    case 'audio-capture':
      return 'The microphone could not capture audio. Check your input device and whether another app is using it, then retry. Your draft is safe.';
    case 'network':
      return 'The browser speech service could not connect. Check your connection or try Chrome or Edge outside an embedded browser. Your draft is safe; typing still works.';
    case 'language-not-supported':
      return 'This browser speech service does not support English (US). Try another browser or keep typing. Your draft is safe.';
    default:
      return `Browser dictation could not continue (${code}). Retry or keep typing. Your draft is safe.`;
  }
}

/** Recognition owns the lifecycle. The optional audio meter never controls it. */
export class DictationSession {
  private recognizer: Recognizer | null = null;
  private wanted = false;
  private final = '';
  private partial = '';
  private began = 0;
  private emptyEnds = 0;
  private retry?: ReturnType<typeof setTimeout>;
  private watchdog?: ReturnType<typeof setTimeout>;
  private limit?: ReturnType<typeof setTimeout>;
  constructor(private create: () => Recognizer, private events: Events) {}

  start() {
    if(this.wanted) return;
    this.wanted = true; this.emptyEnds = 0;
    this.events.notice('', false);
    this.limit = setTimeout(() => {
      this.stop();
      this.events.notice('Dictation reached two minutes. Captured words are in your draft; start again to add more.', false);
    }, 120_000);
    // Directly inside the user gesture, before any permission/meter awaits.
    this.open();
  }
  private open() {
    if(!this.wanted) return;
    this.events.phase('starting'); this.began = Date.now(); this.final = this.partial = '';
    let r: Recognizer;
    try { r = this.create(); } catch { this.fail('service-not-allowed'); return; }
    this.recognizer = r;
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    const current = () => this.wanted && this.recognizer === r;
    r.onstart = () => {
      if(!current()) return;
      clearTimeout(this.watchdog); this.events.notice('', false); this.events.phase('listening');
    };
    r.onresult = event => {
      if(!current()) return;
      let final = '', partial = '';
      for(let i=0; i<event.results.length; i++) {
        const result = event.results[i];
        if(result.isFinal) final += result[0].transcript + ' ';
        else partial += result[0].transcript + ' ';
      }
      this.final = final.trim(); this.partial = partial.trim(); this.events.preview(this.text());
    };
    r.onerror = event => {
      if(!current()) return;
      // Restart only after this instance ends; do not turn normal silence into failure.
      if(event.error === 'no-speech' || event.error === 'aborted') return;
      this.fail(event.error);
    };
    r.onend = () => {
      if(!current()) return;
      const hadWords = !!this.text();
      this.flush(); this.detach();
      this.emptyEnds = hadWords ? 0 : this.emptyEnds + 1;
      if(this.emptyEnds >= 3) {
        this.stop();
        this.events.notice('No speech was captured after three attempts. Check the microphone and browser dictation permissions, then retry. Any captured words remain in your draft.', true);
        return;
      }
      this.events.phase('starting');
      this.events.notice('Reconnecting browser dictation… Your captured words are safe.', false);
      this.retry = setTimeout(() => this.open(), 350);
    };
    this.watchdog = setTimeout(() => {
      if(current()) {
        this.stop();
        this.events.notice('Browser dictation did not start. Check microphone permissions or try Chrome or Edge outside an embedded browser. Your draft is safe.', true);
      }
    }, 10_000);
    try { r.start(); } catch(error) { this.fail(error instanceof Error ? error.name : 'start-failed'); }
  }
  private text() { return [this.final, this.partial].filter(Boolean).join(' '); }
  private flush() {
    const text = this.text(); this.final = this.partial = '';
    if(text) this.events.commit(text, Math.max(0, (Date.now()-this.began)/1000));
    this.events.preview('');
  }
  private detach() {
    clearTimeout(this.watchdog);
    const r = this.recognizer; this.recognizer = null;
    if(r) { r.onstart = r.onend = r.onresult = r.onerror = null; try { r.abort(); } catch {} }
  }
  private fail(code: string) { this.stop(); this.events.notice(dictationError(code), true); }
  stop() {
    this.wanted = false; clearTimeout(this.retry); clearTimeout(this.limit);
    this.flush(); this.detach(); this.events.phase('idle');
  }
  dispose() {
    this.wanted = false; clearTimeout(this.retry); clearTimeout(this.limit); this.detach();
  }
}
