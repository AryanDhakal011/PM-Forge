"use client";
import {chooseDeviceVoice} from "@/lib/hot-seat/browser-voices";
import type {PersonaId} from "@/lib/hot-seat/content";
export type VoiceMode="browser"|"neural"|"gemini";
type Events={state:(s:"idle"|"preparing"|"speaking"|"paused"|"error")=>void;progress:(text:string)=>void;level:(level:number,char:number)=>void;notice:(text:string)=>void};
/** Device speech only. Persona selection never changes another persona's voice. */
export class SeatVoice {
  private generation=0;private paused=false;private started=false;
  private utterance?:SpeechSynthesisUtterance;private timer?:ReturnType<typeof setTimeout>;
  constructor(private events:Events){}
  unlock(){window.speechSynthesis?.resume()}
  private watch(generation:number){clearTimeout(this.timer);this.timer=setTimeout(()=>{if(generation!==this.generation||this.started||this.paused)return;this.stop();this.events.state("error");this.events.notice("Your browser did not start speech. Press Repeat to retry, or continue with captions and typing.")},8000)}
  stop(){this.generation++;clearTimeout(this.timer);window.speechSynthesis?.cancel();this.utterance=undefined;this.paused=false;this.started=false;this.events.level(0,0);this.events.state("idle")}
  pause(){this.paused=true;clearTimeout(this.timer);window.speechSynthesis?.pause();this.events.state("paused")}
  resume(){this.paused=false;window.speechSynthesis?.resume();if(this.utterance&&!this.started)this.watch(this.generation);this.events.state(this.utterance?"speaking":"idle")}
  async speak(text:string,voiceId:PersonaId,_mode:VoiceMode,_session:{id:string;ownerId:string},_turnId?:string){
    this.stop();const generation=this.generation,synth=window.speechSynthesis;this.events.state("preparing");
    if(!synth){this.events.state("error");this.events.notice("Speech is unavailable in this browser. Captions and typing remain available.");return}
    let voices=synth.getVoices();
    if(!voices.length)voices=await new Promise<SpeechSynthesisVoice[]>(resolve=>{
      const finish=()=>{clearTimeout(timer);synth.removeEventListener("voiceschanged",finish);resolve(synth.getVoices())};
      const timer=setTimeout(finish,1200);synth.addEventListener("voiceschanged",finish);
    });
    if(generation!==this.generation)return;
    const u=new SpeechSynthesisUtterance(text),chosen=chooseDeviceVoice(voices,voiceId);
    if(chosen)u.voice=chosen;u.lang=chosen?.lang||"en-US";u.rate=voiceId==="kai"?1:0.96;this.utterance=u;
    u.onstart=()=>{if(generation!==this.generation)return;this.started=true;clearTimeout(this.timer);this.events.state(this.paused?"paused":"speaking")};
    u.onboundary=e=>{if(generation===this.generation)this.events.level(0,e.charIndex)};
    u.onend=()=>{if(generation!==this.generation)return;clearTimeout(this.timer);this.utterance=undefined;this.events.level(0,text.length);this.events.state("idle")};
    u.onerror=e=>{if(generation!==this.generation||e.error==="interrupted"||e.error==="canceled")return;clearTimeout(this.timer);this.utterance=undefined;this.events.state("error");this.events.notice("Device speech did not play. Press Repeat to retry; captions and typing remain available.")};
    synth.speak(u);if(this.paused)synth.pause();else this.watch(generation);
  }
  dispose(){this.stop()}
}
