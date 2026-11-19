#!/usr/bin/env python3
"""Música de fondo procedural por ESTADOS DE ÁNIMO (sin copyright).

Moods: suspense, accion, emotiva, epica, groove.

    python3 scripts/musica3.py --mood suspense --seconds 40 --seed 3 --out x.wav
"""
import argparse
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low")
    return lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high")
    return lfilter(b, a, x)


def t_arr(n):
    return np.arange(n) / SR


def env_exp(n, decay):
    return np.exp(-t_arr(n) / decay)


def saw(f, n, detune=0.0):
    t = t_arr(n)
    out = np.zeros(n)
    for d in (-detune, 0, detune):
        ph = (t * f * (1 + d)) % 1.0
        out += 2 * ph - 1
    return out / 3


def sine(f, n, phase=0.0):
    return np.sin(2 * np.pi * f * t_arr(n) + phase)


def add(buf, x, start):
    s = int(start)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s]


# ---------- drums ----------
def kick(n=int(0.35 * SR), punch=1.0):
    t = t_arr(n)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * punch


def snare(n=int(0.25 * SR), rng=None):
    rng = rng or np.random.default_rng(0)
    t = t_arr(n)
    noise = hp(rng.standard_normal(n), 1500) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return 0.6 * noise + 0.5 * body


def hat(n=int(0.06 * SR), rng=None, open_=False):
    rng = rng or np.random.default_rng(1)
    t = t_arr(n if not open_ else int(0.25 * SR))
    x = hp(rng.standard_normal(len(t)), 7000)
    return x * np.exp(-t * (60 if not open_ else 12)) * 0.5


def tom(f=90, n=int(0.6 * SR)):
    t = t_arr(n)
    ff = f * (1 + 0.6 * np.exp(-t * 10))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 4.5)


def pluck(f, n, decay=0.35):
    x = sine(f, n) + 0.5 * sine(2 * f, n) + 0.25 * sine(3 * f, n) + 0.1 * sine(4 * f, n)
    return x * env_exp(n, decay)


def pad(freqs, n, cutoff=1400, detune=0.004):
    x = sum(saw(f, n, detune) for f in freqs) / len(freqs)
    x = lp(x, cutoff, 2)
    att = int(min(n * 0.3, 1.2 * SR))
    e = np.ones(n)
    e[:att] = np.linspace(0, 1, att)
    e[-att:] = np.minimum(e[-att:], np.linspace(1, 0, att))
    return x * e


def delay(x, secs, fb=0.35, mix=0.35):
    d = int(secs * SR)
    y = x.copy()
    for k in range(1, 5):
        if d * k >= len(x):
            break
        y[d * k:] += x[: len(x) - d * k] * (fb ** k) * mix / 0.35
    return y


