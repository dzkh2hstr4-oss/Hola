import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../Lumora/common";
import { Burst, Flash, Grain, Kinetic, SlamWord, Snow, Sparkle, Vignette } from "../Anuncio/Anuncio";
import { LAMP, Room, SUN } from "../Anuncio/Room";

// Data-driven motion-graphics reel in the style of the Christmas ad that worked best:
// illustrated room, kinetic text, slams, product reveal, switch-on, offer. Each video picks
// its own scenes, texts, voice and music.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Linea = { text: string; color?: string; bg?: string; size?: number };
type Base = { dur: number; voz?: string };
export type Escena = Base &
  (
    | { tipo: "gancho"; lineas: Linea[]; etiqueta?: string }
    | { tipo: "golpes"; palabras: string[] }
    | { tipo: "producto"; lineas: Linea[]; foto: string; sub?: string }
    | { tipo: "encender"; antes: string; despues: Linea[] }
    | { tipo: "cuenta"; lineas: Linea[]; desde?: number }
    | { tipo: "versus"; lineas: Linea[]; izquierda: string; derecha: string }
    | { tipo: "oferta"; titulo: string; descuento: string; antes: string; ahora: string; extra?: string; boton?: string }
  );

export type AnimadoProps = {
  producto: "atardecer" | "aurora";
  escenas: Escena[];
  musica?: string;
  musicaVolumen?: number;
  musicaDesde?: number;
};

type Theme = { accent: string; onAccent: string; hot: string; deep: string; glow: string };
const THEMES: Record<AnimadoProps["producto"], Theme> = {
  atardecer: { accent: "#FFC94A", onAccent: "#3a0d05", hot: "#FF7A1A", deep: "#E8401C", glow: "#ffb050" },
  aurora: { accent: "#3dffb0", onAccent: "#06231a", hot: "#1fd2ff", deep: "#7b5bff", glow: "#8affe0" },
};

const useT = (p: AnimadoProps) => THEMES[p.producto];
const fill = (lines: Linea[], t: Theme) =>
  lines.map((l) => ({ ...l, color: l.color === "accent" ? t.accent : l.bg === "accent" ? t.onAccent : l.color, bg: l.bg === "accent" ? t.accent : l.bg }));

/* ---------- gancho: dull grey room + question ---------- */
const Gancho: React.FC<{ e: Extract<Escena, { tipo: "gancho" }>; p: AnimadoProps; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, e.dur], [1.2, 1.04], { easing: Easing.out(Easing.quad) });
  const flicker = frame > 40 && frame < 52 && frame % 3 === 0 ? 0.22 : 0;
  const out = interpolate(frame, [e.dur - 8, e.dur], [1, 1.25], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom * out})`, filter: "saturate(0.35) brightness(0.8)" }}>
        <Room lit={0} lampVisible={false} modo={p.producto === "aurora" ? "aurora" : "sol"} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(30,45,80,0.28)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flicker }} />
      <Vignette strength={0.85} />
      <Kinetic top={170} delay={4} lines={fill(e.lineas, t)} />
      {e.etiqueta && (
        <Sequence from={36}>
          <Tag text={e.etiqueta} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 9 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        right: 70,
        transform: `rotate(-8deg) scale(${s})`,
        fontFamily,
        fontWeight: 800,
        fontSize: 46,
        color: "#c9ccd4",
        border: "5px solid #c9ccd4",
        borderRadius: 16,
        padding: "8px 22px",
      }}
    >
      {text}
    </div>
  );
};

/* ---------- golpes: slammed words with shake ---------- */
export const hitsFor = (n: number) => new Array(n).fill(0).map((_, i) => 8 + i * 10);
const Golpes: React.FC<{ e: Extract<Escena, { tipo: "golpes" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const hits = hitsFor(e.palabras.length);
  const shake = hits.reduce((acc, h) => acc + (frame - h >= 0 && frame - h < 8 ? (8 - (frame - h)) * 2.2 : 0), 0);
  const pulse = hits.reduce((acc, h) => acc + interpolate(frame - h, [0, 10], [1, 0], clamp), 0);
  const wipe = interpolate(frame, [e.dur - 12, e.dur], [0, 1500], { ...clamp, easing: Easing.in(Easing.cubic) });
  const colors = ["#fff", t.accent, t.hot, "#fff"];
  const n = e.palabras.length;
  const span = 260 * n;
  return (
    <AbsoluteFill style={{ background: "#08060a", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${t.hot}${Math.round((0.25 + pulse * 0.3) * 255).toString(16).padStart(2, "0")}, transparent 65%)` }} />
      {new Array(18).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540,
            top: 960,
            width: 1400,
            height: 6,
            background: `linear-gradient(90deg, transparent 20%, ${t.accent}55)`,
            transformOrigin: "0 50%",
            transform: `rotate(${(i / 18) * 360 + frame * 0.6}deg)`,
            opacity: 0.4 + pulse * 0.4,
          }}
        />
      ))}
      <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 13.1) * shake}px, ${Math.cos(frame * 9.7) * shake}px) rotate(-4deg)` }}>
        {e.palabras.map((w, i) => {
          const size = Math.min(330, Math.floor(1700 / Math.max(3, w.length)) + (i === n - 1 ? 30 : 0));
          return <SlamWord key={i} word={w} at={hits[i]} y={960 - span / 2 + i * 260} color={colors[i % colors.length]} size={size} />;
        })}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 540 - wipe,
          top: 960 - wipe,
          width: wipe * 2,
          height: wipe * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, #fff, ${t.hot} 50%, ${t.deep})`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- producto: product card reveal ---------- */
