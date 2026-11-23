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

- **Gancho en 1 s**, escrito arriba en etiquetas blancas (2 líneas cortas).
- **CADA VÍDEO CON UN GANCHO Y UN FORMATO DISTINTOS.** El «1, 2, 3, 4 / comenta cuál» YA SE USÓ: no repetirlo.
  Antes de escribir, mira la lista «Ganchos ya usados» (abajo) y no repitas ninguno ni su formato en los
  últimos 10 vídeos. Añade los nuevos a la lista.
- Formatos para ir rotando (uno distinto cada vez):
  antes/después · POV de una situación («POV: tu madre entra a tu cuarto a las 12») · pregunta que intriga
  («¿esto es un cuarto o un planetario?») · adivina el precio («¿cuánto crees que cuesta? 👇» → precio) ·
  «espera al final 👀» · unboxing (caja → enchufar → efecto) · rutina de noche · truco de decoración
  («el truco de los cuartos de Pinterest») · polémica suave («las tiras LED ya pasaron de moda») ·
  regalo («si no sabes qué regalar esta Navidad…») · fotos («tus fotos con flash vs con esto») ·
  setup gamer/escritorio · cita en casa / noche de peli · sonido satisfactorio del clic · reto
  («dime un cuarto más bonito que este») · comparativa con otra luz · «cosas que no sabías que necesitabas».
- **Estructura**: toma 1 (gancho, 2–2,5 s) → 2–3 tomas con su texto (`texto` en el JSON; `numero` solo si el
  formato lo pide) → final 2–2,5 s con el botón «Cómpralo en mi bio» y, si encaja, una pregunta para
  comentar (`comenta`). Total 8–12 s.
- Todo lo que se enseñe debe ser algo que el producto **hace de verdad**:
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

## Ganchos ya usados (no repetir)

- «POV: por fin llegó el proyector de TikTok / ¿cuál pongo esta noche? 1, 2, 3, 4» (vídeo del dueño, 18/11)
- 2026-11-19-1 · aurora · «¿Esto es un cuarto / o un planetario? 🌌» (pregunta que intriga)
- 2026-11-19-2 · atardecer · «Mi cuarto antes… / y ahora 🌅» (antes/después)
- 2026-11-19-3 · aurora · «¿Cuánto crees / que cuesta esto? 👇» (adivina el precio)
- 2026-11-19-4 · atardecer · «POV: tu madre entra / a tu cuarto a las 12 😳» (POV de una situación)
- 2026-11-19-5 · aurora · «Mi rutina para dormirme / sin el móvil 🌙» (rutina de noche)
- 2026-11-19-6 · atardecer · «Si no sabes qué regalar / esta Navidad… 🎁» (regalo)
- 2026-11-20-1 · aurora · «Mi setup de día / vs de noche 🎮» (setup gamer)
- 2026-11-20-2 · atardecer · «Las tiras LED / ya pasaron de moda 💀» (polémica suave)
- 2026-11-20-3 · aurora · «Tus fotos con flash / vs con esto 📸» (fotos)
- 2026-11-20-4 · atardecer · «El truco de los cuartos / de Pinterest 🤫» (truco de decoración)
- 2026-11-21-1 · aurora · «Espera al final 👀» (espera al final + cuenta atrás)
- 2026-11-21-2 · atardecer · «Plan de sábado: / peli en casa 🍿» (noche de peli)
- 2026-11-21-3 · aurora · «Abriendo lo que / me ha llegado 📦» (unboxing)
- 2026-11-21-4 · atardecer · «Dime un cuarto / más bonito que este 👇» (reto)
- 2026-11-22-1 · aurora · «Cosas que no sabías / que necesitabas 👀» (cosas que no sabías que necesitabas)
- 2026-11-22-2 · atardecer · «Sube el volumen 🔊» (sonido satisfactorio del clic)
- 2026-11-22-3 · aurora · «Cita en casa: / el plan que no falla 💫» (cita en casa)
- 2026-11-22-4 · atardecer · «Lámpara normal / vs lámpara atardecer 💡🌅» (comparativa con otra luz)
- 2026-11-23-1 · aurora · «El regalo que va a querer / tu hermano pequeño 🎁» (regalo para los peques)
- 2026-11-23-2 · atardecer · «Lo primero que hago / al llegar a casa 🏠» (rutina al llegar a casa)
