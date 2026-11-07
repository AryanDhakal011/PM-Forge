import {interviewStages,interviewStageOf} from '@/lib/product/interview-ux';
import type {RunStage} from '@/lib/product/types';
import s from './LiveInterview.module.css';
export default function InterviewStageRail({stage}:{stage:RunStage}){const current=interviewStageOf(stage);return <ol className={s.phaseBar} aria-label="Interview stages">{interviewStages.map((label,i)=><li key={label} aria-current={current===i?'step':undefined} data-done={i<current}><span>{i<current?'✓':String(i+1).padStart(2,'0')}</span>{label}{i===0&&current===0&&<small>Not started</small>}</li>)}</ol>}
