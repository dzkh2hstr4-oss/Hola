#!/usr/bin/env python3
"""Banda sonora original (procedural, sin derechos) para ElGolpeDelBalonDeOro.

Cada tramo del vídeo tiene su ambiente: misterio, suspense, terror, comedia
sigilosa, acción, épico… y golpes orquestales (stingers) en los momentos clave.

    python3 scripts/banda_sonora_golpe.py  ->  public/golpe/banda_sonora.wav
"""
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
TOTAL = 296.0
rng = np.random.default_rng(7)


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass(x, fc):
    b, a = butter(2, fc / (SR / 2))
    return lfilter(b, a, x)


def highpass(x, fc):
    b, a = butter(2, fc / (SR / 2), btype="high")
    return lfilter(b, a, x)


def reverb(x, mix=0.35):
    out = x.copy()
    for d, g in [(0.029, 0.6), (0.037, 0.55), (0.043, 0.5), (0.053, 0.45)]:
        k = int(d * SR)
        y = np.zeros(len(x) + k * 40)
        y[: len(x)] = x
        b = np.zeros(k + 1); b[0] = 1
        a = np.zeros(k + 1); a[0] = 1; a[k] = -g
        out = out + mix * 0.25 * lfilter(b, a, y)[: len(x)]
    return out


def env(n, a=0.01, r=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


# ---------------------------------------------------------------- instrumentos
def pad(notes, sec, bright=900, detune=0.004):
    t = tt(sec)
    x = np.zeros(len(t))
    for n in notes:
        f = hz(n)
        for d in (-detune, 0, detune):
            x += 2 * ((t * f * (1 + d)) % 1) - 1  # sierra
    x = lowpass(x, bright) / (len(notes) * 3)
    fade = np.minimum(1, np.minimum(t / 1.5, (sec - t) / 1.5))
    return x * fade


def pluck(n, sec=0.6, decay=0.25):
    t = tt(sec)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return x * env(len(t), 0.003, decay)


def musicbox(n, sec=1.5):
    t = tt(sec)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return x * env(len(t), 0.002, 0.5)


def kick(sec=0.4):
    t = tt(sec)
    return np.sin(2 * np.pi * (45 + 120 * np.exp(-t * 30)) * t) * np.exp(-t * 8)


def snare(sec=0.25):
    t = tt(sec)
    return (highpass(rng.standard_normal(len(t)), 1500) * 0.7 + np.sin(2 * np.pi * 190 * t) * 0.5) * np.exp(-t * 18)


def hat(sec=0.06):
    t = tt(sec)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 60)


def tick(sec=0.04):
    t = tt(sec)
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120)


def woodblock(sec=0.12):
    t = tt(sec)
    return np.sin(2 * np.pi * 820 * t) * np.exp(-t * 45)


def timpani(n=38, sec=2.0):
    t = tt(sec)
    f = hz(n)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 2.5) + lowpass(rng.standard_normal(len(t)), 200) * np.exp(-t * 20) * 0.6


def heartbeat(sec=0.9):
    x = np.zeros(int(sec * SR))
    k = kick(0.3) * 0.9
    x[: len(k)] += k
    x[int(0.22 * SR): int(0.22 * SR) + len(k)] += k * 0.6
    return lowpass(x, 300)


def stinger(root=36, sec=3.5):
    """golpe orquestal: boom grave + cluster disonante + platillo"""
    t = tt(sec)
    boom = np.sin(2 * np.pi * hz(root - 12) * t * np.exp(-t * 0.3)) * np.exp(-t * 1.5)
    cl = sum(2 * ((t * hz(n)) % 1) - 1 for n in [root + 12, root + 13, root + 18, root + 24, root + 25]) / 5
    cl = lowpass(cl, 3000) * np.exp(-t * 1.2)
    cym = highpass(rng.standard_normal(len(t)), 4000) * np.exp(-t * 2) * 0.35
    return reverb(boom * 1.2 + cl * 0.8 + cym, 0.5)


def riser(sec=3.0):
    t = tt(sec)
    f = 200 * (8 ** (t / sec))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + highpass(rng.standard_normal(len(t)), 2000) * 0.4
    return x * (t / sec) ** 2


def screech(sec=1.2):
    t = tt(sec)
    f = 1800 + 600 * np.sin(2 * np.pi * 7 * t) + 900 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / sec) * 0.35


# ---------------------------------------------------------------- mezcla
mix = np.zeros(int(TOTAL * SR) + SR * 4)


def put(x, at, vol=1.0):
    i = int(at * SR)
    j = min(len(mix), i + len(x))
    mix[i:j] += x[: j - i] * vol


def beats(start, end, bpm):
    return np.arange(start, end, 60 / bpm)


# 0–7 intro: impacto + subida
put(riser(5), 0, 0.5)
put(stinger(38), 5.5, 0.9)

# 7–25 misterio nocturno (la menor): drone + caja de música
put(pad([45, 52, 57], 18, 500), 7, 0.5)
mel = [69, 72, 76, 74, 72, 69, 71, 72, 69, 76, 79, 77, 76, 72]
for k, n in enumerate(mel):
    put(reverb(musicbox(n), 0.6), 8 + k * 1.2, 0.25)

# 25–45 el golpe: suspense con reloj y ostinato de cuerdas
put(pad([40, 47, 52], 20, 600), 25, 0.45)
for b in beats(25, 45, 120):
    put(tick(), b, 0.25)
for k, b in enumerate(beats(25, 45, 240)):
    put(lowpass(pluck([40, 40, 41, 40][k % 4] + 12, 0.2, 0.08), 1200), b, 0.35)
