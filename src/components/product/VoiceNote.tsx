"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import styles from "./Product.module.css";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        results: {
          length: number;
          [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string };
          };
        };
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
};
export default function VoiceNote({
  onText,
}: {
  onText: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onText);
  callback.current = onText;
  useEffect(() => {
    setSupported(
      !!(
        (
          window as unknown as {
            SpeechRecognition?: unknown;
            webkitSpeechRecognition?: unknown;
          }
        ).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
      ),
    );
    return () => recognition.current?.abort();
  }, []);
  const start = () => {
    const scope = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor =
      scope.SpeechRecognition || scope.webkitSpeechRecognition;
    if (!Constructor || !consent) return;
    const next = new Constructor();
    next.lang = localStorage.getItem("pmforge.voiceLanguage") || "en-US";
    next.continuous = false;
    next.interimResults = false;
    next.onstart = () => {
      setState("listening");
      setMessage(
        "Listening through your browser. Dictate one action; the transcript will go into your story.",
      );
    };
    next.onresult = (event) => {
      const text = Array.from({ length: event.results.length }, (_, i) =>
        event.results[i].isFinal ? event.results[i][0].transcript : "",
      )
        .join(" ")
        .trim();
      if (text) {
        callback.current(text);
        setMessage(
          "Transcript added to your story. Review and edit it before continuing.",
        );
      }
    };
    next.onerror = (event) => {
      setState("idle");
      setMessage(
        event.error === "not-allowed"
          ? "Microphone permission was denied. You can type the same story below."
          : "Voice typing could not continue. Your written work is safe; type or retry.",
      );
    };
    next.onend = () => {
      setState("idle");
      recognition.current = null;
    };
    recognition.current = next;
    setState("connecting");
    try {
      next.start();
    } catch {
      setState("idle");
      setMessage("Voice typing did not start. Type below or retry.");
    }
  };
  return (
    <div className={styles.panel} style={{ marginTop: 20 }}>
      <div className={styles.spread}>
        <h3>Say one of your actions out loud.</h3>
        <Mic size={17} />
      </div>
      <p className={styles.finePrint} style={{ margin: "12px 0" }}>
        Optional browser voice typing. Audio may be sent to your browser’s
        speech provider. PMForge does not record or store it.
      </p>
      {supported ? (
        <>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I understand and want to use browser voice typing.
          </label>
          <div className={styles.row} style={{ marginTop: 14 }}>
            {state === "idle" ? (
              <button
                type="button"
                className={styles.secondary}
                disabled={!consent}
                onClick={start}
              >
                <Mic size={14} />
                Dictate an action
              </button>
            ) : (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => recognition.current?.abort()}
              >
                <Square size={12} />
                {state === "connecting"
                  ? "Connecting… Cancel"
                  : "Stop listening"}
              </button>
            )}
            <span className={styles.pill}>
              <span className={styles.dot} />
              {state === "listening"
                ? "Browser recogniser active"
                : "No audio recording"}
            </span>
          </div>
        </>
      ) : (
        <p className={styles.notice}>
          Voice typing isn’t supported here. All story fields are fully usable
          with a keyboard.
        </p>
      )}
      {message && (
        <p className={styles.finePrint} role="status" style={{ marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  );
}
