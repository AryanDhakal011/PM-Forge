import 'server-only';
import {availability,type AIConfig} from '../interview-ai/config';
export function seatSpeechEnabled(c:AIConfig){return !availability(c)&&c.mode==='free-pilot'&&c.monthlyBudget===0&&c.freeVerified&&process.env.PMFORGE_HOTSEAT_GEMINI_TTS_ENABLED==='true'&&process.env.PMFORGE_HOTSEAT_TTS_FREE_VERIFIED==='true'&&Number(process.env.PMFORGE_HOTSEAT_TTS_RPM)>0&&Number(process.env.PMFORGE_HOTSEAT_TTS_RPD)>0}
