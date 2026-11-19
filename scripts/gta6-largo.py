#!/usr/bin/env python3
"""Construye el vídeo largo de GTA 6: voz gratis (edge-tts) frase a frase y tiempos.

    python3 scripts/gta6-largo.py   -> content/gta6/largo.json + public/gta6/audio/largo-voz.wav
"""
import json, os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = json.load(open(os.path.join(ROOT, "content/gta6/largo-plan.json")))
AUD = os.path.join(ROOT, "public/gta6/audio"); tmp = os.path.join(AUD, "tmp_largo"); os.makedirs(tmp, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def silence(p, L): subprocess.run(["ffmpeg","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(L,0.01):.3f}",p],check=True)
t = 0.6; beats = []; caps = []; pieces = []; prev = 0.0
for i, ln in enumerate(plan["lines"]):
    b = {k: v for k, v in ln.items() if k not in ("t",)}
    if "video" in ln:
        s = t; e = t + ln["dur"] + 0.3; t = e
        b.update(s=round(s, 2), e=round(e, 2)); beats.append(b); continue
    raw = os.path.join(tmp, f"{i}.mp3"); wav = os.path.join(tmp, f"{i}.wav")
    if not os.path.exists(wav):
        cmd = ["edge-tts","--voice",plan["voice"],f"--rate={plan['rate']}",f"--pitch={plan['pitch']}","--text",ln["t"],"--write-media",raw]
        if proxy: cmd[1:1] = ["--proxy", proxy]
        subprocess.run(cmd, check=True, capture_output=True)
        af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        subprocess.run(["ffmpeg","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",wav], check=True)
    L = dur(wav)
    lead = 0.35 if ln.get("chapter") else 0.0
    s = t + lead
    p = os.path.join(tmp, f"sil{i}.wav"); silence(p, s - prev); pieces += [p, wav]; prev = s + L
    tail = 0.55 if ln.get("chapter") else (0.3 if re.search(r"[.?!…]$", ln["t"]) else 0.12)
    e = s + L + tail
    b.update(s=round(t, 2), e=round(e, 2)); beats.append(b)
    caps.append({"t": ln["t"], "s": round(s, 2), "e": round(s + L + 0.1, 2)})
    t = e
total = round(t + 1.5, 2)
beats[-1]["e"] = total
lst = os.path.join(tmp, "list.txt")
open(lst, "w").write("".join(f"file '{p}'\n" for p in pieces))
out = os.path.join(AUD, "largo-voz.wav")
subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",lst,"-ar","44100","-ac","1",out], check=True)
props = {"beats": beats, "captions": caps, "voice": "gta6/audio/largo-voz.wav", "chapters": plan["chapters"], "total": total}
json.dump(props, open(os.path.join(ROOT, "content/gta6/largo.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps({"total": total, "beats": len(beats)}))
