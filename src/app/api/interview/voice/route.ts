import {clientKey} from '@/lib/product/server';
import {vocabularyFor} from '@/lib/product/pm-vocabulary';
import {getQuestion} from '@/lib/product/content';
export const runtime='nodejs';
const limits=new Map<string,{at:number;count:number}>();
function allowed(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return false;const now=Date.now();for(const [key,v] of limits)if(now-v.at>60000)limits.delete(key);const key=clientKey(request)?.split(',')[0]||'local',state=limits.get(key)||{at:now,count:0},global=limits.get('*')||{at:now,count:0};state.count++;global.count++;limits.set(key,state);limits.set('*',global);return state.count<=60&&global.count<=180}
const paidSpeechApproved=()=>process.env.PMFORGE_AI_MODE==='production'&&Number(process.env.PMFORGE_AI_MONTHLY_BUDGET_USD)>0&&Number(process.env.PMFORGE_VOICE_MONTHLY_BUDGET_USD)>0&&process.env.PMFORGE_PAID_SPEECH_APPROVED==='true';
const configured=()=>({stt:paidSpeechApproved()&&process.env.PMFORGE_VOICE_ENABLED==='true'&&!!process.env.DEEPGRAM_API_KEY,tts:paidSpeechApproved()&&process.env.PMFORGE_VOICE_ENABLED==='true'&&!!process.env.ELEVENLABS_API_KEY&&!!process.env.ELEVENLABS_VOICE_ID});
async function limitedBody(request:Request,max:number){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]= [];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw Error('Body limit')}chunks.push(value)}}finally{reader.releaseLock()}const body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}return body}
export async function GET(){return Response.json(configured(),{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:Request){
 if(!allowed(request))return Response.json({error:'Voice request unavailable. Keep typing or retry shortly.'},{status:429});
 if(request.headers.get('x-pmforge-voice-consent')!=='1')return Response.json({error:'Voice consent is required.'},{status:403});
 const kind=new URL(request.url).searchParams.get('kind');
 try{
  if(kind==='stt'){
   if(!configured().stt)return Response.json({error:'Cloud transcription is not configured. Use browser dictation or Fast-Typing Mode.'},{status:503});
   if(Number(request.headers.get('content-length')||0)>4_000_000)return Response.json({error:'Audio chunk too large.'},{status:413});
   const body=await limitedBody(request,4_000_000),form=await new Response(body,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(),audio=form.get('audio'),q=getQuestion(String(form.get('question')||''));
   if(!(audio instanceof Blob)||audio.size>3_000_000||!audio.size||!/^audio\/|^video\/webm/.test(audio.type)||!q)return Response.json({error:'Use a short audio chunk and a valid interview scenario.'},{status:400});
   const url=new URL('https://api.deepgram.com/v1/listen');url.searchParams.set('model','nova-3');url.searchParams.set('language','en');url.searchParams.set('punctuate','true');url.searchParams.set('filler_words','true');url.searchParams.set('smart_format','false');for(const term of vocabularyFor(q.category,q.title))url.searchParams.append('keyterm',term);
   const upstream=await fetch(url,{method:'POST',headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`,'Content-Type':audio.type||'audio/webm'},body:audio,signal:AbortSignal.timeout(20000)});
   if(!upstream.ok)throw Error('Transcription provider unavailable');
   const data=await upstream.json(),alternative=data.results?.channels?.[0]?.alternatives?.[0];
   return Response.json({raw:(alternative?.words||[]).map((w:{word:string})=>w.word).join(' ')||alternative?.transcript||'',display:alternative?.transcript||(alternative?.words||[]).map((w:{word:string;punctuated_word?:string})=>w.punctuated_word||w.word).join(' '),duration:data.metadata?.duration||0,provider:'deepgram',vocabularyCount:vocabularyFor(q.category,q.title).length},{headers:{'Cache-Control':'no-store'}});
  }
  if(kind==='tts'){
   if(!configured().tts)return Response.json({error:'Natural voice is not configured. Browser voice and captions remain available.'},{status:503});
   const body=new TextDecoder().decode(await limitedBody(request,4000));const {text}=JSON.parse(body);if(typeof text!=='string'||!text.trim()||text.length>1200)return Response.json({error:'Invalid spoken message.'},{status:400});
   const upstream=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID!)}`,{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:'eleven_flash_v2_5',voice_settings:{stability:.55,similarity_boost:.7}}),signal:AbortSignal.timeout(15000)});
   if(!upstream.ok)throw Error('Speech provider unavailable');return new Response(upstream.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
  }
  return Response.json({error:'Choose transcription or speech.'},{status:400});
 }catch(error){if(error instanceof Error&&error.message==='Body limit')return Response.json({error:'Audio or text request too large.'},{status:413});return Response.json({error:'Voice could not finish. Your transcript is intact; use typing or retry.'},{status:502})}
}
