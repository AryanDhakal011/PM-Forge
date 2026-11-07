'use client';
import {useState} from 'react';
import Link from 'next/link';
import {getQuestion} from '@/lib/product/content';
import {interviewStageOf,interviewStages} from '@/lib/product/interview-ux';
import type {Run} from '@/lib/product/types';
import s from './LiveInterview.module.css';
export default function ResumeInterview({runs}:{runs:Run[]}){const [dismissed,setDismissed]=useState(false);const run=runs.filter(r=>r.live&&!['complete','feedback','replay','reflection','expert'].includes(r.stage)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];if(!run||dismissed)return null;return <aside className={s.resume} aria-label="Interview in progress"><h2>Interview in progress</h2><p>{getQuestion(run.questionId)?.title}</p><p>{interviewStages[interviewStageOf(run.stage)]} · {run.live!.turns.filter(t=>t.role==='candidate').length} saved thoughts{run.live!.pending?' · your interviewer is waiting for a response':''}</p><Link href={`/app/run/${run.id}`}>Return to the exact saved point →</Link><button style={{marginLeft:18,minHeight:44}} onClick={()=>setDismissed(true)}>Dismiss for now</button></aside>}
