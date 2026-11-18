# Publicación diaria automática — Lumora (lámpara atardecer + proyector aurora)

La tarea programada se ejecuta **dos veces al día**: `manana` (13:07) y `noche` (20:47),
hora de Madrid. **Cada vídeo vende UN producto** (campo `producto` de la entrada en `content/plan.json`):
- `manana` → **lámpara LED atardecer** (`"producto": "atardecer"`)
- `noche` → **proyector aurora** (`"producto": "aurora"`)

Solo se publica en **lumora.esst**. La cuenta lumora.est ya no se usa: nunca publiques en ella.

Rama de trabajo: `claude/intelligent-edison-tb7c0m`.

## Reglas nuevas (18/11, tras analizar los datos)

Los reels animados con IA llegaron a 5–8 personas; los grabados con la lámpara real, a 100–240.
La gente se va a los 3–4 s. Por eso, a partir de ahora:

- **Duración total: 7–10 s** (210–300 fotogramas). Nunca más de 10 s.
- **El primer beat SIEMPRE es `photo`** (foto real del efecto, alternando `real` / `estudio`), `dur` 60–70,
  con el gancho escrito encima. El texto ya se ve en el fotograma 0.
- Después, **un solo** beat de historia (máx. 105 fotogramas), luego `offer` (60) y `cta` (45).
- **Voz SIEMPRE** (petición del dueño, 18/11): cada vídeo lleva voz en off que dice lo mismo que el texto
  en pantalla. Las voces ya generadas están en `content/voz/<ID>.mp3` y `crear-reel.mjs` las usa solas.
- **Animación SIEMPRE**: nada de fotos quietas. Las fotos llevan efectos de luz animados
  (aurora/estrellas o brillo de atardecer) y cada vídeo tiene al menos una escena con «momento» (clic,
  cuenta atrás, regalo, antes/después…).
- **Duración con voz: 8–11 s.**
- Nada de urgencia falsa («última oportunidad», «corre que vuelan»). La urgencia real es la Navidad:
  añade a cada caption `🎄 Pide antes del 2/12 y llega para Navidad · Envío gratis`.

## Datos reales de la lámpara atardecer (no inventar nada más)

- Lámpara LED que proyecta un círculo de atardecer en la pared.
- Se conecta por **USB**, **sin instalación**.
- Precio: **antes 49,95 €, ahora 29,95 €** (−40 %, oferta de Navidad).
- Marca **Lumora**. Compra: **link en la bio**. Cuenta de Instagram donde se publica: **lumora.esst** (id 17841422628356887).
- Fotos reales: `public/lampara-real.jpg` (`photo: "real"`) y `public/lampara.jpg` (`photo: "estudio"`).
- Prohibido inventar características, reseñas, cifras de ventas o testimonios.

## Datos reales del proyector aurora (Shopify: «Proyector Aurora Galaxia LED con Mando»)

- Proyecta ondas de luz tipo aurora (azul, verde, morado) y estrellas en techo y paredes.
- **Mando a distancia incluido**. **Recargable por USB** (sin cables a la vista), sin instalación.
- Blanco, compacto (10 × 10 cm).
- Precio: **antes 64,95 €, ahora 39,95 €** (−38 %). **Envío gratis**.
- Fotos reales: `public/aurora-real.jpg` (techo con galaxia, `photo: "real"`) y `public/aurora.jpg`
  (el proyector en una mesilla, `photo: "estudio"`).
- Hashtags: `hashtags_aurora` de `content/plan.json` (no los de la lámpara).
- **Solo beats con fotos reales**: `photo`, `reveal`, `product`, `offer`, `cta`. Estructura que funciona:
  `photo` (gancho, 60, `photo: "extra"` o `"estudio"`) → `reveal` (90, `switchAt` 38: «Apagas la luz…» →
  clic → aurora) → `offer` (60) → `cta` (45). Fotos: `real`, `estudio`, `extra` (`public/aurora-2.jpg`). Nada de `room`, `strips`, `tease`,
  `lightswitch`, `montage`… (son dibujos de la lámpara atardecer). Textos en color `#7EF0C8` (menta).
- Mismas reglas de duración (7–10 s) y gancho visible en el fotograma 0.

## Pasos de cada ejecución

