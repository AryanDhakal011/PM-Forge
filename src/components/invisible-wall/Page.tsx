import { connection } from "next/server";
import Link from "next/link";
import Client from "./Client";
import s from "./Wall.module.css";
export default async function LevelPage(){await connection();if(process.env.PMFORGE_INVISIBLE_WALL_ENABLED==='false')return <main id="main" tabIndex={-1} className={s.root}><div className={s.loading}><h1>Terminal B12 is temporarily closed.</h1><p>Your saved night is preserved.</p><Link className={s.primary} href="/app/projects">Back to Projects</Link></div></main>;return <Client/>;}
