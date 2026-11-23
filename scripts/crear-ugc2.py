#!/usr/bin/env python3
"""25 more UGC reels (26 Nov - 4 Dec). Writes voice + content/clips/<id>.json; prints the schedule."""
import json, subprocess, os, sys
F = "entrada/fotos/"; R = "entrada/real/aurora.mp4"
def img(f, **k): return {"archivo": F + f, "shake": True, **k}
def pub(f, **k): return {"archivo": "public/" + f, "shake": True, **k}
realC = {"archivo": R, "desde": 3.35, "velocidad": 0.5, "segundos": 1.3}
IA_A = img("ia-aurora.png", modo="full"); IA_S = img("ia-atardecer.png", modo="full")
A = {"a5": img("a5.jpg"), "a1": img("a1.jpg", modo="full"), "a6": img("a6.jpg"), "a4": img("a4.jpg"),
     "a2": img("a2.jpg", recorte="755:560:0:0"), "spiral": img("a3.jpg", recorte="400:290:400:0"),
     "tent": img("a3.jpg", recorte="400:290:400:400"), "couple": img("a3.jpg", recorte="400:290:0:400"),
     "girl": img("a3.jpg", recorte="400:290:0:0"), "real": realC, "ia": IA_A}
S = {"s7": img("s7.jpg", recorte="520:1020:0:0"), "lam": pub("lampara.jpg", modo="full"), "s4": img("s4.jpg", modo="full"),
     "s4b": img("s4.jpg", modo="full", recorte="700:1080:380:0"), "real": pub("lampara-real.jpg"),
     "lamb": pub("lampara.jpg", modo="full", recorte="735:900:0:205"), "ia": IA_S}
