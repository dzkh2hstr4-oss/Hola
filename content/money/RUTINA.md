# Rutina diaria — Money Decoded (canal en inglés de dinero y economía)

Cada día se prepara el paquete de **MAÑANA** (fecha D+1, hora de España), para que el dueño lo programe con tiempo:
- **3 shorts** (15:00, 19:00 y 23:00 hora de España = mañana/tarde/noche en EE. UU.).
- **1 vídeo largo de 8 min o más** solo en días alternos: hay largo el 27-nov, 29-nov, 1-dic, 3-dic, 5-dic… (cada 2 días). Se publica a las 18:00.
Guardar en `content/money/diario/<D+1>/` y `publicados/money/diario/<D+1>/`.

## Lo que pide el dueño (OBLIGATORIO)
1. **Entretenido cada segundo**: ninguna imagen quieta más de ~3 s. Usa SIEMPRE la composición **MoneyVid2** con
   `"split": 3.0` en el plan y `beats` en las frases largas (varios visuales por frase).
2. **Muchas animaciones distintas, no solo texto**: mezcla en cada vídeo los tipos `line`, `pie`, `people`, `stack`,
   `phone`, `meter`, `timeline`, `slot`, `wheel`, `jar`, `compare`, `receipt`, `timer`, `prices`, `bars`, `stat`,
   `list`, `big`, `chapter`. Cambia el fondo (`bg`) en cada sección: grid, rays, stripes, dots, waves, neon,
   blueprint, casino.
3. **Ganchos abiertos** en el guion: «and number 4 is the sneakiest…», «stay until the end», «remember this number»,
   preguntas al espectador. Frases cortas.
4. **Música de suspense famosa y bien alta**: Kevin MacLeod (`track:` investigations, crypto, darkest_child,
   lord_of_the_land, the_descent, five_armies, echoes_of_time, hitman, mistake_the_getaway, volatile_reaction,
   danger_storm) o NCS (`ncs:` roxbury, paranormal, whereyouare…). Cambia de pista en cada sección del largo.
   Mezcla: shorts `--mv 1.5 --duck 1.5`; largos `--mv 1.1 --duck 2 --maxrate 1200k` (< 95 MB).
   Créditos: Kevin MacLeod siempre en la descripción (también shorts); NCS solo en largos.
5. **Solo datos verdaderos y con fuente** (busca en la web; cita la fuente en pantalla con `source` y en la
   descripción). Los ejemplos de cálculo se marcan como ejemplo. Nada de consejos financieros personalizados.
6. Descripciones **sin enlaces** (el canal no está verificado). Shorts: descripción < 100 caracteres + crédito.

## Producción
```bash
export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt
B=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | head -1)
D=2026-11-30; C=content/money/diario/$D; O=publicados/money/diario/$D
# plan: {"vertical": true|false, "voice": "en-US-AndrewNeural", "rate": "+8%" (shorts) / "+0%" (largos),
#        "mic": true, "brand": "MONEY DECODED", "split": 3.0, "lines": [...]}   (ver content/money/lote2/largoB-plan.json)
python3 scripts/money-build.py $C/s1-plan.json $C/s1.json m-$D-s1
# banda: [{"s":0,"e":TOTAL,"mood":"track:hitman@1"}] (largos: una sección por capítulo, campo "mus" en el plan)
python3 scripts/banda.py $C/s1-banda.json public/money/audio/m-$D-s1-music.wav
npx remotion render MoneyVid2 out/m-$D-s1.mp4 --props=$C/s1.json --browser-executable=$B --concurrency=2 --log=error
python3 scripts/mezcla.py --video out/m-$D-s1.mp4 --out $O/s1.mp4 --music-file public/money/audio/m-$D-s1-music.wav --mv 1.5 --duck 1.5
# largo: python3 scripts/render-tramos.py MoneyVid2 $C/largo.json out/m-$D-largo.mp4 && mezcla (ver arriba)
```
Miniatura del largo 1280x720 con Playwright (HTML + `public/fonts`): 2–4 palabras enormes, un objeto/gráfico potente.
Subtítulos `.srt` del largo a partir de `captions` del JSON.

## Revisión antes de entregar
Hoja de contactos de cada vídeo, nada negro ni vacío, ≈ −14 LUFS, voz entendible, duración del largo ≥ 8:00.

## Entrega
`publicados/money/diario/<D+1>/PAQUETE.md` con hora, título, descripción, etiquetas (largo), capítulos (largo) y enlace
raw. Actualiza `content/money/temas-usados.md`. Commit + push a `claude/sleepy-ride-dp3vka`. Envía los vídeos con
SendUserFile y resume en español.
