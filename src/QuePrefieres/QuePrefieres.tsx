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
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { fontFamily } from "../Lumora/common";

const YELLOW = "#FFD60A";
const BLUE = "#2F7BFF";
const RED = "#FF3B3B";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (sec: number) => Math.round(sec * 30);
const CD = 5; // seconds of countdown per question

/*
 * Narration (public/wyr/voz2.mp3) is cut into 5 chunks (parte1..5.wav);
 * a 5 s countdown sits between them. Chunk k is shifted by (k-1)*5 s, so a
 * time t in the original take lands at t + shift(t).
 */
const CHUNKS = [
  { file: "parte1.wav", origFrom: 0, at: 0 },
  { file: "parte2.wav", origFrom: 11.55, at: 16.55 },
  { file: "parte3.wav", origFrom: 20.87, at: 30.87 },
  { file: "parte4.wav", origFrom: 31.67, at: 46.67 },
  { file: "parte5.wav", origFrom: 45.05, at: 65.05 },
];
const g = (orig: number) => {
  const c = [...CHUNKS].reverse().find((k) => orig >= k.origFrom - 0.001)!;
  return f(orig - c.origFrom + c.at);
};

export const QP_DURATION = f(75.2);

type Seg = { from: number; to: number; text: string };
const SEGS: Seg[] = (
  [
    [0.09, 2.93, "¿Crees que eliges lo mismo que la mayoría de la gente?"],
    [3.1, 4.23, "¡Vamos a comprobarlo!"],
    [4.42, 6.08, "Cuenta cuántas coincides."],
    [6.26, 6.73, "Primera."],
    [6.89, 7.64, "¿Qué prefieres?"],
    [7.82, 9.14, "¿Que tu casa se inunde…"],
    [9.32, 10.12, "o que se queme?"],
    [10.29, 11.45, "¡Cinco segundos!"],
    [11.62, 12.02, "¡Ojo!"],
    [12.18, 14.26, "El 62 % elige agua."],
    [14.43, 16.46, "Si elegiste agua, ¡punto para ti!"],
    [16.64, 17.25, "Segunda."],
    [17.43, 18.49, "¿Vivir sin móvil…"],
    [18.66, 19.79, "o sin videojuegos?"],
    [19.99, 20.78, "¡Piénsalo bien!"],
    [20.95, 22.62, "¡Uff, ajustadísimo!"],
    [22.8, 26.34, "El 58 % prefiere quedarse sin videojuegos."],
    [26.53, 27.23, "¿Coincides?"],
    [27.4, 27.94, "Tercera."],
    [28.11, 29.02, "¿Leer mentes…"],
    [29.21, 30.24, "o ser invisible?"],
    [30.41, 31.58, "¡Venga, rápido!"],
    [31.76, 32.74, "¡Paliza total!"],
    [32.91, 35.5, "El 71 % quiere leer mentes."],
    [35.64, 38.23, "Si elegiste invisible… ¡eres de los raros!"],
    [38.41, 40.28, "Y la última, la más difícil."],
    [40.46, 41.7, "¿10.000 € ahora…"],
    [41.88, 43.81, "o 100.000 dentro de diez años?"],
    [43.97, 44.97, "¡Cinco segundos!"],
    [45.13, 45.84, "¡Madre mía!"],
    [45.99, 48.48, "El 55 % prefiere esperar."],
    [48.65, 49.78, "¿Tú habrías aguantado?"],
    [49.94, 51.12, "¿Cuántas has acertado?"],
    [51.29, 54.36, "¡Ponlo en comentarios y sígueme para la segunda parte!"],
  ] as [number, number, string][]
).map(([a, b, t]) => ({ from: g(a), to: g(b), text: t }));

type Q = {
  n: number;
  from: number;
  to: number;
  title: [string, string];
  a: { img: string; label: string; at: number };
  b: { img: string; label: string; at: number };
  cdFrom: number;
  reactAt: number;
  reaction: string;
  resultAt: number;
  pctA: number;
  accentA: string;
  accentB: string;
  emojis: string[];
  hard?: boolean;
};

