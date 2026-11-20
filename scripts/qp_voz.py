#!/usr/bin/env python3
"""Narración de los vídeos largos «¿Qué prefieres?».

Genera cada frase por separado (voz neural es-ES) con su propia entonación,
la recorta y la guarda en public/qp/<id>/voz/<clave>.wav (44,1 kHz mono).

    python3 scripts/qp_voz.py largos/v1.json
"""
import asyncio
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import certifi

# el proxy del entorno re-firma TLS: usamos su CA (no se desactiva la verificación)
if os.path.exists("/root/.ccr/ca-bundle.crt"):
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts  # noqa: E402

VOICE = "es-ES-AlvaroNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# entonación por tipo de frase: (velocidad, tono)
STYLE = {
    "hook": ("+12%", "+4Hz"),
    "level": ("+12%", "+7Hz"),
    "a": ("+8%", "+3Hz"),
    "b": ("+8%", "+1Hz"),
    "go": ("+18%", "+9Hz"),
    "reveal": ("+12%", "+6Hz"),
    "mid": ("+12%", "+5Hz"),
    "outro": ("+10%", "+5Hz"),
}

GO = [
    "¡Tienes cinco segundos!", "¡Rápido, elige!", "¡Piénsalo bien!", "¡Decide ya!",
    "¡Corre, corre!", "¡Tic, tac, tic, tac!", "¡Venga, que se acaba el tiempo!", "¡Elige ya!",
    "¡Uy, esta es difícil!", "¡Sin hacer trampas, eh!", "¡Cinco segundos!", "¡Vamos, vamos!",
    "¡Esta duele!", "¡Rápido!", "¡Madre mía, qué difícil!", "¡No lo pienses tanto!",
    "¡Venga, elige!", "¡Se acaba el tiempo!", "¡Piénsalo!", "¡Última oportunidad!",
]


def lines(d):
    out = []
    for i, h in enumerate(d["hook"]):
        out.append((f"hook{i}", "hook", h))
    for i, lv in enumerate(d["levels"]):
        out.append((f"level{i}", "level", lv["say"]))
    out.append(("mid", "mid", d["mid"]))
    for i, q in enumerate(d["questions"]):
        n = f"{i + 1:02d}"
        out.append((f"q{n}a", "a", q["sayA"]))
        out.append((f"q{n}b", "b", q["sayB"]))
        off = sum(map(ord, d["id"])) % len(GO)  # cada vídeo, otro orden de coletillas
        out.append((f"q{n}go", "go", q.get("go", GO[(i * 7 + off) % len(GO)])))
        out.append((f"q{n}r", "reveal", q["reveal"]))
    for i, o in enumerate(d["outro"]):
        out.append((f"outro{i}", "outro", o))
    return out


def make(job):
    key, kind, text, folder = job
    wav = os.path.join(folder, f"{key}.wav")
    txt = wav + ".txt"
    rate, pitch = STYLE[kind]
    sig = f"{VOICE}|{rate}|{pitch}|{text}"
    if os.path.exists(wav) and os.path.exists(txt) and open(txt).read() == sig:
        return key, "cache"
    mp3 = os.path.join(folder, f"{key}.mp3")
    for attempt in range(4):
        try:
            asyncio.run(edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch).save(mp3))
            if os.path.getsize(mp3) > 1000:
                break
        except Exception as e:  # red inestable: reintenta
            print(key, "retry", e, file=sys.stderr)
    # recorta silencios del principio/final y normaliza el formato
    af = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
        "highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", af, "-ar", "44100", "-ac", "1", wav], check=True)
    os.remove(mp3)
    open(txt, "w").write(sig)
    return key, "ok"


def main():
    d = json.load(open(sys.argv[1]))
    folder = os.path.join(ROOT, "public", "qp", d["id"], "voz")
    os.makedirs(folder, exist_ok=True)
    jobs = [(k, kind, t, folder) for k, kind, t in lines(d)]
    with ThreadPoolExecutor(4) as ex:
        for key, st in ex.map(make, jobs):
            print(key, st, flush=True)


if __name__ == "__main__":
    main()
