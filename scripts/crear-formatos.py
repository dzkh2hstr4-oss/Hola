#!/usr/bin/env python3
"""Rewrites reels an-04 … an-63 so every video is a different kind of content (news flash, search,
phone notes, quiz, movie trailer, unboxing, clock, meme, receipt, versus, countdown, combos).
Keeps each reel's "publicar" slot and status. Adds "formato" so views can be compared per format.
Only real product facts; prices: aurora 39,95 (antes 64,95), atardecer 29,95 (antes 49,95)."""
import json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "content/animado")
GREY = {"bg": "#c9ccd4", "color": "#1a1d24"}

P = {
    "aurora": {
        "fotos": ["aurora.jpg", "animado/ia-aurora.png", "animado/a1.jpg", "animado/a5.jpg", "animado/a3.jpg"],
        "titulo": [{"text": "Proyector", "size": 104}, {"text": "AURORA", "size": 130, "bg": "accent"}],
        "subs": ["📲 Con mando · 🔋 USB", "🤏 Cubo de 10 cm", "🌌 Aurora + estrellas", "🔋 Recargable por USB"],
        "oferta": {"descuento": "-38%", "antes": "64,95 €", "ahora": "39,95 €"}, "ahorro": "25 €",
        "nombre_corto": "Proyector aurora",
        "precio_voz": "treinta y nueve noventa y cinco",
        "on": [{"text": "Una AURORA"}, {"text": "en tu techo 🌌", "bg": "accent"}],
        "on_voz": ["Y de repente... una aurora en tu techo.", "Boom. Aurora boreal.", "Mira el techo.", "Estrellas y aurora. Con un clic."],
        "prod_voz": ["Es este proyector. Con mando, y se carga por USB.", "Un cubo de diez centímetros, con mando.", "Aurora y estrellas, recargable por USB."],
        "tags": "#proyectoraurora #auroraboreal #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora",
        "nombre": "Proyector aurora: aurora y estrellas en tu techo, con mando y recargable por USB. 39,95 € (antes 64,95 €).",
    },
    "atardecer": {
        "fotos": ["lampara-real.jpg", "animado/ia-atardecer.png", "animado/s4.jpg", "animado/s7.jpg", "animado/a6.jpg"],
        "titulo": [{"text": "Lámpara", "size": 104}, {"text": "ATARDECER", "size": 124, "bg": "accent"}],
        "subs": ["🔌 Por USB · sin obras", "🌅 Luz cálida de atardecer", "📸 Fotos aesthetic", "🔘 Un botón y listo"],
        "oferta": {"descuento": "-40%", "antes": "49,95 €", "ahora": "29,95 €"}, "ahorro": "20 €",
        "nombre_corto": "Lámpara atardecer",
        "precio_voz": "veintinueve noventa y cinco",
        "on": [{"text": "Un ATARDECER"}, {"text": "en tu pared 🌅", "bg": "accent"}],
        "on_voz": ["Y de repente... un atardecer en tu pared.", "Boom. Hora dorada.", "Un botón, y mira.", "Luz cálida de atardecer. Así de fácil."],
        "prod_voz": ["Es esta lámpara. Se enchufa por USB y listo.", "Un botón, luz cálida de atardecer.", "Por USB, sin obras."],
        "tags": "#lamparaatardecer #sunsetlamp #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora",
        "nombre": "Lámpara atardecer: luz cálida de atardecer en tu pared, por USB y sin obras. 29,95 € (antes 49,95 €).",
    },
}

# music per mood (track, start second)
M = {
    "tension": [("Volatile Reaction", 28), ("Crypto", 0), ("Hitman", 12)],
    "epico": [("Five Armies", 14), ("Impact Prelude", 78)],
    "misterio": [("Investigations", 0), ("Ghost Story", 0), ("Darkest Child", 2)],
    "alegre": [("Funkorama", 0), ("Life of Riley", 0), ("Carefree", 0), ("Inspired", 0)],
    "chill": [("Wallpaper", 0), ("Inspired", 0)],
    "hype": [("Rocket", 0), ("Movement Proposition", 2), ("Hitman", 12)],
}

# Each recipe: (formato, mood, fx, voice, rate, pitch, list of 5 variants). A variant gives product + texts.
R = []

