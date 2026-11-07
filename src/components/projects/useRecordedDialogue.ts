"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useRecordedDialogue(id: string | undefined, sound: boolean, paused: boolean, clips: Record<string, {file: string; signature?: string}>) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState("");
  const [playing, setPlaying] = useState(false);
  const replay = useCallback(() => {
    const a = audio.current; if (!a || !sound) return;
    a.currentTime = 0; void a.play().catch(() => setStatus("Tap Replay to hear this line. Captions and Next always work."));
  }, [sound]);
  useEffect(() => {
    setStatus(""); setPlaying(false);
    if (!id || !sound) return;
    const clip = clips[id];
    if (!clip) { setStatus("Recording unavailable. Read the caption and continue."); return; }
    const a = new Audio(clip.file + (clip.signature ? "?v=" + clip.signature.slice(0, 12) : "")); audio.current = a;
    let disposed = false;
    a.onplaying = () => { setPlaying(true); setStatus(""); };
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    a.onerror = () => { setPlaying(false); setStatus("Recording unavailable. Read the caption and continue."); };
    if (!paused) void a.play().catch((error: unknown) => { if (!disposed) setStatus(error instanceof DOMException && error.name === "NotAllowedError" ? "Tap Replay for audio. You can continue with captions." : "Recording unavailable. Read the caption and continue."); });
    const hide = () => { if (document.hidden) a.pause(); };
    document.addEventListener("visibilitychange", hide);
    return () => { disposed = true; document.removeEventListener("visibilitychange", hide); a.onplaying = a.onpause = a.onended = a.onerror = null; a.pause(); a.removeAttribute("src"); a.load(); audio.current = null; };
    // Pausing preserves the current clip and time.
  }, [id, sound]);
  useEffect(() => { if (paused) audio.current?.pause(); }, [paused]);
  const toggle = () => { const a = audio.current; if (!a) return; if (a.paused) void a.play().catch(() => setStatus("Audio could not start. Captions remain available.")); else a.pause(); };
  return { replay, toggle, status, playing };
}
