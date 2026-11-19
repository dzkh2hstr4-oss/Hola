#!/usr/bin/env python3
"""Genera las voces del vídeo ElGolpeDelBalonDeOro con Piper (TTS local, gratis).
Uso: python3 scripts/voces_golpe.py <carpeta_modelos_piper>
Saca public/golpe/voz/s{escena}_{linea}.wav y public/golpe/voz/duraciones.json
"""
import json, os, re, subprocess, sys, wave
VOC = sys.argv[1]
SRC = "src/Golpe/Golpe.tsx"
OUT = "public/golpe/voz"
os.makedirs(OUT, exist_ok=True)
# quién -> (modelo, speaker, tono, velocidad)
VOICE = {
    "narr":  ("es_ES-davefx-medium", None, 0.94, 1.0),
    "cr7":   ("es_MX-ald-medium", None, 1.04, 0.9),
    "messi": ("es_MX-claude-high", None, 1.0, 1.0),
    "ney":   ("es_ES-sharvard-medium", 0, 1.10, 0.85),
    "benz":  ("es_ES-carlfm-x_low", None, 0.88, 1.05),
    "ramos": ("es_ES-sharvard-medium", 1, 0.9, 0.95),
    "villa": ("es_ES-davefx-medium", None, 0.78, 1.1),
}
src = open(SRC).read()
body = src[src.index("const S: SceneDef[]"):src.index("const INTRO")]
scenes = re.split(r"\n  // \d+ ·", body)[1:]
durs = {}
for si, sc in enumerate(scenes):
    for li, m in enumerate(re.finditer(r'\{ at: ([\d.]+), d: ([\d.]+), who: "(\w+)", text: "([^"]*)" \}', sc)):
        at, d, who, text = float(m[1]), float(m[2]), m[3], m[4]
        if text.startswith("*"):
            continue
        say = re.sub(r"[^\w\s¡!¿?.,:;áéíóúüñÁÉÍÓÚÜÑ'-]", " ", text.replace("…", ", ").replace("—", ", "))
        say = say.replace("SIUUUUUU", "SIUUUUU").lower() if "SIU" in say else say
        model, spk, pitch, speed = VOICE[who]
        raw = f"{OUT}/tmp.wav"
        cmd = ["piper", "-m", f"{VOC}/{model}.onnx", "-f", raw, "--length-scale", str(speed)]
        if spk is not None:
            cmd += ["-s", str(spk)]
        subprocess.run(cmd, input=say.encode(), check=True, capture_output=True)
        with wave.open(raw) as w:
            sr = w.getframerate()
        name = f"s{si}_{li}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
                        f"asetrate={int(sr*pitch)},aresample=44100,atempo={1/pitch:.4f},volume=1.6",
                        f"{OUT}/{name}"], check=True)
        with wave.open(f"{OUT}/{name}") as w:
            dur = w.getnframes() / w.getframerate()
        durs[f"{si}_{li}"] = round(dur, 2)
        flag = "  <-- LARGA" if dur > d else ""
        print(f"{si}_{li} {who:6} {dur:5.2f}s / {d}s{flag}")
os.remove(f"{OUT}/tmp.wav")
json.dump(durs, open(f"{OUT}/duraciones.json", "w"), indent=1)