def render(mood, seconds, seed):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    mus = np.zeros(n)
    drm = np.zeros(n)
    root = 57 + int(rng.integers(-3, 3))  # A-ish minor
    minor_prog = [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-2, 2, 5]]  # i VI III VII (relative)
    rng.shuffle(minor_prog[1:])

    if mood == "suspense":
        bpm = 92
        beat = 60 / bpm
        # sub drone with slow swell
        drone = (sine(midi(root - 24), n) + 0.4 * sine(midi(root - 12), n)) * (0.55 + 0.45 * np.sin(2 * np.pi * t_arr(n) / 8 - np.pi / 2))
        mus += 0.35 * drone
        # ticking clock + heartbeat
        b = 0
        while b * beat < seconds:
            add(drm, hat(rng=rng) * 0.5, b * beat * SR)
            add(drm, hat(rng=rng) * 0.25, (b + 0.5) * beat * SR)
            if b % 2 == 0:
                add(drm, kick(punch=0.7), b * beat * SR)
                add(drm, kick(punch=0.45), (b + 0.35) * beat * SR)
            b += 1
        # eerie arpeggio with delay
        arp = np.zeros(n)
        step = beat / 2
        k = 0
        while k * step < seconds:
            chord = minor_prog[(int(k * step / (beat * 8))) % 4]
            note = root + 12 + chord[k % 3] + (12 if k % 7 == 6 else 0)
            add(arp, pluck(midi(note), int(0.5 * SR), 0.25) * 0.18, k * step * SR)
            k += 1
        mus += lp(delay(arp, beat * 0.75), 3500)
        # riser every 8 bars
        L = int(beat * 16 * SR)
        for s in range(0, n, int(beat * 32 * SR)):
            r = hp(rng.standard_normal(L), 2000) * np.linspace(0, 1, L) ** 2 * 0.12
            add(mus, r, s + int(beat * 16 * SR))
    elif mood == "accion":
        bpm = 140
        beat = 60 / bpm
        b = 0
        while b * beat < seconds:
            add(drm, kick(), b * beat * SR)
            if b % 2 == 1:
                add(drm, snare(rng=rng) * 0.8, b * beat * SR)
            for q in range(4):
                add(drm, hat(rng=rng) * (0.35 if q % 2 else 0.2), (b + q / 4) * beat * SR)
            b += 1
        # driving bass 8ths
        k = 0
        while k * beat / 2 < seconds:
            chord = minor_prog[(int(k / 16)) % 4]
            f = midi(root - 24 + chord[0] + (12 if k % 4 == 3 else 0))
            x = lp(saw(f, int(beat / 2 * SR), 0.003), 900) * env_exp(int(beat / 2 * SR), 0.2) * 0.5
            add(mus, x, k * beat / 2 * SR)
            k += 1
        # staccato strings ostinato
        k = 0
        while k * beat / 4 < seconds:
            chord = minor_prog[(int(k / 32)) % 4]
            if k % 4 != 3:
                fr = [midi(root + c) for c in chord]
                x = pad(fr, int(beat / 4 * SR * 0.9), 2600, 0.006) * 0.22
                add(mus, x, k * beat / 4 * SR)
            k += 1
    elif mood == "emotiva":
        bpm = 72
        beat = 60 / bpm
        bar = beat * 4
        k = 0
        while k * bar < seconds:
            chord = minor_prog[k % 4]
            fr = [midi(root + c) for c in chord] + [midi(root - 12 + chord[0])]
            add(mus, pad(fr, int(bar * SR * 1.05), 1200, 0.005) * 0.32, k * bar * SR)
            # piano-like broken chord
            for j, c in enumerate([0, 1, 2, 1, 2, 1, 0, 2]):
                add(mus, pluck(midi(root + 12 + chord[c]), int(1.2 * SR), 0.6) * 0.14, (k * bar + j * beat / 2) * SR)
            k += 1
        b = 0
        while b * beat < seconds:
            if b % 4 == 0:
                add(drm, kick(punch=0.35), b * beat * SR)
            b += 1
    elif mood == "epica":
        bpm = 96
        beat = 60 / bpm
        bar = beat * 4
        k = 0
        while k * bar < seconds:
            chord = minor_prog[k % 4]
            fr = [midi(root + c) for c in chord] + [midi(root + 12 + chord[1])]
            add(mus, pad(fr, int(bar * SR * 1.05), 2200, 0.008) * 0.35, k * bar * SR)
            add(mus, lp(saw(midi(root - 24 + chord[0]), int(bar * SR), 0.004), 400) * 0.35, k * bar * SR)
            k += 1
        b = 0
        while b * beat < seconds:
            add(drm, tom(70) * 0.8, b * beat * SR)
            if b % 4 in (2,):
                add(drm, tom(110) * 0.6, (b + 0.5) * beat * SR)
            if b % 2 == 1:
                add(drm, snare(rng=rng) * 0.5, b * beat * SR)
            b += 1
    else:  # groove
        bpm = 112
        beat = 60 / bpm
        b = 0
        while b * beat < seconds:
            add(drm, kick(punch=0.8), b * beat * SR)
            if b % 2 == 1:
                add(drm, snare(rng=rng) * 0.6, b * beat * SR)
            add(drm, hat(rng=rng, open_=True) * 0.25, (b + 0.5) * beat * SR)
            b += 1
        k = 0
        while k * beat / 2 < seconds:
            chord = minor_prog[(int(k / 8)) % 4]
            pat = [0, None, 0, 12, None, 0, 7, None]
            p = pat[k % 8]
            if p is not None:
                f = midi(root - 24 + chord[0] + p)
                add(mus, lp(saw(f, int(beat / 2 * SR), 0.003), 700) * env_exp(int(beat / 2 * SR), 0.18) * 0.5, k * beat / 2 * SR)
            k += 1
        bar = beat * 4
        k = 0
        while k * bar < seconds:
            chord = minor_prog[k % 4]
            for j in (0.5, 1.5, 2.5, 3.5):
                fr = [midi(root + 12 + c) for c in chord]
                add(mus, pad(fr, int(beat * 0.4 * SR), 3000, 0.006) * 0.18, (k * bar + j * beat) * SR)
            k += 1

    mix = 0.75 * mus + 0.6 * drm
    mix = np.tanh(mix * 1.2)
    mix /= np.max(np.abs(mix)) + 1e-9
    # fades
    f = int(0.5 * SR)
    mix[:f] *= np.linspace(0, 1, f)
    mix[-f:] *= np.linspace(1, 0, f)
    return (mix * 0.85 * 32767).astype(np.int16)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--mood", default="suspense")
    ap.add_argument("--seconds", type=float, default=30)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data = render(a.mood, a.seconds, a.seed)
    st = np.repeat(data[:, None], 2, axis=1)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(st.tobytes())
    print(a.out, a.mood)
