#!/usr/bin/env python3
"""Vídeo largo estilo análisis / tier list (composición GTA6Doc).

    python3 scripts/gta6-doc-build.py content/gta6/docA-plan.json content/gta6/docA.json docA
Líneas con "t" llevan voz (edge-tts, gratis). Líneas con "play" reproducen un clip
con su audio original y un subtítulo traducido ("sub").
"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan_p, out_p, name = sys.argv[1:4]
plan = json.load(open(plan_p))
AUD = os.path.join(ROOT, "public/gta6/audio"); tmp = os.path.join(AUD, "tmp_" + name); os.makedirs(tmp, exist_ok=True)
GP = os.path.join(ROOT, "public/gta6/gp"); TH = os.path.join(ROOT, "public/gta6/thumbs"); os.makedirs(TH, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def silence(p, L): subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(L,0.01):.3f}",p],check=True)
t = 0.0; scenes = []; caps = []; pieces = []; prev = 0.0
for i, ln in enumerate(plan["lines"]):
    sc = {k: v for k, v in ln.items() if k not in ("t", "play", "sub", "voice", "rate", "pitch", "dub")}
    if "play" in ln:
        L = dur(os.path.join(GP, ln["play"] + ".mp4"))
        s = t + 0.15; e = s + L
        sc.update(kind="clip", clips=[ln["play"]], vol=0, s=round(t, 2), e=round(e, 2), sfx=[])
        if ln.get("label"): sc["label"] = ln["label"]
        scenes.append(sc); caps.append({"t": ln["sub"], "s": round(s, 2), "e": round(e - 0.05, 2)})
        t = e + 0.2; continue
    raw = os.path.join(tmp, f"{i}.mp3"); wav = os.path.join(tmp, f"{i}.wav"); key = os.path.join(tmp, f"{i}.txt")
    if not (os.path.exists(wav) and os.path.exists(key) and open(key).read() == ln.get("voice","") + ln.get("rate",plan["rate"]) + ln.get("pitch",plan["pitch"]) + ln["t"]):
        cmd = ["edge-tts","--voice",ln.get("voice",plan["voice"]),f"--rate={ln.get('rate',plan['rate'])}",f"--pitch={ln.get('pitch',plan['pitch'])}","--text",ln["t"],"--write-media",raw]
        if proxy: cmd[1:1] = ["--proxy", proxy]
        subprocess.run(cmd, check=True, capture_output=True)
        af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",wav], check=True)
        open(key, "w").write(ln.get("voice","") + ln.get("rate",plan["rate"]) + ln.get("pitch",plan["pitch"]) + ln["t"])
    L = dur(wav)
    lead = 0.4 if ln.get("kind") == "chapter" else (0.25 if ln.get("kind") == "tier" else 0.05)
    s = t + lead
    p = os.path.join(tmp, f"sil{i}.wav"); silence(p, s - prev); pieces += [p, wav]; prev = s + L
    tail = 0.6 if ln.get("kind") == "chapter" else (1.4 if ln.get("kind") == "tier" else (0.28 if re.search(r"[.?!…]$", ln["t"]) else 0.12))
    e = s + L + tail
    sc.update(s=round(t, 2), e=round(e, 2))
    if ln.get("kind") == "tier": sc["reveal"] = round(lead + L - 0.35, 2)
    scenes.append(sc)
    caps.append({"t": ("«" + ln["t"] + "»") if ln.get("dub") else ln["t"], "s": round(s, 2), "e": round(s + L + 0.1, 2)})
    t = e
# fill the voice track up to the end and add silence where clips play
total = round(t + 1.5, 2); scenes[-1]["e"] = total
p = os.path.join(tmp, "silend.wav"); silence(p, total - prev); pieces.append(p)
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{x}'\n" for x in pieces))
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","concat","-safe","0","-i",lst,"-ar","44100","-ac","1",os.path.join(AUD, name + "-voz.wav")], check=True)
clip = {}
for f in os.listdir(GP):
    if f.endswith(".mp4"):
        try: clip[f[:-4]] = round(dur(os.path.join(GP, f)), 2)
        except ValueError: pass
# thumbnails for tier items
for sc in scenes:
    tr = sc.get("tier")
    if tr and not os.path.exists(os.path.join(TH, tr["thumb"] + ".jpg")):
        src = os.path.join(GP, tr["thumb"] + ".mp4")
        subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(min(1.0, clip.get(tr["thumb"], 2) / 2)),"-i",src,"-frames:v","1","-vf","scale=320:180",os.path.join(TH, tr["thumb"] + ".jpg")], check=True)
props = {"theme": plan["theme"], "scenes": scenes, "captions": caps, "voice": f"gta6/audio/{name}-voz.wav", "total": total, "clipLen": clip, "clipVolume": plan.get("clipVolume", 0), "brand": plan.get("brand")}
json.dump(props, open(out_p, "w"), ensure_ascii=False, indent=1)
m, s_ = divmod(int(total), 60)
print(json.dumps({"out": out_p, "total": total, "mmss": f"{m}:{s_:02d}", "scenes": len(scenes)}))
