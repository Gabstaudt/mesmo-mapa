"""Ambiente original de água, sintetizado sem gravações externas."""
from pathlib import Path
from array import array
import math
import random
import wave
rate = 22050
rng = random.Random(8062022)
previous = 0.0
samples = array('h')
for i in range(rate * 12):
    noise = rng.uniform(-1, 1)
    previous = 0.91 * previous + 0.09 * noise
    movement = 0.78 + 0.16 * math.sin(2 * math.pi * i / (rate * 6))
    samples.append(round((noise * 0.15 + previous * 1.2) * movement * 24000))
with wave.open(str(Path(__file__).resolve().parents[1] / 'public/assets/audio/travel-water.wav'), 'wb') as wav:
    wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(rate); wav.writeframes(samples.tobytes())