const QS: Q[] = [
  {
    n: 1, from: g(6.26), to: g(16.64), title: ["AGUA", "FUEGO"],
    a: { img: "a1.png", label: "SE INUNDA 🌊", at: g(7.82) },
    b: { img: "b1.png", label: "SE QUEMA 🔥", at: g(9.32) },
    cdFrom: f(11.55), reactAt: g(11.62), reaction: "👀 ¡OJO!", resultAt: g(12.18), pctA: 62,
    accentA: BLUE, accentB: RED, emojis: ["💧", "🌊", "🔥", "😱"],
  },
  {
    n: 2, from: g(16.64), to: g(27.4), title: ["SIN MÓVIL", "SIN VIDEOJUEGOS"],
    a: { img: "a2.png", label: "SIN MÓVIL 📵", at: g(17.43) },
    b: { img: "b2.png", label: "SIN VIDEOJUEGOS 🎮", at: g(18.66) },
    cdFrom: f(25.87), reactAt: g(20.95), reaction: "😮 ¡AJUSTADÍSIMO!", resultAt: g(22.8), pctA: 42,
    accentA: "#00C2A8", accentB: "#B44CFF", emojis: ["📱", "🎮", "😬", "🤔"],
  },
  {
    n: 3, from: g(27.4), to: g(38.41), title: ["LEER MENTES", "INVISIBILIDAD"],
    a: { img: "a3.png", label: "LEER MENTES 🧠", at: g(28.11) },
    b: { img: "b3.png", label: "INVISIBLE 👻", at: g(29.21) },
    cdFrom: f(41.67), reactAt: g(31.76), reaction: "💀 ¡PALIZA TOTAL!", resultAt: g(32.91), pctA: 71,
    accentA: "#FF4FA3", accentB: "#4FC3FF", emojis: ["🧠", "👻", "🔮", "🤯"],
  },
  {
    n: 4, from: g(38.41), to: g(49.94), title: ["10.000 € AHORA", "100.000 € DESPUÉS"],
    a: { img: "a4.png", label: "10.000 € YA 💶", at: g(40.46) },
    b: { img: "b4.png", label: "100.000 € EN 10 AÑOS ⏳", at: g(41.88) },
    cdFrom: f(60.05), reactAt: g(45.13), reaction: "🤯 ¡MADRE MÍA!", resultAt: g(45.99), pctA: 45,
    accentA: "#2ECC71", accentB: "#F5A623", emojis: ["💶", "💰", "⏳", "🤑"], hard: true,
  },
];
const OUTRO = g(49.94);
const HOOK_THUMBS = ["a1", "b1", "a2", "b2", "a3", "b3", "a4", "b4"];

/* ---------- background ---------- */

