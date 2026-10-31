"""Original seamless room tone. Deterministic synthesis for an offline WAV asset."""
import math,wave,random,struct
from pathlib import Path
rate=24000;seconds=16;rng=random.Random(41)
partials=[(rng.randrange(1400,6400)/seconds,rng.random()*math.tau,.009) for _ in range(44)]
out=Path('public/ghost-metric/audio/lab-ambient.wav')
with wave.open(str(out),'wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate)
 data=bytearray()
 for i in range(rate*seconds):
  t=i/rate
  value=.08*math.sin(math.tau*60*t)+.027*math.sin(math.tau*120*t+.4)+.012*math.sin(math.tau*180*t)
  value+=sum(a*math.sin(math.tau*hz*t+phase) for hz,phase,a in partials)
  data.extend(struct.pack('<h',int(max(-.8,min(.8,value))*32767)))
 f.writeframes(data)
print(out)
