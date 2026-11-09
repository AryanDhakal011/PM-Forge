"use client";
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Mic,MicOff,ArrowRight} from 'lucide-react';
import type {Room} from 'livekit-client';
import {company,persona} from '@/lib/hot-seat/content';
import type {SeatSession} from '@/lib/hot-seat/model';
import {showError} from '@/lib/ui-feedback';
import {realtimeRequest} from './realtimeRequest';
import {Presence} from './Presence';
import s from './HotSeat.module.css';

export default function RealtimeConversation({run,persist,onLobby,onGuided}:{run:SeatSession;persist:(s:SeatSession)=>Promise<void>;onLobby:()=>void;onGuided:()=>Promise<void>}) {
  const [status,setStatus]=useState('Ready to connect'),[notice,setNotice]=useState(''),[caption,setCaption]=useState('');
  const [connected,setConnected]=useState(false),[connecting,setConnecting]=useState(false),[mic,setMic]=useState(false),[draft,setDraft]=useState(run.draft),[sending,setSending]=useState(false),[transcript,setTranscript]=useState(false);
  const room=useRef<Room|null>(null),agent=useRef(''),audio=useRef<HTMLDivElement>(null),attempt=useRef(0),mounted=useRef(true);
  const pendingText=useRef<{id:string;text:string}|null>(null);
  const latest=useRef({run,persist,onLobby,onGuided});latest.current={run,persist,onLobby,onGuided};
  const p=persona(run.options.persona),c=company(run.options.company);
  const fail=(error:unknown)=>{const text=error instanceof Error?error.message:'Voice connection failed. Your saved conversation is safe.';setNotice(text);showError(text);};
  async function disconnect(){attempt.current++;const current=room.current;room.current=null;await current?.disconnect();setConnected(false);setMic(false);}
  async function connect(){
    if(connecting||connected)return;
    setConnecting(true);setNotice('');setCaption('');agent.current='';setStatus('Connecting securely');const token=++attempt.current;
    let next:Room|undefined;
    try {
      const access=await realtimeRequest({action:'connect',id:run.id});
      if(token!==attempt.current||!mounted.current)return;
      const {Room,RoomEvent,Track}=await import('livekit-client');
      next=new Room({adaptiveStream:true,dynacast:true,audioCaptureDefaults:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},disconnectOnPageLeave:true});
      room.current=next;
      next.on(RoomEvent.ParticipantConnected,participant=>{if(participant.isAgent)agent.current=participant.identity;});
      next.on(RoomEvent.ParticipantDisconnected,participant=>{if(participant.isAgent&&token===attempt.current){void next?.disconnect();fail(Error('The voice worker disconnected. Your saved turns are safe; reconnect or continue guided.'));void realtimeRequest({action:'pause',id:run.id}).then(data=>latest.current.persist({...data.session,draft:latest.current.run.draft})).catch(fail);}});
      next.on(RoomEvent.ParticipantAttributesChanged,(_changed,participant)=>{if(participant.isAgent){agent.current=participant.identity;setStatus(participant.attributes['lk.agent.state']||'Connected');}});
      next.on(RoomEvent.TrackSubscribed,(track,_publication,participant)=>{
        if(participant.isAgent&&track.kind===Track.Kind.Audio){agent.current=participant.identity;const element=track.attach();element.autoplay=true;audio.current?.append(element);}
      });
      next.on(RoomEvent.TrackUnsubscribed,track=>track.detach().forEach(element=>element.remove()));
      next.on(RoomEvent.TranscriptionReceived,(segments,participant)=>{if(participant?.isAgent)setCaption(segments.map(segment=>segment.text).join(' '));});
      next.registerTextStreamHandler('lk.transcription',async(reader,participant)=>{
        if(participant.identity!==agent.current)return;
        let text='';for await(const chunk of reader){text+=chunk;if(token===attempt.current)setCaption(text);}
      });
      next.on(RoomEvent.Disconnected,()=>{if(token===attempt.current){setConnected(false);setMic(false);setStatus('Disconnected');setNotice('The voice room disconnected. Your saved turns remain available. Reconnect or continue guided.');}});
      next.on(RoomEvent.MediaDevicesError,fail);
      await next.connect(access.url,access.token);
      if(token!==attempt.current||!mounted.current){await next.disconnect();return;}
      for(const participant of next.remoteParticipants.values())if(participant.isAgent)agent.current=participant.identity;
      if(!agent.current)await new Promise<void>((resolve,reject)=>{
        const timer=setTimeout(()=>{next?.off(RoomEvent.ParticipantConnected,ready);reject(Error('The voice worker did not join. Retry or continue guided.'));},15000);
        const ready=(participant:import('livekit-client').RemoteParticipant)=>{if(participant.isAgent){clearTimeout(timer);next?.off(RoomEvent.ParticipantConnected,ready);agent.current=participant.identity;resolve();}};
        next!.on(RoomEvent.ParticipantConnected,ready);
      });
      if(token!==attempt.current||!mounted.current){await next.disconnect();return;}
      await next.startAudio();
      await next.localParticipant.setMicrophoneEnabled(true);
      if(token!==attempt.current||!mounted.current){await next.disconnect();return;}
      setConnected(true);setMic(true);setStatus('Microphone live');await latest.current.persist(access.session);
    }catch(error){await next?.disconnect();if(token===attempt.current&&mounted.current){setConnected(false);setMic(false);setStatus('Connection needs attention');fail(error);const saved=await realtimeRequest({action:'pause',id:run.id}).catch(()=>null);if(saved)await latest.current.persist({...saved.session,draft:latest.current.run.draft});}}
    finally{if(token===attempt.current)setConnecting(false);}
  }
  async function control(action:Record<string,unknown>){
    if(!room.current||!agent.current)throw Error('The interviewer is not connected yet. Retry shortly.');
    return room.current.localParticipant.performRpc({destinationIdentity:agent.current,method:'pmforge.control',payload:JSON.stringify(action),responseTimeout:10000});
  }
  async function leave(end=false){
    await disconnect();setConnecting(false);
    try{const result=await realtimeRequest({action:end?'end':'pause',id:run.id});await latest.current.persist({...result.session,draft:latest.current.run.draft});if(!end)onLobby();}catch(error){fail(error);}
  }
  useEffect(()=>{
    mounted.current=true;
    const hide=()=>{if(document.hidden)void leave(false);};document.addEventListener('visibilitychange',hide);
    return()=>{mounted.current=false;attempt.current++;document.removeEventListener('visibilitychange',hide);void room.current?.disconnect();};
  },[]);
  useEffect(()=>{
    if(!connected)return;
    let cancelled=false,busy=false;
    const timer=setInterval(()=>{
      if(busy)return;busy=true;
      void realtimeRequest({action:'status',id:run.id}).then(async data=>{if(!cancelled)await latest.current.persist({...data.session,draft:latest.current.run.draft});}).catch(error=>{if(!cancelled)fail(error);}).finally(()=>{busy=false;});
    },2000);
    return()=>{cancelled=true;clearInterval(timer);};
  },[connected,run.id]);
  const elapsed=Math.floor(run.elapsedMs/1000),left=Math.max(0,run.options.minutes*60-elapsed);
  return createPortal(<div className={s.room} role="region" aria-label="Hot Seat realtime conversation room">
    <header className={s.roomBar}><div><span className={s.chip}>{c.name} · simulated</span><span className={s.chip}>{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</span><span className={s.state} role="status">{status}</span></div><div><button onClick={()=>setTranscript(v=>!v)}>Transcript</button><button onClick={()=>void leave(false)}>Pause / Save</button><button onClick={()=>void leave(true)}>End</button></div></header>
    <main className={s.center}>
      <Presence color={p.color} state={status==='speaking'?'speaking':'idle'} level={0}/>
      <p>{p.name} · AI interviewer · streaming synthetic voice</p>
      <p className={s.caption}>{caption||run.turns.filter(t=>t.who==='ai').at(-1)?.text||'Your interviewer is ready.'}</p>
      {!connected&&<div><p>Connect when you are ready. Headphones help prevent echo. Your microphone stays off until you connect.</p><button className={s.primary} disabled={connecting} onClick={()=>void connect()}>{connecting?'Connecting…':'Connect microphone'}</button></div>}
      {notice&&<p role="alert" className={s.roomNotice}>{notice}</p>}
      {transcript&&<div aria-label="Saved transcript">{run.turns.map(turn=><p key={turn.id}><strong>{turn.who==='ai'?p.name:'You'}: </strong>{turn.text}{turn.interrupted?' [interrupted]':''}</p>)}</div>}
      <div ref={audio} aria-hidden="true"/>
    </main>
    <footer className={s.dock}>
      <p className={s.nextMove}>Speak naturally, or type. Captions follow streamed playback. Original recognized words are saved separately.</p>
      <div className={s.quick}>
        <button disabled={!connected} aria-pressed={mic} onClick={()=>void room.current?.localParticipant.setMicrophoneEnabled(!mic).then(()=>setMic(v=>!v)).catch(fail)}>{mic?<MicOff/>:<Mic/>}{mic?'Mute microphone':'Unmute microphone'}</button>
        <button disabled={!connected} onClick={()=>void control({action:'done'}).catch(fail)}>I’m done</button>
        <button disabled={!connected} onClick={()=>void control({action:'interrupt'}).catch(fail)}>Stop speaking</button>
        <button onClick={()=>void disconnect().then(onGuided).catch(fail)}>Continue guided</button>
      </div>
      <div className={s.composer}><label className={s.srOnly} htmlFor="realtime-answer">Your answer</label><textarea id="realtime-answer" value={draft} maxLength={4000} onChange={event=>{setDraft(event.target.value);void latest.current.persist({...latest.current.run,draft:event.target.value}).catch(fail);}} placeholder="Type an answer or clarification"/>
      <button disabled={!connected||!draft.trim()||sending} onClick={()=>{setSending(true);if(pendingText.current?.text!==draft)pendingText.current={id:crypto.randomUUID(),text:draft};void control({action:'text',id:pendingText.current!.id,text:draft}).then(()=>{pendingText.current=null;setDraft('');return latest.current.persist({...latest.current.run,draft:''});}).catch(fail).finally(()=>setSending(false));}}>Send <ArrowRight/></button></div>
    </footer>
  </div>,document.body);
}
