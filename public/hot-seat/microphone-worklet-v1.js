class HotSeatCapture extends AudioWorkletProcessor {
  constructor(){super();this.live=false;this.block=[];this.history=new Float32Array(Math.floor(sampleRate*.5));this.offset=0;this.seen=0;
    this.port.onmessage=({data})=>{if(data.open){const n=Math.min(this.seen,this.history.length),pre=new Float32Array(n);for(let i=0;i<n;i++)pre[i]=this.history[(this.offset-n+i+this.history.length)%this.history.length];this.live=true;this.port.postMessage({samples:pre},[pre.buffer]);}else{this.flush();this.live=false;this.port.postMessage({finished:true});}};
  }
  flush(){if(this.block.length){const samples=Float32Array.from(this.block);this.block=[];this.port.postMessage({samples},[samples.buffer]);}}
  process(inputs,outputs){for(const output of outputs||[])for(const channel of output)channel.fill(0);const samples=inputs[0]?.[0];if(!samples)return true;let energy=0;
    for(const value of samples){this.history[this.offset]=value;this.offset=(this.offset+1)%this.history.length;this.seen++;energy+=value*value;if(this.live)this.block.push(value);}
    if(this.block.length>=4096)this.flush();
    if(this.seen%1536<samples.length)this.port.postMessage({level:Math.min(100,Math.sqrt(energy/samples.length)*600)});
    return true;
  }
}
registerProcessor('hot-seat-capture-v1',HotSeatCapture);
