"use client";
import Link from "next/link";
import s from "@/components/invisible-wall/Wall.module.css";
export default function ErrorPage({retry}:{error:unknown;retry:()=>void}){return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>The terminal connection dropped.</h1><p>Your last saved decisions stay on this device.</p><button className={s.primary} onClick={retry}>Retry scene</button><Link className={s.secondary} href="/app/projects">Exit to Projects</Link></div></main>;}
