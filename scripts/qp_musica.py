#!/usr/bin/env python3
"""Música de fondo libre de derechos para los vídeos largos, generada por código.

Pop electrónico alegre con secciones que van cambiando cada 8 compases
(groove, melodía, rebote, respiro con redoble) para que no se haga pesada.

    python3 scripts/qp_musica.py --seed 1 --seconds 330 --out musica.wav
"""
import argparse
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((np.asarray(n) - 69) / 12)


def filt(x, f, kind="low", order=2):
    b, a = butter(order, np.clip(np.asarray(f) / (SR / 2), 1e-4, 0.99), btype=kind)
    return lfilter(b, a, x)


def add(buf, sig, start):
    s = int(start)
    if s >= len(buf) or s + len(sig) <= 0:
        return
    a = max(0, s)
    e = min(len(buf), s + len(sig))
    buf[a:e] += sig[a - s : e - s]


def env(n, a=0.005, d=0.2, s=0.0, r=0.05, length=None):
    t = np.arange(n) / SR
    length = length or n / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (s + (1 - s) * np.exp(-np.maximum(t - a, 0) / max(d, 1e-4)))
    e *= np.clip((length - t) / max(r, 1e-4), 0, 1)
    return e


def pluck(freq, dur, bright=1.0, nh=14):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, nh + 1):
        if k * freq > 16000:
            break
        out += np.sin(2 * np.pi * k * freq * t) / k * np.exp(-t * (3 + k * 2.2 / bright))
    return out * np.minimum(1, t / 0.003) * np.clip((dur - t) / 0.03, 0, 1)


