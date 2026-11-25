#!/usr/bin/env python3
"""Writes the animated motion-graphics reels (composition "Animado") for 25 Nov – 3 Dec,
one per slot (7 a day: 9, 12, 15, 18, 20, 22, 0 h Madrid), alternating products, each with its own hook,
structure, voice and suspense/hype music. Output: content/animado/an-XX.json + calendario.json."""
import json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "content/animado")
os.makedirs(OUT, exist_ok=True)

GREY = {"bg": "#c9ccd4", "color": "#1a1d24"}
MUSIC = [("Hitman", 12), ("Volatile Reaction", 28), ("Movement Proposition", 2), ("Five Armies", 14), ("Crypto", 0),
         ("Darkest Child", 2), ("Investigations", 0), ("Rocket", 0), ("Crypto", 0), ("Impact Prelude", 78)]
VOICES = ["es-ES-AlvaroNeural", "es-ES-ElviraNeural"]

P = {
    "aurora": {
        "fotos": ["aurora.jpg", "animado/ia-aurora.png", "animado/a1.jpg", "animado/a5.jpg"],
        "titulo": [{"text": "Proyector", "size": 104}, {"text": "AURORA", "size": 130, "bg": "accent"}],
        "subs": ["📲 Con mando · 🔋 USB", "🤏 Cubo de 10 cm", "🌌 Aurora + estrellas", "🔋 Recargable por USB"],
        "oferta": {"descuento": "-38%", "antes": "64,95 €", "ahora": "39,95 €"},
        "precio_voz": "treinta y nueve noventa y cinco",
        "on": [{"text": "Una AURORA"}, {"text": "en tu techo 🌌", "bg": "accent"}],
        "tags": "#proyectoraurora #auroraboreal #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora",
        "nombre": "Proyector aurora: aurora y estrellas en tu techo, con mando y recargable por USB. 39,95 € (antes 64,95 €).",
    },
    "atardecer": {
        "fotos": ["lampara-real.jpg", "animado/ia-atardecer.png", "animado/s4.jpg", "animado/s7.jpg"],
        "titulo": [{"text": "Lámpara", "size": 104}, {"text": "ATARDECER", "size": 124, "bg": "accent"}],
        "subs": ["🔌 Por USB · sin obras", "🌅 Luz cálida de atardecer", "📸 Fotos aesthetic", "🔘 Un botón y listo"],
        "oferta": {"descuento": "-40%", "antes": "49,95 €", "ahora": "29,95 €"},
        "precio_voz": "veintinueve noventa y cinco",
        "on": [{"text": "Un ATARDECER"}, {"text": "en tu pared 🌅", "bg": "accent"}],
        "tags": "#lamparaatardecer #sunsetlamp #decoracionhabitacion #roomdecor #aesthetic #regalosnavidad #lumora",
        "nombre": "Lámpara atardecer: luz cálida de atardecer en tu pared, por USB y sin obras. 29,95 € (antes 49,95 €).",
    },
}

