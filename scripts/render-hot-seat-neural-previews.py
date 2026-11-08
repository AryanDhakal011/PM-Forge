"""Render fictional previews locally; no speech API, user transcript, or deployment Python dependency."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.data/deadlock-voice-runtime').resolve()))
import soundfile as sf
import onnxruntime as ort
from kokoro_onnx import Kokoro
options=ort.SessionOptions();options.intra_op_num_threads=4;options.inter_op_num_threads=1
model=Kokoro.from_session(ort.InferenceSession('.data/deadlock-model/kokoro-v1.0.onnx',sess_options=options,providers=['CPUExecutionProvider']),'.data/deadlock-model/voices-v1.0.bin')
lines={'af_bella':"Let’s get specific. What would you need to know before making that call?",'af_sarah':"There might be something interesting there. What would you try first, and why?"}
out=Path('public/hot-seat/neural-v2');out.mkdir(parents=True,exist_ok=True)
manifest={'version':'kokoro-female-v2','engine':'Kokoro-82M v1.0','synthetic':True,'previews':[]}
for voice,text in lines.items():
 target=out/voice/'preview.wav';target.parent.mkdir(exist_ok=True)
 samples,rate=model.create(text,voice=voice,speed=.98,lang='en-us')
 sf.write(target,samples,rate,subtype='PCM_16')
 manifest['previews'].append({'voice':voice,'text':text,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sampleRate':rate,'path':voice+'/preview.wav'})
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Bella and Sarah previews generated from Kokoro; no browser or paid speech used.')
