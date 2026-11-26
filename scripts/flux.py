#!/usr/bin/env python3
"""Genera imágenes con el Space gratuito FLUX.1-schnell (token HF inyectado por el proxy).
    python3 scripts/flux.py out.jpg "prompt" [ancho alto seed]
"""
import json, os, ssl, sys, uuid, urllib.request
H = "https://black-forest-labs-flux-1-schnell.hf.space"
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
op = urllib.request.build_opener(urllib.request.ProxyHandler({"https": os.environ.get("HTTPS_PROXY")}), urllib.request.HTTPSHandler(context=ctx))
def gen(out, prompt, w=1024, h=576, seed=0):
    sh = uuid.uuid4().hex[:10]
    body = json.dumps({"data": [prompt, seed, seed == 0, w, h, 4], "fn_index": 2, "trigger_id": None, "session_hash": sh, "event_data": None}).encode()
    op.open(urllib.request.Request(H + "/gradio_api/queue/join", data=body, headers={"Content-Type": "application/json"}), timeout=60).read()
    for line in op.open(H + f"/gradio_api/queue/data?session_hash={sh}", timeout=300):
        l = line.decode().strip()
        if not l.startswith("data:"): continue
        m = json.loads(l[5:])
        if m.get("msg") == "log": print("log:", m.get("log"), file=sys.stderr)
        if m.get("msg") == "process_completed":
            o = m.get("output", {})
            if not m.get("success"): raise SystemExit("ERROR: " + str(o.get("error")))
            img = o["data"][0]; url = img.get("url") or (H + "/gradio_api/file=" + img["path"])
            open(out, "wb").write(op.open(url, timeout=120).read()); return out
if __name__ == "__main__":
    a = sys.argv[1:]
    print(gen(a[0], a[1], int(a[2]) if len(a) > 2 else 1024, int(a[3]) if len(a) > 3 else 576, int(a[4]) if len(a) > 4 else 0))
