import {connection} from 'next/server';
import Link from 'next/link';
import Loader from './Loader';
export default async function Page(){await connection();if(process.env.PMFORGE_PIVOT_POINT_ENABLED==='false')return <main id="main" style={{padding:'15vh 8vw'}}><h1>Lumen Health is temporarily closed.</h1><p>Your saved year remains on this device.</p><Link href="/app/projects">Back to Projects</Link></main>;return <Loader/>}
