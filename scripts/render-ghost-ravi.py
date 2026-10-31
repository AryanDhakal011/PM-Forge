"""Offline production: one Microsoft Indian English neural recording per Ravi line.
Install edge-tts into .data/ghost-edge-runtime. Nothing synthesizes in the browser.
"""
import sys,asyncio,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.data/ghost-edge-runtime').resolve()))
import edge_tts
ROOT=Path('content/projects/ghost-metric')
async def main():
 script=json.loads((ROOT/'voice-script.json').read_text(encoding='utf-8'))
 manifest=json.loads((ROOT/'audio-manifest.json').read_text(encoding='utf-8'))
 manifest['provider']='Prerendered Kokoro + Microsoft Indian English neural'
 voice='en-IN-PrabhatNeural';rate='-3%'
 for line in script['lines']:
  if line['speaker']!='Ravi':continue
  signature=hashlib.sha256((line['text']+voice+rate).encode()).hexdigest()
  clip=manifest['lines'].get(line['id'],{})
  file=Path('public/ghost-metric/audio')/(line['id']+'.mp3')
  if clip.get('signature')==signature and file.exists():continue
  await edge_tts.Communicate(line['text'],voice=voice,rate=rate).save(str(file))
  if file.stat().st_size<1000:raise RuntimeError('Empty recording: '+line['id'])
  manifest['lines'][line['id']]={'file':'/ghost-metric/audio/'+file.name,'signature':signature,'caption':line['text'],'speaker':'Ravi','voice':voice,'emotion':line['emotion'],'rate':rate,'provider':'Microsoft neural / offline Edge read-aloud production'}
  manifest['provider']='Prerendered Kokoro + Microsoft Indian English neural'
  (ROOT/'audio-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
  print(line['id'],flush=True)
 (ROOT/'audio-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
asyncio.run(main())