put(riser(4), 31, 0.5)
put(stinger(40), 35, 0.6)

# 45–62 descubrimiento: tensión → gran golpe al morder
put(pad([43, 46, 50], 17, 700), 45, 0.4)
put(riser(3), 47, 0.5)
put(stinger(43), 50, 1.0)
for b in beats(52, 62, 70):
    put(heartbeat(), b, 0.6)

# 62–78 llamada: drone tenso con pulsos
put(pad([38, 45, 50, 51], 16, 650), 62, 0.45)
for b in beats(62, 78, 90):
    put(lowpass(kick(0.3), 200), b, 0.4)

# 78–92 carretera: ritmo de conducción
for b in beats(78, 92, 128):
    put(kick(), b, 0.55)
    put(hat(), b + 60 / 128 / 2, 0.25)
bass = [45, 45, 48, 50]
for k, b in enumerate(beats(78, 92, 256)):
    put(lowpass(pluck(bass[(k // 8) % 4], 0.2, 0.1), 700), b, 0.45)
put(pad([57, 60, 64], 14, 1500), 78, 0.25)

# 92–136 casa de Messi + Neymar: comedia sigilosa (bajo pizzicato + woodblock)
walk = [40, 43, 44, 45, 46, 45, 43, 40, 38, 40, 43, 46, 45, 43, 41, 40]
for k, b in enumerate(beats(92, 136, 200)):
    if k % 2 == 0:
        put(lowpass(pluck(walk[(k // 2) % len(walk)] + 12, 0.25, 0.09), 1500), b, 0.5)
    if k % 4 == 1:
        put(woodblock(), b, 0.25)
put(stinger(41), 96.3, 0.55)  # patada a la puerta
put(stinger(44), 130, 0.7)  # todos miran a Neymar

# 136–162 persecución: acción rápida
for b in beats(136, 162, 160):
    put(kick(), b, 0.6)
for k, b in enumerate(beats(136, 162, 160)):
    if k % 2 == 1:
        put(snare(), b, 0.5)
for b in beats(136, 162, 320):
    put(hat(), b, 0.18)
riff = [45, 45, 57, 45, 48, 45, 55, 45, 43, 43, 55, 43, 44, 44, 56, 44]
for k, b in enumerate(beats(136, 162, 320)):
    put(lowpass(pluck(riff[k % 16], 0.15, 0.06), 1800), b, 0.4)
put(riser(3), 150.5, 0.5)
put(stinger(45), 153.5, 0.7)  # "era una trampa"

# 162–184 la carta: misterio con caja de música desafinada
put(pad([44, 50, 56], 22, 550), 162, 0.45)
for k, n in enumerate([68, 71, 74, 73, 68, 74, 77, 76, 71, 68]):
    put(reverb(musicbox(n - 0.3 * (k % 2)), 0.6), 166 + k * 1.4, 0.25)
put(stinger(44), 179.5, 0.6)  # "¿mis ocho?"

# 184–204 secuestro: terror
put(pad([36, 42, 48, 49], 20, 400), 184, 0.6)
for b in beats(186, 204, 80):
    put(heartbeat(), b, 0.7)
put(screech(), 190, 0.6)
put(stinger(36), 190, 0.9)
put(screech(), 197, 0.4)

# 204–222 llega Ramos: build heroico
for k, b in enumerate(beats(204, 222, 100)):
    put(timpani(38 if k % 4 else 33), b, 0.35 + 0.4 * (b - 204) / 18)
put(pad([50, 57, 62, 65], 18, 1200), 204, 0.35)
put(riser(4), 217.5, 0.5)

# 222–252 asalto al búnker: clímax de acción
for b in beats(222, 252, 150):
    put(kick(), b, 0.65)
for k, b in enumerate(beats(222, 252, 150)):
    if k % 2 == 1:
        put(snare(), b, 0.5)
for b in beats(222, 252, 300):
    put(hat(), b, 0.15)
riff2 = [38, 38, 50, 38, 41, 41, 53, 41, 36, 36, 48, 36, 43, 43, 55, 43]
for k, b in enumerate(beats(222, 252, 300)):
    put(lowpass(pluck(riff2[k % 16], 0.15, 0.06), 1800), b, 0.4)
put(pad([50, 53, 57], 30, 1000), 222, 0.3)
put(riser(3), 239.5, 0.6)
put(stinger(38), 242.5, 1.0)  # ¡SIUUU!
put(timpani(33), 244.3, 0.8)  # cae en la jaula

# 252–276 final: épico y cálido (Do mayor)
chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]]
for k in range(6):
    put(pad(chords[k % 4], 4.2, 2200, 0.006), 252 + k * 4, 0.45)
    put(timpani(36), 252 + k * 4, 0.35)
for k, n in enumerate([72, 76, 79, 77, 76, 72, 74, 76, 79, 81, 79, 76, 74, 72]):
    put(reverb(pluck(n, 1.2, 0.5), 0.5), 254 + k * 1.5, 0.25)

# 276–290 post-créditos: vuelve el terror
put(pad([36, 42, 43], 14, 350), 276, 0.55)
for b in beats(278, 290, 70):
    put(heartbeat(), b, 0.6)
put(stinger(36), 281, 0.9)  # "Próximo objetivo…"

# 290–296 outro
put(stinger(38), 290, 0.7)

out = reverb(mix, 0.2)
out = out / np.max(np.abs(out)) * 0.85
st = np.stack([out, np.roll(out, 220)], axis=1)  # pequeño ensanche estéreo
with wave.open("public/golpe/banda_sonora.wav", "w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("ok", len(out) / SR, "s")
