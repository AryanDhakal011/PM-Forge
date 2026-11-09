import type {MicAdapter} from '@/lib/hot-seat/microphone-controller';
let owner:DeviceMicAdapter|undefined;
export class DeviceMicAdapter implements MicAdapter {
  private stream?:MediaStream;private context?:AudioContext;private node?:AudioWorkletNode;
  private chunks:Float32Array[]=[];private samples=0;private closing?:()=>void;
  private epoch=0;
  private detach?:()=>void;
  async acquire(level:(n:number)=>void,lost:()=>void){
    const epoch=++this.epoch;
    if(owner&&owner!==this)await owner.close();owner=this;
    if(!window.isSecureContext)throw new DOMException('Secure origin required','SecurityError');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
    if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());return;}
    this.stream=stream;
    try {
      const context=new AudioContext();this.context=context;await context.resume();
      await context.audioWorklet.addModule('/hot-seat/microphone-worklet-v1.js');
      if(epoch!==this.epoch){await this.close();return;}
      const node=new AudioWorkletNode(context,'hot-seat-capture-v1');this.node=node;
      const silent=context.createGain();silent.gain.value=0;
      context.createMediaStreamSource(stream).connect(node).connect(silent).connect(context.destination);
      node.port.onmessage=({data})=>{
        if(data.samples&&this.samples<context.sampleRate*61){this.chunks.push(data.samples);this.samples+=data.samples.length;}
        if(data.level!==undefined)level(data.level);
        if(data.finished){this.closing?.();this.closing=undefined;}
      };
      for(const track of stream.getTracks()){track.onended=lost;track.onmute=()=>level(0);}
      context.onstatechange=()=>{if((context.state as string)==='interrupted')lost();};
      const changed=async()=>{try{const id=stream.getAudioTracks()[0]?.getSettings().deviceId;if(id&&!(await navigator.mediaDevices.enumerateDevices()).some(d=>d.kind==='audioinput'&&d.deviceId===id))lost();}catch{/* Track ended remains the fallback on browsers that restrict enumeration. */}};
      navigator.mediaDevices.addEventListener('devicechange',changed);
      let permission:PermissionStatus|undefined;
      const revoked=()=>{if(permission?.state==='denied')lost();};
      this.detach=()=>{navigator.mediaDevices.removeEventListener('devicechange',changed);permission?.removeEventListener('change',revoked);};
      void navigator.permissions?.query({name:'microphone' as PermissionName}).then(p=>{if(epoch!==this.epoch)return;permission=p;p.addEventListener('change',revoked);}).catch(()=>{});
    }catch(error){await this.close();throw error;}
  }
  open(){this.chunks=[];this.samples=0;this.node?.port.postMessage({open:true});}
  async finish(){
    if(this.node)await new Promise<void>(resolve=>{const timeout=setTimeout(resolve,150);this.closing=()=>{clearTimeout(timeout);resolve();};this.node!.port.postMessage({open:false});});
    const samples=new Float32Array(this.samples);let index=0;for(const chunk of this.chunks){samples.set(chunk,index);index+=chunk.length;}
    this.chunks=[];this.samples=0;return {samples,rate:this.context?.sampleRate||48000};
  }
  enabled(value:boolean){this.stream?.getTracks().forEach(t=>{t.enabled=value;});}
  async close(){++this.epoch;this.detach?.();this.detach=undefined;this.closing?.();this.closing=undefined;for(const track of this.stream?.getTracks()||[]){track.onended=null;track.onmute=null;track.stop();}this.stream=undefined;this.node?.disconnect();this.node=undefined;const context=this.context;this.context=undefined;if(context){context.onstatechange=null;await context.close().catch(()=>{});}if(owner===this)owner=undefined;}
}
