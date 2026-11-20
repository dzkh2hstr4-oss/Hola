#!/usr/bin/env python3
"""Línea de tiempo + mezcla de audio de un vídeo largo «¿Qué prefieres?».

Lee largos/<id>.json y la voz ya generada (scripts/qp_voz.py), calcula cuándo
pasa cada cosa a partir de la duración real de cada frase y escribe:

  public/qp/<id>/timeline.json   -> props de la composición QPLargo (Remotion)
  public/qp/<id>/audio.wav       -> voz + música (con ducking) + efectos, a -14 LUFS

    python3 scripts/qp_montaje.py largos/v1.json --seed 1
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np
import pyloudnorm
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qp_musica  # noqa: E402

SR = 44100
FPS = 30
CD = 5.0  # segundos de cuenta atrás
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.path.join(ROOT, "public", "wyr", "sfx")


def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(1)
        if w.getframerate() != SR:
            raise ValueError(f"{path}: {w.getframerate()} Hz")
    return x


def add(buf, sig, t, gain=1.0):
    s = int(round(t * SR))
    if s >= len(buf) or s < 0:
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s] * gain


# ---------- efectos sintetizados que faltan en public/wyr/sfx ----------

def synth_sfx():
    rng = np.random.default_rng(5)
    out = {}
    # aplauso + «¡uooh!» de público: muchas palmadas cortas de ruido filtrado
    L = int(2.2 * SR)
    ap = np.zeros(L)
    for _ in range(420):
        st = int(abs(rng.normal(0.35, 0.45)) * SR)
        if st >= L - 3000:
            continue
        n = int(0.012 * SR)
        tt = np.arange(n) / SR
        c = rng.standard_normal(n) * np.exp(-tt * 380)
        ap[st : st + n] += c * rng.uniform(0.3, 1.0)
    ap = sosfilt(butter(2, [700, 6000], "band", fs=SR, output="sos"), ap)
    ap *= np.minimum(1, np.arange(L) / (0.05 * SR)) * np.clip((L - np.arange(L)) / (0.9 * SR), 0, 1)
    out["applause"] = ap / np.max(np.abs(ap)) * 0.8
    # clic de ratón
    n = int(0.04 * SR)
    tt = np.arange(n) / SR
    click = (rng.standard_normal(n) * np.exp(-tt * 900) + np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 500)) * 0.6
    out["click"] = click
    # campanita de notificación (dos tonos)
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    bell = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * a for f, d, a in [(1568, 3, 0.5), (3136, 5, 0.2), (4700, 8, 0.1)])
    bell2 = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * a for f, d, a in [(2093, 3, 0.5), (4186, 5, 0.2)])
    b = np.zeros(n + int(0.12 * SR))
    b[:n] += bell
    b[int(0.12 * SR) :] += bell2
    out["bell"] = b * 0.6
    # contador rápido (ticks que suben de tono) mientras suben los porcentajes
    n = int(0.9 * SR)
    cnt = np.zeros(n)
    for k in range(18):
        st = int(k * 0.05 * SR)
        m = int(0.025 * SR)
        tt = np.arange(m) / SR
        cnt[st : st + m] += np.sin(2 * np.pi * (900 + k * 60) * tt) * np.exp(-tt * 160) * 0.35
    out["count"] = cnt
    # «swoosh» grave para transiciones
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    sw = rng.standard_normal(n)
    sw = sosfilt(butter(2, 1200, "low", fs=SR, output="sos"), sw) * np.sin(np.pi * tt / 0.6) ** 2
    out["swoosh"] = sw / np.max(np.abs(sw)) * 0.7
    # golpe de impacto con cola
    n = int(1.4 * SR)
    tt = np.arange(n) / SR
    hit = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-tt * 18)) / SR) * np.exp(-tt * 3.5)
    hit += sosfilt(butter(2, 3000, "low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-tt * 7) * 0.5
    out["impact"] = hit / np.max(np.abs(hit)) * 0.9
    return out


def load_sfx():
    s = {}
    for f in os.listdir(SFX_DIR):
        if f.endswith(".wav"):
            s[f[:-4]] = read_wav(os.path.join(SFX_DIR, f))
    s.update(synth_sfx())
    return s


def reaction(pa):
    d = abs(pa - (100 - pa))
    if d <= 4:
        return "¡EMPATE TÉCNICO!"
    if d <= 10:
        return "¡AJUSTADÍSIMO!"
    if d >= 40:
        return "¡PALIZA TOTAL!"
    if d >= 25:
        return "¡SIN DISCUSIÓN!"
    return "¡LA MAYORÍA HA HABLADO!"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("content")
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    d = json.load(open(a.content))
    vid = d["id"]
    base = os.path.join(ROOT, "public", "qp", vid)
    vdir = os.path.join(base, "voz")
    voice_cache = {}

    def vo(key):
        if key not in voice_cache:
            voice_cache[key] = read_wav(os.path.join(vdir, f"{key}.wav"))
        return voice_cache[key]

    def dur(key):
        return len(vo(key)) / SR

    placed = []  # (t, key)

    def say(key, t):
        placed.append((t, key))
        return t + dur(key)

    sfx_ev = []  # (t, name, gain)

    def fx(t, name, g=0.5):
        sfx_ev.append((t, name, g))

    segs = []
    t = 0.0
    # ----- gancho -----
    fx(0.0, "impact", 0.55)
    fx(0.05, "whoosh", 0.4)
    e = say("hook0", 0.6)
    e = say("hook1", e + 0.35)
    for k in range(10):
        fx(0.3 + k * 0.18, "pop", 0.25)
    fx(e - 1.4, "riser", 0.35)
    hook_end = e + 0.5
    segs.append({"type": "hook", "from": 0, "to": hook_end})
    t = hook_end

    levels = {lv["at"]: (i, lv) for i, lv in enumerate(d["levels"])}
    for i, q in enumerate(d["questions"]):
        n = f"{i + 1:02d}"
        if i == 10:
            st = t
            fx(st, "swoosh", 0.5)
            e = say("mid", st + 0.35)
            fx(st + 1.2, "click", 0.7)
            fx(st + 1.25, "pop", 0.4)
            fx(st + 2.2, "click", 0.7)
            fx(st + 2.25, "bell", 0.35)
            to = e + 0.6
            segs.append({"type": "mid", "from": st, "to": to})
            t = to
        if i in levels:
            li, lv = levels[i]
            st = t
            fx(st - 1.4, "riser", 0.3)
            fx(st, "impact", 0.55)
            fx(st + 0.1, "sparkle", 0.3)
            e = say(f"level{li}", st + 0.4)
            to = max(st + 2.6, e + 0.5)
            segs.append({"type": "level", "from": st, "to": to, "idx": li, "name": lv["name"], "emoji": lv["emoji"]})
            t = to
        st = t
        fx(st, "whoosh", 0.45)
        fx(st + 0.15, "swoosh", 0.35)
        a_at = st + 0.45
        fx(a_at, "pop", 0.45)
        e = say(f"q{n}a", a_at)
        b_at = e + 0.2
        fx(b_at, "pop", 0.45)
        e = say(f"q{n}b", b_at)
        cd_from = e + 0.35
        fx(cd_from, "zap", 0.3)
        say(f"q{n}go", cd_from + 0.1)
        for k in range(int(CD * 2)):
            fx(cd_from + k * 0.5, "tick" if k % 2 == 0 else "tock", 0.55)
        for k in range(int(CD)):
            fx(cd_from + k, "heart", 0.35 if k < 3 else 0.5)
        for k in (3, 4):
            fx(cd_from + k, "beep", 0.3)
        fx(cd_from + CD - 1.2, "redoble", 0.3)
        cd_to = cd_from + CD
        fx(cd_to, "beepfin", 0.35)
        rev = cd_to + 0.15
        fx(rev, "impact", 0.45)
        fx(rev + 0.05, "count", 0.5)
        fx(rev + 0.95, "ding", 0.45)
        fx(rev + 0.95, "applause", 0.32)
        fx(rev + 1.0, "sparkle", 0.25)
        e = say(f"q{n}r", rev + 0.4)
        to = e + 0.5
        fx(to - 0.3, "whoosh", 0.3)
        segs.append({
            "type": "q", "n": i + 1, "from": st, "to": to, "aAt": a_at, "bAt": b_at,
            "cdFrom": cd_from, "cdTo": cd_to, "revealAt": rev, "pa": q["pa"], "reaction": reaction(q["pa"]),
            "a": {"img": f"qp/{vid}/img/{n}a.png", "label": q["a"]["label"]},
            "b": {"img": f"qp/{vid}/img/{n}b.png", "label": q["b"]["label"]},
        })
        t = to
    # ----- final -----
    st = t
    fx(st - 1.4, "riser", 0.3)
    fx(st, "impact", 0.55)
    fx(st + 0.1, "sparkle", 0.35)
    e = st + 0.4
    outro_at = []
    for k in range(len(d["outro"])):
        outro_at.append(e)
        e = say(f"outro{k}", e) + 0.35
        fx(outro_at[-1], "pop", 0.35)
    fx(outro_at[-1] + 1.6, "click", 0.7)
    fx(outro_at[-1] + 1.65, "bell", 0.35)
    total = e + 2.6
    segs.append({"type": "outro", "from": st, "to": total, "lines": outro_at})

    # ---------- audio ----------
    N = int(total * SR) + SR
    voice = np.zeros(N)
    for tt, key in placed:
        add(voice, vo(key), tt)
    sfx_lib = load_sfx()
    sfx = np.zeros(N)
    for tt, name, g in sfx_ev:
        add(sfx, sfx_lib[name], tt, g)
    music = qp_musica.make(a.seed, N / SR)[:N]

    # ducking: la música baja cuando habla la voz (envolvente suavizada)
    win = int(0.03 * SR)
    def movsum(x, k):
        c = np.concatenate([[0.0], np.cumsum(x)])
        i = np.arange(len(x))
        lo = np.clip(i - k // 2, 0, len(x))
        hi = np.clip(i + k - k // 2, 0, len(x))
        return c[hi] - c[lo]

    lvl = np.sqrt(np.maximum(movsum(voice ** 2, win), 0) / win)
    active = (lvl > 0.01).astype(float)
    # extiende la actividad 0,25 s y suaviza (ataque rápido, salida lenta)
    k = int(0.25 * SR)
    active = movsum(active, k) > 0.5
    env = np.empty(N)
    g = 0.0
    up, down = 1 - np.exp(-1 / (0.06 * SR)), 1 - np.exp(-1 / (0.5 * SR))
    act = active.astype(float)
    # bucle vectorizado por bloques de 1 ms
    blk = SR // 1000
    for s in range(0, N, blk):
        target = act[s]
        c = up if target > g else down
        g += (target - g) * (1 - (1 - c) ** blk)
        env[s : s + blk] = g
    music_gain = 0.36 - 0.20 * env  # 0.36 sin voz, 0.16 con voz

    # voz: normalizada a -16 LUFS antes de mezclar
    meter = pyloudnorm.Meter(SR)
    v_l = meter.integrated_loudness(voice[voice != 0] if np.any(voice) else voice)
    voice *= 10 ** ((-16 - v_l) / 20)
    m_l = meter.integrated_loudness(music)
    music *= 10 ** ((-16 - m_l) / 20)
    mix = voice + music * music_gain * 1.6 + sfx * 0.8
    ms = music * music_gain * 1.6
    for name, x in (("voz", voice), ("musica", ms), ("efectos", sfx * 0.8)):
        print(f"  {name}: {meter.integrated_loudness(x):.1f} LUFS")
    # fundido final
    fade = int(2.2 * SR)
    end = int(total * SR)
    mix[end - fade : end] *= np.linspace(1, 0, fade)
    mix[end:] = 0
    mix = mix[:end]
    l = meter.integrated_loudness(mix)
    mix *= 10 ** ((-17 - l) / 20)  # mono a -17 = -14 LUFS en estéreo duplicado
    # limitador suave (picos por debajo de -1 dBFS)
    ceil = 10 ** (-1 / 20)
    over = np.abs(mix) > 0.7 * ceil
    mix[over] = np.sign(mix[over]) * (0.7 * ceil + 0.3 * ceil * np.tanh((np.abs(mix[over]) - 0.7 * ceil) / (0.3 * ceil)))
    st2 = np.stack([mix, mix], 1)
    os.makedirs(base, exist_ok=True)
    wav_path = os.path.join(base, "audio.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st2, -1, 1) * 32767).astype("<i2").tobytes())

    # ---------- timeline (en fotogramas) ----------
    fr = lambda s: int(round(s * FPS))  # noqa: E731
    out_segs = []
    for sgm in segs:
        o = dict(sgm)
        for kk in ("from", "to", "aAt", "bAt", "cdFrom", "cdTo", "revealAt"):
            if kk in o:
                o[kk] = fr(o[kk])
        if "lines" in o:
            o["lines"] = [fr(x) for x in o["lines"]]
        out_segs.append(o)
    tl = {
        "id": vid, "title": d["title"], "subtitle": d["subtitle"], "theme": d["theme"],
        "channel": "DILEMAZO", "scores": d["scores"], "nq": len(d["questions"]),
        "total": fr(total), "segments": out_segs,
        "thumbs": [f"qp/{vid}/img/{i + 1:02d}{s}.png" for i in range(len(d["questions"])) for s in "ab"],
    }
    json.dump(tl, open(os.path.join(base, "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{vid}: {total:.1f} s ({int(total // 60)}:{int(total % 60):02d}), {len(placed)} frases, {len(sfx_ev)} efectos")
    subprocess.run(["ffmpeg", "-hide_banner", "-i", wav_path, "-af", "ebur128=peak=true", "-f", "null", "-"], stderr=subprocess.PIPE)


if __name__ == "__main__":
    main()
