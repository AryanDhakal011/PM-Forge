'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,NotebookPen} from 'lucide-react';
import {getQuestion} from '@/lib/product/content';
import type {Capabilities} from '@/lib/interview-ai/client';
import s from './LiveInterview.module.css';
export default function AIPracticeEntry(){const [cap,setCap]=useState<Capabilities|null>(null);useEffect(()=>{let active=true;void fetch('/api/interview/ai',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(active)setCap(c)}).catch(()=>{});return()=>{active=false}},[]);const first=getQuestion('RCA-E-1')!;return <section className={s.practiceEntry} aria-label="Enter the interview room"><div><span className={s.kicker}>FREE PRACTICE · A DECISION YOU CAN DEFEND</span><h2><NotebookPen size={23}/>Enter the decision room.</h2><p>{cap?.available?cap.mock?'The AI test room is available. Test replies are labeled; no Gemini inference is used.':cap.mode==='free-pilot'?'Choose an AI interviewer during preparation. The free pilot uses fictional case positions, with limited capacity.':'Choose an AI interviewer during preparation. Committed answers use the approved provider configuration.':'Guided interviews are ready. Provider-backed follow-ups appear during preparation when AI capacity is enabled.'}</p></div><Link href={'/app/practice/'+first.slug}>Choose your first brief <ArrowRight size={17}/></Link></section>}
