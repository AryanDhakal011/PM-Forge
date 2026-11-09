/** Server configuration. Never import an instantiated config into client code. */
export function realtimeConfig(env: Record<string,string|undefined> = process.env) {
  const number = (key: string, fallback: number) => {
    const value = Number(env[key] ?? fallback);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };
  return {
    enabled: env.PMFORGE_REALTIME_ENABLED === 'true',
    killed: env.PMFORGE_REALTIME_KILL_SWITCH === 'true',
    terms: env.PMFORGE_REALTIME_TERMS_APPROVED === 'true',
    verified: env.PMFORGE_REALTIME_PROVIDERS_VERIFIED === 'true',
    url: env.LIVEKIT_URL || '', key: env.LIVEKIT_API_KEY || '', secret: env.LIVEKIT_API_SECRET || '',
    workerSecret: env.PMFORGE_REALTIME_WORKER_SECRET || '',
    agentName: 'pmforge-hot-seat-v2',
    sttModel: env.PMFORGE_REALTIME_STT_MODEL || 'flux-general-en',
    llmModel: env.PMFORGE_REALTIME_LLM_MODEL || 'gpt-oss-120b',
    ttsModel: env.PMFORGE_REALTIME_TTS_MODEL || 'inworld-tts-2',
    noraVoice: env.PMFORGE_REALTIME_NORA_VOICE || '', kaiVoice: env.PMFORGE_REALTIME_KAI_VOICE || '',
    region: env.PMFORGE_REALTIME_WORKER_REGION || '',
    budget: number('PMFORGE_REALTIME_MONTHLY_BUDGET_USD', 0),
    reservation: number('PMFORGE_REALTIME_SESSION_RESERVE_USD', 0),
    concurrent: Math.min(100, number('PMFORGE_REALTIME_MAX_CONCURRENT', 1)),
    daily: Math.min(100, number('PMFORGE_REALTIME_DAILY_SESSIONS', 2)),
    maxTurns: Math.min(20, number('PMFORGE_REALTIME_MAX_TURNS', 12)),
    maxSeconds: Math.min(1800, number('PMFORGE_REALTIME_MAX_SECONDS', 600)),
    providers: {deepgram: !!env.DEEPGRAM_API_KEY, inworld: !!env.INWORLD_API_KEY, cerebras: !!env.CEREBRAS_API_KEY},
  };
}
export type RealtimeConfig = ReturnType<typeof realtimeConfig>;
export const REALTIME_CONSENT = 'hot-seat-realtime-2026-11-09';
export const REALTIME_PROMPT_VERSION = 'hot-seat-realtime-1';
export const realtimeStack=(c:RealtimeConfig,persona:string)=>({stt:c.sttModel,llm:c.llmModel,tts:c.ttsModel,voice:persona==='kai'?c.kaiVoice:c.noraVoice,region:c.region});
export function realtimeBlocker(c: RealtimeConfig) {
  if(!c.enabled) return 'Realtime voice is not enabled. Local guided practice remains available.';
  if(c.killed) return 'Realtime voice is paused by the operator.';
  if(!c.terms || !c.verified) return 'Provider access and data terms need operator review.';
  if(!c.budget || !c.reservation || c.reservation > c.budget) return 'Realtime voice has no approved operating budget.';
  if(!c.concurrent || !c.daily || !c.maxTurns || !c.maxSeconds) return 'Realtime session limits need configuration.';
  if(c.llmModel!=='gpt-oss-120b'||!['flux-general-en','flux-general-multi'].includes(c.sttModel)||c.ttsModel!=='inworld-tts-2')return 'This provider/model combination needs a verified adapter.';
  if(!c.url.startsWith('wss://') || !c.key || !c.secret || c.workerSecret.length < 32) return 'The secure voice room is not configured.';
  if(!c.noraVoice || !c.kaiVoice || !c.region) return 'The voice worker and providers need configuration.';
  return null;
}
