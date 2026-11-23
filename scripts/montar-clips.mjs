#!/usr/bin/env node
// Builds a reel from Google Flow clips, described in content/clips/<id>.json.
//
//   node scripts/montar-clips.mjs --id 2026-11-19-noche [--publicar]
//
// Spec: { gancho, pregunta?, comenta?, boton?, clips: [{ archivo, segundos?, desde?, numero?, texto?, audio? }] }
// "archivo" is relative to the repo (raw clips go in entrada/<id>/, git-ignored).
// Voice: content/voz/<id>.mp3 if it exists. Output: out/reels/<id>.mp4 or publicados/<id>.mp4,
// plus out/revision/<id>.jpg (frames to check) and basic automatic checks.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const argv = process.argv.slice(2);
const arg = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const id = arg("id");
const publicar = argv.includes("--publicar");
if (!id) {
  console.error("uso: node scripts/montar-clips.mjs --id <id> [--publicar]");
  process.exit(2);
}
const spec = JSON.parse(readFileSync(join(ROOT, "content/clips", `${id}.json`), "utf8"));
const sh = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const dur = (f) => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

// 1. normalize clips: 1080x1920 (cover crop), 30 fps, h264 + aac
const outDir = join(ROOT, "public/clips", id);
mkdirSync(outDir, { recursive: true });
const isImg = (f) => /\.(jpe?g|png|webp)$/i.test(f);
const clips = spec.clips.map((c, i) => {
  const src = resolve(ROOT, c.archivo);
  if (!existsSync(src)) throw new Error(`Falta el clip ${c.archivo}`);
  const dst = join(outDir, `c${i + 1}.mp4`);
  let desde = c.desde ?? 0;
  if (isImg(src)) {
    // still photo -> slow zoom. "card": photo fitted on a blurred copy of itself (square/low-res photos);
    // "full": photo covers the screen. Optional "recorte": "w:h:x:y" crop of the photo first.
    const secs = (c.segundos ?? 2.5) + 0.5;
    const n = Math.round(secs * FPS);
    const crop = c.recorte ? `crop=${c.recorte},` : "";
    const zIn = c.mov === "out" ? `1.14-0.14*on/${n}` : `1+0.14*on/${n}`;
    const zx = c.mov === "left" ? `(iw-iw/zoom)*(1-on/${n})` : c.mov === "right" ? `(iw-iw/zoom)*on/${n}` : "iw/2-(iw/zoom/2)";
    const zoom = `zoompan=z='${zIn}':x='${zx}':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`;
    const fc = (c.modo ?? "card") === "full"
      ? `[0]${crop}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=2160:3840,${zoom},format=yuv420p[v]`
      : `[0]${crop}split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:3,eq=brightness=-0.12[bg];[b]scale=1040:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2+60,scale=2160:3840,${zoom},format=yuv420p[v]`;
    sh("ffmpeg", ["-y", "-v", "error", "-loop", "1", "-t", String(secs), "-i", src, "-f", "lavfi", "-t", String(secs), "-i", "anullsrc=r=44100:cl=stereo", "-filter_complex", fc, "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-c:a", "aac", "-ar", "44100", "-shortest", dst]);
    desde = 0;
  } else {
    const hasAudio = sh("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", src]).trim() !== "";
    const args = ["-y", "-v", "error"];
    let vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p";
    if (c.velocidad) {
      // slow motion: cut the piece first, then stretch it
      const v = c.velocidad;
      args.push("-ss", String(desde), "-t", String((c.segundos ?? 2) / v));
      vf = `setpts=PTS/${v},minterpolate=fps=30:mi_mode=blend,` + vf;
      desde = 0;
    }
    args.push("-i", src);
    if (!hasAudio || c.velocidad) args.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-map", "0:v", "-map", "1:a", "-shortest");
    args.push("-vf", vf, "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-c:a", "aac", "-ar", "44100", dst);
    sh("ffmpeg", args);
  }
  const total = dur(dst);
  const seg = Math.min(c.segundos ?? total - desde, total - desde);
  return {
    src: `clips/${id}/c${i + 1}.mp4`,
    frames: Math.max(6, Math.round(seg * FPS)),
    from: Math.round(desde * FPS),
    numero: c.numero,
    texto: c.texto,
    textoTop: c.textoTop,
    textoAncho: c.textoAncho,
    audio: c.audio ?? 0,
  };
});
let total = clips.reduce((a, c) => a + c.frames, 0);

