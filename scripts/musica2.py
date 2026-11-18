#!/usr/bin/env python3
"""Procedural royalty-free track with a build-up and a DROP at a given time.

Structure: soft filtered intro -> build (snare roll + riser) -> DROP (four-on-
the-floor kick, claps, off-beat bass with sidechain pumping, open chords,
catchy pluck hook, sleigh bells) -> fade out.

    python3 scripts/musica2.py --seed 3 --seconds 21 --drop 8.1 --out x.wav
"""
import argparse
import wave

import numpy as np

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, cutoff):
    """One-pole low-pass; cutoff may be an array (sweeps)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def add(buf, sig, start):
    if start >= len(buf) or start + len(sig) <= 0:
        return
    s0 = max(0, start)
    e = min(len(buf), start + len(sig))
    buf[s0:e] += sig[s0 - start : e - start]


def make(seed, seconds, drop):
    rng = np.random.default_rng(seed)
    bpm = [120, 122, 124, 126][seed % 4]
    beat = 60 / bpm
    key = [57, 60, 62, 64, 65][seed % 5]  # A, C, D, E, F
    prog = [[0, 7, 9, 5], [9, 5, 0, 7], [0, 9, 5, 7]][seed % 3]
    n = int(seconds * SR)
    t_all = np.arange(n) / SR
    # the grid is anchored so that a bar line falls exactly on the drop
    bar = 4 * beat
    t0 = drop - np.ceil(drop / bar) * bar  # <= 0
    in_drop = t_all >= drop

    drums = np.zeros(n)
    bass = np.zeros(n)
    pad = np.zeros(n)
    lead = np.zeros(n)
    fx = np.zeros(n)

    # --- one-shots ---
    kl = int(0.3 * SR)
    tk = np.arange(kl) / SR
    kick = np.sin(2 * np.pi * (45 + 110 * np.exp(-tk * 28)) * tk) * np.exp(-tk * 9) * 1.1
    cl = int(0.2 * SR)
    tc = np.arange(cl) / SR
    clap = rng.standard_normal(cl) * (np.exp(-tc * 30) + 0.6 * np.exp(-np.maximum(tc - 0.012, 0) * 30) * (tc > 0.012)) * 0.35
    clap = np.diff(np.concatenate([[0], clap])) * 2.0
    hl = int(0.04 * SR)
    hat = np.diff(rng.standard_normal(hl + 1)) * np.exp(-np.arange(hl) / SR * 110) * 0.10
    ol = int(0.18 * SR)
    ohat = np.diff(rng.standard_normal(ol + 1)) * np.exp(-np.arange(ol) / SR * 18) * 0.08
    jl = int(0.12 * SR)
    tj = np.arange(jl) / SR
    bell = (np.sin(2 * np.pi * 5200 * tj) + 0.6 * np.sin(2 * np.pi * 7400 * tj)) * rng.standard_normal(jl) * 0.18 * np.exp(-tj * 30)

    steps = int((seconds - t0) / (beat / 4)) + 1
    duck = np.ones(n)
    for s in range(steps):
        tpos = t0 + s * beat / 4
        pos = int(round(tpos * SR))
        if pos < 0:
            continue
        st = s % 16
        if tpos >= drop:
            if st % 4 == 0:
                add(drums, kick, pos)
                dl = int(beat * 0.6 * SR)
                env = 1 - 0.75 * np.exp(-np.arange(dl) / SR * 9)
                e = min(n, pos + dl)
                duck[pos:e] = np.minimum(duck[pos:e], env[: e - pos])
            if st in (4, 12):
                add(drums, clap, pos)
            if st % 4 == 2:
                add(drums, ohat, pos)
            add(drums, hat * (1.2 if st % 2 else 0.7), pos)
            if st % 2 == 1:
                add(fx, bell, pos)
        else:
            # intro / build: soft kick on 1, hats; snare roll the last bar
            if st == 0 and tpos >= bar:
                add(drums, kick * 0.6, pos)
            if st % 4 == 2:
                add(drums, hat * 0.8, pos)
            if tpos >= drop - bar:
                k = int((tpos - (drop - bar)) / bar * 4)  # 0..3, density rises
                if s % max(1, 4 >> k) == 0:
                    add(drums, clap * (0.4 + 0.15 * k), pos)

    # --- harmony ---
    bars = int((seconds - t0) / bar) + 1
    hook = [[0, 7, 12, 7, 15, 12, 7, 10], [12, 10, 7, 10, 12, 15, 12, 7], [7, 12, 15, 12, 10, 7, 5, 7]][seed % 3]
    for b in range(bars):
        deg = prog[b % len(prog)]
        root = key + deg - 12
        third = 3 if deg == 9 else 4
        start = int(round((t0 + b * bar) * SR))
        L = int(bar * SR)
        tt = np.arange(L) / SR
        chord = np.zeros(L)
        for off in (0, third, 7, 12):
            f0 = midi(root + 12 + off)
            for det in (-0.006, 0.0, 0.007):
                chord += 2 * ((tt * f0 * (1 + det)) % 1) - 1
        chord *= 0.025
        add(pad, chord, start)
        # off-beat house bass
        for e in range(8):
            if e % 2 == 1:
                bl = int(beat / 2 * SR)
                tb = np.arange(bl) / SR
                f0 = midi(root - 12)
                sig = (np.sin(2 * np.pi * f0 * tb) + 0.5 * np.sin(4 * np.pi * f0 * tb) + 0.25 * (2 * ((tb * f0) % 1) - 1)) * np.exp(-tb * 5) * 0.32
                add(bass, sig, start + int(e * beat / 2 * SR))
        # pluck hook (8ths)
        for e in range(8):
            pl = int(beat / 2 * SR)
            tp = np.arange(pl) / SR
            f0 = midi(key + 12 + hook[e])
            sig = (np.sin(2 * np.pi * f0 * tp) + 0.3 * np.sin(6 * np.pi * f0 * tp)) * np.exp(-tp * 11) * 0.13
            add(lead, sig, start + int(e * beat / 2 * SR))

    # filter sweep: closed in intro, opening through the build, wide open at the drop
    cut = np.where(in_drop, 5000.0, 350 + 2500 * np.clip((t_all - (drop - 2 * bar)) / (2 * bar), 0, 1))
    pad = lp(pad, cut)
    lead = lp(lead, np.where(in_drop, 9000.0, cut))
    lead *= np.where(in_drop, 1.0, 0.55)
    bass *= np.where(in_drop, 1.0, 0.35)
    pad *= duck
    bass *= duck

    # riser into the drop + impact
    rl = int(min(drop, 2 * bar) * SR)
    tr = np.arange(rl) / SR
    riser = rng.standard_normal(rl) * (tr / tr[-1]) ** 2 * 0.22
    riser = lp(riser, 800 + 7000 * (tr / tr[-1]))
    add(fx, riser, int(drop * SR) - rl)
    il = int(1.2 * SR)
    ti = np.arange(il) / SR
    impact = (np.sin(2 * np.pi * (40 + 60 * np.exp(-ti * 8)) * ti) * np.exp(-ti * 3) * 0.9 + rng.standard_normal(il) * np.exp(-ti * 6) * 0.15)
    add(fx, impact, int(drop * SR))

    mix = drums + bass + pad + lead + fx
    d = int(0.015 * SR)
    wide = np.concatenate([np.zeros(d), (pad + lead)[:-d]]) * 0.3
    st = np.stack([mix + wide, mix - wide * 0.6 + (pad + lead) * 0.3], axis=1)
    fade = int(1.0 * SR)
    st[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))[:, None]
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.4) / np.tanh(1.4)
    return (st * 0.9 * 32767).astype(np.int16), bpm, drop


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--seconds", type=float, default=20)
    ap.add_argument("--drop", type=float, default=8)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data, bpm, drop = make(a.seed, a.seconds, a.drop)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"{a.out} bpm={bpm} drop={drop:.2f}s")


if __name__ == "__main__":
    main()
