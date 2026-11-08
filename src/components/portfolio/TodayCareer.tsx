'use client';
import Link from 'next/link';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from '@/lib/product/db';
import {strength} from '@/lib/portfolio/model';
import s from './Portfolio.module.css';
export function TodayCareer({owner}:{owner:string}){const value=useLiveQuery(async()=>{const [profile,cases,resumes,jobs]=await Promise.all([db.careerProfiles.get(owner),db.caseStudies.where('ownerId').equals(owner).toArray(),db.resumeVersions.where('ownerId').equals(owner).toArray(),db.careerJobs.where('ownerId').equals(owner).toArray()]);return {proof:profile?strength(profile,cases,resumes).total:0,latest:cases.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0],due:jobs.filter(j=>j.status!=='closed'&&j.dueDate&&j.dueDate<=new Date().toLocaleDateString('en-CA'))}},[owner]);if(!value)return null;return <div><p><strong>Proof {value.proof}/100</strong> · {value.latest?.title||'Start with one honest decision.'}</p><Link href="/app/portfolio" className={s.inlineButton}>Open Career Studio →</Link>{value.due.map(job=><p key={job.id}><Link href="/app/portfolio?tab=applications">{job.company}: {job.nextAction||'Review next step'} · due {job.dueDate}</Link></p>)}</div>}
