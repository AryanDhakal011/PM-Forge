"use client";
import Link from "next/link";
import s from "@/components/trojan-horse/TrojanHorseSceneRunner.module.css";
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <main className={s.root}><div className={s.loading}><h1>This scene did not load.</h1><p>Your last saved decisions stay on this device.</p><button className={s.primary} onClick={retry}>Retry scene</button><Link className={s.secondary} href="/app/projects">Exit to Projects</Link></div></main>;
}