R.append(("noticia", "tension", "noticia", "es-ES-ElviraNeural", "+10%", "+0Hz", [
    ("aurora", "Ya puedes tener una aurora boreal en tu cuarto", "Última hora. Ya puedes tener una aurora boreal... en tu propio cuarto."),
    ("atardecer", "El atardecer ya no depende del sol", "Última hora. El atardecer... ya no depende del sol."),
    ("aurora", "Detectan miles de techos aburridos en España", "Última hora. Se detectan miles de techos aburridos... y ya hay solución."),
    ("atardecer", "Alerta: tu cuarto podría verse así esta noche", "Atención. Tu cuarto podría verse así... esta misma noche."),
    ("aurora", "Las estrellas se mudan a tu techo", "Noticia de última hora: las estrellas se mudan a tu techo."),
]))
R.append(("buscador", "misterio", "cercana", "es-ES-XimenaNeural", "+10%", "+0Hz", [
    ("atardecer", "cómo hacer mi cuarto aesthetic", "Todo el mundo busca cómo hacer su cuarto aesthetic... La respuesta es esta."),
    ("aurora", "aurora boreal en casa", "¿Se puede ver una aurora boreal en casa? Pues sí."),
    ("aurora", "regalo original navidad", "Si estás buscando un regalo original para Navidad... mira esto."),
    ("atardecer", "luz bonita para fotos", "¿Buscas una luz bonita para tus fotos? Esta."),
    ("aurora", "estrellas en el techo", "Estrellas en el techo... sin pintar nada."),
]))
R.append(("notas", "chill", "cercana", "es-ES-ElviraNeural", "+8%", "+0Hz", [
    ("atardecer", ("Mi cuarto necesita:", ["luz cálida 🧡", "menos luz blanca", "un atardecer en la pared"]), "Lo que mi cuarto necesita: luz cálida, menos luz blanca... y un atardecer en la pared."),
    ("aurora", ("Regalos Navidad 🎄", ["mamá: lámpara atardecer", "hermano: proyector aurora", "yo: los dos 😅"]), "Lista de regalos: la lámpara para mamá, el proyector para mi hermano... y los dos para mí."),
    ("aurora", ("Plan de esta noche", ["peli 🍿", "mantita", "aurora en el techo"]), "Plan de esta noche: peli, mantita... y aurora en el techo."),
    ("atardecer", ("Cosas que me relajan", ["luz cálida", "música suave", "un atardecer en la pared"]), "Cosas que me relajan: luz cálida, música suave... y un atardecer en la pared."),
    ("aurora", ("Antes de dormir", ["móvil fuera 📵", "luz blanca off", "estrellas on ✨"]), "Antes de dormir: móvil fuera, luz blanca apagada... y estrellas encendidas."),
]))
R.append(("quiz", "hype", "radio", "es-ES-AlvaroNeural", "+14%", "+0Hz", [
    ("aurora", ("¿Cuánto cuesta? 🤔", ["89,95 €", "64,95 €", "39,95 €"], 2), "¿Cuánto crees que cuesta este proyector? Tienes tres segundos."),
    ("atardecer", ("¿Qué necesita para funcionar?", ["Obras", "Un enchufe raro", "Solo USB"], 2), "Pregunta: ¿qué necesita esta lámpara para funcionar? Piensa rápido."),
    ("aurora", ("¿Qué hay en el techo?", ["Pintura", "Una pantalla", "Un proyector"], 2), "¿Qué crees que hay en este techo? Adivina."),
    ("atardecer", ("¿Cuánto cuesta? 🤔", ["59,95 €", "49,95 €", "29,95 €"], 2), "¿Cuánto crees que cuesta esta lámpara? Tres segundos."),
    ("aurora", ("¿Cómo se controla?", ["No se puede", "Con un mando", "Con una app"], 1), "¿Cómo se controla este proyector? Adivina."),
]))
R.append(("trailer", "epico", "trailer", "es-ES-AlvaroNeural", "-6%", "-8Hz", [
    ("aurora", ["En un mundo de techos blancos...", "una noche, todo cambió.", "AURORA"], "En un mundo de techos blancos... una noche, todo cambió."),
    ("atardecer", ["Cuando el sol se fue...", "alguien lo trajo de vuelta.", "ATARDECER"], "Cuando el sol se fue... alguien lo trajo de vuelta."),
    ("aurora", ["Este invierno...", "mira hacia arriba.", "AURORA"], "Este invierno... mira hacia arriba."),
    ("atardecer", ["Hay cuartos...", "y hay cuartos con atardecer.", "ATARDECER"], "Hay cuartos... y hay cuartos con atardecer."),
    ("aurora", ["Basado en hechos reales:", "tu techo.", "AURORA"], "Basado en hechos reales... tu techo."),
]))
R.append(("caja", "alegre", "radio", "es-ES-XimenaNeural", "+12%", "+0Hz", [
    ("aurora", "¿Qué hay dentro? 🎁", "¿Qué hay dentro de la caja? Tres, dos, uno..."),
    ("atardecer", "Abre el regalo 🎁", "Vamos a abrir el regalo... ¡sorpresa!"),
    ("aurora", "Unboxing en 3 segundos ⏱️", "Unboxing en tres segundos. Vamos."),
    ("atardecer", "El regalo de este año 🎄", "Este año el regalo es este. Mira."),
    ("aurora", "Sorpresa 👀", "Te enseño lo que hay en la caja."),
]))
R.append(("reloj", "misterio", "radio", "es-ES-AlvaroNeural", "+8%", "+0Hz", [
    ("aurora", (["19:00", "21:00", "23:00", "00:00"], "Y a medianoche... 🌌"), "Las siete... las nueve... las once... medianoche."),
    ("atardecer", (["17:00", "18:00", "19:00"], "Atardecer infinito 🌅"), "Se va el sol cada vez antes... pero tú no lo necesitas."),
    ("aurora", (["22:00", "23:00", "01:00"], "Insomnio, pero bonito ✨"), "Las diez, las once, la una... si no duermes, que al menos sea bonito."),
    ("atardecer", (["16:30", "17:30", "18:30"], "Hora dorada todo el día 🧡"), "Cada día oscurece antes... la hora dorada, cuando tú quieras."),
    ("aurora", (["20:00", "21:30", "23:00"], "Noche de peli 🍿"), "Ocho, nueve y media, once... noche de peli."),
]))
R.append(("meme", "alegre", "radio", "es-ES-ElviraNeural", "+12%", "+0Hz", [
    ("aurora", "Yo cuando enciendo esto después de un día horrible:", "Yo... después de un día horrible."),
    ("atardecer", "Cuando dices que es \"solo una lámpara\":", "Es solo una lámpara, dijeron."),
    ("aurora", "Nadie:\nYo a las 3 de la mañana mirando el techo:", "Nadie... Yo, a las tres de la mañana, mirando el techo."),
    ("atardecer", "Mi pared en enero vs mi pared ahora:", "Mi pared antes... y mi pared ahora."),
    ("aurora", "POV: tu madre entra en tu cuarto por la noche", "Cuando tu madre entra en tu cuarto por la noche."),
]))
R.append(("versus", "hype", "radio", "es-ES-AlvaroNeural", "+14%", "+0Hz", [
    ("atardecer", (["Tu cuarto", "vs el de TikTok 📱"], "Bombilla", "Atardecer"), "Tu cuarto... contra el cuarto de TikTok."),
    ("aurora", (["¿Techo blanco", "o esto? 🌌"], "Techo blanco", "Aurora"), "¿Techo blanco... o esto?"),
    ("atardecer", (["Luz fría", "vs luz cálida 🧡"], "Luz fría", "Atardecer"), "Luz fría contra luz cálida. ¿Con cuál te quedas?"),
    ("aurora", (["Móvil en la cama", "vs esto ✨"], "Móvil", "Estrellas"), "Móvil en la cama... o esto."),
    ("atardecer", (["Pared vacía", "vs pared con vida"], "Vacía", "Con vida"), "Pared vacía... contra pared con vida."),
]))
R.append(("cuenta", "tension", "radio", "es-ES-XimenaNeural", "+14%", "+0Hz", [
    ("aurora", ["No parpadees", "👁️"], "No parpadees... porque te lo pierdes."),
    ("atardecer", ["Sube el volumen", "🔊"], "Sube el volumen y mira."),
    ("aurora", ["Espera...", "mira el techo 👆"], "Espera... mira el techo."),
    ("atardecer", ["Un botón.", "Solo uno. 🔘"], "Un botón. Solo uno."),
    ("aurora", ["Apaga todo", "y mira 🌑"], "Apaga todas las luces... y mira."),
]))
R.append(("meme+quiz", "hype", "radio", "es-ES-ElviraNeural", "+12%", "+0Hz", [
    ("atardecer", ("Mi madre: ¿y esa luz tan bonita?", ("¿Qué es?", ["Una ventana", "Un foco de cine", "Una lámpara USB"], 2)), "¿Y esa luz tan bonita? Adivina qué es."),
    ("aurora", ("Mis amigos entrando en mi cuarto:", ("¿Qué lo hace?", ["Un proyector", "Una pantalla", "Pintura"], 0)), "Mis amigos entrando en mi cuarto... ¿qué crees que lo hace?"),
    ("atardecer", ("Yo enseñando mi cuarto por videollamada:", ("¿Cuánto cuesta?", ["99 €", "49,95 €", "29,95 €"], 2)), "Enseñando mi cuarto por videollamada... ¿cuánto crees que cuesta?"),
    ("aurora", ("Mi hermano pequeño cuando lo ve:", ("¿Qué incluye?", ["Nada", "Un mando", "Un cable raro"], 1)), "Mi hermano cuando lo ve... ¿y qué incluye?"),
    ("atardecer", ("Yo intentando hacer fotos aesthetic:", ("¿El truco?", ["Filtro", "Photoshop", "Esta lámpara"], 2)), "Intentando hacer fotos aesthetic... ¿el truco?"),
]))
R.append(("trailer+caja", "epico", "trailer", "es-ES-AlvaroNeural", "-4%", "-6Hz", [
    ("aurora", (["Este diciembre...", "llega a tu cuarto."], "¿Qué será? 🎁"), "Este diciembre... llega a tu cuarto."),
    ("atardecer", (["Pronto...", "en tu pared."], "Ábrelo 🎁"), "Pronto... en tu pared."),
    ("aurora", (["La Navidad...", "se ve mejor desde la cama."], "Mira 🎁"), "La Navidad... se ve mejor desde la cama."),
    ("atardecer", (["Un regalo...", "que se enciende."], "Ábrelo 🎁"), "Un regalo... que se enciende."),
    ("aurora", (["Ni Noruega...", "ni Islandia."], "Tu cuarto 🎁"), "Ni Noruega... ni Islandia."),
]))


