"""Base original de 16 pulsos a 96 BPM, sem samples externos."""
from array import array
from pathlib import Path
import math
import random
import wave

rate = 22050
beat = 60 / 96
samples = [0.0] * round(rate * beat * 16)
rng = random.Random(8062022)

def tone(start, frequency, duration, gain, decay=5):
    for j in range(round(duration * rate)):
        t = j / rate
        value = math.sin(2 * math.pi * frequency * t) + 0.18 * math.sin(4 * math.pi * frequency * t)
        envelope = min(t / 0.004, 1) * math.exp(-decay * t / duration)
        samples[(round(start * rate) + j) % len(samples)] += gain * value * envelope

def shaker(start, gain):
    previous = 0.0
    for j in range(round(0.10 * rate)):
        noise = rng.uniform(-1, 1)
        value = noise - previous
        previous = noise
        samples[(round(start * rate) + j) % len(samples)] += value * gain * math.exp(-j / (rate * 0.018))

chords = [(130.81, 164.81, 196.00), (110.00, 130.81, 164.81),
          (87.31, 110.00, 130.81), (98.00, 123.47, 146.83)]
for pulse in range(16):
    t = pulse * beat
    chord = chords[pulse // 4]
    tone(t, 65 if pulse % 2 == 0 else 82, 0.18, 0.27, 7)
    tone(t, chord[0] / 2, 0.42, 0.12)
    shaker(t, 0.10)
    shaker(t + beat / 2, 0.065)
    for k, frequency in enumerate(chord):
        tone(t + beat / 2 + k * 0.009, frequency * 2, 0.32, 0.075)

out = Path(__file__).resolve().parents[1] / 'public/assets/audio/concert-groove.wav'
with wave.open(str(out), 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(rate)
    wav.writeframes(array('h', (round(max(-1, min(1, value)) * 28000) for value in samples)).tobytes())
