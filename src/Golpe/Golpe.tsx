import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Bebas", url: staticFile("fonts/bebas.woff2") });
loadFont({ family: "Mont", url: staticFile("fonts/montserrat-800.woff2"), weight: "800" });

export const G_W = 1920;
export const G_H = 1080;
export const G_FPS = 30;
const GROUND = 900;

// ---------------------------------------------------------------- personajes
type Kit = "blanca" | "rayas" | "villano";
type Hair = "slick" | "short" | "mohawk" | "long" | "buzz" | "hat";
type Who = "cr7" | "messi" | "ney" | "benz" | "ramos" | "villa";
type Mood = "smile" | "shock" | "angry" | "calm" | "sad";

const CAST: Record<Who, { name: string; kit: Kit; num: string; skin: string; hair: Hair; hairC: string; beard?: string; s: number; shades?: boolean; chains?: boolean; color: string }> = {
  cr7: { name: "CR7", kit: "blanca", num: "7", skin: "#c99068", hair: "slick", hairC: "#1d1410", s: 1.08, color: "#e8b400" },
  messi: { name: "MESSI", kit: "rayas", num: "10", skin: "#e2b38c", hair: "short", hairC: "#5a3a22", beard: "#5a3a22", s: 0.9, color: "#3b6fe0" },
  ney: { name: "NEYMAR", kit: "rayas", num: "11", skin: "#b9855c", hair: "mohawk", hairC: "#f2d36b", s: 1, chains: true, color: "#22b14c" },
  benz: { name: "BENZEMA", kit: "blanca", num: "9", skin: "#8d5c3c", hair: "buzz", hairC: "#15100c", beard: "#15100c", s: 1.04, shades: true, color: "#9b59b6" },
  ramos: { name: "RAMOS", kit: "blanca", num: "4", skin: "#d6a078", hair: "long", hairC: "#2b1d14", beard: "#2b1d14", s: 1.05, color: "#e74c3c" },
  villa: { name: "EL COLECCIONISTA", kit: "villano", num: "", skin: "#e9d2c0", hair: "hat", hairC: "#14081f", s: 1.1, color: "#8e44ad" },
};

