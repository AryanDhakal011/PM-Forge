"""Original procedural sound assets, rendered offline with the Python standard library."""
import math, wave, struct
from pathlib import Path
out=Path('public/trojan-horse/audio'); out.mkdir(parents=True, exist_ok=True)
sr=24000
def write(name, seconds, fn):
    with wave.open(str(out/(name+'.wav')), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sr)
        wav.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, fn(i/sr,seconds)))*32767)) for i in range(int(sr*seconds))))
write('party-bed',16,lambda t,d:.07*(1+.15*math.sin(2*math.pi*t/4))*(math.sin(2*math.pi*110*t)+.4*math.sin(2*math.pi*165*t)+.2*math.sin(2*math.pi*220*t)))
write('hangover-bed',16,lambda t,d:.07*(1+.1*math.sin(2*math.pi*t/8))*math.sin(2*math.pi*110*t))
for name,freq,seconds in [('tick',880,.06),('paper',330,.1),('chime',523.25,.5),('error',196,.16)]:
    write(name,seconds,lambda t,d,f=freq:.18*math.sin(2*math.pi*f*t)*math.sin(math.pi*t/d)*math.exp(-4*t/d))
print('Six original soundscape assets rendered.')
