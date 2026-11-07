import {connection} from 'next/server';
import Link from 'next/link';
import Experience from './Experience';
import s from './Legacy.module.css';
export default async function Page(){await connection();if(process.env.PMFORGE_LEGACY_FRACTURE_ENABLED==='false')return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>Granger’s dispatch floor is temporarily closed.</h1><p>Your saved migration stays on this device.</p><Link href="/app/projects">Back to Projects</Link></div></main>;return <Experience/>}