const Person: React.FC<{ who: Who; f: number; walking?: boolean; mood?: Mood; flip?: boolean; armsUp?: boolean; hold?: React.ReactNode }> = ({ who, f, walking, mood = "smile", flip, armsUp, hold }) => {
  const c = CAST[who];
  const sw = walking ? Math.sin(f * 0.5) * 22 : 0;
  const bob = walking ? Math.abs(Math.sin(f * 0.5)) * -6 : Math.sin(f * 0.08) * 2;
  const shirt = c.kit === "blanca" ? "#f7f7f7" : c.kit === "rayas" ? "url(#rayas)" : "#5b2a86";
  const shorts = c.kit === "blanca" ? "#f2f2f2" : c.kit === "rayas" ? "#1d3f8f" : "#2a1240";
  const socks = c.kit === "blanca" ? "#ffffff" : c.kit === "rayas" ? "#1d3f8f" : "#111";
  const arm = armsUp ? -140 : walking ? -sw : 8;
  const mouth = {
    smile: <path d="M-14 22 Q0 36 14 22" stroke="#3a1a10" strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={28} rx={9} ry={13} fill="#3a1a10" />,
    angry: <path d="M-14 30 Q0 18 14 30" stroke="#3a1a10" strokeWidth={5} fill="none" strokeLinecap="round" />,
    calm: <line x1={-10} y1={26} x2={10} y2={26} stroke="#3a1a10" strokeWidth={5} strokeLinecap="round" />,
    sad: <path d="M-12 32 Q0 22 12 32" stroke="#3a1a10" strokeWidth={4} fill="none" strokeLinecap="round" />,
  }[mood];
  return (
    <svg width={260} height={420} viewBox="-130 -390 260 420" style={{ overflow: "visible", transform: `scale(${c.s * (flip ? -1 : 1)},${c.s})`, transformOrigin: "50% 92%" }}>
      <defs>
        <pattern id="rayas" width="28" height="10" patternUnits="userSpaceOnUse">
          <rect width="14" height="10" fill="#1d3f8f" />
          <rect x="14" width="14" height="10" fill="#8a1538" />
        </pattern>
      </defs>
      <ellipse cx={0} cy={22} rx={70} ry={12} fill="rgba(0,0,0,0.25)" />
      <g transform={`translate(0 ${bob})`}>
        {/* piernas */}
        {[-1, 1].map((k) => (
          <g key={k} transform={`rotate(${k * sw} ${k * 20} -120)`}>
            <rect x={k * 20 - 13} y={-120} width={26} height={110} rx={12} fill={c.kit === "villano" ? "#1a0b29" : c.skin} />
            <rect x={k * 20 - 14} y={-70} width={28} height={62} rx={10} fill={socks} />
            <ellipse cx={k * 20 + 6} cy={-6} rx={22} ry={12} fill={c.kit === "villano" ? "#000" : "#111"} />
          </g>
        ))}
        {/* pantalón */}
        <rect x={-48} y={-150} width={96} height={52} rx={14} fill={shorts} />
        {/* brazos */}
        {[-1, 1].map((k) => (
          <g key={k} transform={`rotate(${k * arm} ${k * 52} -255)`}>
            <rect x={k * 52 - 14} y={-262} width={28} height={110} rx={14} fill={c.kit === "villano" ? "#5b2a86" : c.skin} />
            <rect x={k * 52 - 16} y={-262} width={32} height={44} rx={14} fill={shirt} />
            <circle cx={k * 52} cy={-150} r={15} fill={c.kit === "villano" ? "#fff" : c.skin} />
          </g>
        ))}
        {/* torso */}
        <path d="M-58 -270 Q0 -290 58 -270 L52 -140 L-52 -140 Z" fill={shirt} stroke="rgba(0,0,0,0.15)" strokeWidth={3} />
        {c.kit === "villano" && <path d="M-58 -270 L-62 -60 L-30 -70 L-20 -140 Z M58 -270 L62 -60 L30 -70 L20 -140 Z" fill="#4a1f70" />}
        {c.num && (
          <text x={0} y={-178} transform={flip ? "scale(-1,1)" : undefined} textAnchor="middle" fontFamily="Bebas" fontSize={68} fill={c.kit === "blanca" ? "#c9a227" : "#f5d76e"} stroke="rgba(0,0,0,0.35)" strokeWidth={2}>
            {c.num}
          </text>
        )}
        {c.chains && <path d="M-30 -268 Q0 -215 30 -268" stroke="#f1c40f" strokeWidth={6} fill="none" />}
        {/* cabeza (grande, caricatura) */}
        <g transform="translate(0 -345)">
          <rect x={-16} y={40} width={32} height={40} fill={c.skin} />
          <ellipse cx={0} cy={0} rx={62} ry={70} fill={c.skin} />
          <ellipse cx={-62} cy={6} rx={10} ry={16} fill={c.skin} />
          <ellipse cx={62} cy={6} rx={10} ry={16} fill={c.skin} />
          {c.beard && <path d="M-60 0 Q-58 72 0 76 Q58 72 60 0 Q40 46 0 44 Q-40 46 -60 0 Z" fill={c.beard} />}
          {c.hair === "slick" && <path d="M-62 -18 Q-60 -78 0 -80 Q64 -80 64 -20 Q40 -52 -10 -50 Q-40 -48 -62 -18Z" fill={c.hairC} />}
          {c.hair === "short" && <path d="M-62 -14 Q-56 -76 0 -76 Q58 -76 62 -14 Q30 -40 0 -44 Q-36 -42 -62 -14Z" fill={c.hairC} />}
          {c.hair === "buzz" && <path d="M-60 -24 Q-50 -72 0 -72 Q50 -72 60 -24 Q0 -50 -60 -24Z" fill={c.hairC} />}
          {c.hair === "mohawk" && (
            <>
              <path d="M-60 -20 Q-56 -60 0 -66 Q56 -60 60 -20 Q0 -40 -60 -20Z" fill="#2b1a10" />
              <path d="M-24 -50 Q-10 -120 0 -118 Q14 -120 24 -50 Z" fill={c.hairC} />
            </>
          )}
          {c.hair === "long" && <path d="M-66 30 Q-74 -80 0 -80 Q74 -80 66 30 Q60 -40 0 -46 Q-60 -40 -66 30Z" fill={c.hairC} />}
          {c.hair === "hat" && (
            <>
              <rect x={-80} y={-70} width={160} height={14} rx={6} fill={c.hairC} />
              <rect x={-48} y={-150} width={96} height={86} rx={8} fill={c.hairC} />
              <rect x={-48} y={-86} width={96} height={12} fill="#8e44ad" />
            </>
          )}
          {/* ojos */}
          {c.shades ? (
            <g>
              <rect x={-46} y={-14} width={38} height={22} rx={8} fill="#111" />
              <rect x={8} y={-14} width={38} height={22} rx={8} fill="#111" />
              <line x1={-8} y1={-6} x2={8} y2={-6} stroke="#111" strokeWidth={5} />
            </g>
          ) : (
            [-1, 1].map((k) => (
              <g key={k}>
                <ellipse cx={k * 22} cy={-4} rx={mood === "shock" ? 13 : 11} ry={mood === "shock" ? 16 : 13} fill="#fff" />
                <circle cx={k * 22 + 2} cy={-2} r={6} fill="#2a1a10" />
                <path d={mood === "angry" ? `M${k * 36} -26 L${k * 8} -18` : `M${k * 34} -24 Q${k * 22} -32 ${k * 10} -24`} stroke={c.hairC === "#f2d36b" ? "#2b1a10" : c.hairC} strokeWidth={6} fill="none" strokeLinecap="round" />
              </g>
            ))
          )}
          {who === "villa" && <circle cx={22} cy={-4} r={18} fill="none" stroke="#f1c40f" strokeWidth={5} />}
          {who === "villa" && <path d="M-26 14 Q-14 4 0 12 Q14 4 26 14" stroke="#14081f" strokeWidth={6} fill="none" />}
          <ellipse cx={0} cy={10} rx={8} ry={10} fill="rgba(0,0,0,0.12)" />
          <g transform={`translate(0 ${c.beard ? 4 : 0})`}>{mouth}</g>
        </g>
        {hold && <g transform="translate(80 -170)">{hold}</g>}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- objetos
const Ball: React.FC<{ r?: number; bitten?: boolean; choc?: boolean }> = ({ r = 34, bitten, choc }) => (
  <svg width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`} style={{ overflow: "visible" }}>
    <defs>
      <radialGradient id={`gb${r}${choc ? "c" : ""}`} cx="35%" cy="30%">
        <stop offset="0%" stopColor={choc ? "#c08a5a" : "#fff6b0"} />
        <stop offset="60%" stopColor={choc ? "#7a4a25" : "#f1c40f"} />
        <stop offset="100%" stopColor={choc ? "#4a2a12" : "#b7860b"} />
      </radialGradient>
    </defs>
    <circle r={r} fill={`url(#gb${r}${choc ? "c" : ""})`} />
    <polygon points={[0, 1, 2, 3, 4].map((i) => `${Math.cos((i * 72 - 90) * Math.PI / 180) * r * 0.35},${Math.sin((i * 72 - 90) * Math.PI / 180) * r * 0.35}`).join(" ")} fill="rgba(0,0,0,0.18)" />
    {bitten && <circle cx={r * 0.85} cy={-r * 0.5} r={r * 0.45} fill="#1b1030" />}
  </svg>
);

const Trophy: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={60 * s} height={80 * s} viewBox="0 0 60 80">
    <path d="M10 4 H50 Q50 40 30 44 Q10 40 10 4Z" fill="#f1c40f" />
    <rect x={26} y={44} width={8} height={16} fill="#d4a20b" />
    <rect x={14} y={60} width={32} height={10} rx={2} fill="#7a5a10" />
  </svg>
);

// ---------------------------------------------------------------- fondos
const Bg: React.FC<{ kind: string; f: number }> = ({ kind, f }) => {
  const sky = (a: string, b: string) => ({ background: `linear-gradient(180deg, ${a}, ${b})` });
  const floor = (c: string) => <div style={{ position: "absolute", left: 0, right: 0, top: GROUND, bottom: 0, background: c }} />;
  const city = (dark: boolean, speed = 0) => (
    <>
      {new Array(16).fill(0).map((_, i) => {
        const w = 120 + random(`bw${i}`) * 120;
        const h = 250 + random(`bh${i}`) * 380;
        const x = (((i * 130 - f * speed) % 2200) + 2200) % 2200 - 140;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: GROUND - h, width: w, height: h, background: dark ? "#141a33" : i % 2 ? "#e7c9a0" : "#d9b183", borderRadius: "6px 6px 0 0" }}>
            {new Array(Math.floor(h / 70)).fill(0).map((__, j) => (
              <div key={j} style={{ position: "absolute", left: 18, right: 18, top: 24 + j * 70, height: 30, background: dark ? (random(`l${i}${j}`) > 0.5 ? "#f7d774" : "#22294a") : "#7fb2d8", borderRadius: 4 }} />
            ))}
          </div>
        );
      })}
    </>
  );
  switch (kind) {
    case "mansion-noche":
    case "mansion-dia": {
      const night = kind === "mansion-noche";
      return (
        <AbsoluteFill style={sky(night ? "#0d1030" : "#f5efe4", night ? "#25265a" : "#e9dcc6")}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 160 + i * 580, top: 120, width: 360, height: 420, border: "14px solid #b88a3a", background: night ? "#0a0f2a" : "#bfe3f5" }}>
              {night && <div style={{ position: "absolute", right: 40, top: 40, width: 60, height: 60, borderRadius: 30, background: "#f4f1c9", boxShadow: "0 0 40px #f4f1c9" }} />}
            </div>
          ))}
          {floor(night ? "#2a2140" : "#c9a77c")}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: 300 + i * 300, top: GROUND - 120, width: 90, height: 120, background: night ? "#3a3060" : "#efe6d4", borderRadius: 6, border: "4px solid #b88a3a" }} />
          ))}
        </AbsoluteFill>
      );
    }
    case "salon":
      return (
        <AbsoluteFill style={sky("#f3d9b1", "#e6c08f")}>
          <div style={{ position: "absolute", left: 1120, top: 140, width: 640, height: 420, background: "#8a5a32", borderRadius: 10 }}>
            {[0, 1].map((r) => <div key={r} style={{ position: "absolute", left: 0, right: 0, top: 120 + r * 170, height: 18, background: "#5e3a1d" }} />)}
          </div>
          {floor("#a3714a")}
          <div style={{ position: "absolute", left: 180, top: GROUND - 160, width: 560, height: 160, background: "#c0392b", borderRadius: "40px 40px 10px 10px" }} />
        </AbsoluteFill>
      );
    case "carretera":
      return (
        <AbsoluteFill style={sky("#ff9a5a", "#ffd18a")}>
          <div style={{ position: "absolute", left: 760, top: 300, width: 400, height: 400, borderRadius: 200, background: "#fff1b8" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, height: 220, background: "#2f80c9" }} />
          {floor("#3a3a3a")}
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} style={{ position: "absolute", top: GROUND + 80, left: (((i * 260 - f * 40) % 2600) + 2600) % 2600 - 200, width: 140, height: 16, background: "#f5f5f5" }} />
          ))}
        </AbsoluteFill>
      );
    case "calle":
      return (
        <AbsoluteFill style={sky("#8fd3ff", "#d8f1ff")}>
          {city(false, 0)}
          {floor("#b9a78f")}
        </AbsoluteFill>
      );
    case "calle-run":
      return (
        <AbsoluteFill style={sky("#8fd3ff", "#d8f1ff")}>
          {city(false, 22)}
          {floor("#b9a78f")}
        </AbsoluteFill>
      );
    case "calle-noche":
      return (
        <AbsoluteFill style={sky("#060818", "#1b2050")}>
          {city(true, 0)}
          {floor("#2a2a35")}
        </AbsoluteFill>
      );
    case "bunker":
      return (
        <AbsoluteFill style={sky("#1a1424", "#2b2238")}>
          {[0, 1, 2].map((r) => (
            <div key={r} style={{ position: "absolute", left: 0, right: 0, top: 150 + r * 200, height: 16, background: "#4a3b5c" }} />
          ))}
          {new Array(30).fill(0).map((_, i) => <Trophy key={i} x={40 + (i % 10) * 190} y={70 + Math.floor(i / 10) * 200} s={0.9 + random(`t${i}`) * 0.3} />)}
          {floor("#3a2f48")}
        </AbsoluteFill>
      );
    case "azotea":
      return (
        <AbsoluteFill style={sky("#ff7e5f", "#feb47b")}>
          <div style={{ position: "absolute", left: 760, top: 520, width: 400, height: 400, borderRadius: 200, background: "#ffe08a", boxShadow: "0 0 120px #ffe08a" }} />
          {city(true, 0)}
          {floor("#5a4a5a")}
        </AbsoluteFill>
      );
    default:
      return <AbsoluteFill style={{ background: "#111" }} />;
  }
};

