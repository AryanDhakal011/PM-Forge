"""Original Granger effects. Produced offline; the browser only plays assets."""
import math, random, shutil, struct, wave
from pathlib import Path
out=Path('public/projects/legacy-fracture/audio');out.mkdir(parents=True,exist_ok=True)
sr=16000;rng=random.Random(1994)
def write(name,seconds,fn):
    count=int(sr*seconds)
    with wave.open(str(out/(name+'.wav')),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr)
        values=bytearray()
        for i in range(count):
            t=i/sr;fade=min(1,t/.04,(seconds-t)/.18);sample=max(-1,min(1,fn(t)*fade))
            values.extend(struct.pack('<h',int(sample*15000)))
        f.writeframes(values)
write('bell',2.1,lambda t:sum(math.sin(2*math.pi*x*t)*math.exp(-t*(1.5+i*.6))/(i+1) for i,x in enumerate([392,587,784,1175])))
write('clock',1.1,lambda t:.24*(rng.random()-.5)*math.exp(-t*15))
write('paper',1.2,lambda t:.35*(rng.random()-.5)*math.exp(-t*4))
write('truck',5,lambda t:.12*math.sin(2*math.pi*49*t)+.03*(rng.random()-.5))
write('tape',3,lambda t:.04*(rng.random()-.5)+.03*math.sin(2*math.pi*60*t))
write('hum',6,lambda t:.08*math.sin(2*math.pi*55*t)+.03*math.sin(2*math.pi*110*t))
write('switch',1.4,lambda t:.42*math.sin(2*math.pi*68*t)*math.exp(-t*5)+.2*(rng.random()-.5)*math.exp(-t*8))
write('silence',1.3,lambda t:.03*math.sin(2*math.pi*392*t)*math.exp(-t*4))
src=Path('public/projects/silent-churn/audio/KOKORO-LICENSE.txt')
if src.exists():shutil.copyfile(src,out/'KOKORO-LICENSE.txt')
(out.parent/'CREDITS.txt').write_text('Granger & Sons Freight is fictional. All portraits, stage scenes, graph and fleet visuals, and effects are original PMForge code assets.\nDialogue: Kokoro-82M v1.0, Apache-2.0, prerecorded synthetic speech with matching captions. No acted voices or runtime synthesis. See the shipped license.\nSubframe MCP inspiration consulted: Atoms industrial gold and The Vessel editorial warmth. No source copied.\n',encoding='utf-8')
print('Legacy Fracture: eight original sound cues.')
