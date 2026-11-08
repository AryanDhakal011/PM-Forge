"use client";
import { useEffect, useRef, useState } from "react";
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};
export function useMicrophone(
  onText: (text: string, seconds: number) => void,
  onInterrupt: () => void,
) {
  const [active, setActive] = useState(false),
    [level, setLevel] = useState(0),
    [interim, setInterim] = useState(""),
    [notice, setNotice] = useState(""),
    [supported, setSupported] = useState(false);
  const current = useRef({ onText, onInterrupt });
  current.current = { onText, onInterrupt };
  const stream = useRef<MediaStream | null>(null),
    ctx = useRef<AudioContext | null>(null),
    recognition = useRef<Recognition | null>(null),
    frame = useRef(0),
    started = useRef(0),
    words = useRef(""),
    partial = useRef(""),
    lastSpeech = useRef(0),
    ticket = useRef(0),
    test = useRef(false),
    held = useRef(false);
  useEffect(() => {
    setSupported(
      !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      ),
    );
    return () => {
      ticket.current++;
      if (recognition.current) { recognition.current.onend=null; recognition.current.onerror=null; recognition.current.onresult=null; recognition.current.abort(); }
      stream.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(frame.current);
      void ctx.current?.close();
    };
  }, []);
  const stop = () => {
    held.current = false;
    ticket.current++;
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void ctx.current?.close();
    ctx.current = null;
    const r = recognition.current;
    if (r) {
      try { r.stop(); } catch {}
    }
    setActive(false);
    setLevel(0);
  };
  async function start(check = false) {
    if (held.current) return;
    held.current = true;
    test.current = check;
    current.current.onInterrupt();
    setNotice("");
    const request = ++ticket.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (request !== ticket.current) {
        media.getTracks().forEach((t) => t.stop());
        held.current = false;
        return;
      }
      stream.current = media;
      const audio = new AudioContext();
      ctx.current = audio;
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      audio.createMediaStreamSource(media).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      started.current = Date.now();
      lastSpeech.current = 0;
      words.current = "";
      partial.current = "";
      setInterim("");
      setActive(true);
      if (!check) {
        const Constructor =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (!Constructor) {
          setNotice(
            "Browser dictation is unavailable. Type your answer instead.",
          );
          stop();
          return;
        }
        const r: Recognition = new Constructor();
        recognition.current = r;
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";
        r.onresult = (e) => {
          let completed = "",
            draft = "";
          for (let i = 0; i < e.results.length; i++) {
            const result = e.results[i];
            if (result.isFinal) completed += result[0].transcript + " ";
            else draft += result[0].transcript + " ";
          }
          words.current = completed.trim();
          partial.current = draft.trim();
          setInterim(
            [words.current, partial.current].filter(Boolean).join(" "),
          );
          lastSpeech.current = Date.now();
        };
        r.onerror = (e) => {
          setNotice(
            e.error === "not-allowed"
              ? "Microphone or dictation permission was denied. Your draft is safe; use typing."
              : "Dictation stopped. Review the captured words or keep typing.",
          );
          stop();
        };
        r.onend = () => {
          const text = [words.current, partial.current]
            .filter(Boolean)
            .join(" ");
          if (text)
            current.current.onText(text, (Date.now() - started.current) / 1000);
          words.current = "";
          partial.current = "";
          recognition.current = null;
          setInterim("");
          stop();
        };
        r.start();
      }
      let last = 0;
      const loop = () => {
        if (request !== ticket.current) return;
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(
          samples.reduce((n, v) => n + v * v, 0) / samples.length,
        );
        if (performance.now() - last > 80) {
          last = performance.now();
          setLevel(Math.min(100, Math.round(rms * 600)));
        }
        if (rms > 0.025) lastSpeech.current = Date.now();
        const trailing = /\b(and|um|uh|so)\s*$/i.test(
          words.current + " " + partial.current,
        )
          ? 2000
          : 1200;
        if (check && Date.now() - started.current > 3000) {
          setNotice(
            lastSpeech.current
              ? "Microphone input detected. No recording was retained."
              : "No clear input detected. Try again or use typing.",
          );
          stop();
          return;
        }
        if (
          !check &&
          lastSpeech.current &&
          Date.now() - lastSpeech.current > trailing
        ) {
          stop();
          return;
        }
        if (Date.now() - started.current > 120000) {
          stop();
          return;
        }
        frame.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      held.current = false;
      setNotice(
        "Microphone could not start. Check permissions or keep typing.",
      );
      stop();
    }
  }
  return { active, level, interim, notice, supported, start, stop };
}
