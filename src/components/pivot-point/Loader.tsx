"use client";
import dynamic from 'next/dynamic';
const Experience=dynamic(()=>import('./Experience'),{ssr:false,loading:()=> <div role="status" style={{padding:'15vh 8vw',background:'#f7faf7',color:'#0b2a33',minHeight:'100vh'}}>Opening Lumen Health…</div>});
export default Experience;
