"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import {DictationSession, type DictationPhase, type Recognizer} from '@/lib/hot-seat/dictation';
import {showError} from '@/lib/ui-feedback';

type SpeechWindow = Window & {SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer};
export function useMicrophone(onText: (text: string, seconds: number) => void, onInterrupt: () => void) {
  const [phase, setPhase] = useState<DictationPhase>('idle');
  const [level, setLevel] = useState(0), [interim, setInterim] = useState('');
  const [notice, setNotice] = useState(''), [supported, setSupported] = useState(false);
  const callbacks = useRef({onText, onInterrupt});
  callbacks.current = {onText, onInterrupt};
  const session = useRef<DictationSession | null>(null);
  const meter = useRef<MediaStream | null>(null), audio = useRef<AudioContext | null>(null);
  const frame = useRef(0), generation = useRef(0), busy = useRef(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const releaseMeter = useCallback(() => {
    generation.current++;
    clearTimeout(checkTimer.current); cancelAnimationFrame(frame.current);
    meter.current?.getTracks().forEach(track => track.stop()); meter.current = null;
    void audio.current?.close().catch(() => {}); audio.current = null; setLevel(0);
  }, []);
  const openMeter = useCallback(async (check = false) => {
    releaseMeter();
    const request = generation.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
      if(request !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      meter.current = stream;
      const context = new AudioContext(); audio.current = context;
      await context.resume();
      if(request !== generation.current) return;
      const analyser = context.createAnalyser(); analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0, last = 0;
      if(check) setPhase('listening');
      const loop = () => {
        if(request !== generation.current) return;
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        peak = Math.max(peak, rms);
        if(performance.now()-last > 80) { last = performance.now(); setLevel(Math.min(100, Math.round(rms*600))); }
        frame.current = requestAnimationFrame(loop);
      };
      loop();
      if(check) checkTimer.current = setTimeout(() => {
        releaseMeter(); busy.current = false; setPhase('idle');
        setNotice(peak > .01 ? 'Microphone input detected. This checks input only, not browser transcription. No recording was retained.' : 'No clear microphone input detected. Check the selected input device and retry.');
      }, 3000);
    } catch {
      if(request !== generation.current) return;
      releaseMeter();
      if(check) { busy.current = false; setPhase('idle'); setNotice('Microphone test could not start. Check microphone access and your input device, then retry.'); }
      // A missing level meter must never end otherwise working dictation.
    }
  }, [releaseMeter]);

  useEffect(() => {
    const scope = window as SpeechWindow;
    const Constructor = scope.SpeechRecognition || scope.webkitSpeechRecognition;
    setSupported(!!Constructor);
    if(Constructor) session.current = new DictationSession(() => new Constructor(), {
      phase: next => {
        setPhase(next);
        if(next === 'idle') { busy.current = false; releaseMeter(); }
        else if(next === 'listening') void openMeter();
        else releaseMeter();
      },
      preview: setInterim,
      commit: (text, seconds) => callbacks.current.onText(text, seconds),
      notice: (text, error) => {setNotice(text); if(error) showError(text);},
    });
    const hide = () => { if(document.hidden) { session.current?.stop(); releaseMeter(); busy.current = false; setPhase('idle'); } };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      session.current?.dispose(); session.current = null; releaseMeter(); busy.current = false;
    };
  }, [openMeter, releaseMeter]);

  const stop = useCallback(() => {
    session.current?.stop(); releaseMeter(); busy.current = false; setPhase('idle'); setInterim('');
  }, [releaseMeter]);
  const start = useCallback((check = false) => {
    if(busy.current) return;
    if(!check && !session.current) {setNotice('Browser dictation is unavailable here. Try Chrome or Edge, or type your answer.'); return;}
    busy.current = true; callbacks.current.onInterrupt(); setNotice('');
    if(check) {setPhase('starting'); void openMeter(true);}
    else session.current?.start();
  }, [openMeter]);
  return {active: phase === 'listening', starting: phase === 'starting', level, interim, notice, supported, start, stop};
}
