#!/usr/bin/env node
// Builds one daily reel from content/plan.json + a voice take.
//
//   node scripts/crear-video.mjs --id 2026-11-19-manana --voz /path/voz.mp3
//
// Splits the voice into the entry's lines using the longest pauses, times one
// scene per line, generates royalty-free music, renders the "Reel"
// composition and writes publicados/<id>.mp4 (compressed, < 20 MB).
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const LEAD = 0.25; // seconds of silence before the voice starts
const TAIL = 1.5; // seconds after the voice ends

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, all) => (v.startsWith("--") ? [...acc, [v.slice(2), all[i + 1]]] : acc), []),
);
if (!args.id || !args.voz) {
  console.error("uso: node scripts/crear-video.mjs --id <id> --voz <archivo de voz>");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(join(ROOT, "content/plan.json"), "utf8"));
const entry = plan.videos.find((v) => v.id === args.id);
if (!entry) throw new Error(`No existe ${args.id} en content/plan.json`);

const dir = join(ROOT, "public/daily", entry.id);
mkdirSync(dir, { recursive: true });
const vozRel = `daily/${entry.id}/voz.mp3`;
copyFileSync(resolve(args.voz), join(ROOT, "public", vozRel));
const vozPath = join(ROOT, "public", vozRel);

const sh = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const duration = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", vozPath]));

// --- find pauses ---
const log = spawnSync("ffmpeg", ["-i", vozPath, "-af", "silencedetect=noise=-32dB:d=0.12", "-f", "null", "-"], {
  encoding: "utf8",
}).stderr;
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
let sil = starts.map((s, i) => ({ s, e: ends[i] ?? duration })).filter((x) => x.e - x.s > 0);
const speechStart = sil.length && sil[0].s < 0.05 ? sil[0].e : 0;
const speechEnd = sil.length && sil[sil.length - 1].e >= duration - 0.05 ? sil[sil.length - 1].s : duration;
sil = sil.filter((x) => x.s > speechStart + 0.1 && x.e < speechEnd - 0.1);

const n = entry.lines.length;
let bounds; // n-1 pauses between lines
if (sil.length >= n - 1) {
  bounds = [...sil].sort((a, b) => b.e - b.s - (a.e - a.s)).slice(0, n - 1).sort((a, b) => a.s - b.s);
} else {
  // fallback: proportional to text length
  const total = entry.lines.reduce((a, l) => a + l.say.length, 0);
  let acc = speechStart;
  bounds = entry.lines.slice(0, -1).map((l) => {
    acc += ((speechEnd - speechStart) * l.say.length) / total;
    return { s: acc - 0.05, e: acc + 0.05 };
  });
}

const lines = entry.lines.map((l, i) => {
  const from = i === 0 ? speechStart : bounds[i - 1].e;
  const to = i === n - 1 ? speechEnd : bounds[i].s;
  return { from: Math.round((from + LEAD) * FPS), to: Math.round((to + LEAD) * FPS), text: l.subtitle ?? l.say };
});
const totalFrames = Math.round((speechEnd + LEAD + TAIL) * FPS);
const scenes = entry.lines.map((l, i) => ({
  ...l.scene,
  from: i === 0 ? 0 : lines[i].from - 3,
  to: i === n - 1 ? totalFrames : lines[i + 1].from - 3,
}));

// voice offset: render the voice LEAD seconds late via a padded copy
const vozPad = join(dir, "voz-pad.wav");
sh("ffmpeg", ["-y", "-v", "error", "-i", vozPath, "-af", `adelay=${LEAD * 1000}|${LEAD * 1000}`, "-ar", "44100", vozPad]);

// --- music ---
const seed = [...entry.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
const musicRel = `daily/${entry.id}/musica.wav`;
sh("python3", [join(ROOT, "scripts/musica.py"), "--seed", String(seed), "--seconds", String(totalFrames / FPS + 1), "--out", join(ROOT, "public", musicRel)]);

const props = { voice: `daily/${entry.id}/voz-pad.wav`, music: musicRel, scenes, lines, seed };
const propsFile = join(dir, "props.json");
writeFileSync(propsFile, JSON.stringify(props, null, 2));

// --- render ---
mkdirSync(join(ROOT, "out/daily"), { recursive: true });
const raw = join(ROOT, "out/daily", `${entry.id}.mp4`);
const browser = ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].find(existsSync);
const renderArgs = ["remotion", "render", "Reel", raw, `--props=${propsFile}`];
if (browser) renderArgs.push(`--browser-executable=${browser}`);
execFileSync("npx", renderArgs, { cwd: ROOT, stdio: "inherit" });

mkdirSync(join(ROOT, "publicados"), { recursive: true });
const final = join(ROOT, "publicados", `${entry.id}.mp4`);
sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "libx264", "-crf", "24", "-maxrate", "5M", "-bufsize", "10M", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", final]);
const mb = statSync(final).size / 1e6;
console.log(JSON.stringify({ id: entry.id, file: `publicados/${entry.id}.mp4`, seconds: totalFrames / FPS, mb: +mb.toFixed(1) }));
if (mb > 19.5) console.error("AVISO: el vídeo supera 19,5 MB; jsDelivr no lo servirá");
