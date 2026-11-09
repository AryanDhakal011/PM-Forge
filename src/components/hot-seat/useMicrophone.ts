"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {MicController,resample16k,type MicSnapshot} from '@/lib/hot-seat/microphone-controller';
import {DeviceMicAdapter} from './DeviceMicAdapter';
import {showError} from '@/lib/ui-feedback';
import {usableDictation} from '@/lib/hot-seat/dictation-quality';
export function useMicrophone(onText:(text:string,seconds:number,context:string)=>void,onInterrupt:()=>void,context='lobby') {
  const [state,setState]=useState<MicSnapshot>({phase:'off',live:false,level:0,message:''}),[notice,setNotice]=useState(''),[preparing,setPreparing]=useState(false),[processing,setProcessing]=useState(false),[supported,setSupported]=useState(false);
  const current=useRef({onText,onInterrupt,context});current.current={onText,onInterrupt,context};
  const controller=useRef<MicController|null>(null),worker=useRef<Worker|null>(null),ready=useRef(false),request=useRef(0),origin=useRef(context),checking=useRef(false);
  const pending=useRef(new Map<string,{resolve:(data:any)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>());
  const checkTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const gesture=useRef<{source:string;at:number}|null>(null);
  const preparingRef=useRef(false),processingRef=useRef(false);
  const ask=useCallback((type:string,samples?:Float32Array)=>new Promise<any>((resolve,reject)=>{
    if(!worker.current){
      const next=new Worker('/hot-seat/dictation-worker-v1.mjs',{type:'module'});worker.current=next;
      next.onmessage=({data})=>{if(data.progress!==undefined){setNotice(`Preparing on-device dictation · ${Math.round(data.progress)}% of ${data.file}`);return;}const job=pending.current.get(data.id);if(!job)return;clearTimeout(job.timer);pending.current.delete(data.id);data.error?job.reject(Error(data.error)):job.resolve(data);};
      next.onerror=()=>{ready.current=false;for(const job of pending.current.values()){clearTimeout(job.timer);job.reject(Error('On-device dictation could not start. Retry or type.'));}pending.current.clear();next.terminate();worker.current=null;};
    }
    const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.current.delete(id);reject(Error('On-device dictation is taking too long. Keep typing, or retry on a faster device.'));},180000);
    pending.current.set(id,{resolve,reject,timer});worker.current.postMessage({id,type,samples},samples?[samples.buffer]:[]);
  }),[]);
  useEffect(()=>{
    setSupported(!!navigator.mediaDevices?.getUserMedia&&typeof AudioWorkletNode!=='undefined');
    const mic=new MicController(new DeviceMicAdapter(),async(samples,rate)=>{
      const seconds=samples.length/rate,energy=samples.reduce((sum,n)=>sum+n*n,0)/Math.max(1,samples.length);
      if(checking.current){setNotice(energy>.000001?'Microphone input detected. No recording was retained.':'No clear input detected. Check the input device and retry.');return;}
      if(seconds<.25||energy<.000001){setNotice('No clear speech captured. Try again or keep typing.');return;}
      const capturedFor=origin.current;processingRef.current=true;setProcessing(true);
      try{const data=await ask('transcribe',resample16k(samples,rate));if(data.text?.trim()){if(!usableDictation(data.text,seconds))throw Error('The recognition repeated or lost track of the audio. No words were added. Try a shorter answer in a quiet room, or type.');current.current.onText(data.text.trim(),seconds,capturedFor);setNotice(`Words added to your draft. On-device recognition took ${(data.latencyMs/1000).toFixed(1)} seconds; review before sending.`);}else setNotice('No clear words recognized. Try a short answer in English, or keep typing.');}
      catch(error){setNotice((error as Error).message);showError((error as Error).message);}finally{processingRef.current=false;setProcessing(false);}
    });
    controller.current=mic;let lastError='';const unsubscribe=mic.subscribe(next=>{setState(next);if(['error','lost'].includes(next.phase)&&next.message&&next.message!==lastError){lastError=next.message;showError(next.message);}if(next.phase==='listening')lastError='';});
    const cancelPreparation=()=>{gesture.current=null;++request.current;preparingRef.current=false;setPreparing(false);};
    const hide=()=>{if(document.hidden){cancelPreparation();void mic.stop('paused');setNotice('Paused because you left the tab. Start the microphone when you return.');}};
    const blur=()=>{if(gesture.current){cancelPreparation();void mic.stop('paused');}};
    const pagehide=()=>{void mic.stop('off');};
    document.addEventListener('visibilitychange',hide);window.addEventListener('blur',blur);window.addEventListener('pagehide',pagehide);
    return()=>{unsubscribe();document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',pagehide);clearTimeout(checkTimer.current);void mic.stop().finally(()=>{worker.current?.terminate();worker.current=null;ready.current=false;for(const job of pending.current.values()){clearTimeout(job.timer);job.reject(Error('Dictation stopped.'));}pending.current.clear();});controller.current=null;};
  },[ask]);
  const stop=useCallback(()=>{++request.current;gesture.current=null;preparingRef.current=false;clearTimeout(checkTimer.current);setPreparing(false);return controller.current?.stop();},[]);
  const start=useCallback(async(check=false,prepareOnly=false)=>{
    if(preparingRef.current||processingRef.current||controller.current?.snapshot.phase==='listening')return;
    const attempt=++request.current;origin.current=current.current.context;checking.current=check;if(!prepareOnly)current.current.onInterrupt();setNotice('');
    if(!check&&!ready.current){preparingRef.current=true;setPreparing(true);try{await ask('prepare');ready.current=true;}catch(error){if(attempt===request.current){setNotice((error as Error).message);showError((error as Error).message);}return;}finally{if(attempt===request.current){preparingRef.current=false;setPreparing(false);}}}
    if(attempt!==request.current)return;setNotice('');
    if(prepareOnly){setNotice('On-device dictation is ready. Your microphone is off.');return;}
    await controller.current?.start();
    if(check)checkTimer.current=setTimeout(()=>void controller.current?.stop(),3000);
  },[ask]);
  const finish=useCallback(()=>controller.current?.finish(),[]);
  const prepare=useCallback(()=>start(false,true),[start]);
  const clearNotice=useCallback(()=>setNotice(''),[]);
  const press=useCallback((source:string)=>{if(gesture.current)return;if(controller.current?.snapshot.phase==='listening'){void finish();return;}gesture.current={source,at:performance.now()};void start();},[start,finish]);
  const release=useCallback((source:string,cancel=false)=>{const held=gesture.current;if(!held||held.source!==source)return;gesture.current=null;if(cancel){void stop();return;}if(performance.now()-held.at>=350){if(preparingRef.current||controller.current?.snapshot.phase==='arming')void stop();else setTimeout(()=>void finish(),150);}},[stop,finish]);
  return {active:state.phase==='listening',starting:preparing||state.phase==='arming',processing,live:state.live,phase:state.phase,modelReady:ready.current,preparing,level:state.level,interim:'',notice:notice||(['listening','processing','arming','error','lost'].includes(state.phase)?state.message:''),supported,start,stop,finish,press,release,clearNotice,prepare};
}
