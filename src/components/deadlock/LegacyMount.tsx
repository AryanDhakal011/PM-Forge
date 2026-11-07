"use client";
import dynamic from 'next/dynamic';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
const Legacy=dynamic(()=>import('./DeadlockExperience'),{ssr:false});
export default function LegacyMount(){const pathname=usePathname(),[legacy,setLegacy]=useState(false);useEffect(()=>setLegacy(new URLSearchParams(location.search).get('legacy')==='1'||/\/(play|debrief)\/(?!pmf-)[^/]+$/.test(pathname)),[pathname]);return legacy?<Legacy/>:null}