MUS = ["Wallpaper", "Inspired", "Carefree", "Life of Riley", "Funkorama"]
AUR = [  # id, voice, hook, comment, script, shots, caption
 ("a6","es-ES-AlvaroNeural",["Lo mejor que he","comprado este año 🌌"],"¿lo pondrías? 👇","Lo mejor que he comprado este año, y no es broma. Lo pongo en la mesilla, apago la luz y mi techo se llena de auroras y estrellas. Con mando y se carga por USB. Os lo dejo en la bio.",["ia","a4","real","a1","spiral","ia"],"Lo mejor que he comprado este año 🌌"),
 ("a7","es-ES-ElviraNeural",["Si tienes hermanos","pequeños, mira esto 👀"],"etiqueta a quien se lo regalarías 🎁","Si tenéis hermanos pequeños, mirad esto. Apagas la luz y su cuarto se convierte en un cielo de estrellas con auroras. Tiene mando para cambiar los efectos. Regalo perfecto. Está en mi bio.",["tent","ia","real","a6","a5","ia"],"Si tienes hermanos pequeños, mira esto 👀"),
 ("a8","es-ES-AlvaroNeural",["3 motivos","para tenerlo 🌌"],"¿cuál te convence más? 👇","Tres motivos para tenerlo. Uno: tu techo se convierte en una aurora boreal. Dos: tiene mando, no te levantas de la cama. Tres: se carga por USB, sin cables. Treinta y nueve noventa y cinco, en la bio.",["a1","ia","real","a5","a4","ia"],"3 motivos para tenerlo 🌌"),
 ("a9","es-ES-ElviraNeural",["Así me duermo","ahora 🌙"],"¿y tú cómo te duermes? 👇","Así me duermo ahora. Móvil fuera, luz apagada, y esto en el techo. Ondas de luz moviéndose despacito y estrellas. Lo apago con el mando sin levantarme. Os lo dejo en la bio.",["a6","real","ia","spiral","a4","ia"],"Así me duermo ahora 🌙"),
 ("a10","es-ES-AlvaroNeural",["Plan de peli","en casa 🍿"],"etiqueta con quién lo harías 🍿","Plan de peli en casa, pero bien hecho. Manta, palomitas y el techo lleno de auroras. Tiene varios efectos y se cambian con el mando. Treinta y nueve noventa y cinco y envío gratis. En mi bio.",["couple","ia","real","a1","a6","ia"],"Plan de peli en casa 🍿"),
 ("a11","es-ES-ElviraNeural",["Esto NO","es un filtro 🤯"],"¿te lo creías? 👇","Esto no es un filtro, es mi techo de verdad. Lo hace este cubito de diez centímetros. Le das al mando y cambias entre ondas de colores y estrellas. En mi bio lo tenéis.",["ia","a5","real","spiral","a2","ia"],"Esto NO es un filtro 🤯"),
 ("a12","es-ES-AlvaroNeural",["Tu setup","necesita esto 🎮"],"¿le falta algo a tu setup? 👇","Si tienes un setup gamer, te falta esto. Apagas la luz y tienes auroras y estrellas moviéndose por el techo. Con mando y recargable por USB. Treinta y nueve noventa y cinco, en la bio.",["spiral","ia","real","a1","a4","ia"],"Tu setup necesita esto 🎮"),
 ("a13","es-ES-ElviraNeural",["Mira lo que pasa","cuando apago la luz 👀"],"¿así o a oscuras? 👇","Mirad lo que pasa cuando apago la luz. Pulso el mando y… aurora boreal en el techo. Y lo mejor es que se carga por USB y lo pongo donde quiero. Link en la bio.",["a4","real","ia","a6","a1","ia"],"Mira lo que pasa cuando apago la luz 👀"),
 ("a14","es-ES-AlvaroNeural",["Para quien","lo tiene todo 🎁"],"etiqueta a esa persona 🎁","¿Y qué le regalas a alguien que lo tiene todo? Esto. Un proyector de aurora boreal que llena el techo de estrellas. Con mando y envío gratis. Os lo dejo en mi bio.",["a5","ia","real","girl","a6","ia"],"Para quien lo tiene todo 🎁"),
 ("a15","es-ES-ElviraNeural",["Ojo al precio 👇"],"¿lo sabías? 👇","Ojo al precio. Antes costaba sesenta y cuatro noventa y cinco y ahora treinta y nueve noventa y cinco. Proyector de aurora boreal, con mando y recargable. Mirad cómo queda el techo. En la bio.",["a5","ia","real","a1","spiral","ia"],"Ojo al precio 👇 Antes 64,95 €, ahora 39,95 €"),
 ("a16","es-ES-AlvaroNeural",["Mi rincón favorito","de la casa ✨"],"¿cuál es el tuyo? 👇","Este es mi rincón favorito de la casa, y solo por esto. Lo enciendo y las paredes se llenan de luz que se mueve. Ambiente al instante, sin instalar nada. Link en mi bio.",["a2","ia","real","a6","a4","ia"],"Mi rincón favorito de la casa ✨"),
 ("a17","es-ES-ElviraNeural",["Cita en casa:","10/10 💫"],"etiqueta a tu cita 💫","Cita en casa diez de diez. Apagáis la luz, os tumbáis y encendéis esto: una aurora boreal en el techo. Con mando para cambiar los colores. Os lo dejo en la bio.",["couple","real","ia","a1","spiral","ia"],"Cita en casa: 10/10 💫"),
 ("a18","es-ES-AlvaroNeural",["No lo compres","sin ver esto 👀"],"¿lo comprarías? 👇","No lo compres sin ver esto. Así se ve de verdad en un cuarto: auroras y estrellas por todo el techo. Es pequeño, recargable y trae mando. Treinta y nueve noventa y cinco, en mi bio.",["ia","real","a6","a1","a5","ia"],"No lo compres sin ver esto 👀"),
]
SUN = [
 ("s6","es-ES-ElviraNeural",["Así cambio mi cuarto","en 2 segundos 🌅"],"¿te la pondrías? 👇","Así cambio mi cuarto en dos segundos. Apago la luz del techo, enciendo esta lámpara y la pared se convierte en un atardecer. Va por USB, sin obras. Veintinueve noventa y cinco, en mi bio.",["lam","ia","s4","s7","real","ia"],"Así cambio mi cuarto en 2 segundos 🌅"),
 ("s7","es-ES-ElviraNeural",["El truco de los cuartos","de Pinterest 🤫"],"guárdalo para luego 📌","El truco de los cuartos de Pinterest no es la pintura ni los muebles. Es la luz. Una lámpara de atardecer apuntando a la pared y listo. Os la dejo en la bio.",["s4","ia","lamb","real","s7","ia"],"El truco de los cuartos de Pinterest 🤫"),
 ("s8","es-ES-AlvaroNeural",["Mi luz para leer","por la noche 📖"],"¿lees por la noche? 👇","Mi luz favorita para leer por la noche. Cálida, suave y con un atardecer en la pared. La enchufo por USB y ya. Veintinueve noventa y cinco con envío gratis. En la bio.",["ia","real","s4b","lam","s7","ia"],"Mi luz para leer por la noche 📖"),
 ("s9","es-ES-ElviraNeural",["Sesión de fotos","en mi cuarto 📸"],"¿lo pruebas? 👇","Sesión de fotos en mi cuarto, sin salir de casa. Solo necesito esta lámpara apuntando a la pared. Ese círculo naranja hace toda la magia. Veintinueve noventa y cinco, en la bio.",["lamb","ia","s4","real","s7","ia"],"Sesión de fotos en mi cuarto 📸"),
 ("s10","es-ES-ElviraNeural",["Regalo para tu","mejor amiga 🎁"],"etiqueta a tu mejor amiga 🎁","Si no sabéis qué regalarle a vuestra mejor amiga, apuntad. Lámpara atardecer: se enchufa por USB y su cuarto se vuelve dorado. Cuesta veintinueve noventa y cinco. Os la dejo en la bio.",["s7","ia","lam","s4","real","ia"],"Regalo para tu mejor amiga 🎁"),
 ("s11","es-ES-ElviraNeural",["Domingo de","reset 🧺"],"¿cómo es tu domingo? 👇","Domingo de reset: cuarto ordenado, mantita y la lámpara de atardecer encendida. Es lo que más ambiente le da a la habitación. Va por USB, sin instalar nada. En mi bio.",["ia","s4b","real","lam","s7","ia"],"Domingo de reset 🧺"),
 ("s12","es-ES-AlvaroNeural",["Ojo al precio 👇"],"¿lo sabías? 👇","Ojo al precio. Antes cuarenta y nueve noventa y cinco, ahora veintinueve noventa y cinco. Lámpara de atardecer por USB, sin obras. Mirad cómo queda la pared. Link en la bio.",["s7","ia","s4","lam","real","ia"],"Ojo al precio 👇 Antes 49,95 €, ahora 29,95 €"),
 ("s13","es-ES-ElviraNeural",["Ponla donde","quieras 🌅"],"¿dónde la pondrías? 👇","La puedes poner donde quieras: en el suelo, en la mesilla o junto al escritorio, apuntando a la pared. Y en todos lados queda increíble. Lámpara atardecer, por USB. Veintinueve noventa y cinco, en mi bio.",["lam","s4b","ia","real","s7","ia"],"Ponla donde quieras 🌅"),
 ("s14","es-ES-ElviraNeural",["Mi cuarto ya no","parece el mismo 😳"],"¿así o con luz de techo? 👇","Mi cuarto ya no parece el mismo. Misma cama, mismas paredes, pero con esta lámpara de atardecer todo se ve cálido y bonito. Va por USB. Os la dejo en la bio.",["ia","lamb","s4","real","s7","ia"],"Mi cuarto ya no parece el mismo 😳"),
 ("s15","es-ES-AlvaroNeural",["Para tu","setup 🎮"],"¿le falta a tu setup? 👇","Para tu setup: lámpara atardecer detrás del escritorio y la habitación cambia por completo. La conectas al ordenador por USB y listo. Veintinueve noventa y cinco, en la bio.",["s4","ia","real","lam","s7","ia"],"Para tu setup 🎮"),
 ("s16","es-ES-ElviraNeural",["¿Vale la pena?","Te enseño cómo queda 👀"],"¿la comprarías? 👇","¿Vale la pena? Os enseño cómo queda de verdad. Un círculo de luz naranja enorme en la pared, y la habitación entera se vuelve dorada. Veintinueve noventa y cinco y envío gratis. En la bio.",["ia","s4","lamb","real","s7","ia"],"¿Vale la pena? Te enseño cómo queda 👀"),
 ("s17","es-ES-ElviraNeural",["¿Atardecer o aurora?","¿Y por qué no los 2? 🎄"],"¿cuál te pillas? 👇","¿Lámpara atardecer o proyector aurora? ¿Y por qué no los dos? Si os lleváis los dos, os descuentan un diez por ciento en el carrito. Envío gratis. Los tenéis en la bio.",["ia","s4","a1","real","lam","ia"],"¿Atardecer o aurora? ¿Y por qué no los 2? 🎄 Llévate los 2 y ahorra un 10 % en el carrito."),
]
# schedule: Thu 26 21:00, then 27 Nov - 4 Dec at 12/17/21, alternating products
slots = [("2026-11-26", "21:00")]
for day in ["2026-11-27","2026-11-28","2026-11-29","2026-11-30","2026-12-01","2026-12-02","2026-12-03","2026-12-04"]:
    for h in ["12:00", "17:00", "21:00"]:
        slots.append((day, h))
