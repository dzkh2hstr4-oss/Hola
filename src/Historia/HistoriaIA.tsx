import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

loadFont({ family: "Mont", url: staticFile("fonts/montserrat-900.woff2"), weight: "900" });

export const H_FPS = 30;
type Escena = { id: string; texto: string; prompt: string; img?: boolean; voz?: boolean; dur?: number };
export type HistoriaProps = { escenas: Escena[]; musica: string };
export const defaultHistoriaProps: HistoriaProps = { escenas: [], musica: "golpe/musica.wav" };

const exists = async (p: string) => {
  try {
    const r = await fetch(staticFile(p), { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
};

export const calcHistoria = async ({ props }: { props: HistoriaProps }) => {
  const raw: Escena[] = await (await fetch(staticFile("historia/escenas.json"))).json();
  const escenas: Escena[] = [];
  for (const e of raw) {
    const img = await exists(`historia/img/${e.id}.png`);
    let voz = false;
    let dur = e.texto.split(/\s+/).length / 2.6 + 0.8;
    if (await exists(`historia/voz/${e.id}.mp3`)) {
      try {
        dur = (await getAudioDurationInSeconds(staticFile(`historia/voz/${e.id}.mp3`))) + 0.4;
        voz = true;
      } catch {
        /* sin voz */
      }
    }
    escenas.push({ ...e, img, voz, dur });
  }
  const total = escenas.reduce((a, e) => a + (e.dur ?? 5), 0);
  const musica = (await exists(props.musica)) ? props.musica : "";
  return { durationInFrames: Math.max(30, Math.ceil(total * H_FPS)), props: { escenas, musica } };
};

const Subs: React.FC<{ texto: string; frames: number }> = ({ texto, frames }) => {
  const f = useCurrentFrame();
  const words = texto.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 5) chunks.push(words.slice(i, i + 5).join(" "));
  const per = frames / chunks.length;
  const k = Math.min(chunks.length - 1, Math.floor(f / per));
  const local = f - k * per;
  const s = interpolate(local, [0, 5], [0.85, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 90, textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          transform: `scale(${s})`,
          fontFamily: "Mont",
          fontWeight: 900,
          fontSize: 62,
          lineHeight: 1.15,
          color: "#fff",
          textTransform: "uppercase",
          WebkitTextStroke: "3px #000",
          paintOrder: "stroke",
          textShadow: "0 6px 14px rgba(0,0,0,0.7)",
        }}
      >
        {chunks[k]}
      </span>
    </div>
  );
};

const Plano: React.FC<{ e: Escena; frames: number; i: number }> = ({ e, frames, i }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, frames], i % 2 ? [1.15, 1.03] : [1.03, 1.15]);
  const dx = interpolate(f, [0, frames], i % 3 === 0 ? [-30, 30] : [20, -20]);
  const op = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op, background: "#000" }}>
      {e.img ? (
        <Img src={staticFile(`historia/img/${e.id}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translateX(${dx}px)` }} />
      ) : (
        <AbsoluteFill style={{ background: "linear-gradient(135deg,#1b2a4a,#3a1c4a)", padding: 120, justifyContent: "center" }}>
          <div style={{ fontFamily: "Mont", fontWeight: 900, fontSize: 40, color: "#f9e04b" }}>FALTA IMAGEN {e.id}.png</div>
          <div style={{ fontFamily: "monospace", fontSize: 24, color: "#cfd8ff", marginTop: 20, lineHeight: 1.4 }}>{e.prompt.split("Scene:")[1]}</div>
        </AbsoluteFill>
      )}
      {e.voz && <Audio src={staticFile(`historia/voz/${e.id}.mp3`)} />}
      <Subs texto={e.texto} frames={frames} />
    </AbsoluteFill>
  );
};

export const HistoriaIA: React.FC<HistoriaProps> = ({ escenas, musica }) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {musica && <Audio src={staticFile(musica)} volume={0.12} loop />}
      {escenas.map((e, i) => {
        const d = Math.ceil((e.dur ?? 5) * H_FPS);
        const el = (
          <Sequence key={e.id} from={from} durationInFrames={d}>
            <Plano e={e} frames={d} i={i} />
          </Sequence>
        );
        from += d;
        return el;
      })}
    </AbsoluteFill>
  );
};
