"""Original offline soundscapes; no synthesis runs in the product."""
import math,random,wave,struct,shutil
from pathlib import Path
out=Path('public/projects/feature-factory/audio');out.mkdir(parents=True,exist_ok=True)
sr=22050
def write(name,length,fn):
 samples=[fn(t/sr)*min(1,t/180,(length*sr-t)/600) for t in range(int(length*sr))]
 peak=max(abs(x) for x in samples) or 1
 with wave.open(str(out/(name+'.wav')),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(b''.join(struct.pack('<h',int(x/peak*17000)) for x in samples))
write('gong',3.5,lambda t:sum(math.sin(2*math.pi*f*t+math.sin(t*2)*.12)*math.exp(-t*(1+i*.15))/(i+1) for i,f in enumerate([112,171,259,367,511,753,1193])))
write('hold',1.8,lambda t:(math.sin(t*math.tau*82)+.25*math.sin(t*math.tau*123))*math.exp(-t*1.7))
write('factory',4,lambda t:.4*math.sin(t*math.tau*55)+.16*math.sin(t*math.tau*110)+.025*math.sin(t*math.tau*533))
write('incident',2,lambda t:math.sin(t*math.tau*74)*(math.exp(-((t-.25)/.06)**2)+.65*math.exp(-((t-.49)/.07)**2)))
src=Path('public/projects/invisible-wall/audio/KOKORO-LICENSE.txt')
if src.exists():shutil.copyfile(src,out/'KOKORO-LICENSE.txt')
(out.parent/'CREDITS.txt').write_text('Ignis is fictional. Portraits, factory illustration, shader and soundscapes are original PMForge code assets.\nDialogue: Kokoro-82M v1.0, Apache-2.0; prerecorded synthetic speech, not human actors. Emotion labels guide pace; native acted emotions are not supported. See the shipped licence.\nSubframe inspiration: status-board and locked-budget-balance. No example source copied.\n',encoding='utf-8')
print('Four original soundscapes rendered.')
