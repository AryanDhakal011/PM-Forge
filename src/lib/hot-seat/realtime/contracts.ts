import {z} from 'zod';
import {optionsSchema,observationSchema} from '../model';
export const realtimeId = z.string().regex(/^[a-zA-Z0-9_-]{8,150}$/);
export const rtRequest = z.discriminatedUnion('action', [
  z.object({action:z.literal('start'),id:realtimeId,localOwnerId:realtimeId,options:optionsSchema,
    consent:z.object({adult:z.literal(true),providers:z.literal(true),version:z.literal('hot-seat-realtime-2026-11-09')}).strict()}).strict(),
  z.object({action:z.enum(['connect','status','pause','end','delete']),id:realtimeId}).strict(),
]);
export const workerEvent = z.discriminatedUnion('kind', [
  z.object({workerId:realtimeId,kind:z.literal('bootstrap'),id:realtimeId,room:realtimeId}).strict(),
  z.object({workerId:realtimeId,kind:z.literal('heartbeat'),id:realtimeId,room:realtimeId}).strict(),
  z.object({workerId:realtimeId,kind:z.literal('turn'),id:realtimeId,room:realtimeId,eventId:realtimeId,
    role:z.enum(['user','ai']),text:z.string().trim().min(1).max(4000),interrupted:z.boolean().default(false)}).strict(),
  z.object({workerId:realtimeId,kind:z.literal('metrics'),id:realtimeId,room:realtimeId,eventId:realtimeId,
    stage:z.enum(['llm_ttft','llm_usage','tts_ttfb','eot','stt','playback','first_audio']),ms:z.number().min(0).max(300000),
    inputTokens:z.number().int().min(0).max(1000000).default(0),outputTokens:z.number().int().min(0).max(1000000).default(0),characters:z.number().int().min(0).max(1000000).default(0)}).strict(),
  z.object({workerId:realtimeId,kind:z.literal('observations'),id:realtimeId,room:realtimeId,eventId:realtimeId,observations:z.array(observationSchema).max(2)}).strict(),
]);
export const rtControl = z.discriminatedUnion('action',[
  z.object({action:z.literal('done')}).strict(),
  z.object({action:z.literal('interrupt')}).strict(),
  z.object({action:z.literal('text'),id:realtimeId,text:z.string().trim().min(1).max(4000)}).strict(),
]);
export type RealtimeCapability = {available:boolean;reason:string|null;providers:string;consentVersion:string;region:string;maxTurns:number;maxSeconds:number};
