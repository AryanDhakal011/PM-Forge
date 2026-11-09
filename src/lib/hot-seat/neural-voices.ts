import {persona,type PersonaId} from "./content";
export const NEURAL_VOICE_VERSION="kokoro-female-v2";
export function neuralCacheIdentity(id:PersonaId,text:string){return NEURAL_VOICE_VERSION+":"+persona(id).voice+":kokoro-js-1.2.1:q8:speed-0.98:24000:"+text}