const Producto: React.FC<{ e: Extract<Escena, { tipo: "producto" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 120 } });
  const drift = interpolate(frame, [0, e.dur], [0, 1]);
  const shine = interpolate(frame, [22, 44], [-700, 900], clamp);
  const out = interpolate(frame, [e.dur - 10, e.dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${t.hot} 0%, ${t.deep} 45%, #07040d 100%)` }} />
      <AbsoluteFill
        style={{
          background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.14) 0deg 8deg, transparent 8deg 22deg)",
          transform: `rotate(${frame * 0.8}deg) scale(2)`,
        }}
      />
      {[0, 1, 2].map((i) => {
        const k = ((frame + i * 18) % 54) / 54;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - 300 - k * 400,
              top: 980 - 300 - k * 400,
              width: 600 + k * 800,
              height: 600 + k * 800,
              borderRadius: "50%",
              border: `6px solid rgba(255,255,255,${0.45 * (1 - k)})`,
            }}
          />
        );
      })}
      <Kinetic top={150} delay={6} stagger={3} lines={fill(e.lineas, t)} />
      <div
        style={{
          position: "absolute",
          left: 540 - 330,
          top: 600,
          width: 660,
          height: 880,
          borderRadius: 48,
          overflow: "hidden",
          transform: `translateY(${(1 - pop) * 600 - drift * 20}px) scale(${(0.7 + 0.3 * pop) * (1 + drift * 0.06) * (1 - out * 0.3)}) rotate(${(1 - pop) * 14 - 2 + drift * 2}deg)`,
          boxShadow: "0 50px 120px rgba(0,0,0,0.55), 0 0 0 8px rgba(255,255,255,0.9)",
          opacity: 1 - out,
        }}
      >
        <Img src={staticFile(e.foto)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + drift * 0.08})` }} />
        <div
          style={{
            position: "absolute",
            top: -200,
            left: shine,
            width: 160,
            height: 1400,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            transform: "rotate(20deg)",
          }}
        />
      </div>
      <Sparkle x={230} y={640} at={18} size={90} />
      <Sparkle x={880} y={760} at={26} size={70} />
      <Sparkle x={200} y={1350} at={34} size={60} />
      <Sparkle x={870} y={1420} at={40} size={100} />
      {e.sub && <Kinetic top={1560} delay={28} stagger={3} lines={[{ text: e.sub, size: 56 }]} />}
      <Snow count={35} opacity={0.5} />
      <AbsoluteFill style={{ background: "#000", opacity: out }} />
    </AbsoluteFill>
  );
};

/* ---------- encender: device drops in and switches the room on ---------- */
export const ON_AT = 30;
const Encender: React.FC<{ e: Extract<Escena, { tipo: "encender" }>; p: AnimadoProps; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 6, fps, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  const landT = frame - 14;
  const squash = landT >= 0 ? 1 - 0.12 * Math.exp(-landT / 4) * Math.cos(landT / 1.5) : 1;
  const lit = interpolate(frame, [ON_AT, ON_AT + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lights = interpolate(frame, [ON_AT + 14, ON_AT + 30], [0, 1], clamp);
  const aur = p.producto === "aurora";
  const focus = aur ? { x: 540, y: 520 } : SUN;
  const zoom = interpolate(frame, [0, ON_AT, e.dur], [1.02, 1.06, 1.22], { easing: Easing.inOut(Easing.quad) });
  const cy = interpolate(frame, [ON_AT, e.dur], [0, 120], clamp);
  const shake = frame >= ON_AT && frame < ON_AT + 8 ? (ON_AT + 8 - frame) * 2 : 0;
  const dust = new Array(40).fill(0).map((_, i) => {
    const k = frame - ON_AT - random(`dd${i}`) * 20;
    const ang = random(`da${i}`) * Math.PI * 2;
    const dist = Math.max(0, k) * (4 + random(`ds${i}`) * 10);
    return { x: focus.x + Math.cos(ang) * dist, y: focus.y + Math.sin(ang) * dist, o: k > 0 ? interpolate(k, [0, 10, 50], [0, 1, 0], clamp) : 0, s: 4 + random(`dz${i}`) * 10 };
  });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${focus.x}px ${focus.y + 300}px`,
          transform: `translate(${Math.sin(frame * 11) * shake}px, ${cy + Math.cos(frame * 7) * shake}px) scale(${zoom})`,
          filter: `saturate(${0.35 + lit * 0.9}) brightness(${0.8 + lit * 0.25})`,
        }}
      >
        <Room lit={lit} lights={lights} lampDropY={(1 - drop) * -1500} lampSquash={squash} modo={aur ? "aurora" : "sol"} />
        {dust.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: "50%", background: t.accent, opacity: d.o, boxShadow: `0 0 12px ${t.glow}` }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${LAMP.x}px ${LAMP.baseY - 180}px, ${t.glow}, transparent 40%)`,
          opacity: interpolate(frame, [ON_AT - 2, ON_AT, ON_AT + 10], [0, 1, 0], clamp),
          mixBlendMode: "screen",
        }}
      />
      <Flash at={ON_AT + 1} color={t.glow} len={12} />
      <Vignette strength={0.6 - lit * 0.25} />
      <Sequence from={4} durationInFrames={ON_AT - 4}>
        <Kinetic top={170} lines={[{ text: e.antes }]} />
      </Sequence>
      <Sequence from={ON_AT + 12}>
        <Kinetic top={150} stagger={5} lines={fill(e.despues, t)} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------- cuenta: suspense countdown with heartbeat ---------- */
const Cuenta: React.FC<{ e: Extract<Escena, { tipo: "cuenta" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const n = e.desde ?? 3;
  const step = Math.floor((e.dur - 6) / n);
  const idx = Math.min(n - 1, Math.floor(frame / step));
  const k = (frame % step) / step;
  const beat = Math.exp(-((frame % 15) / 3));
  const s = interpolate(k, [0, 0.15, 1], [2.4, 1, 0.9], { easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#050308", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${t.deep}${Math.round((0.3 + beat * 0.35) * 255).toString(16).padStart(2, "0")}, transparent 60%)` }} />
      <Kinetic top={170} delay={2} lines={fill(e.lineas, t)} />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 620,
          lineHeight: 1,
          color: "#fff",
          transform: `scale(${s * (1 + beat * 0.04)})`,
          textShadow: `0 0 80px ${t.hot}`,
          opacity: interpolate(k, [0, 0.1, 0.85, 1], [0, 1, 1, 0.2]),
        }}
      >
        {n - idx}
      </div>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/* ---------- versus: boring light vs this ---------- */
