# Rutina diaria del canal de GTA 6 (español)

Cada día se entrega un **paquete**: 5 shorts + 1 vídeo largo, todos nuevos y distintos, con título,
descripción y hora de publicación. El dueño del canal los programa en YouTube Studio (desde aquí no se
puede subir a YouTube).

Contexto: GTA 6 salió el **19 de noviembre de 2026**. La gente ya está jugando. Canal de fans en español de España.

## Horario de publicación (hora de España, Europe/Madrid)

| Hueco | Hora |
|---|---|
| Short 1 | 10:00 |
| Short 2 | 13:00 |
| Short 3 | 17:00 |
| Short 4 | 21:00 |
| Short 5 | 00:00 (del día siguiente) |
| Vídeo largo | 19:00 |

## Reglas que no se rompen

1. **Lee `content/gta6/ESTILO.md`** antes de nada.
2. **Sin audio de Rockstar.** Clips siempre en silencio (`gameVolume: 0` en shorts, `clipVolume: 0` en largos).
   Nunca usar `"play"`. Frases de personajes: dobladas al español con otra voz (`quote`/`dub` + `voice`).
3. **Música solo de Kevin MacLeod** (`public/gta6/music/inc/`, CC BY 4.0) y SIEMPRE poner el crédito en la descripción:
   `🎵 "Título" Kevin MacLeod (incompetech.com) · CC BY 4.0`
4. **Nada repetido.** Lee `content/gta6/temas-usados.md`. Cada short: tema, gancho y clips principales distintos
   a los ya usados. Varía también el formato del gancho (pregunta, reto, dato, «POV», «nadie se ha dado cuenta de…»,
   ranking, comparación…). Al terminar, añade lo que has hecho a `temas-usados.md`.
5. Pocos textos y emojis encima del gameplay: que se vea el juego. Título del gancho de 1–3 palabras.
6. Descripciones de shorts: **menos de 100 caracteres** + línea de crédito de música aparte.
7. Solo datos verdaderos. Si algo es teoría o rumor, dilo («muchos fans creen…»). Nunca inventes cifras.
   El Jack of Hearts/club se llama «el Tacón»; no digas «Boobie» para el club.
8. Voz: `es-ES-AlvaroNeural` con `"mic": true`, `rate` +8 % a +12 %, `pitch` +3 Hz. Sin efecto `eco` en el gancho.
   Voces de doblaje: es-MX-JorgeNeural, es-CO-GonzaloNeural, es-CL-LorenzoNeural, es-ES-ElviraNeural.

## Material disponible

- Clips de gameplay oficiales (Extended Look): `public/gta6/gp/*.mp4`. **Mira antes `content/gta6/catalogo/<clip>.jpg`**
  (8 fotogramas con su segundo) para elegir clip y `clipFrom`. Prefijos: `d_` detalles/historia, `m_` misiones/golpes,
  `a_` actividades, `c_` el Tacón, `q_` frases de personajes.
- Imágenes oficiales: `public/gta6/img/*.jpg` (personajes, Vice City, Leonida Keys, Grassrivers, Port Gellhorn, coches `ue_*`).
- Efectos: `public/wyr/sfx/*.wav`, `public/voz/impacto.wav`, `public/voz/click.wav`.
- Pistas de música: miami_nights, miami_viceroy, ethernight_club, private_eye, hot_pursuit, mistake_the_getaway,
  griphop, mta, voltaic, super_power_cool_dude, i_can_feel_it_coming, exit_the_premises.

## Cómo hacer un short (ejemplo: `content/gta6/short12-plan.json`)

```bash
export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt
B=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | head -1)
D=2026-11-24   # fecha del paquete
N=s1           # s1..s5
# 1) plan (ver formato abajo) -> content/gta6/diario/$D/$N-plan.json
python3 scripts/gta6-short-build.py content/gta6/diario/$D/$N-plan.json content/gta6/diario/$D/$N.json voz-$D-$N
# 2) post-ajustes obligatorios
python3 - content/gta6/diario/$D/$N.json <<'EOF'
import json,sys; p=sys.argv[1]; d=json.load(open(p))
d.update(gameVolume=0, sfxGain=0.6, capSize=84, capTop=1500, smooth=True); json.dump(d,open(p,'w'),ensure_ascii=False,indent=1)
EOF
# 3) banda: [{"s":0,"e":TOTAL,"mood":"track:NOMBRE@SEGUNDO"}] -> $N-banda.json
python3 scripts/banda.py content/gta6/diario/$D/$N-banda.json public/gta6/music/$D-$N.wav
# 4) render + mezcla (voz alta, música suave)
npx remotion render GTA6Short out/gta6/raw/$D-$N.mp4 --props=content/gta6/diario/$D/$N.json --browser-executable=$B --concurrency=1 --offthreadvideo-cache-size-in-bytes=300000000 --log=error
python3 scripts/mezcla.py --video out/gta6/raw/$D-$N.mp4 --out publicados/gta6/diario/$D/$N.mp4 --music-file public/gta6/music/$D-$N.wav --mv 0.34
```

