import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-900.woff2"), weight: "900" });
loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2") });

export const SFPS = 30;
const sec = (s: number) => Math.round(s * SFPS);

export type SScene = { s: number; e: number; img: string; fx?: "impact" | "flash" | "shake" | "slow" | "zoomin" | "dark"; move?: number; title?: string };
export type SCaption = { t: string; s: number; e: number };
export type StoryProps = { vertical: boolean; scenes: SScene[]; captions: SCaption[]; voice: string; total: number; sfx?: { f: string; at: number; v?: number }[] };

const useU = () => {
  const { width, height } = useVideoConfig();
  return { u: Math.min(width, height) / 1080, vert: height > width, W: width, H: height };
};

// Ken Burns presets: [scaleFrom, scaleTo, xFrom, xTo, yFrom, yTo] (x/y in % of frame)
const MOVES: number[][] = [
  [1.08, 1.22, 0, -3, 0, -2],
  [1.22, 1.08, -3, 2, 1, 0],
  [1.12, 1.25, 3, -2, 0, 2],
  [1.25, 1.12, 0, 0, -3, 2],
  [1.1, 1.3, -2, 2, 2, -2],
  [1.18, 1.18, -4, 4, 0, 0],
];

const SceneView: React.FC<{ sc: SScene; idx: number }> = ({ sc, idx }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const dur = Math.max(1, sec(sc.e - sc.s));
  const m = MOVES[(sc.move ?? idx) % MOVES.length];
  const p = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  let sc0 = m[0] + (m[1] - m[0]) * p;
  if (sc.fx === "zoomin") sc0 = 1.05 + 0.45 * Easing.in(Easing.cubic)(p);
  if (sc.fx === "slow") sc0 = 1.1 + 0.06 * p;
  const x = m[2] + (m[3] - m[2]) * p;
  const y = m[4] + (m[5] - m[4]) * p;
  const hit = sc.fx === "impact" || sc.fx === "shake";
  const sh = hit ? Math.max(0, 14 - f) : 0;
  const shx = Math.sin(f * 2.1) * sh * 2.2 * u;
  const shy = Math.cos(f * 1.7) * sh * 1.6 * u;
  const punch = hit ? interpolate(f, [0, 6], [1.15, 1], { extrapolateRight: "clamp" }) : interpolate(f, [0, 8], [1.05, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fade = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  const flash = sc.fx === "impact" || sc.fx === "flash" ? interpolate(f, [0, 7], [0.85, 0], { extrapolateRight: "clamp" }) : 0;
  const ts = spring({ frame: f - 3, fps: SFPS, config: { damping: 10, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: fade }}>
      <Img src={staticFile(`historia/img/${sc.img}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${x}% , ${y}%) translate(${shx}px, ${shy}px) scale(${sc0 * punch})`, filter: sc.fx === "dark" ? "brightness(0.55) saturate(0.8)" : "saturate(1.08) contrast(1.04)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
      {flash > 0 ? <AbsoluteFill style={{ background: "white", opacity: flash }} /> : null}
      {sc.title ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 90 * u, display: "flex", justifyContent: "center", transform: `scale(${ts})` }}>
          <div style={{ fontFamily: "Anton", fontSize: 96 * u, color: "#FFE14D", WebkitTextStroke: `${6 * u}px #000`, paintOrder: "stroke", textShadow: `0 ${8 * u}px 0 #000`, textTransform: "uppercase", textAlign: "center", padding: `0 ${40 * u}px` }}>{sc.title}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// big word-by-word caption (one word at a time, with pop)
const Captions: React.FC<{ caps: SCaption[] }> = ({ caps }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const t = f / SFPS;
  const c = caps.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const words = c.t.split(" ").filter(Boolean);
  const weights = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 2);
  const tot = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.1, c.e - c.s);
  let acc = 0, wi = words.length - 1, ws = c.s;
  for (let i = 0; i < words.length; i++) {
    const st = c.s + (acc / tot) * span;
    acc += weights[i];
    if (t < c.s + (acc / tot) * span) { wi = i; ws = st; break; }
  }
  const k = Math.round((t - ws) * SFPS);
  const pop = spring({ frame: k, fps: SFPS, config: { damping: 9, stiffness: 260 } });
  const w = words[wi].replace(/[«»"]/g, "");
  const strong = /[!¡?¿]/.test(w) || w.length > 7;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: vert ? 1180 * u : undefined, bottom: vert ? undefined : 120 * u, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: (vert ? 110 : 96) * u, color: strong ? "#FFE14D" : "#FFFFFF", WebkitTextStroke: `${(vert ? 10 : 9) * u}px #000`, paintOrder: "stroke", textShadow: `0 ${6 * u}px ${12 * u}px rgba(0,0,0,0.6)`, transform: `scale(${0.6 + 0.4 * pop}) rotate(${(wi % 2 ? 1 : -1) * 2 * (1 - pop)}deg)`, letterSpacing: 1 }}>{w}</div>
    </div>
  );
};

export const StoryVid: React.FC<StoryProps> = ({ scenes, captions, voice, total, sfx }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s) + 4)}>
          <SceneView sc={sc} idx={i} />
        </Sequence>
      ))}
      <Captions caps={captions} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 7 * u, width: `${(f / sec(total)) * 100}%`, background: "#FFE14D" }} />
      <Audio src={staticFile(voice)} />
      {scenes.map((sc, i) => {
        const fxs: { f: string; at: number; v: number }[] = [];
        if (sc.fx === "impact") fxs.push({ f: "voz/impacto.wav", at: 0, v: 0.6 }, { f: "wyr/sfx/boom.wav", at: 0.02, v: 0.35 });
        else if (sc.fx === "flash") fxs.push({ f: "wyr/sfx/zap.wav", at: 0, v: 0.35 });
        else if (sc.fx === "shake") fxs.push({ f: "wyr/sfx/boom.wav", at: 0, v: 0.35 });
        else if (sc.fx === "zoomin") fxs.push({ f: "wyr/sfx/riser.wav", at: 0, v: 0.35 });
        else if (sc.fx === "dark") fxs.push({ f: "wyr/sfx/heart.wav", at: 0.1, v: 0.45 });
        else if (i > 0) fxs.push({ f: i % 3 === 0 ? "wyr/sfx/whoosh.wav" : "wyr/sfx/tick.wav", at: 0, v: i % 3 === 0 ? 0.2 : 0.12 });
        return fxs.map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(sc.s + x.at)} durationInFrames={sec(2.5)}>
            <Audio src={staticFile(x.f)} volume={x.v} />
          </Sequence>
        ));
      })}
      {(sfx ?? []).map((x, j) => (
        <Sequence key={`x${j}`} from={sec(x.at)} durationInFrames={sec(3)}>
          <Audio src={staticFile(x.f)} volume={x.v ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const storyDuration = (p: StoryProps) => sec(p.total);