def escenas(formato, prod, v, k):
    p = P[prod]
    foto = p["fotos"][k % len(p["fotos"])]
    sub = p["subs"][k % len(p["subs"])]
    on = {"tipo": "encender", "antes": "click...", "despues": p["on"], "dice": p["on_voz"][k % len(p["on_voz"])]}
    producto = {"tipo": "producto", "lineas": p["titulo"], "foto": foto, "sub": sub, "dice": p["prod_voz"][k % len(p["prod_voz"])]}
    oferta = lambda titulo: {"tipo": "oferta", "titulo": titulo, **p["oferta"], "extra": "🚚 Envío gratis",
                             "dice": f"Ahora por {p['precio_voz']}, con envío gratis. Lo tienes en mi bio."}
    ticket = {"tipo": "ticket", "producto": p["nombre_corto"], "antes": p["oferta"]["antes"], "ahora": p["oferta"]["ahora"], "ahorro": p["ahorro"],
              "dice": f"Total: {p['precio_voz']}. Envío gratis. Link en mi bio."}
    _, texto, voz = v
    if formato == "noticia":
        return [{"tipo": "noticia", "titular": texto, "ticker": f"{p['nombre_corto']} · {p['oferta']['ahora']} · envío gratis", "dice": voz}, producto, "OFERTA"]
    if formato == "buscador":
        return [{"tipo": "buscador", "consulta": texto, "resultado": f"{p['nombre_corto']} · {p['oferta']['ahora']}", "foto": foto, "dice": voz}, on, ticket]
    if formato == "notas":
        t, items = texto
        return [{"tipo": "notas", "titulo": t, "items": items, "dice": voz}, on, producto, "OFERTA"]
    if formato == "quiz":
        q, ops, ok = texto
        return [{"tipo": "quiz", "pregunta": q, "opciones": ops, "correcta": ok, "dice": voz}, producto, ticket]
    if formato == "trailer":
        return [{"tipo": "trailer", "frases": texto, "dice": voz}, producto, "OFERTA"]
    if formato == "caja":
        return [{"tipo": "caja", "texto": texto, "foto": foto, "dice": voz}, on, "OFERTA"]
    if formato == "reloj":
        horas, t = texto
        return [{"tipo": "reloj", "horas": horas, "texto": t, "dice": voz}, producto, ticket]
    if formato == "meme":
        return [{"tipo": "meme", "arriba": texto, "dice": voz}, {"tipo": "golpes", "palabras": ["NO", "ES", "MAGIA"] if prod == "aurora" else ["HORA", "DORADA"]}, producto, "OFERTA"]
    if formato == "versus":
        hook, izq, der = texto
        return [{"tipo": "gancho", "lineas": [{"text": hook[0]}, {"text": hook[1], **GREY}], "dice": voz},
                {"tipo": "versus", "lineas": [{"text": "¿Con cuál te quedas?"}], "izquierda": izq, "derecha": der, "dice": "A la izquierda, lo de siempre. A la derecha... esto."}, ticket]
    if formato == "cuenta":
        return [{"tipo": "gancho", "lineas": [{"text": texto[0]}, {"text": texto[1], **GREY}], "dice": voz},
                {"tipo": "cuenta", "lineas": [{"text": "Atento... 🤫"}], "dice": "Tres... dos... uno..."}, on, producto, "OFERTA"]
    if formato == "meme+quiz":
        arriba, (q, ops, ok) = texto
        return [{"tipo": "meme", "arriba": arriba, "dice": voz}, {"tipo": "quiz", "pregunta": q, "opciones": ops, "correcta": ok}, "OFERTA"]
    if formato == "trailer+caja":
        frases, caja = texto
        return [{"tipo": "trailer", "frases": frases + ["LUMORA"], "dice": voz}, {"tipo": "caja", "texto": caja, "foto": foto, "dice": p["prod_voz"][k % 3]}, ticket]
    raise ValueError(formato)


