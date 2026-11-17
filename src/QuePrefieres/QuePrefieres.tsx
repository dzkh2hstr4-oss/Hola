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

export const QP_DURATION = 920;

/* ---------- script, timed to public/wyr/voz.mp3 ---------- */

type Seg = { from: number; to: number; text: string };
const SEGS: Seg[] = [
  [0, 1.3, "¡Cuatro preguntas imposibles!"],
  [1.46, 2.47, "¿Qué prefieres?"],
  [2.7, 3.57, "Primera:"],
  [3.77, 4.21, "¿que tu casa"],
  [4.39, 5.56, "se inunde…"],
  [5.75, 6.49, "o que se queme?"],
  [6.64, 8.83, "¡El 62 % elige agua!"],
  [9.0, 9.62, "Segunda:"],
  [9.79, 10.73, "¿vivir sin móvil…"],
  [10.92, 11.97, "o sin videojuegos?"],
  [12.14, 13.73, "Aquí gana sin videojuegos,"],
  [13.9, 15.66, "con un 58 %."],
  [15.84, 16.32, "Tercera:"],
  [16.49, 17.37, "¿leer mentes…"],
  [17.53, 18.45, "o ser invisible?"],
  [18.61, 21.02, "¡El 71 % quiere leer mentes!"],
  [21.15, 21.87, "Y la última:"],
  [22.02, 23.39, "¿10.000 € ahora…"],
  [23.53, 25.57, "o 100.000 dentro de diez años?"],
  [25.73, 27.94, "¡El 55 % prefiere esperar!"],
  [28.12, 29.2, "¿Y tú qué elegirías?"],
  [29.39, 30.47, "¡Te leo en comentarios!"],
].map(([a, b, t]) => ({ from: f(a as number), to: f(b as number), text: t as string }));

type Q = {
  n: number;
  from: number;
  to: number;
  title: [string, string];
  a: { img: string; label: string; at: number };
  b: { img: string; label: string; at: number };
  resultAt: number;
  pctA: number;
  accentA: string;
  accentB: string;
};

const QS: Q[] = [
  {
    n: 1, from: f(2.7), to: f(9.0), title: ["AGUA", "FUEGO"],
    a: { img: "a1.png", label: "SE INUNDA 🌊", at: f(3.77) },
    b: { img: "b1.png", label: "SE QUEMA 🔥", at: f(5.75) },
    resultAt: f(6.64), pctA: 62, accentA: BLUE, accentB: RED,
  },
  {
    n: 2, from: f(9.0), to: f(15.84), title: ["SIN MÓVIL", "SIN VIDEOJUEGOS"],
    a: { img: "a2.png", label: "SIN MÓVIL 📵", at: f(9.79) },
    b: { img: "b2.png", label: "SIN VIDEOJUEGOS 🎮", at: f(10.92) },
    resultAt: f(12.14), pctA: 42, accentA: "#00C2A8", accentB: "#B44CFF",
  },
  {
    n: 3, from: f(15.84), to: f(21.15), title: ["LEER MENTES", "INVISIBILIDAD"],
    a: { img: "a3.png", label: "LEER MENTES 🧠", at: f(16.49) },
    b: { img: "b3.png", label: "INVISIBLE 👻", at: f(17.53) },
    resultAt: f(18.61), pctA: 71, accentA: "#FF4FA3", accentB: "#4FC3FF",
  },
  {
    n: 4, from: f(21.15), to: f(28.12), title: ["10.000 € AHORA", "100.000 € DESPUÉS"],
    a: { img: "a4.png", label: "10.000 € YA 💶", at: f(22.02) },
    b: { img: "b4.png", label: "100.000 € EN 10 AÑOS ⏳", at: f(23.53) },
    resultAt: f(25.73), pctA: 45, accentA: "#2ECC71", accentB: "#F5A623",
  },
];

/* ---------- pieces ---------- */

