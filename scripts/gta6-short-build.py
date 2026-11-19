#!/usr/bin/env python3
"""Short de gameplay: voz gratis (edge-tts) frase a frase -> props para GTA6Short.

    python3 scripts/gta6-short-build.py content/gta6/short3-plan.json content/gta6/short3.json voz3
"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan_p, out_p, name = sys.argv[1:4]
plan = json.load(open(plan_p))
AUD = os.path.join(ROOT, "public/gta6/audio"); tmp = os.path.join(AUD, "tmp_" + name); os.makedirs(tmp, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
FX = {"eco": "aecho=0.8:0.6:90|180:0.3|0.15", "grave": "asetrate=44100*0.88,aresample=44100,atempo=1.136", "radio": "highpass=f=300,lowpass=f=3400", "lento": "atempo=0.93"}
t = 0.05; scenes = []; caps = []; pieces = []; prev = 0.0
GP0 = os.path.join(ROOT, "public/gta6/gp")
for i, ln in enumerate(plan["lines"]):
    if "play" in ln:
        L = dur(os.path.join(GP0, ln["play"] + ".mp4"))
        sc = {k: v for k, v in ln.items() if k not in ("play", "sub")}
        sc.update(imgs=["v:" + ln["play"]], vol=1.0, full=True, s=0 if i == 0 else round(t, 2), e=round(t + 0.3 + L, 2), sfx=sc.get("sfx", []))
        sc.setdefault("title", [])
        scenes.append(sc); caps.append({"t": ln["sub"], "s": round(t + 0.15, 2), "e": round(t + 0.1 + L, 2), "full": True})
        t = t + 0.15 + L + 0.15; continue
    raw = os.path.join(tmp, f"{i}.mp3"); wav = os.path.join(tmp, f"{i}.wav")
    cmd = ["edge-tts","--voice",ln.get("voice",plan.get("voice","es-ES-AlvaroNeural")),f"--rate={ln.get('rate',plan['rate'])}",f"--pitch={ln.get('pitch',plan['pitch'])}","--text",ln["t"],"--write-media",raw]
    if proxy: cmd[1:1] = ["--proxy", proxy]
    subprocess.run(cmd, check=True, capture_output=True)
    af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    if ln.get("fx"): af += "," + ",".join(FX[x] for x in ln["fx"])
    subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",wav], check=True)
    L = dur(wav)
    sil = os.path.join(tmp, f"s{i}.wav")
    subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(t-prev,0.01):.3f}",sil], check=True)
    pieces += [sil, wav]; prev = t + L
    e = t + L + (0.18 if re.search(r"[.?!…]$", ln["t"]) else 0.08)
    sc = {k: v for k, v in ln.items() if k not in ("t", "rate", "pitch", "fx", "voice")}
    sc.setdefault("title", [])
    sc.update(s=0 if i == 0 else round(t, 2), e=round(e, 2), full=True)
    scenes.append(sc); caps.append({"t": ln["t"], "s": round(t, 2), "e": round(t + L + 0.1, 2)})
    t = e
scenes[-1]["e"] = round(t + 1.2, 2)
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in pieces))
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","concat","-safe","0","-i",lst,"-c:a","libmp3lame","-b:a","192k",os.path.join(AUD, name + ".mp3")], check=True)
gp = os.path.join(ROOT, "public/gta6/gp")
clip = {f[:-4]: round(dur(os.path.join(gp, f)), 2) for f in os.listdir(gp) if f.endswith(".mp4")}
props = {"scenes": scenes, "captions": caps, "voice": f"gta6/audio/{name}.mp3", "music": "gta6/audio/musica1.wav", "musicVolume": 0, "total": scenes[-1]["e"], "clipLen": clip, "gameVolume": 0.28}
json.dump(props, open(out_p, "w"), ensure_ascii=False, indent=1)
print(json.dumps({"out": out_p, "total": props["total"]}))
