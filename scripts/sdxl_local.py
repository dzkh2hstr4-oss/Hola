#!/usr/bin/env python3
"""Genera imágenes en local (CPU) con SDXL-Turbo. Uso como módulo: gen(out, prompt, w, h, seed)"""
import os, sys, time, torch
from diffusers import AutoPipelineForText2Image
torch.set_num_threads(os.cpu_count())
_pipe = None
def pipe():
    global _pipe
    if _pipe is None:
        _pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.bfloat16, variant="fp16")
        _pipe.set_progress_bar_config(disable=True)
    return _pipe
def gen(out, prompt, w=768, h=448, seed=0, steps=2):
    g = torch.Generator().manual_seed(seed)
    img = pipe()(prompt=prompt, num_inference_steps=steps, guidance_scale=0.0, width=w, height=h, generator=g).images[0]
    img.save(out, quality=93)
    return out
if __name__ == "__main__":
    t = time.time(); gen(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]) if len(sys.argv) > 5 else 1); print("seg", round(time.time() - t, 1))
