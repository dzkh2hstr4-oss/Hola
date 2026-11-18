# Reels con Google Flow (método actual, desde el 18/11)

Los vídeos animados por código (Reel2) NO se publican: al dueño no le convencen. Ahora los reels se hacen
con clips realistas de **Google Flow** que graba el dueño, montados en el estilo de su reel del
«1, 2, 3, 4» (el que mejor funcionó).

## Flujo

1. **12:30 y 19:30 (Madrid)**: Claude escribe **2 guiones** en el chat (tarea programada en la sesión).
   Por cada guion: gancho, 4 tomas para Flow (prompts en inglés), textos en pantalla y caption.
   Además crea `content/clips/<ID>.json` con `"status": "esperando-clips"` y guarda los guiones en
   `content/guiones/<fecha>.md`. IDs: `<fecha>-1`, `<fecha>-2`, `<fecha>-3`…
2. **El dueño** genera los clips en Flow y los manda (chat o Google Drive).
3. **Claude**: copia los clips a `entrada/<ID>/1.mp4, 2.mp4…` (no se suben a git), ajusta en el JSON qué
   trozo de cada clip usar (`desde`, `segundos`), y monta:
   `node scripts/montar-clips.mjs --id <ID>` → `out/reels/<ID>.mp4` + `out/revision/<ID>.jpg`.
4. **Revisión**: mirar los 8 fotogramas (gancho legible en el fotograma 0, producto correcto y creíble,
   textos sin cortar, final con «comenta» + botón). Si un clip de Flow sale raro (manos deformes, producto
   distinto, texto inventado), no se usa: se pide otro.
5. **Mandar el vídeo al dueño y esperar su OK.** Nunca se publica sin su OK.
6. Con el OK: `node scripts/montar-clips.mjs --id <ID> --publicar`, commit + push, y publicar en
   **lumora.esst** (Windsor, cuenta 17841422628356887, `create_video_post`, URL de jsDelivr con el SHA,
   caption del JSON). Marcar `"status": "publicado"`.

## Cómo escribir los guiones

- **Gancho en 1 s**, escrito arriba en etiquetas blancas (2 líneas cortas). Formatos que funcionan:
  «POV: …», «Apaga la luz y…», «¿cuál pongo esta noche?», «X vs con esto», «el regalo que…».
- **Estructura**: toma 1 (gancho, 2–2,5 s) → 3–4 tomas numeradas 1, 2, 3… (1,4–1,8 s cada una) →
  final 2,5 s con «comenta 1, 2 o 3 💬» + botón «Cómpralo en mi bio». Total 8–12 s.
- Las opciones numeradas deben ser cosas que el producto **hace de verdad**:
  - **Proyector aurora**: aurora verde, galaxia morada, ondas azules, cielo de estrellas; mando a distancia;
    recargable por USB; cubo blanco de 10 cm. 39,95 € (antes 64,95 €).
  - **Lámpara atardecer**: círculo naranja de atardecer en pared/techo/detrás de la cama, lámpara de pie
    negra pequeña con cabezal redondo, USB. 29,95 € (antes 49,95 €).
  - Envío gratis. Nada de efectos, colores o funciones que el producto no tenga.
- **Prompts de Flow** (inglés, uno por toma), siempre con: `vertical 9:16`, `realistic smartphone footage`,
  `handheld, natural`, el sitio (dormitorio real, ordenado, sin personas famosas ni marcas), la luz, y qué
  pasa en 8 s. Recomendar al dueño usar **Frames to Video / Ingredients con la foto real del producto**
  (`public/aurora.jpg`, `public/lampara.jpg`) para que el producto salga igual que el real.
- Cada guion distinto del anterior (otro gancho, otro sitio).
