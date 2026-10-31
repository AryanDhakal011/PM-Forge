"""Offline production only. No models or synthesis code are shipped to browsers.
Install kokoro-onnx==0.6.1 soundfile imageio-ffmpeg in a separate Python environment.
Model sources and casting are documented in docs/DEADLOCK-V2.md.
"""
import sys, os, json, hashlib, subprocess, time, argparse, shutil
from urllib.request import Request, urlopen
from pathlib import Path
from datetime import datetime, timezone
runtime=Path('.data/deadlock-voice-runtime')
if runtime.exists(): sys.path.insert(0,str(runtime.resolve()))
import numpy as np
import soundfile as sf
import onnxruntime as ort
import imageio_ffmpeg
parser=argparse.ArgumentParser();parser.add_argument('--provider',choices=['kokoro','elevenlabs'],default='kokoro');args=parser.parse_args()

root=Path('content/projects/deadlock'); out=Path('public/deadlock/audio') if args.provider=='kokoro' else Path('.data/deadlock-elevenlabs-audio');out.mkdir(parents=True,exist_ok=True)
old=json.loads((root/'lines.json').read_text(encoding='utf-8'))
extra=json.loads((root/'experience-v2.json').read_text(encoding='utf-8'))['lines']
cast={'Mara':('af_heart',0.96),'Dev':('am_puck',1.0),'Ines':('bf_emma',0.96),'Theo':('am_fenrir',0.98),'Nadia':('bf_isabella',1.0),'CONTROL':('af_sarah',1.0),'Northgate':('af_bella',0.98)}
if args.provider=='kokoro':
    from kokoro_onnx import Kokoro
    opts=ort.SessionOptions();opts.intra_op_num_threads=4;opts.inter_op_num_threads=1
    session=ort.InferenceSession('.data/deadlock-model/kokoro-v1.0.onnx',sess_options=opts,providers=['CPUExecutionProvider'])
    model=Kokoro.from_session(session,'.data/deadlock-model/voices-v1.0.bin')
else:
    if not os.getenv('ELEVENLABS_API_KEY'): raise SystemExit('Set ELEVENLABS_API_KEY in the offline production environment. Never use a NEXT_PUBLIC variable.')
    missing=[s for s in cast if not os.getenv('ELEVENLABS_VOICE_'+s.upper())]
    if missing: raise SystemExit('Choose licensed ElevenLabs voice IDs for: '+', '.join(missing)+'. No requests have been sent.')
