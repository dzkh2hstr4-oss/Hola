#!/usr/bin/env python3
"""Free Spanish voice-over (Microsoft neural voices via edge-tts) + word timings for animated subtitles.

  python3 scripts/voz-gratis.py --id reel-a1 --voz es-ES-ElviraNeural --texto "..."
Writes content/voz/<id>.mp3 and content/voz/<id>.words.json ([{"t": word, "s": start, "e": end}] in seconds).
Needs: SSL_CERT_FILE pointing at the proxy CA and HTTPS_PROXY (passed as --proxy).
"""
import argparse, asyncio, json, os
import edge_tts

ap = argparse.ArgumentParser()
ap.add_argument("--id", required=True)
ap.add_argument("--texto", required=True)
ap.add_argument("--voz", default="es-ES-ElviraNeural")
ap.add_argument("--rate", default="+6%")
ap.add_argument("--pitch", default="+0Hz")
a = ap.parse_args()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, "content/voz"), exist_ok=True)
mp3 = os.path.join(root, "content/voz", f"{a.id}.mp3")

async def main():
    c = edge_tts.Communicate(a.texto, a.voz, rate=a.rate, pitch=a.pitch, boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    words = []
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"t": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    json.dump(words, open(os.path.join(root, "content/voz", f"{a.id}.words.json"), "w"), ensure_ascii=False)
    print(json.dumps({"id": a.id, "palabras": len(words), "fin": words[-1]["e"] if words else 0}))

asyncio.run(main())
