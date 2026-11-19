#!/usr/bin/env python3
"""Regenera la voz de un short de GTA 6 con edge-tts (gratis), frase a frase,
y reajusta escenas, subtítulos y efectos a los nuevos tiempos.

    python3 scripts/gta6-voz.py content/gta6/short1.json --out-name voz1e
"""
import json, os, subprocess, sys, argparse, re
ap = argparse.ArgumentParser()
ap.add_argument("json"); ap.add_argument("--out-name", required=True)
ap.add_argument("--voice", default="es-ES-AlvaroNeural")
ap.add_argument("--rate", default="+20%"); ap.add_argument("--pitch", default="+5Hz")
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, "public/gta6/audio"); tmp = os.path.join(AUD, "tmp_" + a.out_name); os.makedirs(tmp, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
d = json.load(open(a.json))
caps = d["captions"]
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
parts = []
for i, c in enumerate(caps):
    raw = os.path.join(tmp, f"{i}.mp3"); trim = os.path.join(tmp, f"{i}.wav")
    cmd = ["edge-tts","--voice",a.voice,f"--rate={a.rate}",f"--pitch={a.pitch}","--text",c["t"],"--write-media",raw]
    if proxy: cmd[1:1] = ["--proxy", proxy]
    subprocess.run(cmd, check=True, capture_output=True)
    af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    subprocess.run(["ffmpeg","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",trim], check=True)
    parts.append((trim, dur(trim)))
# layout
t = 0.05; new = []
for (f, L), c in zip(parts, caps):
    new.append((t, t + L)); gap = 0.22 if re.search(r"[.?!…]$", c["t"].strip()) else 0.1
    t += L + gap
voice_end = new[-1][1]
# concat with gaps
inputs = []; filt = []; k = 0
silence = os.path.join(tmp, "sil.wav")
items = []
prev = 0.0
for (f, L), (s, e) in zip(parts, new):
    items.append(("sil", s - prev)); items.append((f, L)); prev = e
lst = os.path.join(tmp, "list.txt")
with open(lst, "w") as fh:
    for j, (f, L) in enumerate(items):
        if f == "sil":
            p = os.path.join(tmp, f"s{j}.wav")
            subprocess.run(["ffmpeg","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(L,0.01):.3f}",p], check=True)
            fh.write(f"file '{p}'\n")
        else: fh.write(f"file '{f}'\n")
out = os.path.join(AUD, a.out_name + ".mp3")
subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-b:a","192k",out], check=True)
# remap scenes
old = [(c["s"], c["e"]) for c in caps]
def remap(t0):
    # piecewise-linear map old time -> new time using caption boundaries
    pts = [(0, 0)] + [(o[0], n[0]) for o, n in zip(old, new)] + [(old[-1][1], new[-1][1])]
    pts.sort()
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= t0 <= x1: return y0 if x1 == x0 else y0 + (t0 - x0) * (y1 - y0) / (x1 - x0)
    return pts[-1][1] + (t0 - pts[-1][0])
sc = d["scenes"]
for i, s in enumerate(sc):
    os_, oe = s["s"], s["e"]; ns = 0 if i == 0 else round(remap(os_), 2)
    ne = round(voice_end + 1.3, 2) if i == len(sc) - 1 else round(remap(oe), 2)
    r = (ne - ns) / max(0.01, oe - os_)
    for key in ("titleAt",):
        if key in s: s[key] = [round(x * r, 2) for x in s[key]]
    for o in s.get("overlays", []):
        if "at" in o: o["at"] = round(o["at"] * r, 2)
    for x in s.get("sfx", []):
        if "at" in x: x["at"] = round(x["at"] * r, 2)
    s["s"], s["e"] = ns, ne
d["captions"] = [{"t": c["t"], "s": round(n[0], 2), "e": round(n[1] + 0.15, 2)} for c, n in zip(caps, new)]
d["voice"] = f"gta6/audio/{a.out_name}.mp3"; d["total"] = sc[-1]["e"]
json.dump(d, open(a.json, "w"), ensure_ascii=False, indent=1)
print(json.dumps({"voice": out, "seconds": round(voice_end, 2), "total": d["total"]}))
