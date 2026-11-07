"use client";
import dynamic from 'next/dynamic';
import {useEffect,useState} from 'react';
const Sacred=dynamic(()=>import('../sacred-no/SacredNoExperience'),{ssr:false});
const Ghost=dynamic(()=>import('../ghost-metric/GhostMetricExperience'),{ssr:false});
const Trojan=dynamic(()=>import('../trojan-horse/TrojanHorseSceneRunner'),{ssr:false});
export default function LegacyContent({kind}:{kind:'sacred-no'|'ghost-metric'|'trojan-horse'}){const [legacy,setLegacy]=useState(false);useEffect(()=>setLegacy(new URLSearchParams(location.search).get('legacy')==='1'),[]);if(!legacy)return null;return kind==='sacred-no'?<Sacred/>:kind==='ghost-metric'?<Ghost/>:<Trojan/>}
