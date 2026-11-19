# Cómo crear un vídeo de letra

1. Pon el audio aquí como `public/letras/cancion.mp3`.
2. Escribe la letra en `public/letras/letra.lrc`, una línea por frase, con su tiempo delante:
   `[01:23.50]texto de la frase`  (minuto 1, segundo 23,5)
   Truco: escucha la canción y apunta el segundo en que empieza cada frase.
3. Cambia el título, el artista y el tema (`noche-roja` o `atardecer`) en `defaultLyricProps` (src/Letras/LyricVideo.tsx)
   o desde el panel de la derecha en `npm run dev`.
4. Renderiza:
   `npx remotion render VideoLetra out/video-letra.mp4`
   (el vídeo dura lo mismo que el audio).
