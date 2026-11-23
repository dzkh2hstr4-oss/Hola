#!/usr/bin/env python3
"""Builds the UGC-style reel specs (voice + timings + shots) for content/clips/<id>.json."""
import json, subprocess, os, sys
F = "entrada/fotos/"; R = "entrada/real/aurora.mp4"
HA = "#proyectoraurora #auroraboreal #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora"
HS = "#lamparaatardecer #sunsetlamp #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora"
PACK = "🎄 Pack Navidad: llévate los 2 productos y ahorra un 10 %. Pide antes del 2/12 y llega para Navidad · Envío gratis"
def img(f, **k): return {"archivo": F + f, "shake": True, **k}
realC = {"archivo": R, "desde": 3.35, "velocidad": 0.5}
IA_A = img("ia-aurora.png", modo="full"); IA_S = img("ia-atardecer.png", modo="full")
V = [
 ("ugc-a2","aurora","es-ES-AlvaroNeural","Wallpaper",["No me esperaba esto","por menos de 40 € 😳"],"¿planetario o cuarto? 👇",
  "No me esperaba esto por menos de cuarenta euros. Mirad qué pequeño es. Lo cargo por USB, apago la luz y… ¿esto es mi cuarto o un planetario? Y tiene mando para cambiar los efectos. Os lo dejo en la bio.",
  [img("a5.jpg"), IA_A, realC, img("a1.jpg", modo="full"), img("a3.jpg", recorte="400:290:400:0"), {**IA_A, "mov": "out"}]),
 ("ugc-a3","aurora","es-ES-AlvaroNeural","Inspired",["Regalo de Navidad","resuelto 🎁"],"etiqueta a quien se lo regalarías 🎁",
  "Si no sabes qué regalar esta Navidad, apunta. Es un proyector de aurora boreal. Lo enciendes y el techo se llena de estrellas y luces que se mueven. Envío gratis y, si lo pides antes del dos de diciembre, llega para Navidad. Está en mi bio.",
  [img("a3.jpg", recorte="400:290:400:400"), IA_A, realC, img("a6.jpg"), img("a2.jpg", recorte="755:560:0:0"), {**IA_A, "mov": "out"}]),
 ("ugc-a4","aurora","es-ES-AlvaroNeural","Carefree",["POV: tu cuarto","a las 12 de la noche 🌙"],"¿así o a oscuras? 👇",
  "Mi cuarto a las doce de la noche. Apago la luz… y pasa esto. Ondas de colores, estrellas, y todo sale de este cubito. Lo controlo con el mando desde la cama. Treinta y nueve noventa y cinco, en mi bio.",
  [img("a6.jpg"), realC, IA_A, img("a4.jpg"), img("a1.jpg", modo="full"), {**IA_A, "mov": "out"}]),
 ("ugc-a5","aurora","es-ES-AlvaroNeural","Life of Riley",["¿Merece la pena?","Os digo la verdad 👀"],"¿lo comprarías? 👇",
  "¿Merece la pena? Os digo la verdad. Es pequeño, se carga por USB y trae mando. Lo pongo en la mesilla, apago la luz y mi techo parece una aurora boreal. Para mí, sí. Está en la bio.",
  [IA_A, img("a5.jpg"), realC, img("a3.jpg", recorte="400:290:400:0"), img("a4.jpg"), {**IA_A, "mov": "out"}]),
 ("ugc-s1","atardecer","es-ES-ElviraNeural","Wallpaper",["La lámpara de los","cuartos aesthetic 🌅"],"¿te la pondrías? 👇",
  "Me he comprado la lámpara de los cuartos aesthetic, y ahora entiendo por qué la tiene todo el mundo. La enchufo por USB, la apunto a la pared y… un atardecer en mi cuarto. Veintinueve noventa y cinco, os la dejo en la bio.",
  [IA_S, img("s7.jpg", recorte="520:1020:0:0"), {"archivo": "public/lampara.jpg", "modo": "full", "shake": True}, img("s4.jpg", modo="full"), {"archivo": "public/lampara-real.jpg", "shake": True}, {**IA_S, "mov": "out"}]),
 ("ugc-s2","atardecer","es-ES-ElviraNeural","Life of Riley",["Lo primero que hago","al llegar a casa 🏠"],"¿y tú qué haces al llegar? 👇",
  "Lo primero que hago al llegar a casa: apago la luz del techo y enciendo esto. Luz cálida, ambiente al momento. Y en fotos queda increíble. Cuesta veintinueve noventa y cinco y el envío es gratis. Link en mi bio.",
  [img("s4.jpg", modo="full"), IA_S, {"archivo": "public/lampara.jpg", "modo": "full", "shake": True}, {"archivo": "public/lampara-real.jpg", "shake": True}, img("s7.jpg", recorte="520:1020:0:0"), {**IA_S, "mov": "out"}]),
 ("ugc-s3","atardecer","es-ES-ElviraNeural","Inspired",["El regalo que","SÍ van a usar 🎁"],"etiqueta a quien se la regalarías 🎁",
  "Si buscáis un regalo que sí se use, mirad. Lámpara atardecer: se enchufa por USB y no hay que instalar nada. Le das al botón y la pared se convierte en un atardecer. Pedidla antes del dos de diciembre y llega para Navidad. Está en la bio.",
  [img("s7.jpg", recorte="520:1020:0:0"), IA_S, img("s4.jpg", modo="full"), {"archivo": "public/lampara.jpg", "modo": "full", "shake": True}, {"archivo": "public/lampara-real.jpg", "shake": True}, {**IA_S, "mov": "out"}]),
 ("ugc-s4","atardecer","es-ES-ElviraNeural","Carefree",["Fotos así","con 1 lámpara 📸"],"¿lo pruebas? 👇",
  "¿Queréis fotos así de bonitas? El truco es esta lámpara. La pongo en el suelo, la apunto a la pared y la luz de atardecer lo hace todo. Ni filtros ni nada. Veintinueve noventa y cinco, en mi bio.",
  [{"archivo": "public/lampara.jpg", "modo": "full", "shake": True}, IA_S, {"archivo": "public/lampara-real.jpg", "shake": True}, img("s4.jpg", modo="full"), img("s7.jpg", recorte="520:1020:0:0"), {**IA_S, "mov": "out"}]),
 ("ugc-s5","atardecer","es-ES-ElviraNeural","Funkorama",["Mi combo para el cuarto","🌅 + 🌌"],"¿cuál te pillas? 👇",
  "Mi combo para el cuarto: la lámpara atardecer para la tarde y el proyector aurora para la noche. Si te llevas los dos, te descuentan un diez por ciento en el carrito. Y el envío es gratis. Los tenéis en la bio.",
  [IA_S, img("s4.jpg", modo="full"), IA_A, realC, img("a1.jpg", modo="full"), {**IA_S, "mov": "out"}]),
]
CAP = {
 "ugc-a2": "No me esperaba esto por menos de 40 € 😳 Proyector aurora: aurora y estrellas en tu techo, recargable por USB y con mando. 39,95 € (antes 64,95 €). Link en la bio 🔗",
 "ugc-a3": "Regalo de Navidad resuelto 🎁 Proyector aurora: el techo se llena de estrellas y luces en movimiento. 39,95 € (antes 64,95 €). Link en la bio 🔗",
 "ugc-a4": "POV: tu cuarto a las 12 de la noche 🌙 Ondas de colores y estrellas desde un cubito de 10 cm, con mando. 39,95 € (antes 64,95 €). Link en la bio 🔗",
 "ugc-a5": "¿Merece la pena? 👀 Proyector aurora: pequeño, recargable por USB y con mando. 39,95 € (antes 64,95 €). Link en la bio 🔗",
 "ugc-s1": "La lámpara de los cuartos aesthetic 🌅 Por USB, sin obras: un atardecer en tu pared. 29,95 € (antes 49,95 €). Link en la bio 🔗",
 "ugc-s2": "Lo primero que hago al llegar a casa 🏠 Fuera la luz del techo y enciendo mi atardecer 🌅 29,95 € (antes 49,95 €). Link en la bio 🔗",
 "ugc-s3": "El regalo que SÍ van a usar 🎁 Lámpara atardecer: USB, sin instalación, un botón y listo. 29,95 € (antes 49,95 €). Link en la bio 🔗",
 "ugc-s4": "Fotos así con 1 lámpara 📸🌅 La apuntas a la pared y la luz hace el resto. 29,95 € (antes 49,95 €). Link en la bio 🔗",
 "ugc-s5": "Mi combo para el cuarto 🌅 + 🌌 Lámpara atardecer (29,95 €) para la tarde y proyector aurora (39,95 €) para la noche. Llévate los 2 y ahorra un 10 % en el carrito. Link en la bio 🔗",
}
env = dict(os.environ, SSL_CERT_FILE="/root/.ccr/ca-bundle.crt")
only = sys.argv[1:]
for id, prod, voz, mus, gancho, comenta, texto, shots in V:
    if only and id not in only: continue
    out = subprocess.run(["python3", "scripts/voz-gratis.py", "--id", id, "--voz", voz, "--rate=+14%", "--texto", texto], env=env, capture_output=True, text=True)
    fin = json.loads(out.stdout.strip().splitlines()[-1])["fin"]
    total = fin + 1.5
    first, last = 2.8, 2.6
    mid = (total - first - last) / (len(shots) - 2)
    clips = []
    for i, sh in enumerate(shots):
        c = dict(sh); c["segundos"] = round(first if i == 0 else last if i == len(shots) - 1 else mid, 2)
        clips.append(c)
    spec = {"id": id, "producto": prod, "status": "creado", "gancho": gancho, "ganchoSegundos": first,
            "comenta": comenta, "boton": "Cómprala en mi bio" if prod == "atardecer" else "Cómpralo en mi bio",
            "finalSegundos": last, "musica": f"entrada/musica/{mus}.mp3", "musicaDesde": 8, "musicaVolumen": 0.16,
            "clips": clips,
            "caption": CAP[id] + "\n\n" + PACK + "\n\n" + (HA if prod == "aurora" else HS) + f"\n\n🤖 Imágenes y voz creadas con IA · 🎵 «{mus}» – Kevin MacLeod (incompetech.com), CC BY 4.0"}
    json.dump(spec, open(f"content/clips/{id}.json", "w"), ensure_ascii=False, indent=2)
    print(id, round(fin, 1), "s de voz")
