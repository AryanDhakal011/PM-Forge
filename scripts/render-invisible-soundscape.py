"""Original procedural sound assets, rendered offline with the Python standard library."""
import math, wave, struct
from pathlib import Path
out=Path('public/projects/invisible-wall/audio'); out.mkdir(parents=True, exist_ok=True)
sr=24000
def write(name, seconds, fn):
    with wave.open(str(out/(name+'.wav')), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sr)
        wav.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, fn(i/sr,seconds)))*32767)) for i in range(int(sr*seconds))))
write('party-bed',16,lambda t,d:.07*(1+.15*math.sin(2*math.pi*t/4))*(math.sin(2*math.pi*110*t)+.4*math.sin(2*math.pi*165*t)+.2*math.sin(2*math.pi*220*t)))
for name,freq,seconds in [('tick',880,.06),('paper',330,.1),('chime',523.25,.5),('error',196,.16)]:
    write(name,seconds,lambda t,d,f=freq:.18*math.sin(2*math.pi*f*t)*math.sin(math.pi*t/d)*math.exp(-4*t/d))
print('Terminal ambience and original UI cues rendered.')

import random
random.seed(92471)
write('shatter',1.2,lambda t,d:.10*(random.uniform(-1,1)+.35*math.sin(2*math.pi*1900*t))*math.exp(-5*t/d)*min(1,t/.015))
write('footsteps',.6,lambda t,d:.12*math.sin(2*math.pi*85*t)*sum(math.exp(-((t-p)/.04)**2) for p in [.10,.36]))
write('hum',1.1,lambda t,d:.12*math.sin(2*math.pi*(110*t+18*t*t))*math.sin(math.pi*t/d))
write('heartbeat-bed',16,lambda t,d:.09*math.sin(2*math.pi*65*t)*(math.exp(-((t%1.0-.12)/.05)**2)+.6*math.exp(-((t%1.0-.31)/.04)**2))+.01*math.sin(2*math.pi*110*t))

print('Nine original soundscape assets ready.')
