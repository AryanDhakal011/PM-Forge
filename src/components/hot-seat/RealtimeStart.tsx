"use client";
import {useEffect,useRef,useState} from 'react';
import type {Options,SeatSession} from '@/lib/hot-seat/model';
import type {RealtimeCapability} from '@/lib/hot-seat/realtime/contracts';
import {showError} from '@/lib/ui-feedback';
import {realtimeRequest} from './realtimeRequest';
import s from './HotSeat.module.css';
export function RealtimeStart({options,ownerId,onStart}:{options:Options;ownerId:string;onStart:(run:SeatSession)=>Promise<void>}) {
  const [cap,setCap]=useState<RealtimeCapability|null>(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false);
  const pending=useRef<{id:string;fingerprint:string}|null>(null);
  useEffect(()=>{const controller=new AbortController();void fetch('/api/hot-seat/realtime',{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setCap).catch(()=>{if(!controller.signal.aborted)setCap({available:false,reason:'Realtime voice availability could not be checked.',providers:'',consentVersion:'',region:'',maxTurns:0,maxSeconds:0});});return()=>controller.abort();},[]);
  return <section className={s.speechNote} aria-label="Realtime voice">
    <strong>Realtime voice conversation</strong>
    <p>{cap?.available?`${cap.providers}. Up to ${cap.maxTurns} candidate turns. Realtime has a ${Math.round(cap.maxSeconds/60)}-minute resource cap plus two minutes to join, separate from your practice timebox; pauses do not extend this cap. Worker region: ${cap.region}.`:cap?.reason||'Checking the voice room…'}</p>
    {cap?.available&&<><p className={s.fine}>Realtime uses separately selected Inworld voices. The local Kokoro previews above do not preview this mode.</p><label className={s.check}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I am 18 or older and agree to send fictional practice audio and text to these providers. Audio is processed live; PMForge does not record raw microphone audio. An encrypted transcript recovery copy expires after 24 hours.</label>
    <button className={s.primary} disabled={!consent||busy} onClick={()=>{setBusy(true);const fingerprint=JSON.stringify({ownerId,options});if(pending.current?.fingerprint!==fingerprint)pending.current={id:crypto.randomUUID(),fingerprint};void realtimeRequest({action:'start',id:pending.current!.id,localOwnerId:ownerId,options,consent:{adult:true,providers:true,version:cap.consentVersion}}).then(data=>onStart(data.session)).catch(e=>showError(e.message)).finally(()=>setBusy(false));}}>{busy?'Opening voice room…':'Enter realtime voice'}</button></>}
    <p className={s.fine}>Realtime voice uses a separately configured operating budget. Local guided practice remains available.</p>
  </section>;
}