const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% ${40 + Math.sin(frame / 40) * 6}%, #23253a 0%, #0c0d16 70%)`,
      }}
    >
      {new Array(26).fill(0).map((_, i) => {
        const y = ((random(`py${i}`) * 1920 - frame * (0.6 + random(`ps${i}`))) % 1920 + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`px${i}`) * 1080,
              top: y,
              width: 4,
              height: 4,
              borderRadius: 2,
              background: "#fff",
              opacity: 0.15,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const PANEL_TOP = 470;
const PANEL_H = 900;
const PANEL_W = 530;

const Panel: React.FC<{
  q: Q;
  side: "a" | "b";
}> = ({ q, side }) => {
  const frame = useCurrentFrame(); // relative to question start
  const { fps } = useVideoConfig();
  const opt = q[side];
  const isA = side === "a";
  const local = frame;
  const enter = spring({ frame: local - (isA ? 0 : 3), fps, config: { damping: 14, stiffness: 140 } });
  const exitT = interpolate(local, [q.to - q.from - 6, q.to - q.from], [0, 1], clamp);
  const x0 = isA ? 0 : 1080 - PANEL_W;
  const slide = (1 - enter) * (isA ? -700 : 700) + exitT * (isA ? -900 : 900);

  // spotlight when narrator says this option
  const sayT = local - (opt.at - q.from);
  const spot = interpolate(sayT, [0, 6, 30], [0, 1, 0.35], clamp);
  // result
  const resT = local - (q.resultAt - q.from);
  const winnerIsA = q.pctA > 50;
  const isWinner = winnerIsA === isA;
  const res = interpolate(resT, [0, 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pct = isA ? q.pctA : 100 - q.pctA;
  const shown = Math.round(pct * res);

  // ken burns + handheld drift
  const zoom = 1.08 + local * 0.0016;
  const dx = Math.sin(local / 23 + (isA ? 0 : 2)) * 10;
  const dy = Math.cos(local / 29 + (isA ? 1 : 3)) * 8;

  const winGlow = isWinner ? res : 0;
  const loseDim = !isWinner ? res * 0.55 : 0;
  const accent = isA ? q.accentA : q.accentB;

  return (
    <div
      style={{
        position: "absolute",
        left: x0,
        top: PANEL_TOP,
        width: PANEL_W,
        height: PANEL_H + 170,
        transform: `translateX(${slide}px) rotate(${(1 - enter) * (isA ? -6 : 6)}deg) scale(${1 + winGlow * 0.03 + spot * 0.015})`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PANEL_W,
          height: PANEL_H,
          borderRadius: 34,
          overflow: "hidden",
          boxShadow: `0 0 0 ${6 + winGlow * 6}px ${isWinner && res > 0 ? YELLOW : accent}, 0 0 ${60 * winGlow + 30 * spot}px ${isWinner ? YELLOW : accent}`,
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
            filter: `brightness(${1 - loseDim + spot * 0.12}) saturate(${1 - loseDim * 0.8})`,
          }}
        />
        <AbsoluteFill
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.75) 100%)" }}
        />
        {/* A / B tag */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: isA ? 22 : undefined,
            right: isA ? undefined : 22,
            width: 96,
            height: 96,
            borderRadius: 26,
            background: isWinner && res > 0 ? YELLOW : accent,
            color: isWinner && res > 0 ? "#111" : "#fff",
            fontFamily,
            fontWeight: 900,
            fontSize: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + spot * 0.2}) rotate(${isA ? -6 : 6}deg)`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {isA ? "A" : "B"}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: 16,
            right: 16,
            textAlign: "center",
            fontFamily,
            fontWeight: 900,
            fontSize: opt.label.length > 16 ? 36 : 44,
            lineHeight: 1.1,
            color: "#fff",
            textShadow: "0 4px 16px rgba(0,0,0,0.8)",
          }}
        >
          {opt.label}
        </div>
        {isWinner && res > 0.6 ? (
          <div
            style={{
              position: "absolute",
              top: 30,
              left: isA ? undefined : 30,
              right: isA ? 30 : undefined,
              fontSize: 80,
              transform: `scale(${spring({ frame: resT - 14, fps, config: { damping: 8 } })}) rotate(${isA ? 12 : -12}deg)`,
            }}
          >
            👑
          </div>
        ) : null}
      </div>
      {/* percentage under the option */}
      <div style={{ marginTop: 22, opacity: Math.min(1, res * 3), textAlign: "center" }}>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 1,
            color: isWinner ? YELLOW : "rgba(255,255,255,0.75)",
            textShadow: isWinner ? `0 0 30px ${YELLOW}` : "none",
          }}
        >
          {shown}%
        </div>
        <div style={{ margin: "12px 30px 0", height: 16, borderRadius: 8, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * res}%`, borderRadius: 8, background: isWinner ? YELLOW : "rgba(255,255,255,0.5)" }} />
        </div>
      </div>
    </div>
  );
};

