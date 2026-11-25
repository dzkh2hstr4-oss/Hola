#!/usr/bin/env node
// Builds an animated motion-graphics reel (composition "Animado") from content/animado/<id>.json.
//
//   node scripts/montar-animado.mjs --id an-01 [--publicar]
//
// Spec: { producto, voz?, rate?, musica, musicaDesde?, musicaVolumen?, caption, escenas: [{ tipo, dice?, ...scene props }] }
// Each scene's "dice" is spoken (free edge-tts voice + voice FX); the scene lasts as long as its line needs.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const argv = process.argv.slice(2);
const id = argv[argv.indexOf("--id") + 1];
const publicar = argv.includes("--publicar");
const spec = JSON.parse(readFileSync(join(ROOT, "content/animado", `${id}.json`), "utf8"));
const sh = (cmd, a, env) => execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: env ?? process.env });
const dur = (f) => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

const pubDir = join(ROOT, "public/animado", id);
mkdirSync(pubDir, { recursive: true });
const MIN = { gancho: 75, producto: 90, encender: 80, cuenta: 80, versus: 95, oferta: 125 };
const ttsEnv = { ...process.env, SSL_CERT_FILE: "/root/.ccr/ca-bundle.crt" };

const escenas = spec.escenas.map((e, i) => {
  const { dice, ...rest } = e;
  let min = e.tipo === "golpes" ? 8 + e.palabras.length * 10 + 22 : MIN[e.tipo] ?? 75;
  let voz;
  if (dice) {
    const vid = `${id}-${i + 1}`;
    sh("python3", [join(ROOT, "scripts/voz-gratis.py"), "--id", vid, "--texto", dice, "--voz", spec.voz ?? "es-ES-AlvaroNeural", `--rate=${spec.rate ?? "+10%"}`], ttsEnv);
    const raw = join(ROOT, "content/voz", `${vid}.mp3`);
    const out = join(pubDir, `v${i + 1}.mp3`);
    // voice FX: tight radio-ad compression, presence boost and a short room echo
    sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", "highpass=f=90,equalizer=f=3200:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=4:attack=5:release=80:makeup=4,aecho=0.85:0.6:45|90:0.18|0.08,volume=1.4", "-ar", "44100", out]);
    voz = `animado/${id}/v${i + 1}.mp3`;
    min = Math.max(min, Math.ceil((dur(out) + 0.35) * FPS));
  }
  return { ...rest, dur: e.dur ?? min, voz };
});
let musica;
if (spec.musica) {
  musica = `animado/${id}/musica.mp3`;
  sh("ffmpeg", ["-y", "-v", "error", "-i", resolve(ROOT, spec.musica), "-c", "copy", join(ROOT, "public", musica)]);
}
const props = { producto: spec.producto, escenas, musica, musicaDesde: spec.musicaDesde ?? 0, musicaVolumen: spec.musicaVolumen ?? 0.2 };
const propsFile = join(pubDir, "props.json");
writeFileSync(propsFile, JSON.stringify(props, null, 2));

mkdirSync(join(ROOT, "out/reels/raw"), { recursive: true });
const raw = join(ROOT, "out/reels/raw", `${id}.mp4`);
const browser = ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].find(existsSync);
const args = ["remotion", "render", "Animado", raw, `--props=${propsFile}`];
if (browser) args.push(`--browser-executable=${browser}`);
execFileSync("npx", args, { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });

const finalDir = join(ROOT, publicar ? "publicados" : "out/reels");
mkdirSync(finalDir, { recursive: true });
const final = join(finalDir, `${id}.mp4`);
sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "libx264", "-crf", "21", "-maxrate", "8M", "-bufsize", "16M", "-preset", "medium", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", final]);

const secs = dur(final);
const mb = statSync(final).size / 1e6;
const fails = [];
if (secs < 6 || secs > 40) fails.push(`duración rara: ${secs.toFixed(1)} s`);
if (mb > 19.5) fails.push(`pesa ${mb.toFixed(1)} MB`);
const blk = spawnSync("ffmpeg", ["-hide_banner", "-i", final, "-vf", "blackdetect=d=0.5:pix_th=0.05", "-f", "null", "-"], { encoding: "utf8" }).stderr;
if (/black_start/.test(blk)) fails.push("hay tramos negros");
mkdirSync(join(ROOT, "out/revision"), { recursive: true });
const sheet = join(ROOT, "out/revision", `${id}.jpg`);
sh("ffmpeg", ["-v", "error", "-y", "-i", final, "-vf", `fps=${10 / (secs - 0.15)},scale=216:-1,tile=10x1`, "-frames:v", "1", sheet]);
console.log(JSON.stringify({ id, file: final.replace(ROOT + "/", ""), seconds: +secs.toFixed(1), mb: +mb.toFixed(1), escenas: escenas.map((e) => `${e.tipo}:${e.dur}`).join(" "), fallos: fails }));
if (fails.length) process.exit(1);