// 2. voice (optional): stretch the last clip if the voice is longer
let voiceRel;
const voz = join(ROOT, "content/voz", `${id}.mp3`);
if (existsSync(voz)) {
  voiceRel = `clips/${id}/voz.mp3`;
  sh("ffmpeg", ["-y", "-v", "error", "-i", voz, join(ROOT, "public", voiceRel)]);
  const need = Math.ceil((dur(voz) + 0.8) * FPS);
  if (need > total) console.log(`AVISO: la voz (${dur(voz).toFixed(1)} s) es más larga que los clips; se cortará`);
}

// 3. music bed
const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
const musicRel = `clips/${id}/musica.wav`;
sh("python3", [join(ROOT, "scripts/musica.py"), "--seed", String(seed), "--seconds", String(total / FPS + 1), "--out", join(ROOT, "public", musicRel)]);

// 4. render
const props = {
  clips,
  gancho: spec.gancho,
  ganchoTop: spec.ganchoTop,
  ganchoAncho: spec.ganchoAncho,
  ganchoFrames: spec.ganchoSegundos ? Math.round(spec.ganchoSegundos * FPS) : undefined,
  pregunta: spec.pregunta,
  comenta: spec.comenta,
  boton: spec.boton,
  finalFrames: spec.finalSegundos ? Math.round(spec.finalSegundos * FPS) : undefined,
  music: musicRel,
  musicVolume: voiceRel ? 0.2 : 0.38,
  voice: voiceRel,
};
const propsFile = join(outDir, "props.json");
writeFileSync(propsFile, JSON.stringify(props, null, 2));
mkdirSync(join(ROOT, "out/reels/raw"), { recursive: true });
const raw = join(ROOT, "out/reels/raw", `${id}.mp4`);
const browser = ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].find(existsSync);
const renderArgs = ["remotion", "render", "Clips", raw, `--props=${propsFile}`];
if (browser) renderArgs.push(`--browser-executable=${browser}`);
execFileSync("npx", renderArgs, { cwd: ROOT, stdio: "inherit" });

const finalDir = join(ROOT, publicar ? "publicados" : "out/reels");
mkdirSync(finalDir, { recursive: true });
const final = join(finalDir, `${id}.mp4`);
sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "libx264", "-crf", "21", "-maxrate", "8M", "-bufsize", "16M", "-preset", "medium", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", final]);

// 5. checks + frames to review
const secs = dur(final);
const mb = statSync(final).size / 1e6;
const fails = [];
if (secs < 5 || secs > 30) fails.push(`duración rara: ${secs.toFixed(1)} s`);
if (mb > 19.5) fails.push(`pesa ${mb.toFixed(1)} MB (máx. 19,5)`);
const st = spawnSync("ffmpeg", ["-hide_banner", "-i", final, "-vf", "select=eq(n\\,0),signalstats,metadata=print", "-frames:v", "1", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const yavg = parseFloat(st.match(/YAVG=([\d.]+)/)?.[1] ?? "0");
if (yavg < 25) fails.push(`primer fotograma muy oscuro (${yavg.toFixed(0)})`);
const blk = spawnSync("ffmpeg", ["-hide_banner", "-i", final, "-vf", "blackdetect=d=0.4:pix_th=0.06", "-f", "null", "-"], { encoding: "utf8" }).stderr;
if (/black_start/.test(blk)) fails.push("hay tramos negros");
mkdirSync(join(ROOT, "out/revision"), { recursive: true });
const sheet = join(ROOT, "out/revision", `${id}.jpg`);
sh("ffmpeg", ["-v", "error", "-y", "-i", final, "-vf", `fps=${8 / (secs - 0.15)},scale=270:-1,tile=8x1`, "-frames:v", "1", sheet]);
console.log(JSON.stringify({ id, file: final.replace(ROOT + "/", ""), seconds: +secs.toFixed(1), mb: +mb.toFixed(1), revision: sheet.replace(ROOT + "/", ""), fallos: fails }));
if (fails.length) process.exit(1);