const VsBadge: React.FC<{ q: Q }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 8, fps, config: { damping: 9, stiffness: 160 } });
  const out = interpolate(frame, [q.to - q.from - 6, q.to - q.from], [1, 0], clamp);
  const pulse = 1 + 0.06 * Math.sin(frame / 4);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 85,
        top: PANEL_TOP + PANEL_H / 2 - 85,
        width: 170,
        height: 170,
        borderRadius: "50%",
        background: `conic-gradient(from ${frame * 6}deg, ${q.accentA}, ${YELLOW}, ${q.accentB}, ${q.accentA})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${s * pulse * out}) rotate(${(1 - s) * 360}deg)`,
        boxShadow: "0 0 60px rgba(255,214,10,0.6)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "#0c0d16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 68,
          color: "#fff",
          fontStyle: "italic",
        }}
      >
        VS
      </div>
    </div>
  );
};

const Header: React.FC<{ q: Q }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13 } });
  const out = interpolate(frame, [q.to - q.from - 6, q.to - q.from], [1, 0], clamp);
  const long = q.title[0].length + q.title[1].length > 20;
  return (
    <div style={{ position: "absolute", top: 150, left: 30, right: 30, textAlign: "center", opacity: out }}>
      <div
        style={{
          display: "inline-block",
          fontFamily,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 4,
          color: "#111",
          background: YELLOW,
          borderRadius: 999,
          padding: "6px 24px",
          transform: `scale(${s})`,
        }}
      >
        PREGUNTA {q.n}/4
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily,
          fontWeight: 900,
          fontSize: long ? 58 : 84,
          lineHeight: 1.05,
          color: "#fff",
          letterSpacing: -1,
          transform: `translateY(${(1 - s) * -60}px)`,
          textShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        <span style={{ color: q.accentA }}>{q.title[0]}</span>
        <span style={{ color: "#fff" }}> VS </span>
        <span style={{ color: q.accentB }}>{q.title[1]}</span>
      </div>
    </div>
  );
};

