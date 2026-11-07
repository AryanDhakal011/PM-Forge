"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useEffect,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {cachedJson} from '../../../platform/services/store';
import {mayEnter,type Flags} from '../../../platform/services';
import type {Manifest} from '../../../platform/core';
const Experience=dynamic(()=>import('../../../platform/ui/Experience'),{ssr:false,loading:()=> <main id="main" style={{padding:'15vh 8vw',minHeight:'100vh',background:'#101b22',color:'#f4f2e7'}}>Preparing the project stage…</main>});

type Catalog={manifests:Manifest[];flags:Flags;lint:Record<string,boolean>};
export default function PlatformGateway({children}:{children:ReactNode}){
 const pathname=usePathname(),id=pathname.split('/')[3],deep=pathname.match(/\/(debrief|branch)\/([^/]+)$/),[catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState(''),[offline,setOffline]=useState(false),[legacy,setLegacy]=useState(false);
 const legacyRun=/\/deadlock\/(play|debrief)\/(?!pmf-)[^/]+$/.test(pathname);
 useEffect(()=>{if(legacyRun)return;void import('../../../platform/ui/Experience');if(!['invisible-wall','feature-factory','silent-churn','pivot-point','legacy-fracture','shadow-roadmap','public-fracture'].includes(id))void cachedJson('definition-'+id,'/api/project-platform/'+id).catch(()=>{})},[id,legacyRun]);
 useEffect(()=>{setLegacy(new URLSearchParams(location.search).get('legacy')==='1')},[pathname]);
 useEffect(()=>{let cancelled=false;const load=()=>void cachedJson<Catalog>('catalog','/api/project-platform').then(r=>{if(!cancelled){setCatalog(r.data);setError('');setOffline(r.offline)}}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Release information could not load.')});load();const interval=setInterval(load,10000);window.addEventListener('focus',load);return()=>{cancelled=true;clearInterval(interval);window.removeEventListener('focus',load)}},[id]);

 const manifest=catalog?.manifests.find(m=>m.id===id),flag=catalog?.flags.levels[id],preview=!!flag?.preview;
 if(catalog&&manifest&&flag?.enabled&&(legacy||legacyRun))return children;
 if(!catalog&&!error)return <main id="main" style={{padding:'15vh 8vw',minHeight:'100vh'}}>Checking the project entrance…</main>;
 if(error||!manifest||!flag?.enabled||!preview&&!mayEnter(manifest,catalog!.lint,catalog!.flags))return <main id="main" style={{padding:'15vh 8vw',minHeight:'100vh',background:'#101b22',color:'#f4f2e7'}}><h1>{!flag?.enabled?'Temporarily unavailable':'Preparing this project'}</h1><p>{error||'This project is awaiting its release gates. Your existing saves remain on this device.'}</p><Link href="/app/projects">Back to Projects</Link></main>;
 return (manifest as Manifest&{runtime?:string}).runtime!=='legacy-preserved'?<Experience key={id+'-'+(deep?.[2]||'entrance')} levelId={id} deepLink={deep?.[2]} readOnly={deep?.[1]==='debrief'} connectionOffline={offline}/>:children;
}
