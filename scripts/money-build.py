#!/usr/bin/env python3
"""Vídeos del canal de dinero (inglés). Composición MoneyVid.

    python3 scripts/money-build.py content/money/X-plan.json content/money/X.json X
plan = {"vertical": true, "voice": "en-US-AndrewNeural", "rate": "+8%", "pitch": "+0Hz", "mic": true,
        "brand": "MONEY DECODED", "lines": [{"t": "...", "kind": "hook", "title": "...", ...}, ...]}
Cada línea con "t" lleva voz (edge-tts). El resto de campos pasan a la escena.
"""
import json, os, re, subprocess, sys
MIC = "highpass=f=80,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=4,alimiter=limit=0.95"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan_p, out_p, name = sys.argv[1:4]
plan = json.load(open(plan_p))
AUD = os.path.join(ROOT, "public/money/audio"); tmp = os.path.join(AUD, "tmp_" + name); os.makedirs(tmp, exist_ok=True)
proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def silence(p, L): subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i","anullsrc=r=44100:cl=mono","-t",f"{max(L,0.01):.3f}",p],check=True)
t = 0.0; scenes = []; caps = []; pieces = []; prev = 0.0
for i, ln in enumerate(plan["lines"]):
    sc = {k: v for k, v in ln.items() if k not in ("t", "voice", "rate", "pitch", "say")}
    say = ln.get("say", ln["t"])
    voice = ln.get("voice", plan["voice"]); rate = ln.get("rate", plan["rate"]); pitch = ln.get("pitch", plan.get("pitch", "+0Hz"))
    raw = os.path.join(tmp, f"{i}.mp3"); wav = os.path.join(tmp, f"{i}.wav"); key = os.path.join(tmp, f"{i}.txt")
    sig = voice + rate + pitch + say
    if not (os.path.exists(wav) and os.path.exists(key) and open(key).read() == sig):
        cmd = ["edge-tts","--voice",voice,f"--rate={rate}",f"--pitch={pitch}","--text",say,"--write-media",raw]
        if proxy: cmd[1:1] = ["--proxy", proxy]
        for attempt in range(4):
            r = subprocess.run(cmd, capture_output=True)
            if r.returncode == 0: break
        else: sys.exit(r.stderr.decode()[-500:])
        af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" + ("," + MIC if plan.get("mic") else "")
        subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",raw,"-af",af,"-ar","44100","-ac","1",wav], check=True)
        open(key, "w").write(sig)
    L = dur(wav)
    lead = 0.35 if ln.get("kind") == "chapter" else 0.05
    s = t + lead
    p = os.path.join(tmp, f"sil{i}.wav"); silence(p, s - prev); pieces += [p, wav]; prev = s + L
    tail = ln.get("hold", 0.55 if ln.get("kind") == "chapter" else (0.25 if re.search(r"[.?!…]$", ln["t"]) else 0.1))
    e = s + L + tail
    sc.update(s=round(t, 2), e=round(e, 2)); scenes.append(sc)
    caps.append({"t": ln["t"], "s": round(s, 2), "e": round(s + L + 0.1, 2)})
    t = e
total = round(t + (1.2 if not plan.get("vertical") else 0.6), 2); scenes[-1]["e"] = total
p = os.path.join(tmp, "silend.wav"); silence(p, total - prev); pieces.append(p)
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{x}'\n" for x in pieces))
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-f","concat","-safe","0","-i",lst,"-ar","44100","-ac","1",os.path.join(AUD, name + "-voz.wav")], check=True)
props = {"vertical": plan.get("vertical", False), "scenes": scenes, "captions": caps, "voice": f"money/audio/{name}-voz.wav", "total": total, "brand": plan.get("brand")}
json.dump(props, open(out_p, "w"), ensure_ascii=False, indent=1)
m, s_ = divmod(int(total), 60)
print(json.dumps({"out": out_p, "total": total, "mmss": f"{m}:{s_:02d}", "scenes": len(scenes)}))
