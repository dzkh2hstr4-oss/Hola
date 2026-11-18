#!/usr/bin/env node
// Builds one reel (Reel2 composition) from content/plan.json.
//
//   node scripts/crear-reel.mjs --id 2026-11-19-manana            (sin voz)
//   node scripts/crear-reel.mjs --id 2026-11-19-manana --voz x.mp3 --publicar
//
// Without voice the music is loud; with voice it starts at 0.2 s, music drops
// under it and the last beat stretches if the voice is longer than the beats.
// Output: out/reels/<id>.mp4, or publicados/<id>.mp4 with --publicar (< 20 MB).
import { execFileSync } from "node:child_process";
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
const voz = arg("voz");
const publicar = argv.includes("--publicar");
if (!id) {
  console.error("uso: node scripts/crear-reel.mjs --id <id> [--voz archivo] [--publicar]");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(join(ROOT, "content/plan.json"), "utf8"));
const entry = plan.videos.find((v) => v.id === id);
if (!entry) throw new Error(`No existe ${id} en content/plan.json`);

const sh = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const dir = join(ROOT, "public/daily", id);
mkdirSync(dir, { recursive: true });

const beats = entry.beats.map((b) => ({ ...b }));
let voiceRel;
if (voz) {
  const padded = join(dir, "voz-pad.wav");
  sh("ffmpeg", ["-y", "-v", "error", "-i", resolve(voz), "-af", "adelay=200|200", "-ar", "44100", padded]);
  voiceRel = `daily/${id}/voz-pad.wav`;
  const vsec = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", padded]));
  const need = Math.ceil((vsec + 1) * FPS);
  const total = beats.reduce((a, b) => a + b.dur, 0);
  if (need > total) beats[beats.length - 1].dur += need - total;
}
const totalFrames = beats.reduce((a, b) => a + b.dur, 0);

const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 11);
const musicRel = `daily/${id}/musica.wav`;
if (entry.drop !== undefined) {
  // build-up + drop synced to the reveal (seconds, including the 0.2 s voice lead-in)
  sh("python3", [join(ROOT, "scripts/musica2.py"), "--seed", String(seed), "--seconds", String(totalFrames / FPS + 1), "--drop", String(entry.drop), "--out", join(ROOT, "public", musicRel)]);
} else {
  sh("python3", [join(ROOT, "scripts/musica.py"), "--seed", String(seed), "--seconds", String(totalFrames / FPS + 1), "--out", join(ROOT, "public", musicRel)]);
}

const props = { beats, music: musicRel, musicVolume: voz ? (entry.drop !== undefined ? 0.34 : 0.16) : 0.42, voice: voiceRel, theme: entry.theme ?? "clasico" };
const propsFile = join(dir, "props2.json");
writeFileSync(propsFile, JSON.stringify(props, null, 2));

mkdirSync(join(ROOT, "out/reels/raw"), { recursive: true });
const raw = join(ROOT, "out/reels/raw", `${id}.mp4`);
const browser = ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].find(existsSync);
const renderArgs = ["remotion", "render", "Reel2", raw, `--props=${propsFile}`];
if (browser) renderArgs.push(`--browser-executable=${browser}`);
execFileSync("npx", renderArgs, { cwd: ROOT, stdio: "inherit" });

const outDir = publicar ? "publicados" : "out/reels";
mkdirSync(join(ROOT, outDir), { recursive: true });
const final = join(ROOT, outDir, `${id}.mp4`);
sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "libx264", "-crf", "23", "-maxrate", "6M", "-bufsize", "12M", "-preset", "medium", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", final]);
const mb = statSync(final).size / 1e6;
console.log(JSON.stringify({ id, file: `${outDir}/${id}.mp4`, seconds: +(totalFrames / FPS).toFixed(1), mb: +mb.toFixed(1) }));
if (mb > 19.5) console.error("AVISO: supera 19,5 MB; jsDelivr no lo servirá");
