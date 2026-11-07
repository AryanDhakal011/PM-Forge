"use client";
import s from "./GhostMetric.module.css";
export default function AudioControls({
  sound,
  auto,
  ambient,
  captions,
  playing,
  onSound,
  onAuto,
  onAmbient,
  onCaptions,
}: {
  sound: boolean;
  auto: boolean;
  ambient: boolean;
  captions: boolean;
  playing: boolean;
  onSound: () => void;
  onAuto: (value: boolean) => void;
  onAmbient: () => void;
  onCaptions: () => void;
}) {
  return (
    <div
      className={s.audioControls}
      aria-label="Conversation playback preferences"
    >
      <button
        type="button"
        role="switch"
        aria-checked={captions}
        aria-label="Dialogue captions"
        onClick={onCaptions}
      >
        Captions: {captions ? "On" : "Off"}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={sound}
        aria-label="Dialogue sound"
        onClick={onSound}
      >
        Sound: {sound ? "On" : "Off"}
        {sound && playing && <span className={s.playingIndicator}>Playing…</span>}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={auto}
        aria-label="Automatic line advancement"
        title={!sound ? "Enable sound to use automatic advancement." : undefined}
        disabled={!sound}
        onClick={() => onAuto(!auto)}
      >
        Auto-advance: {auto ? "On" : "Off"}
      </button>
      <button
        type="button"
        role="switch"
        aria-label="Ambient sound"
        aria-checked={ambient}
        onClick={onAmbient}
      >
        Ambient: {ambient ? "On" : "Off"}
      </button>
    </div>
  );
}
