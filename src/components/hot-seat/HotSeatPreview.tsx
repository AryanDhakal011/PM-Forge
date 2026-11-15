"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { HostedAccessDialog } from "@/components/product/HostedAccessDialog";
import { Presence } from "./Presence";
import { company, persona } from "@/lib/hot-seat/content";
import { lockPageScroll } from "@/lib/page-scroll";
import s from "./HotSeat.module.css";

const interviewer = persona("nora");
const business = company("saas");
const opener = `I'm ${interviewer.name}. You're joining ${business.name}, our fictional ${business.stage.toLowerCase()} company. ${business.situation} ${business.openers[0]}`;
const openingAudio = "/hot-seat/library-v1/af_bella/49040ea403650ff4.wav";

export function HotSeatPreview() {
  const [entered, setEntered] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!entered) return;
    const release = lockPageScroll();
    const opening = audio.current;
    let root = document.getElementById("main");
    while (root?.parentElement && root.parentElement !== document.body) root = root.parentElement;
    const previous = root?.inert ?? false;
    if (root) root.inert = true;
    title.current?.focus();
    return () => {
      opening?.pause();
      release();
      if (root) root.inert = previous;
      openButton.current?.focus();
    };
  }, [entered]);

  function stopAudio() {
    audio.current?.pause();
    setPlaying(false);
  }

  async function playOpening() {
    if (!audio.current) return;
    audio.current.currentTime = 0;
    setAudioError(false);
    try {
      await audio.current.play();
      setPlaying(true);
    } catch {
      setAudioError(true);
    }
  }

  return <div className={s.lobby}>
    {entered ? createPortal(<section className={s.room} aria-label="Hot Seat preview room">
      <header className={s.roomBar}>
        <button type="button" onClick={() => { stopAudio(); setEntered(false); }}><ArrowLeft size={16} /> Back to lobby</button>
        <span className={s.chip}>Recorded opening · {business.name}</span>
      </header>
      <div className={s.center}>
        <Presence state="idle" level={0} color={interviewer.color} />
        <h1 ref={title} tabIndex={-1} className={s.previewHeading}>{interviewer.name}</h1>
        <p className={s.who}>{interviewer.role} · fictional interviewer</p>
        <p className={s.caption}>{opener}</p>
        <audio ref={audio} preload="none" src={openingAudio} onEnded={() => setPlaying(false)} />
        <button type="button" onClick={playing ? stopAudio : () => void playOpening()}>
          <Volume2 size={17} /> {playing ? "Stop playback" : "Play recorded opening"}
        </button>
        {audioError && <p className={s.roomNotice} role="status">Audio couldn’t play. The opening is written above.</p>}
      </div>
      <div className={s.dock}>
        <form className={`${s.composer} ${s.previewComposer}`} onSubmit={(event) => {
          event.preventDefault();
          stopAudio();
          setAccessOpen(true);
        }}>
          <label htmlFor="hot-seat-preview-draft">Try a response <span className={s.fine}>(optional)</span></label>
          <textarea id="hot-seat-preview-draft" maxLength={4000} rows={2} placeholder="What would you learn in your first week?" />
          <p className={s.fine}>Your draft stays in this preview and is never submitted.</p>
          <button type="submit">Continue conversation <ArrowRight size={17} /></button>
        </form>
      </div>
    </section>, document.body) : null}
    <div className={s.intro}>
      <span className={s.eyebrow}>Hot Seat · Opening preview</span>
      <h1>Take the seat.</h1>
      <p>Meet a fictional product lead and hear the first question. You can ask about a walkthrough of the full conversation.</p>
      <div className={s.previewActions}>
        <button ref={openButton} className={s.primary} onClick={() => setEntered(true)}>Open the room <ArrowRight size={18} /></button>
        <Link className={s.secondary} href="/app/practice">Browse full practice</Link>
      </div>
    </div>
    <HostedAccessDialog open={accessOpen} onClose={() => setAccessOpen(false)} feature="Hot Seat" />
  </div>;
}
