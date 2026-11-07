import {connection} from 'next/server';
import Link from 'next/link';
import Client from './Client';
import s from './Churn.module.css';
export default async function Page(){await connection();if(process.env.PMFORGE_SILENT_CHURN_ENABLED==='false')return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>Meridian’s desk is temporarily closed.</h1><p>Your saved investigation stays on this device.</p><Link href="/app/projects">Back to Projects</Link></div></main>;return <Client/>;}
