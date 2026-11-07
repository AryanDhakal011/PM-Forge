"use client";
import Link from 'next/link';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from '@/lib/product/db';
import {useWorkspace} from '@/components/product/WorkspaceProvider';
import u from '@/components/product/Product.module.css';
export default function PortfolioProgress(){const {profile}=useWorkspace();const counts=useLiveQuery(async()=>{if(!profile)return [0,0,0];const cases=await db.caseStudies.where('ownerId').equals(profile.id).toArray();return [cases.length,cases.filter(c=>c.reviewed).length,await db.resumeVersions.where('ownerId').equals(profile.id).count()]},[profile?.id])||[0,0,0];return <section className={u.panel} style={{margin:'24px 0'}}><div className={u.panelHead}><h2>Evidence you can take with you</h2><Link href="/app/portfolio" className={u.textButton}>Open Portfolio →</Link></div><p>{counts[0]} case studies · {counts[1]} reviewed · {counts[2]} resume versions</p><p className={u.finePrint}>Portfolio readiness measures completeness. It does not change interview rubric scores or establish production impact.</p></section>}
