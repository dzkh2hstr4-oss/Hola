# Estilo para los próximos shorts de GTA 6

Indicaciones del dueño del canal (después del short del Tacón, que ya está publicado):

- **Que se vea el gameplay.** Cuando se enseña un sitio (una entrada, un interior…), la imagen manda.
- **Menos texto en pantalla:** un título corto (1–3 palabras) y solo en los momentos clave, no en cada escena.
- **Pocos emojis:** como mucho uno de vez en cuando, nunca dos o más a la vez encima del gameplay.
- Subtítulos de la voz sí, pero más pequeños y en la parte de abajo, sin tapar lo importante.
- **Animaciones y efectos sí** (cortes con zoom, destellos, transiciones, sonidos), pero sin recargar.
- Voz alta y clara; música de fondo suave (mezcla de `scripts/mezcla.py`, `--mv 0.28`).
- Gancho directo con el nombre que usa la gente (p. ej. «el Tacón»), sin nombres que no conozca el público.

## ⚠️ Regla para TODOS los vídeos (largos y shorts): sin audio de Rockstar

Para evitar reclamaciones de Content ID y poder monetizar:

- **Nunca** usar el audio original del juego: ni diálogos en inglés, ni sonido de fondo de los clips, ni música de radios/clubs.
  - Clips de gameplay siempre **silenciados** (`gameVolume: 0` en shorts, `clipVolume: 0` en largos).
  - Las frases de los personajes se **doblan al español** con otra voz (líneas con `"dub": true` / `"quote": true` y `voice`), nunca con `"play"`.
- Nunca usar los tráileres oficiales con su música (p. ej. la animación de la portada).
- Solo nuestra voz, nuestra música (scripts/musica*.py, banda.py) y nuestros efectos.
- La imagen del gameplay oficial puede seguir detectándose: clips cortos, siempre comentados y con gráficos encima (uso de análisis/comentario).
