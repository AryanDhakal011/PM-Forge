/** Bound public containers and remove metadata. This is not a malware scan or pixel re-encode. */
export function cleanPublicArtifact(input:Uint8Array):{bytes:Uint8Array;mime:string}{
  if(!input.length||input.length>1048576)throw Error('Artifact exceeds 1 MB.');
  const view=new DataView(input.buffer,input.byteOffset,input.byteLength),text=(a:number,b:number)=>new TextDecoder().decode(input.subarray(a,b));
  const join=(parts:Uint8Array[])=>{const bytes=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;};
  if(input.length>=33&&[137,80,78,71,13,10,26,10].every((n,i)=>input[i]===n)){
    const width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width>4096||height>4096||width*height>4194304)throw Error('Image exceeds four megapixels.');
    const parts=[input.subarray(0,8)];let offset=8,data=false,end=false;
    while(offset+12<=input.length){
      const length=view.getUint32(offset),type=text(offset+4,offset+8),next=offset+12+length;if(next>input.length)throw Error('Truncated PNG.');
      if(offset===8&&(type!=='IHDR'||length!==13))throw Error('Invalid PNG header.');
      let crc=0xffffffff;for(let i=offset+4;i<offset+8+length;i++){crc^=input[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}
      if((~crc>>>0)!==view.getUint32(offset+8+length))throw Error('Corrupt PNG checksum.');
      if(['IHDR','PLTE','IDAT','tRNS','IEND'].includes(type))parts.push(input.subarray(offset,next));
      else if(!(input[offset+4]&32))throw Error('Unsupported PNG structure.');
      if(type==='IDAT')data=true;if(type==='IEND'){if(length||next!==input.length)throw Error('Invalid PNG end.');end=true;break;}offset=next;
    }
    if(!data||!end)throw Error('Incomplete PNG.');return {bytes:join(parts),mime:'image/png'};
  }
  if(input.length>=44&&text(0,4)==='RIFF'&&text(8,12)==='WAVE'){
    if(view.getUint32(4,true)!==input.length-8)throw Error('Invalid WAV length.');
    const parts:Uint8Array[]=[input.slice(0,12)];let offset=12,format=false,data=false,alignment=0;
    while(offset+8<=input.length){const size=view.getUint32(offset+4,true),type=text(offset,offset+4),next=offset+8+size+(size%2);if(next>input.length)throw Error('Truncated WAV.');
      if(type==='fmt '){if(format||size<16||size>128)throw Error('Invalid WAV format.');const encoding=view.getUint16(offset+8,true),channels=view.getUint16(offset+10,true),rate=view.getUint32(offset+12,true),bits=view.getUint16(offset+22,true);alignment=view.getUint16(offset+20,true);if(![1,3].includes(encoding)||![1,2].includes(channels)||rate<8000||rate>96000||![16,32].includes(bits)||encoding===3&&bits!==32||alignment!==channels*bits/8)throw Error('Unsupported WAV audio.');format=true;parts.push(input.subarray(offset,next));}
      if(type==='data'){if(data||!format||size%alignment)throw Error('Invalid WAV samples.');data=true;parts.push(input.subarray(offset,next));}offset=next;
    }
    if(!format||!data||offset!==input.length)throw Error('Incomplete WAV.');const bytes=join(parts);new DataView(bytes.buffer).setUint32(4,bytes.length-8,true);return {bytes,mime:'audio/wav'};
  }
  throw Error('Use a flattened PNG or an approved WAV snippet.');
}