manifest={'version':'2.0','status':'pre-rendered-neural','model':'Kokoro-82M v1.0 / kokoro-onnx 0.6.1','generatedAt':datetime.now(timezone.utc).isoformat(),'lines':{},'sfx':'Procedural WebAudio; dialogue is pre-rendered MP3.'}
previous=json.loads((root/'audio-manifest.json').read_text(encoding='utf-8'))
checkpoint=Path('.data/deadlock-voice-checkpoint.json')
if checkpoint.exists(): previous['lines'].update(json.loads(checkpoint.read_text(encoding='utf-8')).get('lines',{}))
if args.provider=='elevenlabs': manifest['model']=os.getenv('ELEVENLABS_MODEL','eleven_v3')
start=time.time()
for i,l in enumerate(extra+old):
    text=l['text'].replace('{thing}','The setting')
    voice,speed=cast.get(l['speaker'],cast['Mara'])
    emotion=l.get('emotion','conversational')
    if l['speaker']=='Dev' and 'emotion' not in l:
        emotion='concerned' if any(word in l['id'] for word in ['REJ','PUSH','O2-S','O2-16','T-S-','T-D-']) else 'reassured' if any(word in l['id'] for word in ['ACC','EN-G','E3-AUTO','SUP']) else 'engaged'
    if l['speaker']=='Theo' and 'emotion' not in l:emotion='thoughtful'
    # Kokoro has no native acting tags. Apply direction to pace and pauses,
    # retain the tag for an expressive provider, and never speak tag text.
    directed=l['speaker'] in ['Dev','Theo','Northgate']
    sentence_pause,clause_pause=(0.30,0.14) if directed else (0.25,0.10)
    if directed and emotion in ['concerned','thoughtful','reflective']:speed-=0.03
    if directed and emotion in ['approving','reassured']:speed+=0.01
    if args.provider=='elevenlabs':
        voice=os.environ['ELEVENLABS_VOICE_'+l['speaker'].upper()]
        emotion='frustrated' if l.get('expression')=='annoyed' else {'engaged':'confident','concerned':'serious','reassured':'calm','conversational':'calm'}.get(emotion,emotion)
    signature=hashlib.sha256((text+voice+str(speed)).encode()).hexdigest()
    if directed:signature=hashlib.sha256((signature+emotion+str(sentence_pause)+str(clause_pause)).encode()).hexdigest()
    if args.provider=='elevenlabs': signature=hashlib.sha256((signature+manifest['model']+emotion).encode()).hexdigest()
    file=out/(l['id']+'.mp3')
    prev=previous.get('lines',{}).get(l['id'],{})
    if file.exists() and prev.get('signature')==signature:
        manifest['lines'][l['id']]={**prev,'emotionTag':'['+emotion+']','delivery':{'speed':speed,'sentencePause':sentence_pause,'clausePause':clause_pause}};continue
    if args.provider=='elevenlabs':
        # Exactly one performance tag. It is direction, never part of the caption.
        tag=emotion
        payload={'text':'['+tag+'] '+text,'model_id':manifest['model'],'voice_settings':{'stability':0.5,'similarity_boost':0.75}}
        req=Request('https://api.elevenlabs.io/v1/text-to-speech/'+voice+'?output_format=mp3_44100_128',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','xi-api-key':os.environ['ELEVENLABS_API_KEY']})
        with urlopen(req,timeout=90) as response: file.write_bytes(response.read())
        raw=subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(file),'-f','f32le','-ar','24000','-ac','1','pipe:1'])
        samples=np.frombuffer(raw,dtype=np.float32);sr=24000
    else: samples,sr=model.create(text,voice=voice,speed=speed,lang='en-gb' if voice.startswith('b') else 'en-us',sentence_pause=sentence_pause,clause_pause=clause_pause)
    if args.provider=='kokoro':samples=np.concatenate([np.zeros(int(sr*.07)),samples,np.zeros(int(sr*.12))])
    # Peak limit only; keep the model's delivery dynamics intact.
    peak=float(np.max(np.abs(samples))); samples=samples*(min(1.0,.94/max(.01,peak)))
    wav=Path('.data/deadlock-voice.wav');sf.write(wav,samples,sr)
    if args.provider=='kokoro':subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(wav),'-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','96k',str(file)],check=True)
    step=int(sr/20);rms=[float(np.sqrt(np.mean(samples[j:j+step]**2))) for j in range(0,len(samples),step)]
    ceiling=max(.02,max(rms));envelope=[round(min(1,x/ceiling),2) for x in rms]
    manifest['lines'][l['id']]={'file':'/deadlock/audio/'+file.name,'voice':voice,'status':'rendered','speaker':l['speaker'],'caption':text,'expression':l.get('expression','neutral'),'emotion':emotion,'duration':round(len(samples)/sr,3),'envelope':envelope,'signature':signature}
    manifest['lines'][l['id']].update({'emotionTag':'['+emotion+']','delivery':{'speed':speed,'sentencePause':sentence_pause,'clausePause':clause_pause}})
    if (i+1)%5==0:
        Path('.data/deadlock-voice-checkpoint.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(f"{i+1}/{len(old)+len(extra)} {l['id']} {voice} {len(samples)/sr:.1f}s elapsed {time.time()-start:.0f}s",flush=True)
if args.provider=='elevenlabs':
    for file in out.glob('*.mp3'):shutil.copy2(file,Path('public/deadlock/audio')/file.name)
temporary=root/'audio-manifest.next.json';temporary.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');temporary.replace(root/'audio-manifest.json')
print('COMPLETE',len(manifest['lines']),flush=True)
