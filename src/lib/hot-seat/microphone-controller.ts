export type MicPhase='off'|'arming'|'ready'|'listening'|'processing'|'muted'|'paused'|'lost'|'error';
export type MicSnapshot={phase:MicPhase;live:boolean;level:number;message:string};
export interface MicAdapter {
  acquire(onLevel:(level:number)=>void,onLost:()=>void):Promise<void>;
  open():void;
  finish():Promise<{samples:Float32Array;rate:number}>;
  enabled(value:boolean):void;
  close():Promise<void>;
}
export function microphoneError(error:unknown):string {
  switch((error as {name?:string})?.name){
    case 'NotAllowedError':return 'Microphone is blocked. You can still type, or enable it in your browser settings.';
    case 'SecurityError':return 'Microphone needs a secure connection. Use the HTTPS site or localhost.';
    case 'NotFoundError':return "We cannot find a microphone. Plug one in, or type your answers.";
    case 'NotReadableError':return 'Another app may be using your microphone. Close it and try again, or type.';
    case 'OverconstrainedError':return 'The selected microphone is unavailable. Choose the default microphone or type.';
    default:return 'Microphone problem. Try typing while you check the input device.';
  }
}
/** One owner for hardware, gate, cancellation and state. Recognition never owns hardware. */
export class MicController {
  snapshot:MicSnapshot={phase:'off',live:false,level:0,message:''};
  private epoch=0;private acquiring=false;private recording=false;
  private pressSource:string|null=null;private pressedAt=0;private cap?:ReturnType<typeof setTimeout>;
  private warning?:ReturnType<typeof setTimeout>;private mutedTimer?:ReturnType<typeof setTimeout>;
  private listeners=new Set<(s:MicSnapshot)=>void>();
  private settling?:Promise<void>;
  constructor(private adapter:MicAdapter,private consume:(audio:Float32Array,rate:number)=>Promise<void>){}
  subscribe(listener:(s:MicSnapshot)=>void){this.listeners.add(listener);listener(this.snapshot);return()=>{this.listeners.delete(listener);};}
  private emit(patch:Partial<MicSnapshot>){this.snapshot={...this.snapshot,...patch};for(const listener of this.listeners)listener(this.snapshot);}
  async start(){
    if(this.recording||this.acquiring||this.snapshot.phase==='processing')return;
    const epoch=++this.epoch;
    if(!this.snapshot.live){
      this.acquiring=true;this.emit({phase:'arming',message:'Allow microphone access if your browser asks.'});
      try{await this.adapter.acquire(level=>{if(this.snapshot.live)this.emit({level});},()=>{void this.stop('lost');this.emit({phase:'lost',message:'Microphone disconnected. Choose another device or switch to typing.'});});}
      catch(error){if(epoch===this.epoch){this.acquiring=false;this.emit({phase:'error',live:false,message:microphoneError(error)});}return;}
      this.acquiring=false;
      if(epoch!==this.epoch){await this.adapter.close();return;}
    }
    clearTimeout(this.mutedTimer);this.adapter.enabled(true);this.adapter.open();this.recording=true;
    this.emit({phase:'listening',live:true,message:'Speak naturally. Finish when you are ready; your words remain a draft.'});
    this.warning=setTimeout(()=>this.emit({message:'Finish this dictation within 15 seconds, then start another if needed.'}),45000);
    this.cap=setTimeout(()=>{void this.finish();},60000);
  }
  finish(close=false,after:MicPhase='off'):Promise<void>{
    if(!this.recording)return this.settling||Promise.resolve();
    this.recording=false;this.pressSource=null;clearTimeout(this.cap);clearTimeout(this.warning);
    this.emit({phase:'processing',message:'Converting your speech into a draft on this device…'});
    const pending=this.complete(close,after);this.settling=pending;
    return pending.finally(()=>{if(this.settling===pending)this.settling=undefined;});
  }
  private async complete(close:boolean,after:MicPhase){
    try{const clip=await this.adapter.finish();if(close){await this.adapter.close();this.emit({phase:after,live:false,level:0});}await this.consume(clip.samples,clip.rate);if(this.snapshot.live&&this.snapshot.phase==='processing')this.emit({phase:'ready',message:'Words added to your draft. Review them before sending.'});}
    catch(error){if(close){await this.adapter.close();this.emit({live:false,level:0});}this.emit({phase:this.snapshot.live?'ready':after,message:error instanceof Error?error.message:'Dictation could not finish. Your typed draft is safe.'});}
  }
  async stop(phase:MicPhase='off'){
    ++this.epoch;this.pressSource=null;clearTimeout(this.cap);clearTimeout(this.warning);clearTimeout(this.mutedTimer);
    if(this.recording){await this.finish(true,phase);return;}
    await this.adapter.close();this.emit({phase,live:false,level:0});await this.settling;
  }
  async mute(){const finished=this.finish();this.adapter.enabled(false);this.emit({phase:'muted',message:'Microphone muted. Typing remains available.'});this.mutedTimer=setTimeout(()=>{void this.stop('muted');},60000);await finished;}
  press(source:string,now:number){if(this.pressSource)return;this.pressSource=source;this.pressedAt=now;void this.start();}
  release(source:string,now:number,cancel=false){if(this.pressSource!==source)return;this.pressSource=null;if(cancel||this.snapshot.phase==='arming'&&now-this.pressedAt>=350){void this.stop('paused');return;}if(now-this.pressedAt>=350)void this.finish();}
  clearListeners(){this.listeners.clear();}
}

export function resample16k(input:Float32Array,rate:number){
  if(rate===16000)return input;
  const out=new Float32Array(Math.floor(input.length*16000/rate)),ratio=rate/16000;
  for(let i=0;i<out.length;i++){const start=Math.floor(i*ratio),end=Math.min(input.length,Math.floor((i+1)*ratio));let sum=0;for(let j=start;j<end;j++)sum+=input[j];out[i]=sum/Math.max(1,end-start);}
  return out;
}
