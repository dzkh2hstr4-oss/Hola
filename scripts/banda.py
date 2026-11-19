#!/usr/bin/env python3
"""Banda sonora por secciones: una canción distinta para cada momento del vídeo.

    python3 scripts/banda.py secciones.json salida.wav
secciones.json = [{"s": 0, "e": 36, "mood": "suspense", "seed": 1}, ...]
moods: suspense, accion, emotiva, epica, groove (musica3.py), chill (musica.py), fiesta (musica2.py)
"""
import json, os, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
secs = json.load(open(sys.argv[1])); out = sys.argv[2]
tmp = tempfile.mkdtemp(); XF = 2.0
parts = []
for i, s in enumerate(secs):
    L = s["e"] - s["s"] + (XF if i < len(secs) - 1 else 0.5)
    raw = os.path.join(tmp, f"r{i}.wav"); norm = os.path.join(tmp, f"n{i}.wav")
    m = s["mood"]; seed = str(s.get("seed", i + 1))
    if m == "chill":
        cmd = ["python3", f"{ROOT}/scripts/musica.py", "--seed", seed, "--seconds", f"{L:.2f}", "--out", raw]
    elif m == "fiesta":
        cmd = ["python3", f"{ROOT}/scripts/musica2.py", "--seed", seed, "--seconds", f"{L:.2f}", "--drop", "3", "--out", raw]
    else:
        cmd = ["python3", f"{ROOT}/scripts/musica3.py", "--mood", m, "--seed", seed, "--seconds", f"{L:.2f}", "--out", raw]
    subprocess.run(cmd, check=True, capture_output=True)
    subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",raw,"-af",f"loudnorm=I=-20:TP=-3:LRA=7,aresample=44100,aformat=channel_layouts=stereo,atrim=0:{L:.2f}",norm], check=True)
    parts.append(norm)
cur = parts[0]
for i, p in enumerate(parts[1:]):
    o = os.path.join(tmp, f"x{i}.wav")
    subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",cur,"-i",p,"-filter_complex",f"acrossfade=d={XF}:c1=qsin:c2=qsin",o], check=True)
    cur = o
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",cur,"-c:a","pcm_s16le",out], check=True)
print(out)
