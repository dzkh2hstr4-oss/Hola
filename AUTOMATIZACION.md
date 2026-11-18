# Publicación diaria automática — Lámpara LED atardecer (Lumora)

Este documento es la receta que sigue la tarea programada **dos veces al día**:
`manana` (13:07, hora de Madrid) y `noche` (20:47, hora de Madrid).
El objetivo de **cada** vídeo es vender la lámpara LED atardecer de Lumora.

Rama de trabajo: `claude/practical-fermi-g5yl5j` (es la rama por defecto del repo).

## Datos reales del producto (no inventar nada más)

- Lámpara LED que proyecta un círculo de atardecer en la pared.
- Se conecta por **USB**, **sin instalación**.
- Precio: **antes 49,95 €, ahora 29,95 €** (−40 %, oferta de Navidad).
- Marca: **Lumora**. Compra: **link en la bio**.
- Fotos reales: `public/lampara-real.jpg` y `public/lampara.jpg`.
- No inventar características (colores, mando, potencia, envío, etc.) ni reseñas.

## Pasos de cada ejecución

1. `cd` al repo, `git checkout claude/practical-fermi-g5yl5j && git pull`.
   Si `node_modules` no existe: `npm ci`.
2. Calcula la fecha de hoy en **Europe/Madrid** (`TZ=Europe/Madrid date +%F`).
   - Si es anterior a `2026-11-19`, no hagas nada y termina.
   - `ID = <fecha>-<franja>` (franja = `manana` o `noche`, la que diga el aviso).
3. Abre `content/plan.json`.
   - Si `ID` ya tiene `"status": "publicado"`, termina (nunca publicar dos veces).
   - Si `ID` no existe, **escribe tú los guiones nuevos** (ver «Cómo escribir guiones»)
     para hoy y los próximos días hasta tener al menos 6 pendientes; haz commit.
4. **Voz** (Higgsfield, misma voz de todos los vídeos):
   `generate_audio` con
   `{"model":"text2speech_v2","variant":"elevenlabs","voice_type":"preset","voice_id":"858499d9-fef5-40e1-bc29-b4dc661dc283","use_unlim":false,"prompt": <frases "say" unidas con un espacio>}`.
   Espera con `jobs_wait` y descarga el mp3 (`curl`) a `/tmp/voz-<ID>.mp3`.
   - Si falla por créditos o por plan, **no publiques**: marca la entrada con
     `"status": "sin_voz"` y una nota, haz commit/push y termina explicándolo.
5. `node scripts/crear-video.mjs --id <ID> --voz /tmp/voz-<ID>.mp3`
   (render ~3 min). Comprueba 3–4 fotogramas con ffmpeg para ver que nada está roto.
6. `git add publicados/<ID>.mp4 content/plan.json && git commit && git push`.
   `SHA = git rev-parse HEAD`.
7. URL pública: `https://cdn.jsdelivr.net/gh/dzkh2hstr4-oss/Hola@<SHA>/publicados/<ID>.mp4`.
   Comprueba con `curl -sI` que responde 200 y `content-type: video/mp4`.
8. **Instagram** (Windsor.ai): `execute_action` con
   `connector="instagram"`, `account="17841466665010853"`, `action="create_video_post"`,
   `params={"video_url": <URL>, "caption": <caption>, "share_to_feed": true}`.
   Caption = `caption` de la entrada + línea en blanco + `hashtags_base` + `\n🔊 Voz generada con IA`.
9. Marca la entrada `"status": "publicado"`, guarda `publicado_en` (fecha/hora) y el id
   que devuelva Instagram; commit + push.
10. **TikTok**: la conexión actual no permite publicar. Deja en el resumen final la URL del
    vídeo y la caption para que el dueño lo suba a mano.

## Cómo escribir guiones nuevos

- Cada vídeo: **4–6 frases**, 15–22 s en total, español de España, con muchas expresiones
  («¡Madre mía!», «¡boom!», «¡Para!», «¡Ojo!»). Cada frase termina en `.`, `!`, `?` o `…`.
- La **primera frase es el gancho**: diferente cada vez (POV, pregunta, reto, «deja de
  scrollear», antes/después, regalo, error de precio, top 3, curiosidad…). No repetir
  ganchos ni temas de los últimos 7 días.
- Las dos últimas frases casi siempre: oferta (`offer`) y llamada a la acción (`cta`).
- Cada frase lleva una escena (`scene.type`):
  `hook` (cuarto apagado + texto), `hookLit` (cuarto encendido + texto),
  `slam` (2–4 palabras que golpean), `product` (foto real; `photo`: `real`|`estudio`),
  `lampOn` (la lámpara cae y se enciende; `text` antes y `textAfter` después),
  `beforeAfter` (antes/después con cortinilla), `uses` (lista de `items`, máx. 5),
  `photo` (foto real a pantalla completa), `gift` (caja de regalo que se abre),
  `offer` (−40 %, 49,95 → 29,95), `cta` (LUMORA + link en la bio).
- Los textos en pantalla (`text`) cortos y en MAYÚSCULAS para los ganchos; los números
  de la voz escritos con letras («veintinueve noventa y cinco»).
- Formato: copia una entrada existente de `content/plan.json`.