1. `git checkout claude/intelligent-edison-tb7c0m && git pull`; si falta `node_modules`, `npm ci`.
2. Fecha de hoy en **Europe/Madrid** (`TZ=Europe/Madrid date +%F`). Si es anterior a
   `2026-11-19`, termina sin hacer nada. `ID = <fecha>-<franja>`.
3. En `content/plan.json`:
   - si `ID` ya está `"publicado"`, termina;
   - si `ID` no existe, **escribe vídeos nuevos** (ver «Cómo crear vídeos nuevos») para hoy y
     los próximos días hasta tener al menos 6 pendientes (mañana = atardecer, noche = aurora); commit.
4. **Voz (obligatoria)**: si existe `content/voz/<ID>.mp3`, ya está. Si no, usa el campo `voz_guion` de la
   entrada (o escribe uno: 18–24 palabras, dice lo mismo que los textos, precios en letra, termina en
   «Link en la bio») y genéralo en Higgsfield con `generate_audio_batch` (UNA petición cada vez: el límite
   da error 429 si mandas varias): `{"model":"text2speech_v2","variant":"elevenlabs","voice_type":"preset",
   "voice_id":"858499d9-fef5-40e1-bc29-b4dc661dc283","use_unlim":false,"prompt": <guion>}`; `jobs_wait`;
   descarga el mp3 a `content/voz/<ID>.mp3`. **Si no hay créditos o falla: NO publiques**; marca la entrada
   `"status": "sin-voz"` y dilo en el resumen.
5. `node scripts/crear-reel.mjs --id <ID> --publicar` (~1 min; usa la voz sola).
6. **CONTROL DE CALIDAD (obligatorio, nunca te lo saltes):**
   a. `node scripts/revisar-reel.mjs --id <ID>`. Si sale `NO PUBLICAR`, arregla la entrada y vuelve a
      renderizar (máx. 2 intentos). Si sigue fallando: no publiques, marca `"status": "revisar"` con el motivo.
   b. Mira `out/revision/<ID>.jpg` (8 fotogramas) y comprueba TODO esto:
      - el gancho se lee en el primer fotograma (texto grande, sin cortar, sin tapar);
      - el producto (o su efecto de luz) se ve en el primer segundo y es el producto correcto;
      - ningún texto se sale de la pantalla, se solapa o es ilegible;
      - el precio de la oferta es el del producto (atardecer 29,95 €, aurora 39,95 €);
      - termina con el CTA «Link en la bio».
      Un fotograma blanco o negro suelto es la transición: normal. Si dudas de algo, saca más fotogramas
      con ffmpeg alrededor de ese momento antes de decidir.
   c. Solo si a y b están bien, sigue. Ante la duda, NO publiques.
7. `git add publicados/<ID>.mp4 content/plan.json content/voz && git commit && git push`; `SHA = git rev-parse HEAD`.
8. URL: `https://cdn.jsdelivr.net/gh/dzkh2hstr4-oss/Hola@<SHA>/publicados/<ID>.mp4`
   (comprueba con `curl -sI`: 200 y `video/mp4`).
9. **Instagram** (Windsor.ai): `execute_action` con `connector="instagram"`,
   `account="17841422628356887"`, `action="create_video_post"`,
   `params={"video_url": <URL>, "caption": <caption + "\n\n" + hashtags>, "share_to_feed": true}`,
   donde `hashtags` = `hashtags_aurora` si `producto` es `aurora`, si no `hashtags_base`; añade al final
   `\n🔊 Voz IA`.
10. Marca la entrada `"status": "publicado"` con `publicado_en` y el id de Instagram; commit + push.
11. **TikTok**: la conexión no permite publicar. Deja en el resumen la URL y la caption.

## Cómo crear vídeos nuevos

Cada vídeo es una lista de `beats` (duraciones en fotogramas, 30 fps; **total 7–10 s**, ver «Reglas nuevas»):

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
`product` (foto real con rayos), `photo` (foto real a pantalla completa con luz animada),
`reveal` (foto real a oscuras → clic → se enciende con destello y luz animada; `text`, `textAfter`, `switchAt`), `montage` (cortes
rápidos por varios lugares), `urgency` (contador «última oportunidad»), `offer`, `cta`.

Copia el formato de una entrada existente de `content/plan.json`.
