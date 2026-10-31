"use client";
import s from "./GhostMetric.module.css";
export default function AudioControls({
  sound,
  auto,
  ambient,
  onSound,
  onAuto,
  onAmbient,
}: {
  sound: boolean;
  auto: boolean;
  ambient: boolean;
  onSound: () => void;
  onAuto: (value: boolean) => void;
  onAmbient: () => void;
}) {
  return (
    <div
      className={s.audioControls}
      aria-label="Conversation playback preferences"
    >
      <span className={s.captionState}>Captions: On</span>
      <button
        type="button"
        role="switch"
        aria-checked={sound}
        aria-label="Dialogue sound"
        onClick={onSound}
      >
        Sound: {sound ? "On" : "Off"}
      </button>
      <label
        title={
          !sound ? "Enable sound to use automatic advancement." : undefined
        }
      >
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => onAuto(e.target.checked)}
        />
        Auto-advance: {auto ? "On" : "Off"}
      </label>
      <button
        type="button"
        role="switch"
        aria-label="Ambient sound"
        aria-checked={ambient}
        onClick={onAmbient}
      >
        Ambient: {ambient ? "On" : "Off"}
      </button>
      {!sound && <small>Next is required while sound is off.</small>}
    </div>
  );
}