Formato del plan de short (cada línea = una escena con voz):
```json
{"rate":"+10%","pitch":"+3Hz","mic":true,"lines":[
 {"t":"Gancho…","imgs":["v:d_casa"],"clipFrom":8,"title":[["PALABRA"],["*CLAVE*"]],"hook":true,
  "sfx":[{"f":"voz/impacto.wav","at":0,"v":0.6}]},
 {"t":"Frase…","imgs":["v:a_hidro"],"clipFrom":0,"title":[],"sfx":[{"f":"wyr/sfx/whoosh.wav","at":0,"v":0.28}]},
 {"t":"Frase doblada de un personaje","quote":true,"voice":"es-MX-JorgeNeural","rate":"+12%","pitch":"+6Hz","imgs":["v:d_tele"],"clipFrom":4,"title":[],"sfx":[]},
 {"t":"Pregunta final para comentar…","imgs":["v:…"],"title":[["¿TÚ","QUÉ"],["*HARÍAS*?"]],"emojis":["👇"]}
]}
```
`imgs` acepta `v:<clip>` (gameplay) o el nombre de una imagen de `public/gta6/img`. Usa `speed` (p. ej. 0.6) si un clip
es más corto que la frase. Duración ideal 20–40 s.

## Cómo hacer el vídeo largo (ejemplos: `content/gta6/docC-plan.json`, `docD-plan.json`)

Composición `GTA6Doc`, temas `doc`, `tier`, `detective`, `news`. Tipos de escena: clip, panel, list, cards, map, stat,
quote, tier, board, chapter, intro, outro, split, cork, suspect, evidence, headline, versus. Duración 5–9 min.
Formatos que funcionan: «N cosas que no sabías», rankings, «explicado», guías para empezar, comparativas, teorías.

```bash
python3 scripts/gta6-doc-build.py content/gta6/diario/$D/largo-plan.json content/gta6/diario/$D/largo.json largo-$D
# banda por secciones: [{"s":..,"e":..,"mood":"track:NOMBRE@SEG"}, …] (cambia de pista en cada parte)
python3 scripts/banda.py content/gta6/diario/$D/largo-banda.json public/gta6/music/largo-$D.wav
python3 scripts/render-tramos.py GTA6Doc content/gta6/diario/$D/largo.json out/gta6/raw/largo-$D.mp4
python3 scripts/mezcla.py --video out/gta6/raw/largo-$D.mp4 --out publicados/gta6/diario/$D/largo.mp4 --music-file public/gta6/music/largo-$D.wav --mv 0.3 --maxrate 1500k
```
El archivo final del largo debe pesar **menos de 95 MB** (GitHub). Si pasa, baja `--maxrate`.
Miniatura 1280x720 con Playwright (HTML + fuentes de `public/fonts`), texto grande de 2–4 palabras, una cara o imagen
potente: `publicados/gta6/diario/$D/miniatura.jpg`.

## Comprobaciones antes de entregar

- Primer fotograma no negro; hoja de contactos de cada vídeo (ffmpeg `tile`) y mírala.
- Volumen integrado ≈ −14 LUFS (`ffmpeg -af ebur128`).
- La voz se entiende por encima de la música.

## Entrega

1. `publicados/gta6/diario/$D/PAQUETE.md` con, para cada vídeo: hora de publicación, título, descripción (shorts <100
   caracteres + crédito musical), y enlace de descarga
   `https://raw.githubusercontent.com/dzkh2hstr4-oss/Hola/<rama>/publicados/gta6/diario/$D/<archivo>`.
2. Actualiza `content/gta6/temas-usados.md`.
3. Commit y push. Resume el paquete al final de la sesión (títulos + horas + enlaces).
