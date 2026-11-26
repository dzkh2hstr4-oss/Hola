#!/usr/bin/env python3
"""Canal de historias animadas (composición StoryVid).
    python3 scripts/story-build.py content/historia/X-plan.json content/historia/X.json X
plan = {"vertical": bool, "voice": "es-MX-JorgeNeural", "rate": "+8%", "pitch": "+0Hz",
        "style": "...", "chars": {"leo": "descripción"}, "images": {"clave": "prompt con {leo}"},
        "lines": [{"t": "texto", "imgs": ["clave", ...], "fx": "impact", "rate": "+15%", "pitch": "+5Hz", "title": "..."}]}
Las imágenes que falten se generan gratis con FLUX (scripts/flux.py) en public/historia/img/<clave>.jpg
"""
import json, os, re, subprocess, sys, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("flux", os.path.join(ROOT, "scripts/flux.py")); flux = importlib.util.module_from_spec(spec); spec.loader.exec_module(flux)
MIC = "highpass=f=80,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=4,alimiter=limit=0.95"
plan_p, out_p, name = sys.argv[1:4]
plan = json.load(open(plan_p)); vert = plan.get("vertical", False)
IMG = os.path.join(ROOT, "public/historia/img"); os.makedirs(IMG, exist_ok=True)
AUD = os.path.join(ROOT, "public/historia/audio"); tmp = os.path.join(AUD, "tmp_" + name); os.makedirs(tmp, exist_ok=True)
W, H = (576, 1024) if vert else (1024, 576)
def prompt_of(k):
    p = plan["images"][k]
    for c, d in plan.get("chars", {}).items(): p = p.replace("{" + c + "}", d)
    return plan.get("style", "") + ", " + p
need = sorted({k for ln in plan["lines"] for k in ln.get("imgs", [])})
for i, k in enumerate(need):
    f = os.path.join(IMG, k + ".jpg")
    if os.path.exists(f): continue
    for att in range(3):
        try:
            flux.gen(f, prompt_of(k), W, H, 1000 + (abs(hash(k)) % 90000)); print("img", k, flush=True); break
        except SystemExit as e:
            print("fallo img", k, e, flush=True)
            if "quota" in str(e).lower() or "limit" in str(e).lower(): sys.exit("CUPO AGOTADO: " + str(e))
proxy = os.environ.get("HTTPS_PROXY")
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def silence(p, L): subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(L,0.01):.3f}",p],check=True)
t = 0.0; prev = 0.0; scenes = []; caps = []; pieces = []; sfx = []
for i, ln in enumerate(plan["lines"]):
    voice = ln.get("voice", plan["voice"]); rate = ln.get("rate", plan["rate"]); pitch = ln.get("pitch", plan.get("pitch", "+0Hz"))
    raw = os.path.join(tmp, f"{i}.mp3"); wav = os.path.join(tmp, f"{i}.wav"); key = os.path.join(tmp, f"{i}.txt"); sig = voice + rate + pitch + ln["t"]
    if not (os.path.exists(wav) and os.path.exists(key) and open(key).read() == sig):
        cmd = ["edge-tts", "--proxy", proxy, "--voice", voice, f"--rate={rate}", f"--pitch={pitch}", "--text", ln["t"], "--write-media", raw]
        for a in range(4):
            if subprocess.run(cmd, capture_output=True).returncode == 0: break
        else: sys.exit("tts falló: " + ln["t"])
        af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse," + MIC
        subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",wav], check=True)
        open(key, "w").write(sig)
    L = dur(wav); s = t + 0.05
    p = os.path.join(tmp, f"sil{i}.wav"); silence(p, s - prev); pieces += [p, wav]; prev = s + L
    pause = ln.get("pause", 0.55 if ln.get("fx") in ("impact", "dark") else (0.3 if re.search(r"[.?!…]$", ln["t"]) else 0.12))
    e = s + L + pause
    imgs = ln.get("imgs", []); n = max(1, len(imgs))
    for j, k in enumerate(imgs):
        a = t + (e - t) * j / n; b = t + (e - t) * (j + 1) / n
        sc = {"s": round(a, 2), "e": round(b, 2), "img": k}
        if j == 0 and ln.get("fx"): sc["fx"] = ln["fx"]
        if j == 0 and ln.get("title"): sc["title"] = ln["title"]
        if ln.get("move") is not None: sc["move"] = ln["move"]
        scenes.append(sc)
    caps.append({"t": ln["t"], "s": round(s, 2), "e": round(s + L + 0.05, 2)})
    for x in ln.get("sfx", []): sfx.append({"f": x["f"], "at": round(s + x.get("at", 0), 2), "v": x.get("v", 0.5)})
    t = e
total = round(t + 0.8, 2); scenes[-1]["e"] = total
p = os.path.join(tmp, "end.wav"); silence(p, total - prev); pieces.append(p)
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{x}'\n" for x in pieces))
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","concat","-safe","0","-i",lst,"-ar","44100","-ac","1",os.path.join(AUD, name + "-voz.wav")], check=True)
json.dump({"vertical": vert, "scenes": scenes, "captions": caps, "voice": f"historia/audio/{name}-voz.wav", "total": total, "sfx": sfx}, open(out_p, "w"), ensure_ascii=False, indent=1)
m, s_ = divmod(int(total), 60); print(json.dumps({"out": out_p, "total": total, "mmss": f"{m}:{s_:02d}", "scenes": len(scenes), "imgs": len(need)}))
