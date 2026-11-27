#!/usr/bin/env python3
"""Efecto 3D (parallax por profundidad) para el canal de historias.
    python3 scripts/parallax.py content/historia/X.json      -> crea public/historia/clips/X_<n>.mp4 por escena
Calcula la profundidad de cada imagen (Depth-Anything V2 Small, CPU) y genera un clip donde la cámara
se mueve en 3D: lo cercano se desplaza más que el fondo, con zoom suave y "respiración" del primer plano.
"""
import json, os, subprocess, sys, math
import numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public/historia/img"); DEP = os.path.join(ROOT, "public/historia/depth"); CL = os.path.join(ROOT, "public/historia/clips")
os.makedirs(DEP, exist_ok=True); os.makedirs(CL, exist_ok=True)
_p = None
def depth(key):
    f = os.path.join(DEP, key + ".png")
    if not os.path.exists(f):
        global _p
        if _p is None:
            from transformers import pipeline
            _p = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
        _p(Image.open(os.path.join(IMG, key + ".jpg")))["depth"].save(f)
    d = cv2.imread(f, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0
    return d
MOVES = [  # (dx, dy, zoom_from, zoom_to)  dx/dy = desplazamiento máx. en % del ancho
    (0.035, 0.0, 1.06, 1.14), (-0.035, 0.008, 1.12, 1.05), (0.0, -0.025, 1.05, 1.16),
    (0.03, 0.015, 1.15, 1.07), (-0.025, -0.015, 1.06, 1.12), (0.02, 0.0, 1.04, 1.2),
]
def render(key, out, dur, W, H, move, fps=30, strength=1.0):
    img = cv2.imread(os.path.join(IMG, key + ".jpg"))
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
    d = cv2.resize(depth(key), (W, H), interpolation=cv2.INTER_LINEAR)
    d = cv2.GaussianBlur(d, (0, 0), 3)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())
    near = d ** 1.4
    dx, dy, z0, z1 = MOVES[move % len(MOVES)]
    n = max(2, int(round(dur * fps)))
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W / 2, H / 2
    proc = subprocess.Popen(["ffmpeg","-nostdin","-y","-v","error","-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r",str(fps),"-i","-","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",out], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / (n - 1)
        e = 0.5 - 0.5 * math.cos(math.pi * t)
        z = z0 + (z1 - z0) * e
        ox = (e - 0.5) * 2 * dx * W * strength
        oy = (e - 0.5) * 2 * dy * H * strength
        breath = 1 + 0.012 * math.sin(t * math.pi * 2)
        zz = z * (1 + (breath - 1) * near)
        mx = cx + (xs - cx) / zz - ox * near
        my = cy + (ys - cy) / zz - oy * near
        frame = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close(); proc.wait()
if __name__ == "__main__":
    props = sys.argv[1]; name = os.path.basename(props)[:-5]
    d = json.load(open(props)); W, H = (1080, 1920) if d.get("vertical") else (1920, 1080)
    for i, sc in enumerate(d["scenes"]):
        out = os.path.join(CL, f"{name}_{i}.mp4")
        dur = sc["e"] - sc["s"] + 0.2
        if not os.path.exists(out): render(sc["img"], out, dur, W, H, sc.get("move", i))
        sc["vid"] = f"historia/clips/{name}_{i}.mp4"
        print("clip", i, flush=True)
    json.dump(d, open(props, "w"), ensure_ascii=False, indent=1)