/** Fast, loud transition at each question start: flash + zoom streaks. */
const Transition: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -4 || t > 10) return null;
  const flash = interpolate(t, [-4, 0, 8], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 20 }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      {new Array(14).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540,
            top: 960,
            width: 1400,
            height: 10,
            transformOrigin: "0 50%",
            transform: `rotate(${(i / 14) * 360 + t * 3}deg) translateX(${120 + t * 60}px)`,
            background: `linear-gradient(90deg, transparent, ${YELLOW})`,
            opacity: flash,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const split = spring({ frame, fps, config: { damping: 15 } });
  const t1 = spring({ frame: frame - 4, fps, config: { damping: 10 } });
  const t2 = spring({ frame: frame - 44, fps, config: { damping: 8, stiffness: 180 } });
  const shake = frame >= 44 && frame < 54 ? (54 - frame) * 2.5 : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, background: `linear-gradient(160deg, ${BLUE}, #0a1a5c)`, transform: `translateX(${(1 - split) * -540}px)` }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: 540, height: 1920, background: `linear-gradient(200deg, ${RED}, #5c0a0a)`, transform: `translateX(${(1 - split) * 540}px)` }} />
      <div style={{ position: "absolute", left: 540 - 6, top: 0, width: 12, height: 1920, background: YELLOW, transform: `scaleY(${split})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", transform: `translate(${Math.sin(frame * 9) * shake}px, ${Math.cos(frame * 7) * shake}px)` }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 56, color: "#fff", letterSpacing: 3, opacity: t1, transform: `translateY(${(1 - t1) * 40}px)` }}>
          4 PREGUNTAS IMPOSIBLES
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily,
            fontWeight: 900,
            fontSize: 136,
            lineHeight: 0.95,
            color: YELLOW,
            letterSpacing: -4,
            transform: `scale(${t2}) rotate(${(1 - t2) * -10}deg)`,
            textShadow: "0 14px 0 rgba(0,0,0,0.35)",
          }}
        >
          ¿QUÉ
          <br />
          PREFIERES?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 9 } });
  const bob = Math.sin(frame / 4) * 14;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${s})` }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 120, color: "#fff", lineHeight: 1 }}>¿Y TÚ</div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 120, color: YELLOW, lineHeight: 1 }}>QUÉ ELIGES?</div>
      </div>
      <div style={{ marginTop: 50, display: "flex", gap: 30, transform: `scale(${s2})` }}>
        {["A", "B"].map((l, i) => (
          <div key={l} style={{ width: 170, height: 170, borderRadius: 40, background: i ? RED : BLUE, color: "#fff", fontFamily, fontWeight: 900, fontSize: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 50, fontFamily, fontWeight: 800, fontSize: 56, color: "#fff", transform: `translateY(${bob}px)`, opacity: s2 }}>
        👇 COMENTA 👇
      </div>
    </AbsoluteFill>
  );
};

/** Karaoke-style subtitles: current phrase, word being spoken in yellow. */
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const seg = [...SEGS].reverse().find((s) => frame >= s.from - 2);
  if (!seg || frame > seg.to + 8) return null;
  const words = seg.text.split(" ");
  const p = interpolate(frame, [seg.from, seg.to], [0, words.length], clamp);
  const pop = interpolate(frame, [seg.from - 2, seg.from + 3], [0.8, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 1600,
        left: 60,
        right: 60,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 16px",
        transform: `scale(${pop})`,
        zIndex: 10,
      }}
    >
      {words.map((w, i) => {
        const active = p >= i && p < i + 1.2;
        const done = p >= i;
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: 66,
              color: active ? YELLOW : "#fff",
              opacity: done ? 1 : 0.45,
              WebkitTextStroke: "12px #000",
              paintOrder: "stroke fill",
              display: "inline-block",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Presenter: mic chip with a live waveform driven by the narration. */
const Presenter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile("wyr/voz.mp3"));
  const bars = audio
    ? visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 16, smoothing: true })
    : new Array(16).fill(0);
  return (
    <div
      style={{
        position: "absolute",
        top: 1770,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 44 }}>🎙️</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 60 }}>
        {bars.slice(0, 14).map((v, i) => (
          <div key={i} style={{ width: 8, height: 8 + Math.min(52, v * 520), borderRadius: 4, background: YELLOW }} />
        ))}
      </div>
    </div>
  );
};

export const QuePrefieres: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0c0d16" }}>
      <Bg />
      <Sequence durationInFrames={QS[0].from + 4}>
        <Intro />
      </Sequence>
      {QS.map((q) => (
        <Sequence key={q.n} from={q.from} durationInFrames={q.to - q.from}>
          <Header q={q} />
          <Panel q={q} side="a" />
          <Panel q={q} side="b" />
          <VsBadge q={q} />
        </Sequence>
      ))}
      <Sequence from={QS[3].to}>
        <Outro />
      </Sequence>
      {QS.map((q) => (
        <Transition key={q.n} at={q.from} />
      ))}
      <Transition at={QS[3].to} />
      <Subtitles />
      <Presenter />
      <Audio src={staticFile("wyr/voz.mp3")} />
    </AbsoluteFill>
  );
};
