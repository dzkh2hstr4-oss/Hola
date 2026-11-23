#!/usr/bin/env python3
"""Turns a still into a short vertical video with real 3D camera motion (depth parallax)
and living light effects, so reels never show a frozen photo.

  python3 scripts/animar-foto.py IN.png OUT.mp4 --segundos 3 --efecto aurora|atardecer|nada --cam push|pull|left|right|orbit

Depth: Depth Anything V2 small (ONNX, entrada/modelos/depth.onnx), runs on CPU.
"""
import argparse, os, subprocess
import numpy as np, cv2, onnxruntime as ort

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS = 1080, 1920, 30

ap = argparse.ArgumentParser()
ap.add_argument("inp"); ap.add_argument("out")
ap.add_argument("--segundos", type=float, default=3.0)
ap.add_argument("--efecto", default="nada")
ap.add_argument("--cam", default="push")
ap.add_argument("--recorte", default=None, help="w:h:x:y crop before framing")
ap.add_argument("--seed", type=int, default=1)
ap.add_argument("--tam", default="1080x1920", help="output WxH")
a = ap.parse_args()
W, H = map(int, a.tam.split("x"))
rng = np.random.default_rng(a.seed)

img = cv2.imread(a.inp, cv2.IMREAD_COLOR)
if a.recorte:
    w, h, x, y = map(int, a.recorte.split(":")); img = img[y:y + h, x:x + w]
# cover-crop to 9:16 with a margin for the camera move
M = 1.12
ih, iw = img.shape[:2]
s = max(W * M / iw, H * M / ih)
img = cv2.resize(img, (int(iw * s + 0.5), int(ih * s + 0.5)), interpolation=cv2.INTER_LANCZOS4)
ih, iw = img.shape[:2]
x0, y0 = (iw - int(W * M)) // 2, (ih - int(H * M)) // 2
img = img[y0:y0 + int(H * M), x0:x0 + int(W * M)]
ih, iw = img.shape[:2]

# depth (near = 1)
sess = ort.InferenceSession(os.path.join(ROOT, "entrada/modelos/depth.onnx"), providers=["CPUExecutionProvider"])
dh = 518; dw = max(14, int(round(518 * iw / ih / 14)) * 14)
x = cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (dw, dh)).astype(np.float32) / 255.0
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
x = x.transpose(2, 0, 1)[None].astype(np.float32)
d = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
d = (d - d.min()) / (d.max() - d.min() + 1e-6)
d = cv2.resize(d, (iw, ih), interpolation=cv2.INTER_CUBIC)
d = cv2.GaussianBlur(d, (0, 0), 6)

yy, xx = np.mgrid[0:ih, 0:iw].astype(np.float32)
cx, cy = iw / 2, ih / 2
n = int(a.segundos * FPS)

# effect masks
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
if hsv[..., 2].mean() > 150: a.efecto = "nada"  # bright studio shot: camera move only
far = (1 - d)
top = np.clip(1.3 - yy / (ih * 0.6), 0, 1)
if a.efecto == "aurora":
    lightmask = np.clip(far * top * 1.6, 0, 1) * np.clip(hsv[..., 2] / 160, 0, 1)
    stars_n = 140
    sx = rng.uniform(0, iw, stars_n); sy = rng.uniform(0, ih * 0.55, stars_n)
    sp = rng.uniform(0, 6.28, stars_n); sr = rng.uniform(1.5, 3.5, stars_n)
elif a.efecto == "atardecer":
    warm = ((hsv[..., 0] < 25) | (hsv[..., 0] > 165)) & (hsv[..., 2] > 120) & (hsv[..., 1] > 60)
    lightmask = cv2.GaussianBlur(warm.astype(np.float32), (0, 0), 25)
    dust_n = 60
    dxp = rng.uniform(0, iw, dust_n); dyp = rng.uniform(0, ih, dust_n)
    dsp = rng.uniform(0.6, 1.8, dust_n); dph = rng.uniform(0, 6.28, dust_n)
else:
    lightmask = np.zeros_like(d)

ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", a.out], stdin=subprocess.PIPE)
ease = lambda u: u * u * (3 - 2 * u)
for f in range(n):
    u = ease(f / max(1, n - 1)); t = f / FPS
    # camera: parallax shift scaled by depth (near moves more) + dolly
    amp = iw * 0.035
    if a.cam == "left": dx, dy, z = amp * (0.5 - u), 0, 0.03 * u
    elif a.cam == "right": dx, dy, z = amp * (u - 0.5), 0, 0.03 * u
    elif a.cam == "pull": dx, dy, z = amp * 0.25 * np.sin(u * 3.1), 0, 0.07 * (1 - u)
    elif a.cam == "orbit": dx, dy, z = amp * 0.6 * np.sin(u * 3.1 - 1.55), amp * 0.15 * np.cos(u * 3.1), 0.04 * u
    else: dx, dy, z = amp * 0.2 * np.sin(u * 2.5), -amp * 0.1 * u, 0.08 * u  # push
    # handheld micro shake
    dx += 3.5 * np.sin(t * 5.3) + 1.5 * np.sin(t * 13.1); dy += 3 * np.cos(t * 4.1) + 1.2 * np.sin(t * 11.7)
    k = 1 + z * (0.35 + 0.65 * d)
    mx = cx + (xx - cx) / k - dx * (d - 0.5)
    my = cy + (yy - cy) / k - dy * (d - 0.5)
    if a.efecto == "aurora":
        # the projected light flows: travelling waves only where the projection is
        mx += lightmask * (9 * np.sin(yy / 70 + t * 1.6) + 5 * np.sin(xx / 110 - t * 1.1))
        my += lightmask * (6 * np.sin(xx / 90 + t * 1.3))
    fr = cv2.remap(img, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    fr = fr.astype(np.float32)
    if a.efecto == "aurora":
        # slow colour breathing of the light + twinkling stars
        g = 1 + 0.12 * np.sin(t * 2.1) * lightmask[..., None]
        fr *= g
        for i in range(stars_n):
            b = max(0.0, np.sin(t * 3 + sp[i])) ** 3
            if b < 0.05: continue
            cv2.circle(fr, (int(sx[i]), int(sy[i])), int(sr[i]), (255 * b, 255 * b, 255 * b), -1, cv2.LINE_AA)
    elif a.efecto == "atardecer":
        g = 1 + 0.10 * np.sin(t * 1.7) * lightmask[..., None]
        fr *= g
        for i in range(dust_n):
            px = (dxp[i] + 25 * np.sin(t * 0.8 + dph[i])) % iw
            py = (dyp[i] - t * 22 * dsp[i]) % ih
            b = 0.35 + 0.35 * np.sin(t * 2 + dph[i])
            cv2.circle(fr, (int(px), int(py)), 2, (120 * b, 200 * b, 255 * b), -1, cv2.LINE_AA)
    fr = np.clip(fr, 0, 255).astype(np.uint8)
    ox, oy = (iw - W) // 2, (ih - H) // 2
    ff.stdin.write(fr[oy:oy + H, ox:ox + W].tobytes())
ff.stdin.close(); ff.wait()
print(a.out)