ids = [f"an-{n:02d}" for n in range(4, 64)]
voices_cycle = 0
for k, rid in enumerate(ids):
    formato, mood, fx, voz, rate, pitch, variants = R[k % len(R)]
    inst = k // len(R)
    v = variants[inst % len(variants)]
    prod = v[0]
    path = os.path.join(OUT, f"{rid}.json")
    old = json.load(open(path))
    day = datetime.datetime.fromisoformat(old["publicar"])
    navidad = day.date() <= datetime.date(2026, 12, 2)
    sc = [s if s != "OFERTA" else {"tipo": "oferta", "titulo": "🎄 OFERTA NAVIDAD" if navidad else "SOLO ESTA SEMANA", **P[prod]["oferta"], "extra": "🚚 Envío gratis",
                                   "dice": f"Ahora por {P[prod]['precio_voz']}, con envío gratis. Lo tienes en mi bio."} for s in escenas(formato, prod, v, k)]
    # the formato scene carries the style voice; product/offer lines use a normal, energetic read
    for i, s in enumerate(sc):
        if i > 0 and "dice" in s:
            s.setdefault("fx", "radio")
            s.setdefault("rate", "+12%")
            s.setdefault("pitch", "+0Hz")
    track, desde = M[mood][inst % len(M[mood])]
    hook = {
        "noticia": lambda: f"🚨 ÚLTIMA HORA: {v[1]}",
        "buscador": lambda: f"🔍 «{v[1]}»",
        "notas": lambda: f"📝 {v[1][0]}",
        "quiz": lambda: f"❓ {v[1][0]} Responde en comentarios 👇",
        "trailer": lambda: "🎬 " + " ".join(v[1][:-1]),
        "caja": lambda: v[1],
        "reloj": lambda: v[1][1],
        "meme": lambda: v[1].replace("\n", " "),
        "versus": lambda: " ".join(v[1][0]),
        "cuenta": lambda: " ".join(v[1]),
        "meme+quiz": lambda: f"{v[1][0]} 😅",
        "trailer+caja": lambda: "🎬 " + " ".join(v[1][0]),
    }[formato]()
    pack = "🎄 Pack Navidad: llévate los 2 productos y ahorra un 10 %." + (" Pide antes del 2/12 y llega para Navidad ·" if navidad else "") + " Envío gratis"
    caption = (f"{hook}\n\n{P[prod]['nombre']} Link en la bio 🔗\n\n{pack}\n\n{P[prod]['tags']}\n\n"
               f"🎵 «{track}» – Kevin MacLeod (incompetech.com), CC BY 4.0 · 🤖 Voz creada con IA")
    spec = {"id": rid, "formato": formato, "producto": prod, "voz": voz, "rate": rate, "pitch": pitch, "fx": fx,
            "musica": f"entrada/musica/{track}.mp3", "musicaDesde": desde,
            "publicar": old["publicar"], "status": old.get("status", "creado"), "escenas": sc, "caption": caption}
    for key in ("instagram_id", "publicado_en", "nota"):
        if key in old:
            spec[key] = old[key]
    if old.get("status") == "publicado":
        continue  # never touch something already on Instagram
    with open(path, "w") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(rid, old["publicar"], formato, prod, track)
