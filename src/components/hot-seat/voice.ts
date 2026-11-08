"use client";
import { neuralCacheIdentity } from "@/lib/hot-seat/neural-voices";
import { db } from "@/lib/product/db";
import { persona, type PersonaId } from "@/lib/hot-seat/content";
export type VoiceMode = "neural" | "browser" | "gemini";
type Events = {
  state: (
    state: "idle" | "preparing" | "speaking" | "paused" | "error",
  ) => void;
  progress: (text: string) => void;
  level: (value: number, char: number) => void;
  notice: (text: string) => void;
};
export class SeatVoice {
  private disposed=false;
  private worker?: Worker;
  private waiting = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private ctx?: AudioContext;
  private source?: AudioBufferSourceNode;
  private gain?: GainNode;
  private frame = 0;
  private generation = 0;
  private paused = false;


  constructor(private events: Events) {}
  private work() {
    if (!this.worker) {
      this.worker = new Worker("/hot-seat/voice-worker-v2.mjs", {
        type: "module",
      });
      this.worker.onmessage = ({ data }) => {
        if (data.progress !== undefined) {
          this.events.progress(
            `Downloading voice · ${data.progress}% of ${data.file || "model file"}`,
          );
          return;
        }
        if(data.diagnostic)console.warn("Hot Seat voice initialization:",data.diagnostic);
        const p = this.waiting.get(data.id);
        if (!p) return;
        clearTimeout(p.timer);
        this.waiting.delete(data.id);
        data.error ? p.reject(Error(data.error)) : p.resolve(data);
      };
      this.worker.onerror = () => {
        for (const p of this.waiting.values()) {
          clearTimeout(p.timer);
          p.reject(Error("Local voice could not start."));
        }
        this.waiting.clear();
        this.worker?.terminate();
        this.worker = undefined;
      };
    }
    return this.worker;
  }
  private request(data: Record<string, unknown>) {
    return new Promise<any>((resolve, reject) => {
      const id = crypto.randomUUID(),
        timer = setTimeout(() => {
          this.waiting.delete(id);
          reject(
            Error(
              "The neural voice is taking too long. Retry natural voice or continue with captions.",
            ),
          );
        }, 180000);
      this.waiting.set(id, { resolve, reject, timer });
      this.work().postMessage({ ...data, id });
    });
  }
  async prepare() {
    this.events.state("preparing");
    try {
      await this.request({ type: "prepare" });
      if(this.disposed)return false;
      this.events.progress("Neural voice ready · runs on this device");
      this.events.state("idle");
      return true;
    } catch {
      if(this.disposed)return false;
      this.events.state("error");
      this.events.notice(
        "Neural voice could not load. Retry natural voice or continue with captions.",
      );
      return false;
    }
  }
  unlock() {
    if (!this.ctx || this.ctx.state === "closed") this.ctx = new AudioContext();
    if (!this.paused) void this.ctx.resume().catch(() => {});
  }
  stop() {
    this.paused = false;
    this.generation++;

    try {
      this.source?.stop();
    } catch {}
    this.source = undefined;
    cancelAnimationFrame(this.frame);


    this.events.level(0, 0);
    this.events.state("idle");
  }
  pause() {
    this.paused = true;
    void this.ctx?.suspend();

    this.events.state("paused");
  }
  resume() {
    this.paused = false;
    void this.ctx?.resume();

    this.events.state(this.source ? "speaking" : "idle");
  }
  async speak(
    text: string,
    voiceId: PersonaId,
    mode: VoiceMode,
    session: { id: string; ownerId: string },
    turnId?: string,
  ) {
    this.stop();
    const generation = this.generation,
      p = persona(voiceId);
    this.events.state("preparing");
    try {
      const hash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(neuralCacheIdentity(voiceId,text)),
            ),
          ),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join(""),
        key = session.id + ":" + hash;
      let blob = (await db.hotSeatAudio.get(key))?.blob;
      if (!blob && voiceId !== "ellis" && text === p.sample) {
        const response=await fetch(`/hot-seat/neural-v2/${p.voice}/preview.wav`);
        if(response.ok)blob=await response.blob();
      }
      if (!blob) {
        const result = await this.request({
          type: "speak",
          text,
          voice: p.voice,
        });
        if (generation !== this.generation) return;
        this.unlock();
        const buffer = this.ctx!.createBuffer(
          1,
          result.samples.length,
          result.rate,
        );
        buffer.copyToChannel(result.samples, 0);
        const wave = new ArrayBuffer(44 + result.samples.length * 2),
          v = new DataView(wave);
        for (const [offset, str] of [
          [0, "RIFF"],
          [8, "WAVE"],
          [12, "fmt "],
          [36, "data"],
        ] as const)
          for (let i = 0; i < str.length; i++)
            v.setUint8(offset + i, str.charCodeAt(i));
        v.setUint32(4, 36 + result.samples.length * 2, true);
        v.setUint32(16, 16, true);
        v.setUint16(20, 1, true);
        v.setUint16(22, 1, true);
        v.setUint32(24, result.rate, true);
        v.setUint32(28, result.rate * 2, true);
        v.setUint16(32, 2, true);
        v.setUint16(34, 16, true);
        v.setUint32(40, result.samples.length * 2, true);
        for (let i = 0; i < result.samples.length; i++)
          v.setInt16(
            44 + i * 2,
            Math.max(-1, Math.min(1, result.samples[i])) * 32767,
            true,
          );
        blob = new Blob([wave], { type: "audio/wav" });
      }
      if (generation !== this.generation) return;
      const existing = await db.hotSeatAudio
        .where("runId")
        .equals(session.id)
        .toArray();
      if (existing.reduce((n, a) => n + a.blob.size, 0) + blob.size < 30000000)
        await db.hotSeatAudio.put({
          id: key,
          runId: session.id,
          ownerId: session.ownerId,
          blob,
          createdAt: new Date().toISOString(),
        });
      this.unlock();
      const ctx = this.ctx!,
        buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      if (generation !== this.generation) return;
      const source = ctx.createBufferSource(),
        analyser = ctx.createAnalyser(),
        gain = ctx.createGain();
      this.gain = gain;
      analyser.fftSize = 256;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);
      this.source = source;
      const begin = ctx.currentTime,
        data = new Float32Array(analyser.fftSize);
      let last = 0;
      const frame = () => {
        if (generation !== this.generation) return;
        analyser.getFloatTimeDomainData(data);
        if (performance.now() - last > 80) {
          last = performance.now();
          const rms = Math.sqrt(
            data.reduce((n, v) => n + v * v, 0) / data.length,
          );
          this.events.level(
            Math.min(1, rms * 5),
            Math.min(
              text.length,
              Math.floor(
                ((ctx.currentTime - begin) / buffer.duration) * text.length,
              ),
            ),
          );
        }
        this.frame = requestAnimationFrame(frame);
      };
      source.onended = () => {
        if (generation === this.generation) {
          cancelAnimationFrame(this.frame);
          this.events.level(0, text.length);
          this.events.state("idle");
          this.source = undefined;
        }
      };
      source.start();
      this.events.state(this.paused ? "paused" : "speaking");
      frame();
    } catch {
      if (generation === this.generation) {
        this.events.state("error");
        this.events.notice(
          "Kokoro speech could not play. Retry natural voice or continue with captions. No browser voice was substituted.",
        );
      }
    }
  }
  dispose() {
    this.disposed=true;
    this.stop();
    this.worker?.terminate();
    for (const p of this.waiting.values()) {
      clearTimeout(p.timer);
      p.reject(Error("Voice closed"));
    }
    this.waiting.clear();
    void this.ctx?.close();
  }
}