order = []
ai, si = 0, 0
for k in range(len(slots)):
    if k % 2 == 0 and ai < len(AUR): order.append(("aurora", AUR[ai])); ai += 1
    elif si < len(SUN): order.append(("atardecer", SUN[si])); si += 1
    else: order.append(("aurora", AUR[ai])); ai += 1
HA = "#proyectoraurora #auroraboreal #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora"
HS = "#lamparaatardecer #sunsetlamp #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora"
env = dict(os.environ, SSL_CERT_FILE="/root/.ccr/ca-bundle.crt")
plan = []
for n, ((day, hour), (prod, (sid, voz, gancho, comenta, texto, shots, cap0))) in enumerate(zip(slots, order)):
    id = "ugc-" + sid
    mus = MUS[n % len(MUS)]
    pool = A if prod == "aurora" else S
    if sid == "s17": pool = {**S, "a1": A["a1"], "real": A["real"]}
    out = subprocess.run(["python3", "scripts/voz-gratis.py", "--id", id, "--voz", voz, "--rate=+14%", "--texto", texto], env=env, capture_output=True, text=True)
    fin = json.loads(out.stdout.strip().splitlines()[-1])["fin"]
    total = fin + 1.5; first, last = 2.8, 2.6
    fixed = sum(1.3 for s in shots[1:-1] if pool[s].get("velocidad"))
    nfree = sum(1 for s in shots[1:-1] if not pool[s].get("velocidad"))
    mid = (total - first - last - fixed) / max(1, nfree)
    clips = []
    for i, s in enumerate(shots):
        c = dict(pool[s])
        if i == 0: c["segundos"] = first
        elif i == len(shots) - 1: c["segundos"] = last; c["mov"] = "out"
        elif not c.get("velocidad"): c["segundos"] = round(mid, 2)
        clips.append(c)
    precio = "39,95 € (antes 64,95 €)" if prod == "aurora" else "29,95 € (antes 49,95 €)"
    if sid == "s17": precio = "Lámpara 29,95 € · Proyector 39,95 €"
    pack = "🎄 Pack Navidad: llévate los 2 productos y ahorra un 10 %" + (". Pide antes del 2/12 y llega para Navidad · Envío gratis" if day <= "2026-12-02" else " (hasta el 7 de enero) · Envío gratis")
    caption = f"{cap0} {precio}. Link en la bio 🔗\n\n{pack}\n\n{HA if prod=='aurora' else HS}\n\n🤖 Imágenes y voz creadas con IA · 🎵 «{mus}» – Kevin MacLeod (incompetech.com), CC BY 4.0"
    spec = {"id": id, "producto": prod, "status": "creado", "publicar": f"{day}T{hour}", "gancho": gancho, "ganchoSegundos": first,
            "comenta": comenta, "boton": "Cómprala en mi bio" if prod == "atardecer" else "Cómpralo en mi bio", "finalSegundos": last,
            "musica": f"entrada/musica/{mus}.mp3", "musicaDesde": 8, "musicaVolumen": 0.16, "clips": clips, "caption": caption}
    json.dump(spec, open(f"content/clips/{id}.json", "w"), ensure_ascii=False, indent=2)
    plan.append((id, day, hour, round(fin, 1)))
json.dump(plan, open("content/clips/calendario-ugc2.json", "w"), ensure_ascii=False, indent=1)
for p in plan: print(*p)
