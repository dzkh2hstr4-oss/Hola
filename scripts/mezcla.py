#!/usr/bin/env python3
"""Mezcla final: añade música de fondo que baja sola cuando hay voz (sidechain),
y normaliza a -14 LUFS para YouTube.

    python3 scripts/mezcla.py --video out/x.mp4 --out publicados/x.mp4 --gen musica --seeds 3,8,12 --mv 0.22
"""
import argparse, os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("--video", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--gen", default="musica"); ap.add_argument("--seeds", default="3,8,12")
ap.add_argument("--mv", type=float, default=0.2, help="volumen de la música antes del ducking")
ap.add_argument("--seg", type=float, default=150, help="segundos por pista")
ap.add_argument("--crf", default="21"); ap.add_argument("--maxrate", default="")
ap.add_argument("--ss", type=float, default=0.0, help="recortar el inicio del vídeo")
ap.add_argument("--music-file", default="", help="usar esta banda sonora en vez de generarla")
a = ap.parse_args()
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
L = dur(a.video) - a.ss
tmp = tempfile.mkdtemp()
seeds = [int(s) for s in a.seeds.split(",")]
n = max(1, int(L // a.seg) + 1)
parts = []
for i in range(0 if a.music_file else n):
    p = os.path.join(tmp, f"m{i}.wav")
    args = ["python3", os.path.join(ROOT, "scripts", a.gen + ".py"), "--seed", str(seeds[i % len(seeds)] + i * 17), "--seconds", str(a.seg + 4), "--out", p]
    if a.gen == "musica2": args += ["--drop", "6"]
    subprocess.run(args, check=True, capture_output=True)
    parts.append(p)
# chain crossfades
music = a.music_file or parts[0]
for i, p in enumerate(parts[1:]):
    o = os.path.join(tmp, f"x{i}.wav")
    subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",music,"-i",p,"-filter_complex","acrossfade=d=4:c1=tri:c2=tri",o], check=True)
    music = o
fc = (f"[1:a]atrim=0:{L:.2f},afade=t=in:d=1.5,afade=t=out:st={max(0, L-3):.2f}:d=3,volume={a.mv},aformat=sample_rates=44100:channel_layouts=stereo[m];"
      "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[v][key];"
      "[m][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400:makeup=1[md];"
      "[v][md]amix=inputs=2:normalize=0:duration=first,acompressor=threshold=0.25:ratio=2.5:attack=10:release=200,loudnorm=I=-14:TP=-1.5:LRA=9[out]")
vargs = ["-c:v","libx264","-crf",a.crf,"-preset","medium"]
if a.maxrate: vargs += ["-maxrate",a.maxrate,"-bufsize",str(int(a.maxrate[:-1])*2)+"M"]
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(a.ss),"-i",a.video,"-i",music,"-filter_complex",fc,"-map","0:v","-map","[out]",*vargs,"-c:a","aac","-b:a","192k","-ar","48000","-movflags","+faststart",a.out], check=True)
print(a.out, round(L, 1), "s", round(os.path.getsize(a.out)/1e6, 1), "MB")
