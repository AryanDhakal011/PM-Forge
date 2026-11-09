/** Sentence-boundary buffering; decimals and common abbreviations stay intact. */
export class SentenceBuffer {
  private buffer='';
  private first=true;
  push(token:string,final=false):string[] {
    this.buffer+=token;
    const chunks:string[]=[];
    while(this.buffer.trim()) {
      let end=0;
      for(const match of this.buffer.matchAll(/[.!?](?=\s|$)/g)) {
        const at=match.index!+1,prefix=this.buffer.slice(0,at);
        if(!final&&at===this.buffer.length)continue;
        if(/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc)|e\.g|i\.e|U\.S|U\.K|\b[A-Z])\.$/i.test(prefix))continue;
        if(!final&&this.first&&prefix.trim().split(/\s+/).length<4)continue;
        end=at;break;
      }
      if(!end&&this.buffer.length>180){const space=this.buffer.lastIndexOf(' ',180);if(space>0)end=space;}
      if(!end){if(!final)break;end=this.buffer.length;}
      const chunk=this.buffer.slice(0,end).trim();this.buffer=this.buffer.slice(end).trimStart();
      if(chunk){this.first=false;chunks.push(chunk);}
    }
    return chunks;
  }
}
export function percentile(values:number[],q:number) {
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(q*sorted.length)-1))];
}