const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% ${42 + Math.sin(frame / 40) * 6}%, #262842 0%, #0b0c15 72%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.04) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(frame * 1.5) % 90}px`,
        }}
      />
      {new Array(30).fill(0).map((_, i) => {
        const y = ((random(`py${i}`) * 1920 - frame * (0.8 + random(`ps${i}`) * 1.5)) % 1920 + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`px${i}`) * 1080,
              top: y,
              width: 5,
              height: 5,
              borderRadius: 3,
              background: i % 3 ? "#fff" : YELLOW,
              opacity: 0.18,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- hook ---------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: frame - 2, fps, config: { damping: 10 } });
  const t2 = spring({ frame: frame - 30, fps, config: { damping: 8, stiffness: 170 } });
  const t3 = spring({ frame: frame - f(4.42), fps, config: { damping: 11 } });
  const exit = interpolate(frame, [g(6.26) - 8, g(6.26)], [0, 1], clamp);
  const shake = frame >= 30 && frame < 42 ? (42 - frame) * 2.2 : 0;
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + exit * 0.4})`, opacity: 1 - exit, filter: `blur(${exit * 12}px)` }}>
      {/* small option images flying around */}
      {HOOK_THUMBS.map((t, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const s = spring({ frame: frame - 6 - i * 4, fps, config: { damping: 12 } });
        const x = side < 0 ? 18 + (row % 2) * 24 : 1080 - 168 - (row % 2) * 24;
        const y = 300 + row * 300 + Math.sin(frame / 12 + i) * 14;
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: x + (1 - s) * side * 500,
              top: y,
              width: 150,
              height: 200,
              borderRadius: 22,
              overflow: "hidden",
              border: `5px solid ${side < 0 ? BLUE : RED}`,
              transform: `rotate(${side * (8 + Math.sin(frame / 18 + i) * 4)}deg) scale(${s})`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <Img src={staticFile(`wyr/${t}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 190,
          right: 190,
          top: 600,
          textAlign: "center",
          transform: `translate(${Math.sin(frame * 9) * shake}px, ${Math.cos(frame * 7) * shake}px)`,
        }}
      >
        <div style={{ fontFamily, fontWeight: 900, fontSize: 58, color: "#fff", lineHeight: 1.05, opacity: t1, transform: `translateY(${(1 - t1) * 50}px)`, textShadow: "0 8px 30px #000" }}>
          ¿ELIGES LO MISMO QUE
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-block",
            fontFamily,
            fontWeight: 900,
            fontSize: 90,
            lineHeight: 1,
            color: "#111",
            background: YELLOW,
            borderRadius: 26,
            padding: "10px 28px 16px",
            transform: `scale(${t2}) rotate(${(1 - t2) * -14 - 3}deg)`,
            boxShadow: "0 20px 60px rgba(255,214,10,0.45)",
          }}
        >
          LA MAYORÍA?
        </div>
        <div
          style={{
            marginTop: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontFamily,
            fontWeight: 800,
            fontSize: 38,
            color: "#fff",
            background: "rgba(255,255,255,0.12)",
            border: "3px solid rgba(255,255,255,0.4)",
            borderRadius: 999,
            padding: "12px 30px",
            transform: `scale(${t3})`,
          }}
        >
          🎯 Cuenta tus aciertos: <span style={{ color: YELLOW }}>?/4</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- question parts ---------- */

const PANEL_TOP = 470;
const PANEL_H = 880;
const PANEL_W = 524;