const Versus: React.FC<{ e: Extract<Escena, { tipo: "versus" }>; p: AnimadoProps; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = spring({ frame: frame - 4, fps, config: { damping: 13 } });
  const r = spring({ frame: frame - 22, fps, config: { damping: 11 } });
  const aur = p.producto === "aurora";
  const half = (lit: number, x: number, label: string, pop: number, good: boolean) => (
    <div style={{ position: "absolute", left: x, top: 520, width: 520, height: 1000, overflow: "hidden", borderRadius: 36, transform: `translateY(${(1 - pop) * 900}px) rotate(${good ? 2 : -2}deg)`, boxShadow: good ? `0 0 0 8px ${t.accent}, 0 0 90px ${t.glow}` : "0 0 0 8px #5a5d66" }}>
      <div style={{ position: "absolute", left: -280, top: -330, width: 1080, height: 1920, transform: "scale(0.62)", transformOrigin: "50% 40%" }}>
        <Room lit={lit} lights={lit} modo={aur ? "aurora" : "sol"} />
      </div>
      {!good && <div style={{ position: "absolute", inset: 0, background: "rgba(220,230,255,0.25)" }} />}
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 52, color: good ? t.onAccent : "#fff" }}>
        <span style={{ background: good ? t.accent : "#3a3d46", padding: "6px 22px", borderRadius: 18 }}>{label}</span>
      </div>
    </div>
  );
  const vs = spring({ frame: frame - 40, fps, config: { damping: 8 } });
  return (
    <AbsoluteFill style={{ background: "#0b0a10", overflow: "hidden" }}>
      <Kinetic top={140} delay={2} lines={fill(e.lineas, t)} />
      {half(0, 20, e.izquierda, l, false)}
      {half(1, 540, e.derecha, r, true)}
      <div style={{ position: "absolute", left: 540 - 95, top: 920, width: 190, height: 190, borderRadius: "50%", background: t.deep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 84, color: "#fff", transform: `scale(${vs}) rotate(${(1 - vs) * 90}deg)`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        VS
      </div>
    </AbsoluteFill>
  );
};

/* ---------- oferta: price stamp + call to action ---------- */
const Oferta: React.FC<{ e: Extract<Escena, { tipo: "oferta" }>; p: AnimadoProps; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = interpolate(frame, [4, 12], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const shake = frame >= 12 && frame < 20 ? (20 - frame) * 3 : 0;
  const strike = interpolate(frame, [34, 42], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const newPrice = spring({ frame: frame - 42, fps, config: { damping: 9 } });
  const btn = spring({ frame: frame - 62, fps, config: { damping: 10 } });
  const finger = Math.sin(frame / 4) * 12;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, e.dur], [1.3, 1.42])})`, filter: "blur(18px) brightness(0.55)" }}>
        <Room lit={1} lights={1} modo={p.producto === "aurora" ? "aurora" : "sol"} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7))" }} />
      <Flash at={1} color="#fff" len={6} />
      <Kinetic top={150} delay={0} stagger={3} lines={[{ text: e.titulo, size: 76, color: t.accent }]} />
      <div
        style={{
          position: "absolute",
          left: 540 - 340,
          top: 330,
          width: 680,
          height: 680,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${Math.sin(frame * 12) * shake}px, ${Math.cos(frame * 9) * shake}px) scale(${stamp}) rotate(-8deg)`,
          opacity: interpolate(frame, [4, 7], [0, 1], clamp),
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <Burst size={680} color={t.deep} rot={frame * 0.7} />
        </div>
        <div style={{ position: "absolute", inset: 46 }}>
          <Burst size={588} color={t.hot} rot={-frame * 0.5} />
        </div>
        <div style={{ position: "relative", fontFamily, fontWeight: 900, fontSize: 240, color: "#fff", letterSpacing: -10, textShadow: "0 12px 0 rgba(0,0,0,0.25)", lineHeight: 1, textAlign: "center" }}>
          {e.descuento}
          <div style={{ fontSize: 58, letterSpacing: 2, marginTop: 6 }}>DESCUENTO</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1050, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative", fontFamily, fontWeight: 800, fontSize: 80, color: "rgba(255,255,255,0.75)", opacity: interpolate(frame, [16, 22], [0, 1], clamp) }}>
          {e.antes}
          <div style={{ position: "absolute", left: -10, top: "50%", height: 10, width: `${strike * 110}%`, background: t.deep, borderRadius: 5, transform: "rotate(-8deg)" }} />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 116, color: t.onAccent, background: t.accent, borderRadius: 28, padding: "4px 34px 12px", transform: `scale(${newPrice}) rotate(${(1 - newPrice) * 20}deg)`, boxShadow: `0 20px 60px ${t.glow}77` }}>
          {e.ahora}
        </div>
      </div>
      {e.extra && (
        <Sequence from={50}>
          <Kinetic top={1250} stagger={2} lines={[{ text: e.extra, size: 58 }]} />
        </Sequence>
      )}
      <div style={{ position: "absolute", top: 1480, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${btn})` }}>
        <div style={{ fontSize: 90, transform: `translateY(${finger}px)` }}>☝️</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 64, color: "#fff", padding: "22px 54px", borderRadius: 60, background: `linear-gradient(90deg, ${t.deep}, ${t.hot})`, boxShadow: `0 0 0 6px rgba(255,255,255,0.85), 0 20px 60px ${t.glow}88` }}>
          {e.boton ?? "Cómpralo en mi bio"}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 52, letterSpacing: 6, color: "#fff", opacity: interpolate(frame, [80, 90], [0, 0.9], clamp) }}>LUMORA</div>
      <Snow count={50} opacity={0.6} />
    </AbsoluteFill>
  );
};

/* ---------- sound design ---------- */
const sfx = (f: string) => staticFile(`voz/${f}`);
const SceneSfx: React.FC<{ e: Escena }> = ({ e }) => {
  const list: { at: number; f: string; v: number }[] = [];
  if (e.tipo === "golpes") hitsFor(e.palabras.length).forEach((h) => list.push({ at: h, f: "impacto.wav", v: 0.4 }));
  if (e.tipo === "golpes") list.push({ at: e.dur - 16, f: "whoosh.wav", v: 0.35 });
  if (e.tipo === "producto") list.push({ at: 4, f: "brillo.wav", v: 0.3 }, { at: e.dur - 14, f: "whoosh.wav", v: 0.3 });
  if (e.tipo === "encender") list.push({ at: 14, f: "impacto.wav", v: 0.22 }, { at: ON_AT - 1, f: "click.wav", v: 0.75 }, { at: ON_AT + 1, f: "brillo.wav", v: 0.3 });
  if (e.tipo === "cuenta") {
    const n = e.desde ?? 3;
    const step = Math.floor((e.dur - 6) / n);
    for (let i = 0; i < n; i++) list.push({ at: i * step, f: "impacto.wav", v: 0.3 });
  }
  if (e.tipo === "versus") list.push({ at: 4, f: "whoosh.wav", v: 0.3 }, { at: 22, f: "whoosh.wav", v: 0.3 }, { at: 40, f: "impacto.wav", v: 0.35 });
  if (e.tipo === "oferta") list.push({ at: 11, f: "impacto.wav", v: 0.4 }, { at: 42, f: "brillo.wav", v: 0.25 }, { at: 62, f: "click.wav", v: 0.5 });
  if (e.tipo === "gancho") list.push({ at: 2, f: "whoosh.wav", v: 0.25 });
  return (
    <>
      {list.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.at)}>
          <Audio src={sfx(s.f)} volume={s.v} />
        </Sequence>
      ))}
    </>
  );
};

export const animadoDuration = (p: AnimadoProps) => p.escenas.reduce((a, e) => a + e.dur, 0);

export const Animado: React.FC<AnimadoProps> = (p) => {
  const t = useT(p);
  let from = 0;
  const total = animadoDuration(p);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {p.escenas.map((e, i) => {
        const at = from;
        from += e.dur;
        return (
          <Sequence key={i} from={at} durationInFrames={e.dur}>
            {e.tipo === "gancho" && <Gancho e={e} p={p} t={t} />}
            {e.tipo === "golpes" && <Golpes e={e} t={t} />}
            {e.tipo === "producto" && <Producto e={e} t={t} />}
            {e.tipo === "encender" && <Encender e={e} p={p} t={t} />}
            {e.tipo === "cuenta" && <Cuenta e={e} t={t} />}
            {e.tipo === "versus" && <Versus e={e} p={p} t={t} />}
            {e.tipo === "oferta" && <Oferta e={e} p={p} t={t} />}
            {i > 0 && <Flash at={0} len={6} />}
            <SceneSfx e={e} />
            {e.voz && <Audio src={staticFile(e.voz)} />}
          </Sequence>
        );
      })}
      {p.musica && (
        <Audio
          src={staticFile(p.musica)}
          startFrom={Math.round((p.musicaDesde ?? 0) * 30)}
          volume={(f) => (p.musicaVolumen ?? 0.22) * interpolate(f, [0, 10, total - 20, total], [0, 1, 1, 0], clamp)}
        />
      )}
      <Grain />
    </AbsoluteFill>
  );
};
