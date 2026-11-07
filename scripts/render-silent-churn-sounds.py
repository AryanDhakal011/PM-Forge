"""Original low-volume office cues. No sound generation runs in the product."""
import math
import random
import shutil
import struct
import wave
from pathlib import Path

out = Path("public/projects/silent-churn/audio")
out.mkdir(parents=True, exist_ok=True)
sr = 16000
rng = random.Random(1886)

def write(name, seconds, fn):
    count = int(sr * seconds)
    with wave.open(str(out / f"{name}.wav"), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        samples = bytearray()
        for i in range(count):
            t = i / sr
            fade = min(1, t / .06, (seconds - t) / .2)
            value = max(-1, min(1, fn(t) * fade))
            samples.extend(struct.pack("<h", int(value * 13000)))
        wav.writeframes(samples)

write("room", 8, lambda t: .10*math.sin(2*math.pi*58*t) + .03*math.sin(2*math.pi*117*t) + .014*(rng.random()-.5))
write("paper", 1.4, lambda t: .35*(rng.random()-.5)*math.exp(-3*t) + .06*math.sin(2*math.pi*100*t)*math.exp(-4*t))
write("door", 2, lambda t: .28*math.sin(2*math.pi*94*t)*math.exp(-2*t)+.18*(rng.random()-.5)*math.exp(-6*t))
write("crash", 2.4, lambda t: .45*math.sin(2*math.pi*73*t)*math.exp(-1.8*t)+.2*(rng.random()-.5)*math.exp(-3*t))

license_file = Path("public/projects/feature-factory/audio/KOKORO-LICENSE.txt")
if license_file.exists():
    shutil.copyfile(license_file, out / "KOKORO-LICENSE.txt")
(out.parent / "CREDITS.txt").write_text(
    "Meridian Mutual is fictional. Portraits, office illustration, canvas ledger and sound cues are original PMForge assets.\n"
    "151 dialogue recordings: Kokoro-82M v1.0, Apache-2.0, prerecorded synthetic speech. The model has no native acted emotion control. Captions and typed follow-ups are shown in the product. See the shipped licence.\n"
    "Subframe MCP references consulted: Griffin visual approach, animated-beam, proposal-ledger, expandable-ledger, seat-picker and chart-crosshair. No example source copied.\n",
    encoding="utf-8",
)
print("Silent Churn: four original sounds and voice credits ready.")
