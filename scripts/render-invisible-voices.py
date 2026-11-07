"""Offline, repeatable production of caption-matched dialogue. No runtime TTS."""
import sys, json, hashlib, subprocess
from pathlib import Path
sys.path.insert(0, str(Path('.data/deadlock-voice-runtime').resolve()))
import numpy as np
import soundfile as sf
import onnxruntime as ort
import imageio_ffmpeg
from kokoro_onnx import Kokoro
root = Path('content/invisible-wall')
out = Path('public/projects/invisible-wall/audio'); out.mkdir(parents=True, exist_ok=True)
cast_data = json.loads((root/'cast.json').read_text(encoding='utf-8'))
scenes = json.loads((root/'scenes.json').read_text(encoding='utf-8'))
script = {'people': [dict(id=k, **v) for k,v in cast_data.items()], 'lines': [dict(l, emotion=l['expression']) for scene in scenes for l in scene['lines'] if l['id']!='fallback']}
cast = {p['id']: p for p in script['people']}
options = ort.SessionOptions(); options.intra_op_num_threads = 4; options.inter_op_num_threads = 1
session = ort.InferenceSession('.data/deadlock-model/kokoro-v1.0.onnx', sess_options=options, providers=['CPUExecutionProvider'])
model = Kokoro.from_session(session, '.data/deadlock-model/voices-v1.0.bin')
previous = json.loads((root/'audio-manifest.json').read_text(encoding='utf-8'))
manifest = {'version': 1, 'provider': 'Kokoro-82M v1.0 / kokoro-onnx 0.6.1', 'directionLimit': 'Emotion tags adjust pace and pauses. This model does not provide native acted emotions.', 'lines': {}}
for line in script['lines']:
    person = cast[line['speaker']]; voice = person['voice']; speed = person['speed'] - (.02 if line['emotion'] == 'concerned' else 0)
    signature = hashlib.sha256((line['text']+voice+str(speed)).encode()).hexdigest(); file = out/(line['id']+'.mp3')
    if file.exists() and previous['lines'].get(line['id'], {}).get('signature') == signature:
        manifest['lines'][line['id']] = previous['lines'][line['id']]; continue
    samples, sr = model.create(line['text'], voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us', sentence_pause=.28, clause_pause=.14)
    samples = np.concatenate([np.zeros(int(sr*.07)), samples, np.zeros(int(sr*.12))]); samples *= min(1, .94/max(.01, float(np.max(np.abs(samples)))))
    wav = Path('.data/invisible-voice.wav'); sf.write(wav, samples, sr)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-y', '-i', str(wav), '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', str(file)], check=True)
    manifest['lines'][line['id']] = {'file': '/projects/invisible-wall/audio/'+file.name, 'signature': signature, 'caption': line['text'], 'speaker': line['speaker'], 'emotion': line['emotion'], 'voice': voice, 'duration': round(len(samples)/sr, 3)}
    (root/'audio-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    print(line['id'], flush=True)
(root/'audio-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print('COMPLETE', len(manifest['lines']), flush=True)

for file in out.glob('*.mp3'):
    if file.stem not in manifest['lines']:
        assert file.resolve().parent == out.resolve()
        file.unlink()