def supersaw(freq, dur, nh=10, det=(-0.11, 0, 0.12)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for dc in det:
        f = freq * 2 ** (dc / 12)
        ph = np.random.rand() * 6.28
        for k in range(1, nh + 1):
            if k * f > 12000:
                break
            out += np.sin(2 * np.pi * k * f * t + ph * k) / k
    return out / len(det)


def make(seed, seconds):
    rng = np.random.default_rng(seed)
    np.random.seed(seed)
    bpm = [118, 124, 120, 126][seed % 4]
    beat = 60 / bpm
    bar = 4 * beat
    key = [60, 62, 57, 64][seed % 4]
    progs = [
        [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],  # I V vi IV
        [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]],  # vi IV I V
        [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],  # I vi IV V
    ]
    n = int(seconds * SR)
    drums, bass, chords, lead, pad, fx = (np.zeros(n) for _ in range(6))
    duck = np.ones(n)

    # one-shots
    tk = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * np.pi * np.cumsum(48 + 140 * np.exp(-tk * 30)) / SR) * np.exp(-tk * 8)
    kick += 0.3 * np.random.randn(len(tk)) * np.exp(-tk * 300)
    tc = np.arange(int(0.25 * SR)) / SR
    clap_n = np.random.randn(len(tc))
    clap = filt(clap_n, [900, 2600], "band") * (
        np.exp(-tc * 25) + 0.7 * (tc > 0.011) * np.exp(-np.maximum(tc - 0.011, 0) * 25) + 0.6 * (tc > 0.022) * np.exp(-np.maximum(tc - 0.022, 0) * 18)
    ) * 1.4
    snare = (filt(np.random.randn(len(tc)), 1800, "high") * np.exp(-tc * 22) + 0.5 * np.sin(2 * np.pi * 190 * tc) * np.exp(-tc * 30)) * 0.8
    th = np.arange(int(0.05 * SR)) / SR
    hat = filt(np.random.randn(len(th)), 7000, "high") * np.exp(-th * 90) * 0.5
    to = np.arange(int(0.25 * SR)) / SR
    ohat = filt(np.random.randn(len(to)), 6500, "high") * np.exp(-to * 14) * 0.35
    tsh = np.arange(int(0.08 * SR)) / SR
    shaker = filt(np.random.randn(len(tsh)), 5000, "high") * np.sin(np.pi * tsh / 0.08) ** 2 * 0.22

    # melody motifs (scale degrees in major pentatonic, relative to chord root)
    penta = [0, 2, 4, 7, 9, 12, 14, 16]
    motifs = []
    for m in range(3):
        rhythms = [[0, 1, 1.5, 2, 3, 3.5], [0, 0.5, 1.5, 2.5, 3], [0, 0.75, 1.5, 2, 2.5, 3.5], [0, 1, 2, 2.5, 3, 3.5]]
        rhythm = rhythms[int(rng.integers(len(rhythms)))]
        notes = [int(rng.choice(penta[:6])) for _ in rhythm]
        motifs.append(list(zip(rhythm, notes)))

    # section plan: 8 bars each
    kinds = ["intro", "groove", "lead", "bounce", "lead", "break", "groove", "bounce", "lead2", "break"]
    nbars = int(np.ceil(seconds / bar)) + 1
    for b in range(nbars):
        t_bar = b * bar
        sec = b // 8
        kind = kinds[min(sec, len(kinds) - 1)] if sec < len(kinds) else kinds[1 + (sec - 1) % (len(kinds) - 1)]
        prog = progs[(sec // 2 + seed) % len(progs)]
        ch = prog[b % 4]
        root = key + ch[0]
        last_bar = b % 8 == 7
        full = kind in ("groove", "lead", "bounce", "lead2")

        # --- drums ---
        for q in range(16):
            tq = t_bar + q * beat / 4
            st = int(tq * SR)
            if kind != "break" and kind != "intro":
                if kind == "bounce":
                    kpat = q in (0, 6, 8, 11, 14) if not last_bar else q in (0, 4, 8, 12)
                else:
                    kpat = q % 4 == 0
                if kpat:
                    add(drums, kick * 1.0, st)
                    dl = int(0.22 * SR)
                    e = min(n, st + dl)
                    if st < n:
                        duck[st:e] = np.minimum(duck[st:e], 0.35 + 0.65 * np.linspace(0, 1, e - st) ** 0.6)
                if q in (4, 12):
                    add(drums, clap * 0.75, st)
                if q % 2 == 1:
                    add(drums, ohat if (q % 4 == 2 and full) else hat * (0.9 if q % 4 == 2 else 0.6), st)
                if q % 2 == 0 and kind in ("lead", "lead2"):
                    add(drums, shaker, st)
            elif kind == "intro":
                if q % 2 == 0:
                    add(drums, hat * 0.5, st)
                if b % 8 >= 4 and q % 4 == 0:
                    add(drums, kick * 0.6, st)
            else:  # break: soft hats, then snare roll on the last bar
                if q % 2 == 1:
                    add(drums, hat * 0.45, st)
            if last_bar and kind in ("break", "intro"):
                step = 4 if q < 8 else (2 if q < 12 else 1)
                if q % max(1, step // 1) == 0 or q >= 12:
                    add(drums, snare * (0.3 + 0.5 * q / 16), st)
                if q >= 12:
                    add(drums, snare * 0.6, st + int(beat / 8 * SR))

        # --- bass ---
        bf = midi(root - 24)
        if kind != "intro":
            pattern = [2, 6, 10, 14] if kind in ("groove", "lead", "lead2") else ([0, 3, 6, 8, 10, 11, 14] if kind == "bounce" else [0, 8])
            for q in pattern:
                dur = beat / 4 * (1.6 if kind != "break" else 7)
                tt = np.arange(int(dur * SR)) / SR
                sig = np.sin(2 * np.pi * bf * tt) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * bf * 2 * tt)) * np.exp(-tt * 12)
                sig *= np.minimum(1, tt / 0.004) * np.clip((dur - tt) / 0.02, 0, 1)
                add(bass, sig * 0.55, (t_bar + q * beat / 4) * SR)

        # --- chords: plucky stabs (full) or pads (break/intro) ---
        notes = [key + c for c in ch]
        if full:
            stabs = [0, 1.5, 2.5, 3.5] if kind != "bounce" else [0.5, 1.5, 2.5, 3, 3.5]
            for sb in stabs:
                for nn in notes:
                    add(chords, pluck(midi(nn), beat * 0.9, bright=1.4) * 0.16, (t_bar + sb * beat) * SR)
        if kind in ("break", "intro", "lead2"):
            for nn in notes + [key + ch[0] - 12]:
                s = supersaw(midi(nn), bar + 0.1) * env(int((bar + 0.1) * SR), a=0.25, d=9, s=0.8, r=0.2) * 0.07
                add(pad, s, t_bar * SR)
        # arpeggio in bounce / break
        if kind in ("bounce", "break", "intro"):
            arp = notes + [notes[0] + 12, notes[1] + 12]
            for q in range(0, 16, 1 if kind == "bounce" else 2):
                nn = arp[(q * 3 + b) % len(arp)] + 12
                add(lead, pluck(midi(nn), beat * 0.4, bright=0.8, nh=6) * (0.09 if kind == "bounce" else 0.08), (t_bar + q * beat / 4) * SR)

        # --- lead melody ---
        if kind in ("lead", "lead2"):
            motif = motifs[(sec + b // 2) % len(motifs)] if b % 2 == 0 else motifs[(sec + 1) % len(motifs)]
            for pos, deg in motif:
                nn = key + 12 + deg + (ch[0] if ch[0] < 7 else ch[0] - 12)
                f0 = midi(nn)
                add(lead, pluck(f0, beat * 0.7, bright=2.0, nh=10) * 0.16, (t_bar + pos * beat) * SR)
                add(lead, pluck(f0 * 2, beat * 0.5, bright=1, nh=4) * 0.04, (t_bar + pos * beat) * SR)

        # riser into each new section
        if last_bar:
            L = int(bar * SR)
            tt = np.arange(L) / SR
            noise = np.random.randn(L)
            r = filt(noise, 2500, "high") * (tt / bar) ** 2.5 * 0.10
            add(fx, r, t_bar * SR)
        if b % 8 == 0 and b > 0:
            tt = np.arange(int(1.5 * SR)) / SR
            add(fx, filt(np.random.randn(len(tt)), 3000, "low") * np.exp(-tt * 3) * 0.25, t_bar * SR)

    # mix
    music = chords + lead * 1.0 + pad
    rv_t = np.arange(int(1.6 * SR)) / SR
    ir = np.random.randn(len(rv_t)) * np.exp(-rv_t * 3.2)
    ir = filt(ir, 5000, "low")
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(music, ir)[:n] * 0.25
    mix = drums * 0.6 + bass * duck * 0.9 + (music + wet) * 2.6 * (0.6 + 0.4 * duck) + fx * 1.2
    mix = filt(mix, 30, "high")
    # fades
    fade = int(2.5 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.4)
    mix /= np.max(np.abs(mix)) * 1.05
    return mix


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--seconds", type=float, default=60)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    m = make(a.seed, a.seconds)
    st = np.stack([m, m], 1)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