// ---------------------------------------------------------------- texto
const type = (txt: string, f: number) => txt.slice(0, Math.floor(f * 1.4));

const Bubble: React.FC<{ who: Who; text: string; f: number; x: number; y: number }> = ({ who, text, f, x, y }) => {
  const c = CAST[who];
  const pop = interpolate(f, [0, 6], [0.6, 1], { extrapolateRight: "clamp" });
  const bx = Math.max(30, Math.min(G_W - 650, x - 310));
  return (
    <div style={{ position: "absolute", left: bx, top: y, width: 620, transform: `scale(${pop})`, transformOrigin: `${x - bx}px 100%` }}>
      <div style={{ background: "#fff", border: "5px solid #111", borderRadius: 28, padding: "18px 26px", boxShadow: "6px 8px 0 rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: "Bebas", fontSize: 34, color: c.color, letterSpacing: 2 }}>{c.name}</div>
        <div style={{ fontFamily: "Mont", fontWeight: 800, fontSize: 36, color: "#111", lineHeight: 1.2 }}>{type(text, f)}</div>
      </div>
      <div style={{ position: "absolute", left: x - bx - 20, bottom: -34, width: 0, height: 0, borderLeft: "22px solid transparent", borderRight: "22px solid transparent", borderTop: "36px solid #111" }} />
    </div>
  );
};

const Narr: React.FC<{ text: string; f: number }> = ({ text, f }) => (
  <div style={{ position: "absolute", left: 60, top: 40, maxWidth: 1200, background: "#f9e04b", border: "5px solid #111", padding: "14px 26px", boxShadow: "6px 8px 0 rgba(0,0,0,0.35)", opacity: interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>
    <div style={{ fontFamily: "Mont", fontWeight: 800, fontSize: 34, color: "#111", fontStyle: "italic" }}>{type(text, f)}</div>
  </div>
);

// ---------------------------------------------------------------- escenas
type KF = number | [number[], number[]]; // valor fijo o [segundos], [valores]
const val = (k: KF, t: number) => (typeof k === "number" ? k : interpolate(t, k[0], k[1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

type Actor = { who: Who; x: KF; y?: KF; walk?: [number, number]; flip?: boolean; mood?: [number, Mood][]; jump?: number[]; armsUp?: [number, number]; hold?: (t: number) => React.ReactNode; from?: number; to?: number };
type Line = { at: number; d: number; who: Who | "narr"; text: string };
type SceneDef = { dur: number; bg: string; actors: Actor[]; lines: Line[]; under?: (t: number, f: number) => React.ReactNode; over?: (t: number, f: number) => React.ReactNode; sfx?: [number, string][] };

const EXTRA: Record<number, [number, string, number?][]> = {
  0: [[0, "pasos", 0.5], [12.4, "whoosh"]],
  1: [[0.2, "whoosh"], [0.5, "redoble", 0.5], [9, "pasos", 0.4]],
  2: [[4, "mordisco"]],
  3: [[0, "whoosh", 0.4]],
  4: [[0, "motor", 0.35], [3.9, "motor", 0.35], [7.8, "motor", 0.35], [11.7, "motor", 0.35]],
  5: [[2, "pasos", 0.5], [2.8, "puerta"]],
  6: [[1, "pasos", 0.4], [3, "magia", 0.6]],
  7: [[0, "pasos", 0.5], [3, "pasos", 0.5], [6, "whoosh"], [9, "pasos", 0.5], [13, "whoosh"], [15, "pasos", 0.5], [19, "whoosh"], [21, "pasos", 0.5]],
  8: [[0.5, "aleteo"], [2.5, "aleteo"], [5.3, "redoble", 0.4], [17.3, "ding", 0.5]],
  9: [[0, "helicoptero", 0.5], [5.5, "helicoptero", 0.5], [6, "whoosh"], [11.5, "helicoptero", 0.3]],
  10: [[0, "motor", 0.6], [2.8, "whoosh"]],
  11: [[0, "pasos", 0.5], [2.4, "puerta"], [5.5, "magia", 0.6], [8, "alarma", 0.35], [11.5, "ding", 0.5], [17, "redoble", 0.5], [20.4, "whoosh"], [22.3, "jaula"]],
  12: [[0.5, "magia", 0.5]],
  13: [[0, "jaula", 0.5], [5, "redoble", 0.5]],
};

const Scene: React.FC<{ s: SceneDef; si: number }> = ({ s, si }) => {
  const f = useCurrentFrame();
  const t = f / G_FPS;
  const pos: Partial<Record<Who, { x: number; y: number }>> = {};
  const out = interpolate(t, [s.dur - 0.4, s.dur], [1, 0], { extrapolateLeft: "clamp" });
  const inn = interpolate(t, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: Math.min(out, inn) }}>
      <Bg kind={s.bg} f={f} />
      {s.under?.(t, f)}
      {s.actors.map((a, i) => {
        if ((a.from ?? 0) > t || (a.to ?? 1e9) < t) return null;
        const x = val(a.x, t);
        let y = val(a.y ?? GROUND, t);
        if (a.jump) for (const j of a.jump) if (t > j && t < j + 0.8) y -= Math.sin(((t - j) / 0.8) * Math.PI) * 220;
        pos[a.who] = { x, y };
        const mood = (a.mood ?? []).filter(([at]) => at <= t).pop()?.[1] ?? "smile";
        const walking = !!a.walk && t >= a.walk[0] && t <= a.walk[1];
        const armsUp = (!!a.armsUp && t >= a.armsUp[0] && t <= a.armsUp[1]) || (!!a.jump && a.jump.some((j) => t > j && t < j + 0.8));
        return (
          <div key={i} style={{ position: "absolute", left: x - 130, top: y - 390 }}>
            <Person who={a.who} f={f} walking={walking} mood={mood} flip={a.flip} armsUp={armsUp} hold={a.hold?.(t)} />
          </div>
        );
      })}
      {s.over?.(t, f)}
      {s.lines.map((l, i) => {
        if (t < l.at || t > l.at + l.d) return null;
        const lf = f - l.at * G_FPS;
        if (l.who === "narr") return <Narr key={i} text={l.text} f={lf} />;
        const p = pos[l.who] ?? { x: G_W / 2, y: GROUND };
        return <Bubble key={i} who={l.who} text={l.text} f={lf} x={p.x} y={Math.max(30, p.y - 470 * CAST[l.who].s - 150)} />;
      })}
      {(s.sfx ?? []).map(([at, file], i) => (
        <Sequence key={i} from={Math.round(at * G_FPS)} durationInFrames={60}>
          <Audio src={staticFile(`golpe/${file}`)} volume={0.6} />
        </Sequence>
      ))}
      {(EXTRA[si] ?? []).map(([at, file, vol], i) => (
        <Sequence key={`x${i}`} from={Math.round(at * G_FPS)}>
          <Audio src={staticFile(`golpe/${file}.wav`)} volume={vol ?? 0.7} />
        </Sequence>
      ))}
      {s.lines.map((l, i) => (
        <Sequence key={`v${i}`} from={Math.round(l.at * G_FPS)}>
          <Audio src={staticFile("golpe/pop.wav")} volume={0.25} />
          {!l.text.startsWith("*") && <Audio src={staticFile(`golpe/voz/s${si}_${i}.wav`)} volume={1} />}
        </Sequence>
      ))}
      {si === 8 && (
        <Sequence from={Math.round(5.5 * G_FPS)}>
          <Audio src={staticFile("golpe/voz/carta.wav")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ big: string; small: string; dur: number }> = ({ big, small, dur }) => {
  const f = useCurrentFrame();
  const t = f / G_FPS;
  const s = interpolate(t, [0, 0.6], [0.7, 1], { extrapolateRight: "clamp" });
  const op = interpolate(t, [0, 0.4, dur - 0.5, dur], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #3a2a6a, #0b0716)", alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
        <div style={{ margin: "0 auto 20px", width: 140 }}><Ball r={70} /></div>
        <div style={{ fontFamily: "Bebas", fontSize: 170, color: "#f9e04b", letterSpacing: 6, textShadow: "8px 8px 0 #000" }}>{big}</div>
        <div style={{ fontFamily: "Mont", fontWeight: 800, fontSize: 36, color: "#fff", marginTop: 10 }}>{small}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- guion
const S: SceneDef[] = [
  // 1 · cold open
  {
    dur: 18, bg: "mansion-noche",
    actors: [{ who: "cr7", x: [[0, 3], [-150, 820]], walk: [0, 3], jump: [12.5], hold: (t) => (t > 3 ? <Ball /> : null) }],
    under: () => [0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 300 + i * 300 + 10, top: GROUND - 200 }}><Ball /></div>),
    lines: [
      { at: 0.5, d: 5, who: "narr", text: "Madrid. Tres de la madrugada." },
      { at: 5.5, d: 5, who: "narr", text: "Hay hombres que cuentan ovejas para dormir… y hombres que cuentan Balones de Oro." },
      { at: 8, d: 4.3, who: "cr7", text: "Uno, dos, tres, cuatro, cinco… ¡PERFECTOS!" },
      { at: 13.5, d: 4, who: "cr7", text: "¡SIUUUUU!" },
    ],
    sfx: [[3, "brillo.wav"], [12.5, "impacto.wav"]],
  },
  // 2 · el golpe
  {
    dur: 20, bg: "mansion-noche",
    actors: [{ who: "villa", x: [[9, 15], [1000, 2200]], y: [[0, 5], [-300, GROUND]], walk: [9, 15], mood: [[0, "calm"], [6, "smile"]], hold: (t) => (t > 7.5 ? <Ball /> : null) }],
    under: (t) => (
      <>
        {[0, 1, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 310 + i * 300, top: GROUND - 200 }}><Ball /></div>)}
        {t < 7.5 && <div style={{ position: "absolute", left: 1210, top: GROUND - 200 }}><Ball /></div>}
        {t > 7 && <div style={{ position: "absolute", left: 1210, top: GROUND - 200 }}><Ball choc /></div>}
        {new Array(8).fill(0).map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 220 + i * 80, height: 4, background: "rgba(255,30,30,0.7)", boxShadow: "0 0 12px red", transform: `rotate(${i % 2 ? 8 : -8}deg)` }} />)}
        {t < 6 && <div style={{ position: "absolute", left: 1124, top: 0, width: 6, height: interpolate(t, [0, 5], [100, GROUND - 380], { extrapolateRight: "clamp" }), background: "#ddd" }} />}
      </>
    ),
    lines: [
      { at: 0.5, d: 4.5, who: "narr", text: "Pero esa noche… alguien más estaba contando." },
      { at: 5.5, d: 4, who: "villa", text: "Cinco… menos uno." },
      { at: 10, d: 5, who: "villa", text: "Y en su lugar… uno de chocolate. Jeje." },
    ],
    sfx: [[7.2, "click.wav"]],
  },
  // 3 · descubrimiento
  {
    dur: 17, bg: "mansion-dia",
    actors: [{ who: "cr7", x: 960, mood: [[0, "smile"], [5, "shock"], [10, "angry"]], hold: (t) => (t > 1 ? <Ball choc bitten={t > 4} /> : null) }],
    lines: [
      { at: 0.5, d: 3.5, who: "cr7", text: "Buenos días, campeón… *ñam*" },
      { at: 5, d: 4.5, who: "cr7", text: "¿¡CHOCOLATE!? ¡¡YO NO COMO AZÚCAR!!" },
      { at: 10, d: 6.5, who: "narr", text: "Y en el mundo solo había una persona con motivos…" },
    ],
    sfx: [[5, "impacto.wav"]],
  },
  // 4 · llamada
  {
    dur: 16, bg: "mansion-dia",
    actors: [
      { who: "cr7", x: 480, mood: [[0, "angry"], [13, "angry"]] },
      { who: "benz", x: 1440, flip: true, mood: [[0, "calm"]] },
    ],
    under: () => <div style={{ position: "absolute", left: 960, top: 0, width: 960, height: G_H, background: "#2c3e50" }}><div style={{ position: "absolute", left: 0, top: 0, width: 10, height: G_H, background: "#111" }} /></div>,
    lines: [
      { at: 0.5, d: 4, who: "cr7", text: "Karim. Me han robado un Balón de Oro." },
      { at: 5, d: 4, who: "benz", text: "…Yo sé quién tiene muchos." },
      { at: 9.5, d: 5.5, who: "cr7", text: "Nos vamos a BARCELONA." },
    ],
  },
  // 5 · viaje
  {
    dur: 14, bg: "carretera",
    actors: [
      { who: "cr7", x: 860, y: GROUND + 20 },
      { who: "benz", x: 1080, y: GROUND + 20, mood: [[0, "calm"]] },
    ],
    over: (t) => (
      <svg style={{ position: "absolute", left: 620, top: GROUND - 230 + Math.sin(t * 20) * 3 }} width={700} height={280} viewBox="0 0 700 280">
        <path d="M20 200 Q30 120 140 110 L250 40 Q350 20 470 40 L580 110 Q680 120 690 200 Z" fill="#f4f4f4" stroke="#111" strokeWidth={6} />
        <path d="M270 55 L460 55 L540 115 L190 115 Z" fill="rgba(140,200,255,0.25)" />
        {[150, 550].map((x) => <g key={x}><circle cx={x} cy={210} r={52} fill="#111" /><circle cx={x} cy={210} r={22} fill="#999" /></g>)}
      </svg>
    ),
    lines: [
      { at: 0.5, d: 5, who: "narr", text: "Seiscientos kilómetros. Cero paradas. Mucho drama." },
      { at: 6, d: 3.5, who: "cr7", text: "¿Puedes ir más rápido?" },
      { at: 10, d: 3.5, who: "benz", text: "Conduces tú, Cris." },
    ],
  },
  // 6 · casa de Messi
  {
    dur: 24, bg: "salon",
    actors: [
      { who: "messi", x: 460, y: GROUND - 10, mood: [[0, "calm"]], hold: () => <div style={{ width: 40, height: 50, background: "#7a4a25", borderRadius: "0 0 14px 14px", border: "4px solid #333" }} /> },
      { who: "cr7", x: [[2, 4], [2100, 1250]], walk: [2, 4], flip: true, mood: [[0, "angry"], [15, "shock"]] },
      { who: "benz", x: [[2.5, 4.5], [2300, 1620]], walk: [2.5, 4.5], flip: true, mood: [[0, "calm"]] },
    ],
    under: () => new Array(8).fill(0).map((_, i) => <div key={i} style={{ position: "absolute", left: 1150 + (i % 4) * 150, top: 180 + Math.floor(i / 4) * 170 }}><Ball r={30} /></div>),
    lines: [
      { at: 0.5, d: 2, who: "messi", text: "*sorbe mate*" },
      { at: 4.5, d: 3.8, who: "cr7", text: "¡¿DÓNDE ESTÁ MI BALÓN?!" },
      { at: 8.8, d: 5, who: "messi", text: "Tengo ocho, Cris. No me hace falta el tuyo." },
      { at: 14.5, d: 4.5, who: "cr7", text: "…¿Ocho?" },
      { at: 19.5, d: 4, who: "benz", text: "Ocho. Los he contado." },
    ],
  },
  // 7 · Neymar
  {
    dur: 20, bg: "salon",
    actors: [
      { who: "messi", x: 460, y: GROUND - 10, mood: [[0, "calm"]] },
      { who: "ney", x: [[1, 3.5], [-200, 900]], walk: [1, 3.5], armsUp: [3.5, 8], mood: [[0, "smile"], [14, "shock"]] },
      { who: "cr7", x: 1300, flip: true, mood: [[0, "angry"]] },
      { who: "benz", x: 1650, flip: true, mood: [[0, "calm"]] },
    ],
    under: (t) => new Array(40).fill(0).map((_, i) => {
      const x = 700 + random(`gx${i}`) * 400; const y = Math.min(GROUND + 30, 500 + random(`gy${i}`) * 200 + t * 40);
      return t > 3 ? <div key={i} style={{ position: "absolute", left: x, top: y, width: 10, height: 10, background: ["#ff4fd8", "#ffd84f", "#4fffe1"][i % 3], transform: `rotate(${i * 30}deg)` }} /> : null;
    }),
    lines: [
      { at: 3.5, d: 4.5, who: "ney", text: "¿Qué pasa, fiesta? ¡Nadie me invitó!" },
      { at: 8.5, d: 5, who: "benz", text: "En la mansión había… purpurina." },
      { at: 14, d: 5.5, who: "narr", text: "Todos miraron a Neymar." },
    ],
    sfx: [[14, "impacto.wav"]],
  },
  // 8 · persecución
  {
    dur: 26, bg: "calle-run",
    actors: [
      { who: "ney", x: [[0, 4, 26], [600, 1350, 1450]], walk: [0, 26], mood: [[0, "shock"]], jump: [6, 13, 19] },
      { who: "cr7", x: [[0, 4, 26], [-200, 700, 900]], walk: [0, 26], mood: [[0, "angry"]] },
      { who: "benz", x: [[0, 6, 26], [-400, 250, 400]], mood: [[0, "calm"]] },
    ],
    over: (t) => (
      <>
        <svg style={{ position: "absolute", left: val([[0, 6, 26], [-400, 250, 400]], t) - 120, top: GROUND - 60 }} width={240} height={90} viewBox="0 0 240 90">
          <rect x={20} y={40} width={200} height={14} rx={6} fill="#222" />
          <rect x={180} y={-200} width={12} height={250} fill="#222" />
          <circle cx={40} cy={70} r={18} fill="#111" /><circle cx={200} cy={70} r={18} fill="#111" />
        </svg>
        {new Array(6).fill(0).map((_, i) => {
          const x = (((i * 360 - t * 400) % 2200) + 2200) % 2200;
          return <div key={i} style={{ position: "absolute", left: x, top: GROUND - 40, width: 40, height: 40, borderRadius: 20, background: "#ff9a1f", transform: `rotate(${t * 400}deg)` }} />;
        })}
      </>
    ),
    lines: [
      { at: 1, d: 4.5, who: "ney", text: "¡QUE YO NO FUI! ¡La purpurina es mi perfume!" },
      { at: 7, d: 4, who: "cr7", text: "¡VUELVE AQUÍ!" },
      { at: 12, d: 4.5, who: "benz", text: "No corráis. Tengo patinete." },
      { at: 17.5, d: 7.5, who: "narr", text: "Pero la purpurina… no era una prueba. Era una trampa." },
    ],
  },
  // 9 · giro
  {
    dur: 22, bg: "calle",
    actors: [
      { who: "ney", x: 520, mood: [[0, "sad"]] },
      { who: "benz", x: 960, mood: [[0, "calm"]], hold: (t) => (t > 4 ? <div style={{ width: 90, height: 60, background: "#f8f0dc", border: "3px solid #8e44ad", borderRadius: 4 }} /> : null) },
      { who: "cr7", x: 1300, flip: true, mood: [[0, "angry"]] },
      { who: "messi", x: [[15, 17], [2100, 1650]], walk: [15, 17], flip: true, mood: [[0, "calm"], [18, "shock"]] },
    ],
    under: (t) => (t < 4.2 ? (
      <svg style={{ position: "absolute", left: interpolate(t, [0, 4], [1900, 1040]), top: interpolate(t, [0, 4], [100, GROUND - 330]) }} width={120} height={80} viewBox="0 0 120 80">
        <ellipse cx={60} cy={45} rx={40} ry={24} fill="#9aa3ad" /><circle cx={92} cy={30} r={16} fill="#9aa3ad" /><polygon points="106,30 118,34 106,38" fill="#f39c12" />
        <path d={`M40 40 L10 ${Math.sin(t * 30) * 25 + 20} L60 40`} fill="#7d858e" /><rect x={30} y={60} width={34} height={22} fill="#f8f0dc" stroke="#8e44ad" strokeWidth={3} />
      </svg>
    ) : null),
    over: (t) => (t > 5.5 && t < 15 ? (
      <div style={{ position: "absolute", left: 460, top: 160, width: 1000, padding: 40, background: "#f8f0dc", border: "8px solid #8e44ad", fontFamily: "Mont", fontWeight: 800, fontSize: 44, color: "#2c1a3a", fontStyle: "italic", lineHeight: 1.35, boxShadow: "10px 12px 0 rgba(0,0,0,0.4)" }}>
        {type("«Querido Siete: un balón no basta. Esta noche tendré también los ocho del Diez.»\n— El Coleccionista", (t - 5.5) * G_FPS)}
      </div>
    ) : null),
    lines: [
      { at: 0.5, d: 3.5, who: "narr", text: "Entonces, una paloma trajo una carta…" },
      { at: 17.5, d: 4.2, who: "messi", text: "…¿Mis ocho?" },
    ],
    sfx: [[4.2, "click.wav"]],
  },
  // 10 · secuestro
  {
    dur: 20, bg: "calle-noche",
    actors: [
      { who: "messi", x: 960, y: [[6, 11], [GROUND, -400]], mood: [[0, "calm"]], armsUp: [7, 20] },
      { who: "cr7", x: 500, mood: [[0, "shock"]] },
      { who: "ney", x: 1400, flip: true, mood: [[0, "shock"]] },
      { who: "benz", x: 1720, flip: true, mood: [[0, "calm"], [8, "shock"]] },
    ],
    over: (t) => {
      const hy = interpolate(t, [0, 4, 6, 11], [-500, 80, 80, -600], { extrapolateRight: "clamp" });
      const cy = interpolate(t, [3, 6, 11], [hy + 150, GROUND - 520, -400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <>
          <svg style={{ position: "absolute", left: 660, top: hy }} width={600} height={240} viewBox="0 0 600 240">
            <rect x={60 + Math.sin(t * 40) * 200} y={10} width={480 - Math.abs(Math.sin(t * 40)) * 400} height={12} fill="#333" />
            <ellipse cx={300} cy={130} rx={170} ry={80} fill="#6c2a9c" stroke="#111" strokeWidth={6} />
            <rect x={460} y={110} width={140} height={22} fill="#6c2a9c" />
            <ellipse cx={240} cy={110} rx={70} ry={40} fill="rgba(160,220,255,0.6)" />
          </svg>
          <div style={{ position: "absolute", left: 956, top: hy + 200, width: 8, height: Math.max(0, cy - hy - 200), background: "#888" }} />
          <svg style={{ position: "absolute", left: 870, top: cy }} width={180} height={140} viewBox="0 0 180 140">
            <path d="M20 10 H160 L140 40 H40 Z" fill="#999" />
            <path d="M40 40 Q10 90 50 130 M140 40 Q170 90 130 130" stroke="#999" strokeWidth={14} fill="none" />
          </svg>
        </>
      );
    },
    lines: [
      { at: 0.5, d: 3.5, who: "narr", text: "Esa misma noche…" },
      { at: 8, d: 4, who: "messi", text: "Che… que alguien avise a mi mujer." },
      { at: 12.5, d: 3, who: "cr7", text: "¡¡LEOOO!!" },
      { at: 16, d: 3.8, who: "narr", text: "Ahora sí. Esto era personal." },
    ],
    sfx: [[6, "impacto.wav"]],
  },
  // 11 · Ramos
  {
    dur: 18, bg: "calle-noche",
    actors: [
      { who: "ramos", x: [[0, 3], [-300, 760]], mood: [[0, "angry"]] },
      { who: "cr7", x: 1250, flip: true, mood: [[0, "angry"], [8, "smile"]] },
      { who: "ney", x: 1530, flip: true },
      { who: "benz", x: 1780, flip: true, mood: [[0, "calm"]] },
    ],
    under: (t) => (
      <svg style={{ position: "absolute", left: val([[0, 3], [-470, 590]], t), top: GROUND - 120 }} width={340} height={140} viewBox="0 0 340 140">
        <circle cx={60} cy={100} r={38} fill="#111" /><circle cx={280} cy={100} r={38} fill="#111" />
        <path d="M60 100 L140 50 L240 50 L280 100" stroke="#c0392b" strokeWidth={18} fill="none" />
      </svg>
    ),
    lines: [
      { at: 3.5, d: 4.5, who: "ramos", text: "Me han dicho que hay un búnker. Yo entro donde sea." },
      { at: 8.5, d: 4.5, who: "cr7", text: "Equipo. Sin rivalidades. Solo esta noche." },
      { at: 13.5, d: 4, who: "ney", text: "¡Vamos a por el Diez!" },
    ],
    sfx: [[3, "impacto.wav"]],
  },
  // 12 · búnker
  {
    dur: 30, bg: "bunker",
    actors: [
      { who: "messi", x: 1500, y: GROUND - 20, mood: [[0, "calm"]], hold: () => <div style={{ width: 54, height: 60, background: "#e74c3c", borderTop: "14px solid #fff6d0" }} /> },
      { who: "villa", x: [[22, 23.5], [1120, 1180]], flip: true, mood: [[0, "smile"], [17, "angry"], [22, "shock"]] },
      { who: "ramos", x: [[0, 2.5], [-200, 350]], walk: [0, 2.5] },
      { who: "ney", x: [[0.5, 3], [-300, 560]], walk: [0.5, 3], armsUp: [5, 11], jump: [6, 7.5, 9] },
      { who: "benz", x: [[1, 3.5], [-300, 140]], walk: [1, 3.5], mood: [[0, "calm"]] },
      { who: "cr7", x: [[1.5, 4, 18, 20], [-300, 780, 780, 900]], walk: [1.5, 4], mood: [[0, "angry"]], jump: [20.5] },
    ],
    under: (t) => (
      <>
        <div style={{ position: "absolute", left: 1430, top: GROUND - 240, width: 140, height: 40, background: "#f1c40f", transform: "rotate(-4deg)", opacity: t < 26 ? 1 : 0 }} />
        {t < 2.5 && <div style={{ position: "absolute", left: 0, top: 300, width: 60, height: 600, background: "#555", transform: `rotate(${t * 40}deg)` }} />}
      </>
    ),
    over: (t) => (
      <>
        {t > 21.5 && (
          <svg style={{ position: "absolute", left: 1040, top: interpolate(t, [21.5, 22.3], [-500, GROUND - 470], { extrapolateRight: "clamp" }) }} width={280} height={480} viewBox="0 0 280 480">
            <rect x={0} y={0} width={280} height={20} fill="#c9a227" />
            {new Array(8).fill(0).map((_, i) => <rect key={i} x={i * 38} y={0} width={10} height={480} fill="#c9a227" />)}
          </svg>
        )}
        {t > 11 && t < 16 && <div style={{ position: "absolute", left: 60, top: 220, fontFamily: "Bebas", fontSize: 90, color: "#2ecc71", textShadow: "4px 4px 0 #000" }}>ALARMA: DESACTIVADA ✔</div>}
      </>
    ),
    lines: [
      { at: 3, d: 3, who: "ramos", text: "¡TOC TOC!" },
      { at: 5.5, d: 5, who: "ney", text: "¡Guardias, mirad este baile! 💃" },
      { at: 11, d: 4.5, who: "benz", text: "Alarma desactivada. Sin prisa." },
      { at: 16, d: 4, who: "villa", text: "¡NADIE TOCA MI COLECCIÓN!" },
      { at: 20.3, d: 3.5, who: "cr7", text: "¡¡SIUUUUUU!!" },
      { at: 24.5, d: 5, who: "messi", text: "¿Ya está? Me quedaban palomitas." },
    ],
    sfx: [[2.4, "impacto.wav"], [20.5, "impacto.wav"], [22.3, "click.wav"]],
  },
  // 13 · final
  {
    dur: 24, bg: "azotea",
    actors: [
      { who: "benz", x: 260, mood: [[0, "calm"]] },
      { who: "ney", x: 560, armsUp: [0, 6] },
      { who: "messi", x: 860, hold: () => <Ball r={28} /> },
      { who: "cr7", x: 1180, flip: true, hold: () => <Ball r={28} />, mood: [[0, "smile"], [12, "angry"]] },
      { who: "ramos", x: 1520, flip: true, armsUp: [16, 24] },
    ],
    lines: [
      { at: 0.5, d: 3.5, who: "narr", text: "Al amanecer…" },
      { at: 4, d: 3.5, who: "messi", text: "Gracias, Cris." },
      { at: 8, d: 4, who: "cr7", text: "De nada. Pero que conste: YO te rescaté." },
      { at: 12.5, d: 3.5, who: "messi", text: "Y yo tengo ocho." },
      { at: 16.5, d: 7, who: "narr", text: "Hay rivalidades que ni un secuestro puede romper." },
    ],
  },
  // 14 · post-créditos
  {
    dur: 14, bg: "bunker",
    actors: [{ who: "villa", x: 960, mood: [[0, "sad"], [5, "smile"]], hold: (t) => (t > 4 ? <div style={{ width: 70, height: 90, background: "#fff", border: "4px solid #333" }} /> : null) }],
    over: () => (
      <svg style={{ position: "absolute", left: 800, top: GROUND - 470 }} width={320} height={480} viewBox="0 0 320 480">
        <rect x={0} y={0} width={320} height={20} fill="#c9a227" />
        {new Array(9).fill(0).map((_, i) => <rect key={i} x={i * 38} y={0} width={10} height={480} fill="#c9a227" />)}
      </svg>
    ),
    lines: [
      { at: 0.5, d: 3.5, who: "narr", text: "Mientras tanto, en la jaula…" },
      { at: 5, d: 5, who: "villa", text: "Próximo objetivo… la COPA DEL MUNDO." },
    ],
  },
];

const INTRO = 7;
const OUTRO = 5;
export const GOLPE_DURATION = (INTRO + S.reduce((a, s) => a + s.dur, 0) + OUTRO) * G_FPS;

export const Golpe: React.FC = () => {
  let from = INTRO * G_FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("golpe/banda_sonora.wav")} volume={0.3} />
      <Sequence from={6}>
        <Audio src={staticFile("golpe/whoosh.wav")} />
      </Sequence>
      <Sequence from={15}>
        <Audio src={staticFile("golpe/brillo.wav")} volume={0.6} />
      </Sequence>
      <Sequence durationInFrames={INTRO * G_FPS}>
        <Title big="EL GOLPE DEL BALÓN DE ORO" small="Parodia animada de ficción · Nada de esto ha ocurrido" dur={INTRO} />
      </Sequence>
      {S.map((s, i) => {
        const d = s.dur * G_FPS;
        const el = (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Scene s={s} si={i} />
          </Sequence>
        );
        from += d;
        return el;
      })}
      <Sequence from={from} durationInFrames={OUTRO * G_FPS}>
        <Title big="CONTINUARÁ…" small="¿Quién será el próximo? Suscríbete 🔔" dur={OUTRO} />
      </Sequence>
    </AbsoluteFill>
  );
};