# (producto, hook lines, tag, hook voice, structure, extra texts)
IDEAS = [
    ("aurora", ["Apaga la luz", "y mira esto 👀"], "aburrido · oscuro", "Apaga la luz de tu cuarto... y mira lo que pasa.", "cuenta", {}),
    ("atardecer", ["Tu cuarto a las 8", "es así de triste 😩"], "gris · frío · sin vida", "Tu cuarto a las ocho de la tarde... es así de triste.", "golpes", {"golpes": ["NO", "MÁS", "LUZ", "FRÍA"]}),
    ("aurora", ["¿Luz blanca", "o esto? 🤔"], "", "¿Sigues con la luz blanca del techo? Mira la diferencia.", "versus", {"izq": "Luz del techo", "der": "Aurora"}),
    ("atardecer", ["Lo que nadie", "te cuenta 🤫"], "secreto aesthetic", "Lo que nadie te cuenta de los cuartos de Pinterest...", "encender", {"golpes": ["ES", "UNA", "LÁMPARA"]}),
    ("aurora", ["POV: tu cuarto", "a las 12 de la noche 🌙"], "sin planes", "Son las doce de la noche... y tu cuarto está así.", "golpes", {"golpes": ["ESTO", "LO", "CAMBIA"]}),
    ("atardecer", ["Mira lo que pasa", "cuando pulso esto 👇"], "un solo botón", "Mira lo que pasa cuando pulso este botón.", "cuenta", {}),
    ("aurora", ["El regalo que", "nadie se espera 🎁"], "Navidad 2026", "Si no sabes qué regalar esta Navidad, mira esto.", "encender", {"golpes": ["REGALO", "RESUELTO"]}),
    ("atardecer", ["Tu pared", "está pidiendo esto 🧱"], "vacía · sosa", "Tu pared está vacía... y está pidiendo esto.", "versus", {"izq": "Pared sosa", "der": "Atardecer"}),
    ("aurora", ["No te duermas", "sin ver esto 😴"], "insomnio", "Antes de dormir, haz esto.", "cuenta", {}),
    ("atardecer", ["De cuarto aburrido", "a cuarto de TikTok 📱"], "antes", "De cuarto aburrido... a cuarto de TikTok, en un segundo.", "golpes", {"golpes": ["EN", "UN", "SEGUNDO"]}),
    ("aurora", ["Tu madre va a pensar", "que es magia ✨"], "real", "Cuando tu madre entre a tu cuarto, va a pensar que es magia.", "encender", {"golpes": ["NO", "ES", "MAGIA"]}),
    ("atardecer", ["Haz esto", "antes de una cita 💘"], "truco", "Si tienes una cita en casa, haz esto antes.", "cuenta", {}),
    ("aurora", ["Cielo estrellado", "sin salir de casa 🌠"], "sin frío", "¿Quieres ver estrellas sin salir de casa?", "versus", {"izq": "Techo blanco", "der": "Estrellas"}),
    ("atardecer", ["La luz que hace", "que todo se vea mejor ✨"], "fotos · vídeos", "Esta luz hace que todo se vea mejor. Mira.", "golpes", {"golpes": ["FOTOS", "DE", "10"]}),
    ("aurora", ["Gamers,", "esto es para vosotros 🎮"], "setup aburrido", "Gamers... vuestro setup necesita esto.", "encender", {"golpes": ["SETUP", "NIVEL", "DIOS"]}),
    ("atardecer", ["El truco más barato", "para tu cuarto 💸"], "menos de 30 €", "El truco más barato para cambiar tu cuarto.", "cuenta", {}),
    ("aurora", ["Esto no es", "un planetario 🪐"], "es mi cuarto", "Esto no es un planetario... es mi cuarto.", "golpes", {"golpes": ["ES", "UN", "CUBO", "DE 10 CM"]}),
    ("atardecer", ["Si te gusta", "la hora dorada 🌇"], "todo el año", "Si te encanta la hora dorada, puedes tenerla todo el día.", "versus", {"izq": "Bombilla", "der": "Hora dorada"}),
    ("aurora", ["Tu hermano pequeño", "va a flipar 🤯"], "regalo niños", "Tu hermano pequeño va a flipar con esto.", "cuenta", {}),
    ("atardecer", ["No la enciendas", "si estás triste 🥲"], "cuidado", "No enciendas esta lámpara si estás triste... porque se te pasa.", "encender", {"golpes": ["MODO", "CALMA"]}),
    ("aurora", ["¿Cuánto crees", "que cuesta esto? 💰"], "adivina", "¿Cuánto crees que cuesta esto? Te vas a sorprender.", "golpes", {"golpes": ["MENOS", "DE", "40 €"]}),
    ("atardecer", ["3 segundos", "para cambiar tu cuarto ⏱️"], "reto", "Te reto. Tres segundos para cambiar tu cuarto.", "cuenta", {}),
    ("aurora", ["Domingo de peli", "nivel cine 🍿"], "plan en casa", "Domingo de peli en casa... pero nivel cine.", "encender", {"golpes": ["PLAN", "PERFECTO"]}),
    ("atardecer", ["Nadie adivina", "de dónde sale esta luz 🤔"], "misterio", "Nadie adivina de dónde sale esta luz.", "golpes", {"golpes": ["ES", "ESTO"]}),
    ("aurora", ["Así me relajo", "después de clase 😮‍💨"], "estrés", "Así me relajo después de un día horrible.", "versus", {"izq": "Móvil", "der": "Aurora"}),
    ("atardecer", ["El regalo", "que sí van a usar 🎁"], "no más calcetines", "Este año no regales calcetines. Regala esto.", "encender", {"golpes": ["ADIÓS", "CALCETINES"]}),
    ("aurora", ["Último aviso", "para Navidad ⏳"], "últimos días", "Último aviso si lo quieres para Navidad.", "cuenta", {}),
    ("atardecer", ["Tu cuarto", "merece esto 🫶"], "autocuidado", "Tu cuarto también merece un cambio.", "golpes", {"golpes": ["TÚ", "TE LO", "MERECES"]}),
    ("aurora", ["Por qué todo el mundo", "quiere esto 💯"], "tendencia", "Te enseño por qué todo el mundo quiere esto.", "encender", {"golpes": ["100%", "MERECE", "LA PENA"]}),
    ("atardecer", ["Último del día:", "mira el final 👀"], "espera", "Espera al final, que viene lo mejor.", "cuenta", {}),
    # --- an-31 … an-63 (29 nov – 3 dic) ---
    ("aurora", ["Esto en tu techo", "cada noche 🌌"], "cada noche", "Imagina tener esto en tu techo... cada noche.", "cuenta", {}),
    ("atardecer", ["Pon esto", "en tu escritorio 💻"], "setup", "Pon esto en tu escritorio... y mira el cambio.", "encender", {"golpes": ["SETUP", "CÁLIDO"]}),
    ("aurora", ["Plan de pareja", "sin salir de casa 💑"], "noche en casa", "Plan para esta noche, sin salir de casa.", "versus", {"izq": "Peli y ya", "der": "Aurora"}),
    ("atardecer", ["Si tu cuarto", "no tiene ventana 🪟"], "sin luz natural", "Si tu cuarto no tiene ventana... necesitas esto.", "golpes", {"golpes": ["SOL", "SIN", "VENTANA"]}),
    ("aurora", ["Tu techo", "puede ser así 👆"], "mira arriba", "Mira arriba. Tu techo puede ser así.", "encender", {"golpes": ["MIRA", "ARRIBA"]}),
    ("atardecer", ["Un atardecer", "a cualquier hora 🌅"], "también de noche", "Un atardecer... a cualquier hora del día.", "cuenta", {}),
    ("aurora", ["No sabes qué regalar", "a tu pareja 🎁"], "Navidad", "¿No sabes qué regalarle a tu pareja? Apunta esto.", "golpes", {"golpes": ["REGALO", "TOP"]}),
    ("atardecer", ["Tus fotos", "con luz de atardecer 📸"], "selfies", "¿Quieres fotos con luz de atardecer? Así se hacen.", "versus", {"izq": "Flash", "der": "Atardecer"}),
    ("aurora", ["El cubo de 10 cm", "que cambia tu cuarto 🧊"], "pequeño", "Un cubo de diez centímetros... que cambia todo tu cuarto.", "encender", {"golpes": ["PEQUEÑO", "PERO", "BRUTAL"]}),
    ("atardecer", ["Regalo para", "tu mejor amiga 💛"], "Navidad", "Mira esto si buscas regalo para tu mejor amiga.", "cuenta", {}),
    ("aurora", ["Con un mando", "desde la cama 🛏️"], "sin levantarte", "Lo controlas con un mando... sin salir de la cama.", "golpes", {"golpes": ["DESDE", "LA", "CAMA"]}),
    ("atardecer", ["Así se ve", "un cuarto acogedor 🧸"], "cozy", "Así se ve un cuarto acogedor de verdad.", "encender", {"golpes": ["MODO", "COZY"]}),
    ("aurora", ["¿Aurora boreal", "sin ir a Noruega? 🤯"], "sin viajar", "¿Una aurora boreal en tu casa? Sin viajar a Noruega.", "versus", {"izq": "Noruega", "der": "Tu techo"}),
    ("atardecer", ["El color", "que cambia tu cuarto 🧡"], "naranja cálido", "Este color convierte tu cuarto en otro sitio.", "golpes", {"golpes": ["LUZ", "NARANJA", "CÁLIDA"]}),
    ("aurora", ["Pijamada", "nivel pro 🎉"], "plan amigas", "Si haces pijamada en casa, necesitas esto.", "cuenta", {}),
    ("atardecer", ["Para tu", "rincón de lectura 📚"], "leer", "Tu rincón de lectura... con luz de atardecer.", "encender", {"golpes": ["MODO", "LECTURA"]}),
    ("aurora", ["Esto parece", "de otra galaxia 🚀"], "espacial", "Esto parece de otra galaxia... y es un cuarto normal.", "golpes", {"golpes": ["OTRA", "GALAXIA"]}),
    ("atardecer", ["Tu cuarto", "en modo verano ☀️"], "en pleno invierno", "Pleno invierno... y tu cuarto en modo verano.", "versus", {"izq": "Invierno", "der": "Verano"}),
    ("aurora", ["Nadie se cree", "que esto es un techo 😮"], "mira bien", "Nadie se cree que esto es un techo.", "encender", {"golpes": ["ES", "UN", "TECHO"]}),
    ("atardecer", ["USB", "y listo 🔌"], "sin obras", "Sin obras, sin líos. Lo enchufas por USB y listo.", "cuenta", {}),
    ("aurora", ["Navidad", "en tu techo 🎄"], "Navidad", "Esta Navidad... pon esto en tu techo.", "golpes", {"golpes": ["NAVIDAD", "MÁGICA"]}),
    ("atardecer", ["Antes de dormir", "pon esto 🌙"], "ritual", "El mejor ritual antes de dormir.", "encender", {"golpes": ["RITUAL", "DE NOCHE"]}),
    ("aurora", ["Sí, tú.", "Te falta esto 🫵"], "sí, tú", "Sí, tú. Esto es lo que le falta a tu cuarto.", "versus", {"izq": "Tu cuarto", "der": "Con aurora"}),
    ("atardecer", ["Pulsas un botón", "y pasa esto 🔘"], "un clic", "Pulsas un botón... y pasa esto.", "cuenta", {}),
    ("aurora", ["Haz que tu cuarto", "parezca un sueño 💭"], "sueño", "Haz que tu cuarto parezca un sueño.", "golpes", {"golpes": ["MODO", "SUEÑO"]}),
    ("atardecer", ["Para quien", "lo tiene todo 🎁"], "regalo difícil", "Regalo para la persona que lo tiene todo.", "encender", {"golpes": ["REGALO", "ORIGINAL"]}),
    ("aurora", ["Mira lo que hace", "este cubo 🧊"], "10 cm", "Mira lo que hace este cubo tan pequeño.", "cuenta", {}),
    ("atardecer", ["Tu cuarto", "a las 7 de la tarde 🌇"], "golden hour", "Las siete de la tarde... la hora dorada en tu cuarto.", "golpes", {"golpes": ["HORA", "DORADA"]}),
    ("aurora", ["Estrellas + aurora", "con un clic ✨"], "mando", "Estrellas y aurora... con un solo clic.", "encender", {"golpes": ["UN", "CLIC"]}),
    ("atardecer", ["¿Regalo", "para tu madre? 🫶"], "Navidad", "¿Buscas regalo para tu madre? Mira esto.", "versus", {"izq": "Perfume", "der": "Atardecer"}),
    ("aurora", ["Si te gusta", "el espacio 🌌"], "fan del cosmos", "Si te gusta el espacio... esto es para ti.", "golpes", {"golpes": ["EL", "ESPACIO", "EN CASA"]}),
    ("atardecer", ["Tu pared", "antes y después 🔁"], "cambio", "Tu pared antes... y después. Atento.", "cuenta", {}),
    ("aurora", ["Guarda este vídeo", "para Navidad 🔖"], "idea regalo", "Guarda este vídeo para cuando busques regalo.", "encender", {"golpes": ["IDEA", "REGALO"]}),
]


