#!/usr/bin/env python3
"""Royalty-free background music generator (procedural, numpy only).

Every track is synthesised from scratch, so there is no copyright to worry
about. A seed picks key, tempo, chord progression and instrumentation, so
each video gets its own tune.

    python3 scripts/musica.py --seed 7 --seconds 30 --out public/daily/x/musica.wav
"""
import argparse
import wave

import numpy as np

SR = 44100
KEYS = {"C": 60, "D": 62, "E": 64, "F": 65, "G": 67, "A": 57, "Bb": 58}
PROGRESSIONS = [
    [0, 7, 9, 5],  # I V vi IV
    [9, 5, 0, 7],  # vi IV I V
    [0, 9, 5, 7],  # I vi IV V
    [0, 5, 9, 7],  # I IV vi V
]
MINOR_DEGREES = {9}  # vi is minor


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, d=0.2, s=0.0, length=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * (s + (1 - s) * np.exp(-t / d))
    return e


def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    f = freq * (1 + detune)
    return 2 * ((t * f) % 1) - 1


def add(buf, sig, start):
    end = min(len(buf), start + len(sig))
    if start < len(buf):
        buf[start:end] += sig[: end - start]


def make(seed, seconds):
    rng = np.random.default_rng(seed)
    key = list(KEYS.values())[seed % len(KEYS)]
    bpm = int(rng.integers(98, 122))
    prog = PROGRESSIONS[seed % len(PROGRESSIONS)]
    bells = seed % 2 == 0  # christmas sleigh bells on even seeds
    beat = 60 / bpm
    n = int(seconds * SR)
    drums = np.zeros(n)
    bass = np.zeros(n)
    pad = np.zeros(n)
    lead = np.zeros(n)
    jingle = np.zeros(n)

    kick_len = int(0.25 * SR)
    t = np.arange(kick_len) / SR
    kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 12)
    sn_len = int(0.18 * SR)
    snare = rng.standard_normal(sn_len) * np.exp(-np.arange(sn_len) / SR * 22) * 0.5
    snare += np.sin(2 * np.pi * 190 * np.arange(sn_len) / SR) * np.exp(-np.arange(sn_len) / SR * 30) * 0.4
    hat_len = int(0.05 * SR)
    hat = np.diff(rng.standard_normal(hat_len + 1)) * np.exp(-np.arange(hat_len) / SR * 90) * 0.12
    jl = int(0.12 * SR)
    tj = np.arange(jl) / SR
    jbell = (np.sin(2 * np.pi * 5200 * tj) + np.sin(2 * np.pi * 7100 * tj) * 0.6) * rng.standard_normal(jl) * 0.25 * np.exp(-tj * 35)

    steps = int(seconds / (beat / 4)) + 1
    for s in range(steps):
        pos = int(s * beat / 4 * SR)
        st = s % 16
        bar = s // 16
        intro = bar == 0
        if st in (0, 8) or (st == 10 and seed % 3 == 0):
            add(drums, kick * (0.6 if intro else 1.0), pos)
        if st in (4, 12) and not intro:
            add(drums, snare, pos)
        if st % 2 == 0:
            add(drums, hat * (1.3 if st % 4 == 2 else 0.8), pos)
        if bells and st % 2 == 1:
            add(jingle, jbell, pos)

    chord_len = int(4 * beat * SR)
    bars = int(seconds / (4 * beat)) + 1
    arp_patterns = [[0, 2, 1, 2, 0, 2, 1, 3], [0, 1, 2, 3, 2, 1, 0, 1], [2, 1, 0, 1, 2, 3, 2, 1]]
    arp = arp_patterns[seed % len(arp_patterns)]
    for b in range(bars):
        deg = prog[b % len(prog)]
        root = key + deg - 12
        third = 3 if deg in MINOR_DEGREES else 4
        notes = [root + 12, root + 12 + third, root + 19, root + 24]
        start = int(b * 4 * beat * SR)
        # pad
        p = np.zeros(chord_len)
        for nn in notes[:3]:
            p += saw(midi(nn), chord_len, 0.003) + saw(midi(nn), chord_len, -0.004)
        p = onepole_lp(p * 0.06, 900) * env(chord_len, a=0.25, d=3.0, s=0.4)
        add(pad, p, start)
        # bass on 8ths
        for e in range(8):
            ln = int(beat / 2 * SR)
            tt = np.arange(ln) / SR
            f0 = midi(root - 12)
            sig = (np.sin(2 * np.pi * f0 * tt) + 0.3 * np.sin(4 * np.pi * f0 * tt)) * np.exp(-tt * 6) * 0.35
            add(bass, sig, start + e * ln)
        # pluck arpeggio (from bar 2 on)
        if b >= 1:
            for e in range(8):
                ln = int(beat / 2 * SR)
                tt = np.arange(ln) / SR
                f0 = midi(notes[arp[e]] + 12)
                sig = (np.sin(2 * np.pi * f0 * tt) + 0.25 * np.sin(6 * np.pi * f0 * tt)) * np.exp(-tt * 9) * 0.16
                add(lead, sig, start + e * ln)

    mix = drums * 0.9 + bass + pad + lead + jingle * 0.5
    # simple stereo widening with a short delay on the pad/lead
    d = int(0.012 * SR)
    left = mix + np.concatenate([np.zeros(d), (pad + lead)[:-d]]) * 0.25
    right = mix + (pad + lead) * 0.25
    st = np.stack([left, right], axis=1)
    # fades
    fade = int(1.0 * SR)
    st[:fade] *= np.linspace(0, 1, fade)[:, None]
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st /= np.max(np.abs(st)) + 1e-9
    return (st * 0.85 * 32767).astype(np.int16), bpm


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--seconds", type=float, default=30)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data, bpm = make(a.seed, a.seconds)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"{a.out} bpm={bpm}")


if __name__ == "__main__":
    main()
