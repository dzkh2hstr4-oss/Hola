#!/usr/bin/env python3
"""Renderiza una composición larga por tramos (poca memoria) y los une.

    python3 scripts/render-tramos.py GTA6Doc content/gta6/docA.json out/gta6/raw/docA.mp4
"""
import json, os, subprocess, sys, glob
comp, props, out = sys.argv[1:4]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(props)); total = round(d["total"] * 30)
CH = 3600
tmp = out + ".parts"; os.makedirs(tmp, exist_ok=True)
B = glob.glob("/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell")[0]
parts = []
for i, a in enumerate(range(0, total, CH)):
    b = min(total - 1, a + CH - 1)
    p = os.path.join(tmp, f"p{i:02d}.mp4"); parts.append(p)
    if os.path.exists(p) and os.path.getsize(p) > 1000: continue
    for attempt in range(3):
        r = subprocess.run(["npx","remotion","render",comp,p,f"--props={props}",f"--frames={a}-{b}",f"--browser-executable={B}","--muted","--concurrency=2","--offthreadvideo-cache-size-in-bytes=400000000","--log=error"], cwd=ROOT)
        if r.returncode == 0: break
        print("reintento tramo", i, flush=True)
    else:
        sys.exit(f"falló el tramo {i}")
    print("tramo", i, "ok", flush=True)
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in parts))
vid = os.path.join(tmp, "video.mp4")
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","concat","-safe","0","-i",lst,"-c","copy",vid], check=True)
wav = os.path.join(tmp, "audio.wav")
if not os.path.exists(wav):
    subprocess.run(["npx","remotion","render",comp,wav,f"--props={props}","--codec=wav",f"--browser-executable={B}","--concurrency=2","--log=error"], cwd=ROOT, check=True)
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",vid,"-i",wav,"-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-b:a","256k","-shortest",out], check=True)
print("OK", out)