def slots():
    # 7 a day (Madrid): 9, 12, 15, 18, 20, 22 and midnight (= 00:00 of the next date), 25 Nov – 3 Dec
    d = datetime.date(2026, 11, 25)
    while d <= datetime.date(2026, 12, 3):
        for h in ("09:00", "12:00", "15:00", "18:00", "20:00", "22:00"):
            yield d, h
        yield d + datetime.timedelta(days=1), "00:00"
        d += datetime.timedelta(days=1)


cal = []
for i, ((prod, hook, tag, hook_voz, est, ex), (day, hour)) in enumerate(zip(IDEAS, slots())):
    p = P[prod]
    rid = f"an-{i + 1:02d}"
    music, desde = MUSIC[i % len(MUSIC)]
    foto = p["fotos"][i % len(p["fotos"])]
    sub = p["subs"][i % len(p["subs"])]
    gancho = {"tipo": "gancho", "lineas": [{"text": hook[0]}, {"text": hook[1], **GREY}], "dice": hook_voz}
    if tag:
        gancho["etiqueta"] = tag
    on = {"tipo": "encender", "antes": "click...", "despues": p["on"],
          "dice": "Boom. Una aurora boreal en tu techo." if prod == "aurora" else "Boom. Un atardecer en tu pared."}
    producto = {"tipo": "producto", "lineas": p["titulo"], "foto": foto, "sub": sub,
                "dice": ("Es este proyector. Con mando, y se carga por USB." if prod == "aurora" else "Es esta lámpara. Se enchufa por USB y listo.")}
    navidad = day <= datetime.date(2026, 12, 2)
    oferta = {"tipo": "oferta", "titulo": "🎄 OFERTA NAVIDAD" if navidad else "SOLO ESTA SEMANA", **p["oferta"],
              "extra": "🚚 Envío gratis",
              "dice": f"Ahora por {p['precio_voz']}, con envío gratis. Lo tienes en mi bio."}
    if est == "cuenta":
        mid = [{"tipo": "cuenta", "lineas": [{"text": "Atento... 🤫"}], "dice": "Tres... dos... uno..."}, on, producto]
    elif est == "golpes":
        mid = [{"tipo": "golpes", "palabras": ex["golpes"]}, producto, on]
    elif est == "versus":
        mid = [{"tipo": "versus", "lineas": [{"text": "¿Con cuál te quedas?"}], "izquierda": ex["izq"], "derecha": ex["der"],
                "dice": "A la izquierda, lo de siempre. A la derecha... esto."}, producto]
    else:  # encender first, then slam + product
        mid = [on, {"tipo": "golpes", "palabras": ex["golpes"]}, producto]
    pack = "🎄 Pack Navidad: llévate los 2 productos y ahorra un 10 %." + (" Pide antes del 2/12 y llega para Navidad ·" if navidad else "") + " Envío gratis"
    caption = (f"{hook[0]} {hook[1]} {p['nombre']} Link en la bio 🔗\n\n{pack}\n\n{p['tags']}\n\n"
               f"🎵 «{music}» – Kevin MacLeod (incompetech.com), CC BY 4.0 · 🤖 Voz creada con IA")
    spec = {"id": rid, "producto": prod, "voz": VOICES[i % 2], "rate": "+14%", "musica": f"entrada/musica/{music}.mp3",
            "musicaDesde": desde, "musicaVolumen": 0.2, "publicar": f"{day.isoformat()}T{hour}", "status": "creado",
            "escenas": [gancho, *mid, oferta], "caption": caption}
    path = os.path.join(OUT, f"{rid}.json")
    if os.path.exists(path):  # never overwrite a reel that is already rendered / published; keep its status
        old = json.load(open(path))
        old["publicar"] = spec["publicar"]
        spec = old
    with open(path, "w") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
        f.write("\n")
    cal.append([rid, prod, spec["publicar"], " / ".join(hook)])
json.dump(cal, open(os.path.join(OUT, "calendario.json"), "w"), ensure_ascii=False, indent=1)
print(len(cal), cal[0], cal[-1])
