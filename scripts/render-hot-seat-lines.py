"""Offline static synthetic lines only. No API calls, private transcripts or runtime Python dependency."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.data/deadlock-voice-runtime').resolve()))
import numpy as np
import soundfile as sf
import onnxruntime as ort
from kokoro_onnx import Kokoro
out=Path('public/hot-seat/audio');out.mkdir(parents=True,exist_ok=True)
options=ort.SessionOptions();options.intra_op_num_threads=4;options.inter_op_num_threads=1
model=Kokoro.from_session(ort.InferenceSession('.data/deadlock-model/kokoro-v1.0.onnx',sess_options=options,providers=['CPUExecutionProvider']),'.data/deadlock-model/voices-v1.0.bin')
lines={'ack':'Mm-hm.','right':'Right.','okay':'Okay.','time':'Take your time. You can also ask me to rephrase.','close':'The conversation is complete. Let’s look at the reasoning you documented. This review is provisional, not a hiring verdict.','sample':'Let’s get specific. What would you need to know before making that call?'}
manifest={'provider':'Kokoro-82M v1.0, Apache-2.0, pre-rendered synthetic speech','lines':lines,'voices':['af_heart','af_bella','bf_emma']}
for voice in manifest['voices']:
 (out/voice).mkdir(exist_ok=True)
 for name,text in lines.items():
  target=out/voice/(name+'.wav')
  if target.exists() and name!='sample':continue
  text = {'af_heart':lines['sample'],'af_bella':'There might be something interesting there. What would you try first, and why?','bf_emma':'Before we spend anything, tell me which assumption you would test.'}[voice] if name=='sample' else text
  samples,rate=model.create(text,voice=voice,speed=.98,lang='en-gb' if voice.startswith('b') else 'en-us')
  sf.write(target,samples,rate,subtype='PCM_16')
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared 18 static neural lines; no external inference was used.')
