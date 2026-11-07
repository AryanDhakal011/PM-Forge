"use client";
import Link from 'next/link';
export default function Error({retry}:{error:unknown;retry:()=>void}){return <main id="main" style={{padding:'15vh 8vw'}}><h1>The care desk needs a moment.</h1><p>Your saved year remains on this device.</p><button onClick={retry}>Retry</button><p><Link href="/app/projects">Back to Projects</Link></p></main>}
