import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

loadFont({ family: "Marker", url: staticFile("fonts/permanent-marker.ttf") });
loadFont({ family: "PlayfairItalic", url: staticFile("fonts/playfair-900-italic.woff2"), weight: "900", style: "italic" });

export const LV_W = 1920;
export const LV_H = 1080;
export const LV_FPS = 30;

export type Linea = { t: number; text: string };
export type Tema = "noche-roja" | "atardecer";

export type LyricProps = {
  audio: string; // archivo dentro de public/, p. ej. "letras/cancion.mp3" ("" = sin audio)
  letra: string; // archivo .lrc dentro de public/
  titulo: string;
  artista: string;
  tema: Tema;
  lineas?: Linea[];
  duracion?: number;
};

export const defaultLyricProps: LyricProps = {
  audio: "letras/cancion.mp3",
  letra: "letras/letra.lrc",
  titulo: "TÍTULO",
  artista: "ARTISTA",
  tema: "noche-roja",
};

// [mm:ss.xx] texto
export const parseLrc = (src: string): Linea[] =>
  src
    .split(/\r?\n/)
    .flatMap((l) => {
      const tags = [...l.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
      const text = l.replace(/\[[^\]]*\]/g, "").trim();
      return tags.map((m) => ({ t: Number(m[1]) * 60 + Number(m[2]), text }));
    })
    .sort((a, b) => a.t - b.t);

export const calcLyricMetadata = async ({ props }: { props: LyricProps }) => {
  let lineas: Linea[] = [];
  try {
    const r = await fetch(staticFile(props.letra));
    if (r.ok) lineas = parseLrc(await r.text());
  } catch {
    /* sin letra */
  }
  let dur = lineas.length ? lineas[lineas.length - 1].t + 5 : 30;
  let audio = props.audio;
  if (audio) {
    try {
      dur = await getAudioDurationInSeconds(staticFile(audio));
    } catch {
      audio = ""; // no hay audio todavía: vista previa muda
    }
  }
  return {
    durationInFrames: Math.max(1, Math.ceil(dur * LV_FPS)),
    props: { ...props, audio, lineas, duracion: dur },
  };
};

const TEMAS = {
  "noche-roja": {
    stops: ["#05070f", "#0b1730", "#1c3358", "#2c4a72"],
    nube: "rgba(210,225,245,",
    acento: "#8e0f16",
    sombra: "rgba(60,0,8,0.85)",
  },
  atardecer: {
    stops: ["#24225c", "#5c3a82", "#c44678", "#f48c80"],
    nube: "rgba(255,150,150,",
    acento: "#ffd6aa",
    sombra: "rgba(20,10,40,0.7)",
  },
} as const;

const Cielo: React.FC<{ tema: Tema }> = ({ tema }) => {
  const f = useCurrentFrame();
  const T = TEMAS[tema];
  const nubes = new Array(14).fill(0).map((_, i) => {
    const y = 15 + random(`y${i}`) * 75;
    const w = 500 + random(`w${i}`) * 900;
    const h = 120 + random(`h${i}`) * 220;
    const speed = 0.15 + random(`s${i}`) * 0.35;
    const x = ((random(`x${i}`) * (LV_W + w) + f * speed) % (LV_W + w)) - w;
    const a = 0.08 + random(`a${i}`) * 0.18;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: `${y}%`,
          width: w,
          height: h,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${T.nube}${a}) 0%, ${T.nube}0) 70%)`,
          filter: "blur(30px)",
        }}
      />
    );
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${T.stops.join(",")})` }}>
      {nubes}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Intro: React.FC<{ p: LyricProps }> = ({ p }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = TEMAS[p.tema];
  const op = interpolate(f, [0, 20, 4 * fps, 4.6 * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = interpolate(f, [0, 4.6 * fps], [0.94, 1.04]);
  if (op <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op, transform: `scale(${s})` }}>
      <div style={{ fontFamily: "Marker", color: "white", fontSize: 44, letterSpacing: 8, textShadow: `0 4px 18px ${T.sombra}` }}>
        {p.artista.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: "PlayfairItalic",
          fontStyle: "italic",
          fontWeight: 900,
          fontSize: 240,
          lineHeight: 1,
          color: T.acento,
          textShadow: "0 6px 30px rgba(0,0,0,0.5)",
        }}
      >
        {p.titulo}
      </div>
    </AbsoluteFill>
  );
};

const Letra: React.FC<{ p: LyricProps }> = ({ p }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const L = p.lineas ?? [];
  let i = -1;
  for (let k = 0; k < L.length; k++) if (L[k].t <= t) i = k;
  if (i < 0 || !L[i].text) return null;
  const start = L[i].t * fps;
  const end = (i + 1 < L.length ? L[i + 1].t : (p.duracion ?? t + 5)) * fps;
  const op = interpolate(f, [start, start + 8, end - 6, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(f, [start, start + 10], [18, 0], { extrapolateRight: "clamp" });
  const T = TEMAS[p.tema];
  const txt = L[i].text.toUpperCase();
  const size = txt.length > 38 ? 70 : txt.length > 26 ? 84 : 100;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 140px" }}>
      <div
        style={{
          fontFamily: "Marker",
          color: "white",
          fontSize: size,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: op,
          transform: `translateY(${y}px)`,
          textShadow: `0 5px 0 ${T.sombra}, 0 8px 28px ${T.sombra}`,
        }}
      >
        {txt}
      </div>
    </AbsoluteFill>
  );
};

export const LyricVideo: React.FC<LyricProps> = (p) => (
  <AbsoluteFill>
    <Cielo tema={p.tema} />
    <Intro p={p} />
    <Letra p={p} />
    <div style={{ position: "absolute", right: 50, bottom: 36, fontFamily: "Marker", color: "rgba(255,255,255,0.8)", fontSize: 40 }}>
      AL
    </div>
    {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
  </AbsoluteFill>
);
