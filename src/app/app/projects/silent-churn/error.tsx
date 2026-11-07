"use client";
import Link from 'next/link';
import s from '@/components/silent-churn/Churn.module.css';
export default function Error({retry}:{error:unknown;retry:()=>void}){return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>The desk needs a moment.</h1><p>Your last saved decisions remain on this device.</p><button className={s.primary} onClick={retry}>Retry the desk</button><Link href="/app/projects">Back to Projects</Link></div></main>;}
