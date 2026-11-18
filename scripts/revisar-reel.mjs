#!/usr/bin/env node
// Quality gate: a reel is only published if this exits 0.
//
//   node scripts/revisar-reel.mjs --id 2026-11-19-manana [--file publicados/<id>.mp4]
//
// Checks the video file (format, length, audio, voice, loudness, first frame,
// black/frozen stretches) and the plan entry (product, hook, caption, price).
// Always writes out/revision/<id>.jpg: 8 frames to look at before publishing.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const id = arg("id");
if (!id) {
  console.error("uso: node scripts/revisar-reel.mjs --id <id> [--file ruta.mp4]");
  process.exit(2);
}
const file = resolve(ROOT, arg("file") ?? (existsSync(join(ROOT, "publicados", `${id}.mp4`)) ? `publicados/${id}.mp4` : `out/reels/${id}.mp4`));

const plan = JSON.parse(readFileSync(join(ROOT, "content/plan.json"), "utf8"));
const entry = plan.videos.find((v) => v.id === id);
const fails = [];
const ok = [];
const check = (cond, good, bad) => (cond ? ok.push(good) : fails.push(bad));
const run = (cmd, a) => {
  try {
    return execFileSync(cmd, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64e6 });
  } catch (e) {
    return (e.stdout ?? "") + (e.stderr ?? "");
  }
};
const ffStderr = (a) =>
  spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...a, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64e6 }).stderr ?? "";

/* ---------- plan entry ---------- */
check(!!entry, "entrada en el plan", `no existe ${id} en content/plan.json`);
if (entry) {
  const prod = entry.producto ?? "atardecer";
  check(["atardecer", "aurora"].includes(prod), `producto: ${prod}`, `producto desconocido: ${prod}`);
  const first = entry.beats?.[0];
  const hook = (first?.text ?? []).map((l) => l.t).join(" ").trim();
  check(hook.length >= 6, `gancho: «${hook}»`, "el primer beat no tiene gancho escrito");
  check(["photo", "reveal", "product"].includes(first?.kind) || prod === "atardecer", "primer beat con foto real", "el primer beat debe ser una foto real");
  if (prod === "aurora") {
    const bad = entry.beats.filter((b) => !["photo", "reveal", "product", "offer", "cta"].includes(b.kind)).map((b) => b.kind);
    check(bad.length === 0, "aurora: solo escenas con fotos reales", `aurora con escenas dibujadas de la lámpara: ${bad.join(", ")}`);
  }
  check(entry.beats.some((b) => b.kind === "offer") && entry.beats.at(-1)?.kind === "cta", "termina con oferta + cta", "falta la oferta o el cta final");
  const cap = entry.caption ?? "";
  const price = prod === "aurora" ? "39,95" : "29,95";
  const wrong = prod === "aurora" ? "29,95" : "39,95";
  check(cap.includes("Link en la bio") || cap.includes("link en la bio"), "caption con «Link en la bio»", "la caption no dice «Link en la bio»");
  check(cap.includes(price) || /cuarenta|40 ?€|40%/.test(cap), `caption con el precio correcto (${price} €)`, `la caption no tiene el precio ${price} €`);
  check(!cap.includes(wrong), "caption sin precio de otro producto", `la caption tiene el precio del otro producto (${wrong} €)`);
  check(cap.length < 2000, "caption < 2000 caracteres", "caption demasiado larga");
  const voz = join(ROOT, "content/voz", `${id}.mp3`);
  check(existsSync(voz), "voz en content/voz", `falta la voz content/voz/${id}.mp3`);
}

/* ---------- video file ---------- */
check(existsSync(file), `archivo ${file.replace(ROOT + "/", "")}`, `no existe el vídeo ${file}`);
if (existsSync(file)) {
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration,size", "-of", "json", file]));
  const v = probe.streams.find((s) => s.codec_type === "video");
  const a = probe.streams.find((s) => s.codec_type === "audio");
  const dur = parseFloat(probe.format.duration);
  const mb = parseInt(probe.format.size) / 1e6;
  check(v && v.width === 1080 && v.height === 1920, "1080×1920 vertical", `resolución incorrecta: ${v?.width}×${v?.height}`);
  check(dur >= 7 && dur <= 13, `duración ${dur.toFixed(1)} s`, `duración fuera de 7–13 s: ${dur.toFixed(1)} s`);
  check(mb < 19.5, `${mb.toFixed(1)} MB`, `pesa demasiado: ${mb.toFixed(1)} MB`);
  check(!!a, "tiene audio", "NO tiene audio");

  if (a) {
    const ln = ffStderr(["-i", file, "-af", "loudnorm=print_format=json"]);
    const m = ln.match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
    const lufs = m ? parseFloat(m[1]) : NaN;
    check(lufs >= -18 && lufs <= -10, `volumen ${lufs} LUFS`, `volumen raro: ${lufs} LUFS (debe estar entre -18 y -10)`);
    // voice: the 300–3400 Hz band must carry sound for most of the video
    const sil = ffStderr(["-i", file, "-af", "highpass=f=300,lowpass=f=3400,silencedetect=n=-38dB:d=1.2"]);
    const silent = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].reduce((s, x) => s + parseFloat(x[1]), 0);
    check(silent < dur * 0.35, "voz/sonido presente casi todo el vídeo", `demasiado silencio en la banda de voz (${silent.toFixed(1)} s)`);
  }

  // first frame: hook visible (not black, has contrast)
  const st = ffStderr(["-i", file, "-vf", "select=eq(n\\,0),signalstats,metadata=print", "-frames:v", "1"]);
  const yavg = parseFloat(st.match(/YAVG=([\d.]+)/)?.[1] ?? "0");
  const ylow = parseFloat(st.match(/YLOW=([\d.]+)/)?.[1] ?? "0");
  const yhigh = parseFloat(st.match(/YHIGH=([\d.]+)/)?.[1] ?? "0");
  check(yavg > 35, `primer fotograma con luz (media ${yavg.toFixed(0)})`, `primer fotograma demasiado oscuro (media ${yavg.toFixed(0)})`);
  check(yhigh - ylow > 90, "primer fotograma con contraste (texto legible)", `primer fotograma plano, sin contraste (${ylow}-${yhigh})`);

  const black = ffStderr(["-i", file, "-vf", "blackdetect=d=0.4:pix_th=0.08"]);
  check(!/black_start/.test(black), "sin tramos negros", "hay tramos en negro de más de 0,4 s");
  const frz = ffStderr(["-i", file, "-vf", "freezedetect=n=0.001:d=1.5"]);
  check(!/freeze_start/.test(frz), "sin imagen congelada", "hay imagen congelada más de 1,5 s");

  // contact sheet for the visual review
  mkdirSync(join(ROOT, "out/revision"), { recursive: true });
  const sheet = join(ROOT, "out/revision", `${id}.jpg`);
  const n = 8;
  run("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf", `fps=${(n - 0.5) / dur},scale=270:-1,tile=${n}x1`, "-vsync", "0", "-frames:v", "1", sheet]);
  console.log(`Fotogramas para revisar a ojo: ${sheet.replace(ROOT + "/", "")}`);
}

for (const g of ok) console.log(`  ✔ ${g}`);
for (const f of fails) console.log(`  ✘ ${f}`);
if (fails.length) {
  console.log(`\nNO PUBLICAR: ${fails.length} fallo(s).`);
  process.exit(1);
}
console.log("\nRevisión automática OK. Falta la revisión visual (ver AUTOMATIZACION.md).");
