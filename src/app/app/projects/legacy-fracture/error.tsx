"use client";
import Link from 'next/link';
import s from '@/components/legacy-fracture/Legacy.module.css';
export default function Error({retry}:{error:unknown;retry:()=>void}){return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>The dispatch floor needs a moment.</h1><p>Your last saved migration remains on this device.</p><button onClick={retry}>Retry</button><Link href="/app/projects">Back to Projects</Link></div></main>}