const QuestionCard: React.FC<{ q: Q }> = ({ q }) => {
  // "PREGUNTA 2" slam at the start of each question
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 6], [3, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const o = interpolate(frame, [0, 3, 16, 22], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 30, opacity: o, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.55)" }} />
      <div style={{ transform: `scale(${s}) rotate(-6deg)`, textAlign: "center" }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 90, color: "#fff" }}>PREGUNTA</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 330, lineHeight: 0.85, color: YELLOW, textShadow: "0 16px 0 rgba(0,0,0,0.4)" }}>{q.n}</div>
        {q.hard ? (
          <div style={{ marginTop: 10, fontFamily, fontWeight: 900, fontSize: 60, color: "#fff", background: RED, borderRadius: 16, padding: "6px 24px" }}>⚠️ LA MÁS DIFÍCIL</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ q: Q; side: "a" | "b" }> = ({ q, side }) => {
  const frame = useCurrentFrame(); // relative to question start
  const { fps } = useVideoConfig();
  const opt = q[side];
  const isA = side === "a";
  const len = q.to - q.from;
  const enter = spring({ frame: frame - 14 - (isA ? 0 : 4), fps, config: { damping: 13, stiffness: 150 } });
  const exitT = interpolate(frame, [len - 7, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x0 = isA ? 6 : 1080 - PANEL_W - 6;
  const slide = (1 - enter) * (isA ? -760 : 760) + exitT * (isA ? -1000 : 1000);

  const sayT = frame - (opt.at - q.from);
  const spot = interpolate(sayT, [0, 5, 28], [0, 1, 0.3], clamp);
  const spotPop = sayT >= 0 && sayT < 10 ? Math.sin((sayT / 10) * Math.PI) * 0.06 : 0;

  // countdown: panels breathe and wobble
  const cdT = frame - (q.cdFrom - q.from);
  const inCd = cdT >= 0 && cdT < CD * 30;
  const beat = inCd ? Math.max(0, Math.cos(((cdT % 30) / 30) * Math.PI * 2)) ** 6 * 0.035 : 0;
  const wobble = inCd ? Math.sin(cdT / 3 + (isA ? 0 : 1.6)) * 1.4 : 0;

  const resT = frame - (q.resultAt - q.from);
  const winnerIsA = q.pctA > 50;
  const isWinner = winnerIsA === isA;
  const res = interpolate(resT, [0, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pct = isA ? q.pctA : 100 - q.pctA;
  const shown = Math.round(pct * res);
  const winGlow = isWinner ? res : 0;
  const loseDim = !isWinner ? res * 0.6 : 0;
  const accent = isA ? q.accentA : q.accentB;
  const frameColor = isWinner && res > 0 ? YELLOW : accent;

  const zoom = 1.1 + frame * 0.0012;
  const dx = Math.sin(frame / 23 + (isA ? 0 : 2)) * 12;
  const dy = Math.cos(frame / 29 + (isA ? 1 : 3)) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: x0,
        top: PANEL_TOP,
        width: PANEL_W,
        transform: `translateX(${slide}px) rotate(${(1 - enter) * (isA ? -10 : 10) + wobble}deg) scale(${1 + winGlow * 0.035 + spot * 0.02 + spotPop + beat - loseDim * 0.06})`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PANEL_W,
          height: PANEL_H,
          borderRadius: 34,
          overflow: "hidden",
          boxShadow: `0 0 0 ${6 + winGlow * 7}px ${frameColor}, 0 0 ${70 * winGlow + 40 * spot}px ${frameColor}`,
        }}
      >
        <Img
          src={staticFile(`wyr/${opt.img}`)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${dx}px, ${dy}px) scale(${zoom})`,
            filter: `brightness(${1 - loseDim + spot * 0.15}) saturate(${1 - loseDim * 0.9})`,
          }}
        />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 62%, rgba(0,0,0,0.8) 100%)" }} />
        {/* shine sweep when the option is said */}
        <div
          style={{
            position: "absolute",
            top: -300,
            left: interpolate(sayT, [0, 14], [-300, 800], clamp),
            width: 120,
            height: 1600,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            transform: "rotate(20deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 22,
            left: isA ? 22 : undefined,
            right: isA ? undefined : 22,
            width: 100,
            height: 100,
            borderRadius: 28,
            background: frameColor,
            color: isWinner && res > 0 ? "#111" : "#fff",
            fontFamily,
            fontWeight: 900,
            fontSize: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + spot * 0.25}) rotate(${isA ? -8 : 8}deg)`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          }}
        >
          {isA ? "A" : "B"}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 14,
            right: 14,
            textAlign: "center",
            fontFamily,
            fontWeight: 900,
            fontSize: opt.label.length > 16 ? 36 : 46,
            lineHeight: 1.1,
            color: "#fff",
            textShadow: "0 4px 16px rgba(0,0,0,0.9)",
            transform: `scale(${1 + spot * 0.08})`,
          }}
        >
          {opt.label}
        </div>
        {/* winner / loser stamp */}
        {res > 0 ? (
          <div
            style={{
              position: "absolute",
              top: 340,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              transform: `scale(${interpolate(resT, [6, 14], [2.4, 1], clamp)}) rotate(${isWinner ? -10 : 10}deg)`,
              opacity: interpolate(resT, [6, 10], [0, 1], clamp),
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 900,
                fontSize: 54,
                color: isWinner ? "#111" : "#fff",
                background: isWinner ? YELLOW : "rgba(0,0,0,0.65)",
                border: isWinner ? "none" : "4px solid rgba(255,255,255,0.6)",
                borderRadius: 18,
                padding: "8px 22px",
              }}
            >
              {isWinner ? "👑 MAYORÍA" : "MINORÍA"}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 20, opacity: Math.min(1, res * 3), textAlign: "center" }}>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1,
            color: isWinner ? YELLOW : "rgba(255,255,255,0.75)",
            textShadow: isWinner ? `0 0 34px ${YELLOW}` : "none",
            transform: `scale(${1 + (isWinner ? Math.max(0, 1 - Math.abs(resT - 26) / 6) * 0.25 : 0)})`,
          }}
        >
          {shown}%
        </div>
        <div style={{ margin: "12px 34px 0", height: 18, borderRadius: 9, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * res}%`, borderRadius: 9, background: isWinner ? YELLOW : "rgba(255,255,255,0.5)" }} />
        </div>
      </div>
    </div>
  );
};

const VsBadge: React.FC<{ q: Q }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 22, fps, config: { damping: 9, stiffness: 160 } });
  const len = q.to - q.from;
  const cdT = frame - (q.cdFrom - q.from);
  const hide = cdT >= -4 && cdT < CD * 30 + 4 ? 0 : 1; // the timer takes its place
  const out = interpolate(frame, [len - 6, len], [1, 0], clamp);
  const pulse = 1 + 0.07 * Math.sin(frame / 3.5);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 88,
        top: PANEL_TOP + PANEL_H / 2 - 88,
        width: 176,
        height: 176,
        borderRadius: "50%",
        background: `conic-gradient(from ${frame * 7}deg, ${q.accentA}, ${YELLOW}, ${q.accentB}, ${q.accentA})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${s * pulse * out * hide}) rotate(${(1 - s) * 360}deg)`,
        boxShadow: "0 0 70px rgba(255,214,10,0.6)",
        zIndex: 5,
      }}
    >
      <div style={{ width: 144, height: 144, borderRadius: "50%", background: "#0b0c15", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 70, color: "#fff", fontStyle: "italic" }}>
        VS
      </div>
    </div>
  );
};

/** 5-second timer between the panels. */
const Countdown: React.FC = () => {
  const frame = useCurrentFrame(); // relative to countdown start
  const { fps } = useVideoConfig();
  const total = CD * fps;
  if (frame < 0 || frame > total + 6) return null;
  const sec = Math.min(CD, Math.max(1, CD - Math.floor(frame / fps)));
  const inSec = (frame % fps) / fps;
  const pop = interpolate(inSec, [0, 0.15], [1.45, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const prog = Math.min(1, frame / total);
  const urgent = sec <= 3;
  const color = urgent ? RED : YELLOW;
  const R = 112;
  const C = 2 * Math.PI * R;
  const enter = spring({ frame, fps, config: { damping: 10 } });
  const out = interpolate(frame, [total, total + 6], [1, 0], clamp);
  return (
    <>
      {/* red pulse at the edges in the last seconds */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(255,40,40,${urgent ? 0.45 * (1 - inSec) : 0}) 100%)`,
          zIndex: 4,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 140,
          top: PANEL_TOP + PANEL_H / 2 - 140,
          width: 280,
          height: 280,
          zIndex: 6,
          transform: `scale(${enter * out})`,
        }}
      >
        <svg width={280} height={280} style={{ position: "absolute", inset: 0 }}>
          <circle cx={140} cy={140} r={132} fill="#0b0c15" stroke={color} strokeWidth={6} />
          <circle
            cx={140}
            cy={140}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * prog}
            transform="rotate(-90 140 140)"
            style={{ filter: `drop-shadow(0 0 14px ${color})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontWeight: 900,
            fontSize: 150,
            color: "#fff",
            transform: `scale(${pop})`,
            textShadow: `0 0 30px ${color}`,
          }}
        >
          {sec}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: PANEL_TOP - 20,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 6,
          transform: `scale(${enter * out * (1 + (urgent ? (1 - inSec) * 0.08 : 0))})`,
        }}
      >
        <span style={{ fontFamily, fontWeight: 900, fontSize: 50, color: "#111", background: color, borderRadius: 999, padding: "8px 28px" }}>
          ⏱️ ¡ELIGE YA!
        </span>
      </div>
    </>
  );
};

/** Big reaction stamp at the reveal + floating emojis + confetti. */
const Reaction: React.FC<{ q: Q }> = ({ q }) => {
  const frame = useCurrentFrame(); // relative to reactAt
  if (frame < 0) return null;
  const s = interpolate(frame, [0, 7], [3.2, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const o = interpolate(frame, [0, 3, 40, 50], [0, 1, 1, 0], clamp);
  const winnerX = q.pctA > 50 ? 270 : 810;
  return (
    <AbsoluteFill style={{ zIndex: 25, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", opacity: o, transform: `scale(${s}) rotate(-5deg)` }}>
        <span style={{ fontFamily, fontWeight: 900, fontSize: 82, color: "#fff", background: RED, borderRadius: 22, padding: "10px 30px", boxShadow: "0 18px 50px rgba(255,59,59,0.5)" }}>
          {q.reaction}
        </span>
      </div>
      {/* confetti from the winner */}
      {new Array(36).fill(0).map((_, i) => {
        const t = frame - (q.resultAt - q.reactAt) - 8;
        if (t < 0) return null;
        const ang = -Math.PI / 2 + (random(`ca${i}`) - 0.5) * 2.2;
        const v = 18 + random(`cv${i}`) * 20;
        const x = winnerX + Math.cos(ang) * v * t;
        const y = 900 + Math.sin(ang) * v * t + 0.9 * t * t;
        const colors = [YELLOW, "#fff", q.accentA, q.accentB, "#ff7ad9"];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 14,
              height: 22,
              background: colors[i % colors.length],
              transform: `rotate(${t * 20 + i * 40}deg)`,
              opacity: interpolate(t, [30, 45], [1, 0], clamp),
            }}
          />
        );
      })}
      {/* floating emojis */}
      {new Array(10).fill(0).map((_, i) => {
        const t = frame - i * 3;
        if (t < 0) return null;
        const x = 80 + random(`ex${i}${q.n}`) * 920;
        const y = 1500 - t * (8 + random(`ev${i}`) * 6);
        return (
          <div key={i} style={{ position: "absolute", left: x + Math.sin(t / 6 + i) * 30, top: y, fontSize: 70 + random(`es${i}`) * 40, opacity: interpolate(t, [0, 6, 50, 70], [0, 1, 1, 0], clamp) }}>
            {q.emojis[i % q.emojis.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Header: React.FC<{ q: Q }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 12, fps, config: { damping: 12 } });
  const len = q.to - q.from;
  const out = interpolate(frame, [len - 6, len], [1, 0], clamp);
  const long = q.title[0].length + q.title[1].length > 20;
  return (
    <div style={{ position: "absolute", top: 205, left: 30, right: 30, textAlign: "center", opacity: out, transform: `translateY(${(1 - s) * -80}px)` }}>
      <div style={{ fontFamily, fontWeight: 900, fontSize: long ? 58 : 88, lineHeight: 1.05, color: "#fff", letterSpacing: -1, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
        <span style={{ color: q.accentA }}>{q.title[0]}</span>
        <span style={{ color: "#fff", fontStyle: "italic" }}> VS </span>
        <span style={{ color: q.accentB }}>{q.title[1]}</span>
      </div>
    </div>
  );
};

/** Top progress: 4 segments, current one filling. */
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const vis = interpolate(frame, [QS[0].from, QS[0].from + 10, OUTRO, OUTRO + 10], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 120, left: 140, right: 140, display: "flex", gap: 12, opacity: vis, zIndex: 8 }}>
      {QS.map((q) => {
        const p = interpolate(frame, [q.from, q.to], [0, 1], clamp);
        const active = frame >= q.from && frame < q.to;
        return (
          <div key={q.n} style={{ flex: 1, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.2)", overflow: "hidden", boxShadow: active ? `0 0 16px ${YELLOW}` : "none" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: YELLOW }} />
          </div>
        );
      })}
    </div>
  );
};

/** Fast transition at each question start: flash + light streaks. */
const Transition: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -4 || t > 10) return null;
  const flash = interpolate(t, [-4, 0, 8], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      {new Array(16).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540,
            top: 960,
            width: 1400,
            height: 12,
            transformOrigin: "0 50%",
            transform: `rotate(${(i / 16) * 360 + t * 4}deg) translateX(${120 + t * 70}px)`,
            background: `linear-gradient(90deg, transparent, ${YELLOW})`,
            opacity: flash,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10 } });
  const chips = ["0/4", "1/4", "2/4", "3/4", "4/4"];
  const bob = Math.sin(frame / 4) * 14;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${s})` }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 110, color: "#fff", lineHeight: 1 }}>¿CUÁNTAS</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 110, color: YELLOW, lineHeight: 1 }}>HAS ACERTADO?</div>
      </div>
      <div style={{ marginTop: 50, display: "flex", gap: 16 }}>
        {chips.map((c, i) => {
          const cs = spring({ frame: frame - 10 - i * 4, fps, config: { damping: 8 } });
          return (
            <div key={c} style={{ fontFamily, fontWeight: 900, fontSize: 52, color: i === 4 ? "#111" : "#fff", background: i === 4 ? YELLOW : "rgba(255,255,255,0.14)", border: "3px solid rgba(255,255,255,0.4)", borderRadius: 20, padding: "14px 18px", transform: `scale(${cs}) rotate(${(i - 2) * 4}deg)` }}>
              {c}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 50, fontFamily, fontWeight: 800, fontSize: 54, color: "#fff", transform: `translateY(${bob}px)` }}>👇 COMENTA TU PUNTUACIÓN 👇</div>
      <div
        style={{
          marginTop: 40,
          fontFamily,
          fontWeight: 900,
          fontSize: 50,
          color: "#fff",
          background: RED,
          borderRadius: 999,
          padding: "10px 34px",
          transform: `scale(${spring({ frame: frame - 40, fps, config: { damping: 8 } })})`,
        }}
      >
        PARTE 2 🔜 SÍGUEME
      </div>
    </AbsoluteFill>
  );
};

