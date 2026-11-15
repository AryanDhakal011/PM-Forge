/** Split worklet frames at quiet boundaries, with a hard cap for continuous speech. */
export class DictationSegments {
  private frames: Float32Array[] = [];
  private samples = 0;
  private quiet = 0;
  private heardSpeech = false;

  constructor(private readonly rate: number) {}

  push(frame: Float32Array): Float32Array | undefined {
    if (!frame.length) return;
    const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
    const speech = energy >= 0.00001;
    if (speech) this.heardSpeech = true;
    this.quiet = speech ? 0 : this.quiet + frame.length;
    this.frames.push(frame);
    this.samples += frame.length;
    if (this.samples >= this.rate * 8 ||
      (this.heardSpeech && this.samples >= this.rate && this.quiet >= this.rate * 0.4)) {
      return this.finish();
    }
  }

  finish(): Float32Array | undefined {
    const frames = this.frames, length = this.samples, hasSpeech = this.heardSpeech;
    this.frames = [];
    this.samples = this.quiet = 0;
    this.heardSpeech = false;
    if (!hasSpeech || length < this.rate * 0.25) return;
    const result = new Float32Array(length);
    let offset = 0;
    for (const frame of frames) {
      result.set(frame, offset);
      offset += frame.length;
    }
    return result;
  }
}
