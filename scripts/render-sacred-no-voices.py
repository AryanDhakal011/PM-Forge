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

from kokoro_onnx import Kokoro
root=Path('content/projects/sacred-no');out=Path('public/sacred-no/audio');out.mkdir(parents=True,exist_ok=True)
c=json.loads((root/'content.json').read_text(encoding='utf-8'))
cast={p['id']:(p['voice'],p['speed']) for p in c['people']}
opts=ort.SessionOptions();opts.intra_op_num_threads=4;opts.inter_op_num_threads=1
session=ort.InferenceSession('.data/deadlock-model/kokoro-v1.0.onnx',sess_options=opts,providers=['CPUExecutionProvider'])
model=Kokoro.from_session(session,'.data/deadlock-model/voices-v1.0.bin')
manifest={'version':1,'provider':'Kokoro-82M v1.0 / kokoro-onnx 0.6.1','directionLimit':'Emotion tags direct pace and pauses; this model has no native acted-emotion control.','lines':{}}
previous=json.loads((root/'audio-manifest.json').read_text(encoding='utf-8')) if (root/'audio-manifest.json').exists() else {'lines':{}}
for i,l in enumerate(c['lines']):
 voice,speed=cast[l['speaker']]
 if l['emotion'] in ['concerned','thinking','pressured']:speed-=.02
 text=l['text'];signature=hashlib.sha256((text+voice+str(speed)).encode()).hexdigest();file=out/(l['id']+'.mp3')
 if file.exists() and previous['lines'].get(l['id'],{}).get('signature')==signature:
  manifest['lines'][l['id']]=previous['lines'][l['id']];continue
 samples,sr=model.create(text,voice=voice,speed=speed,lang='en-gb' if voice.startswith('b') else 'en-us',sentence_pause=.25,clause_pause=.12)
 samples=np.concatenate([np.zeros(int(sr*.07)),samples,np.zeros(int(sr*.12))]);samples*=min(1,.94/max(.01,float(np.max(np.abs(samples)))))
 wav=Path('.data/sacred-voice.wav');sf.write(wav,samples,sr)
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(wav),'-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','96k',str(file)],check=True)
 manifest['lines'][l['id']]={'file':'/sacred-no/audio/'+file.name,'signature':signature,'caption':text,'speaker':l['speaker'],'voice':voice,'emotion':l['emotion'],'speed':speed,'duration':round(len(samples)/sr,3)}
 (root/'audio-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 print(f"{i+1}/{len(c['lines'])} {l['id']}",flush=True)
print('COMPLETE',len(manifest['lines']),flush=True)