/** Karaoke subtitles: current phrase, spoken word in yellow. */
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const seg = [...SEGS].reverse().find((s) => frame >= s.from - 2);
  if (!seg || frame > seg.to + 8) return null;
  const words = seg.text.split(" ");
  const p = interpolate(frame, [seg.from, seg.to], [0, words.length], clamp);
  const pop = interpolate(frame, [seg.from - 2, seg.from + 3], [0.75, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", top: 1590, left: 50, right: 50, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", transform: `scale(${pop})`, zIndex: 50 }}>
      {words.map((w, i) => {
        const active = p >= i && p < i + 1.2;
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: words.length > 6 ? 56 : 66,
              color: active ? YELLOW : "#fff",
              opacity: p >= i ? 1 : 0.45,
              WebkitTextStroke: "12px #000",
              paintOrder: "stroke fill",
              display: "inline-block",
              transform: `translateY(${active ? -6 : 0}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Presenter chip: live waveform driven by the narration chunks. */
const Wave: React.FC<{ file: string }> = ({ file }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(`wyr/${file}`));
  if (!audio) return null;
  const bars = visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 16, smoothing: true });
  return (
    <div style={{ position: "absolute", top: 1790, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, zIndex: 50 }}>
      <div style={{ fontSize: 44 }}>🎙️</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 70 }}>
        {bars.slice(0, 14).map((v, i) => (
          <div key={i} style={{ width: 9, height: 8 + Math.min(62, v * 600), borderRadius: 5, background: YELLOW }} />
        ))}
      </div>
    </div>
  );
};

/* ---------- sound design ---------- */

const S: React.FC<{ at: number; file: string; vol?: number }> = ({ at, file, vol = 0.4 }) => (
  <Sequence from={Math.max(0, at)}>
    <Audio src={staticFile(`wyr/sfx/${file}`)} volume={vol} />
  </Sequence>
);

const SoundDesign: React.FC = () => {
  const out: React.ReactNode[] = [];
  let k = 0;
  const add = (at: number, file: string, vol?: number) => out.push(<S key={k++} at={at} file={file} vol={vol} />);
  // hook
  add(0, "boom.wav", 0.45);
  add(30, "boom.wav", 0.35);
  HOOK_THUMBS.forEach((_, i) => add(6 + i * 4, "pop.wav", 0.25));
  add(f(4.42), "sparkle.wav", 0.2);
  add(QS[0].from - 45, "riser.wav", 0.35);
  QS.forEach((q) => {
    add(q.from - 2, "zap.wav", 0.35);
    add(q.from, "boom.wav", 0.45);
    add(q.from + 14, "whoosh.wav", 0.35);
    add(q.from + 22, "pop.wav", 0.3);
    add(q.a.at, "pop.wav", 0.4);
    add(q.b.at, "pop.wav", 0.4);
    // countdown
    for (let i = 0; i < CD * 2; i++) add(q.cdFrom + i * 15, i % 2 ? "tock.wav" : "tick.wav", 0.35);
    for (let s = 0; s < CD; s++) add(q.cdFrom + s * 30, "heart.wav", 0.5);
    for (let s = 2; s < CD; s++) add(q.cdFrom + s * 30, "beep.wav", 0.35);
    add(q.cdFrom + CD * 30 - 36, "redoble.wav", 0.35);
    add(q.cdFrom + CD * 30, "beepfin.wav", 0.4);
    // reveal
    add(q.reactAt, "boom.wav", 0.5);
    add(q.reactAt, "ding.wav", 0.35);
    add(q.resultAt, "whoosh.wav", 0.3);
    add(q.resultAt + 26, "ding.wav", 0.4);
    add(q.resultAt + 26, "sparkle.wav", 0.3);
    add(q.to - 8, "whoosh.wav", 0.35);
  });
  add(OUTRO, "boom.wav", 0.45);
  add(OUTRO + 10, "sparkle.wav", 0.3);
  [0, 1, 2, 3, 4].forEach((i) => add(OUTRO + 10 + i * 4, "pop.wav", 0.25));
  add(OUTRO + 40, "ding.wav", 0.3);
  return <>{out}</>;
};

export const QuePrefieres: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0b0c15" }}>
      <Bg />
      <Sequence durationInFrames={QS[0].from + 2}>
        <Hook />
      </Sequence>
      {QS.map((q) => (
        <Sequence key={q.n} from={q.from} durationInFrames={q.to - q.from}>
          <Header q={q} />
          <Panel q={q} side="a" />
          <Panel q={q} side="b" />
          <VsBadge q={q} />
          <Sequence from={q.cdFrom - q.from}>
            <Countdown />
          </Sequence>
          <Sequence from={q.reactAt - q.from}>
            <Reaction q={q} />
          </Sequence>
          <QuestionCard q={q} />
        </Sequence>
      ))}
      <Sequence from={OUTRO}>
        <Outro />
      </Sequence>
      {QS.map((q) => (
        <Transition key={q.n} at={q.from} />
      ))}
      <Transition at={OUTRO} />
      <Progress />
      <Subtitles />
      {CHUNKS.map((c) => (
        <Sequence key={c.file} from={f(c.at)}>
          <Audio src={staticFile(`wyr/${c.file}`)} />
          <Wave file={c.file} />
        </Sequence>
      ))}
      <SoundDesign />
    </AbsoluteFill>
  );
};
