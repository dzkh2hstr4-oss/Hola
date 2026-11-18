# Publicación diaria automática — Lámpara LED atardecer (Lumora)

La tarea programada se ejecuta **dos veces al día**: `manana` (13:07) y `noche` (20:47),
hora de Madrid. **Cada vídeo tiene un único objetivo: vender la lámpara LED atardecer.**

Rama de trabajo: `claude/practical-fermi-g5yl5j` (rama por defecto del repo).

## Datos reales del producto (no inventar nada más)

- Lámpara LED que proyecta un círculo de atardecer en la pared.
- Se conecta por **USB**, **sin instalación**.
- Precio: **antes 49,95 €, ahora 29,95 €** (−40 %, oferta de Navidad).
- Marca **Lumora**. Compra: **link en la bio**.
- Fotos reales: `public/lampara-real.jpg` (`photo: "real"`) y `public/lampara.jpg` (`photo: "estudio"`).
- Prohibido inventar características, reseñas, cifras de ventas o testimonios.

## Pasos de cada ejecución

1. `git checkout claude/practical-fermi-g5yl5j && git pull`; si falta `node_modules`, `npm ci`.
2. Fecha de hoy en **Europe/Madrid** (`TZ=Europe/Madrid date +%F`). Si es anterior a
   `2026-11-19`, termina sin hacer nada. `ID = <fecha>-<franja>`.
3. En `content/plan.json`:
   - si `ID` ya está `"publicado"`, termina;
   - si `ID` no existe, **escribe vídeos nuevos** (ver «Cómo crear vídeos nuevos») para hoy y
     los próximos días hasta tener al menos 6 pendientes; commit.
4. **Voz (opcional, si hay créditos)**: escribe un guion corto que diga lo mismo que los
   textos en pantalla, con expresiones («¡Madre mía!», «¡boom!»…), y genéralo en Higgsfield:
   `generate_audio` con `{"model":"text2speech_v2","variant":"elevenlabs","voice_type":"preset","voice_id":"858499d9-fef5-40e1-bc29-b4dc661dc283","use_unlim":false,"prompt": <guion>}`;
   `jobs_wait`, descarga el mp3 a `/tmp/voz-<ID>.mp3`. Si no hay créditos, sigue **sin voz**
   (el vídeo funciona solo con música, efectos y texto grande) y dilo en el resumen.
5. `node scripts/crear-reel.mjs --id <ID> --publicar [--voz /tmp/voz-<ID>.mp3]` (~3 min).
   Mira 3–4 fotogramas con ffmpeg para comprobar que nada está roto.
6. `git add publicados/<ID>.mp4 content/plan.json && git commit && git push`; `SHA = git rev-parse HEAD`.
7. URL: `https://cdn.jsdelivr.net/gh/dzkh2hstr4-oss/Hola@<SHA>/publicados/<ID>.mp4`
   (comprueba con `curl -sI`: 200 y `video/mp4`).
8. **Instagram** (Windsor.ai): `execute_action` con `connector="instagram"`,
   `account="17841466665010853"`, `action="create_video_post"`,
   `params={"video_url": <URL>, "caption": <caption + "\n\n" + hashtags_base (+ "\n🔊 Voz generada con IA" si lleva voz)>, "share_to_feed": true}`.
9. Marca la entrada `"status": "publicado"` con `publicado_en` y el id de Instagram; commit + push.
10. **TikTok**: la conexión no permite publicar. Deja en el resumen la URL y la caption.

## Cómo crear vídeos nuevos

Cada vídeo es una lista de `beats` (duraciones en fotogramas, 30 fps; total 12–16 s):

- **El primer beat es el gancho y lo es TODO.** Debe enganchar en el primer segundo:
  texto grande visible desde el fotograma 0, una frase que provoque (pregunta, reto,
  polémica, «POV», «deja de…», «X está caducado», precio, chat, búsqueda, cuenta atrás…).
  Nunca repetir el gancho ni el tipo de gancho de los últimos 7 días.
- Cada vídeo debe ser **distinto** de los demás: otro lugar (`world`), otro tipo de gancho,
  otra historia. Lugares: `dormitorio`, `tiras` (cuarto con tiras LED moradas), `escritorio`,
  `salon`, `rincon`. De día son sosos (no oscuros); al encender la lámpara, todo se vuelve cálido.
- **Cada vídeo con su propio `theme`** (tipografía, animación del texto, colores,
  transiciones, diseño de oferta y final). Temas en `THEMES` de `src/Reel2/Reel2.tsx`:
  `medianoche`, `impacto`, `gamer`, `elegante`, `rotulador`, `galeria`, `pastel`, `navidad`,
  `versus`, `editorial`, `alarma`, `clasico`. No repetir el tema de los 3 vídeos anteriores.
- Las preguntas de intriga van con `tease` sobre un **plano cercano** distinto cada vez
  (`world` + `focus`: sofa, cojines, palomitas, cuadro, mesita, planta, cama, almohadas,
  ventana, mesilla, pared, estanteria, monitor, taza, libros, silla, tablero, butaca,
  taburete, tiras). Sin barras, contadores ni «?» de relleno.
- **Sin subtítulos**: el texto va grande y bonito en la propia escena (`text`). Líneas cortas
  (2–4 palabras); la palabra clave en cursiva elegante con `"serif": true` y color `#FFC94A`
  (dorado) o `#E8401C` (rojo). Emojis grandes con `"size": 150`.
- Termina casi siempre con `offer` (−40 %, 49,95 → 29,95) y `cta` (Lumora + link en la bio).

Tipos de beat (ver `src/Reel2/Reel2.tsx`):
`room` (lugar; `from`/`to` luz 0–1, `switchAt` = fotograma en que se enciende, `cam`:
`push|pull|wall|pan`, `text` y `textAfter`), `strips` (tiras LED → sello «CADUCADO» → lámpara),
`chat` (móvil con mensajes `msgs`), `search` (buscador que escribe `query` y muestra la lámpara),
`price` (etiqueta de precio que cae), `lightswitch` (interruptor → se ilumina `world`),
`split` (1 vs 2 lado a lado), `board` (tablero tipo Pinterest), `camera` (cámara de fotos:
foto sosa → foto con la lámpara), `gift` (caja que se abre), `countdown` (3-2-1 y se enciende),
`product` (foto real con rayos), `photo` (foto real a pantalla completa), `montage` (cortes
rápidos por varios lugares), `urgency` (contador «última oportunidad»), `offer`, `cta`.

Copia el formato de una entrada existente de `content/plan.json`.
