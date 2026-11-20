import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

/*
 * Vídeo largo horizontal «¿Qué prefieres?» (1920×1080, 30 fps).
 * Todo el contenido llega por props: public/qp/<id>/timeline.json,
 * que genera scripts/qp_montaje.py a partir de largos/<id>.json.
 */

export const LILITA = "Lilita";
loadFont({ family: LILITA, url: staticFile("fonts/lilita-one-latin-400-normal.woff2"), unicodeRange: "U+0000-00FF, U+2000-206F, U+20AC" });
loadFont({ family: LILITA, url: staticFile("fonts/lilita-one-latin-ext-400-normal.woff2"), unicodeRange: "U+0100-02AF, U+1E00-1EFF" });
const FONT = `${LILITA}, "Noto Color Emoji", sans-serif`;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YELLOW = "#FFD60A";
const GREEN = "#39D353";

type Opt = { img: string; label: string };
type QSeg = {
  type: "q"; n: number; from: number; to: number; aAt: number; bAt: number;
  cdFrom: number; cdTo: number; revealAt: number; pa: number; reaction: string; a: Opt; b: Opt;
};
type LevelSeg = { type: "level"; from: number; to: number; idx: number; name: string; emoji: string };
type Seg =
  | QSeg
  | LevelSeg
  | { type: "hook"; from: number; to: number }
  | { type: "mid"; from: number; to: number }
  | { type: "outro"; from: number; to: number; lines: number[] };

export type Theme = { bg1: string; bg2: string; accent: string; a: string; b: string };
export type Timeline = {
  id: string; title: string; subtitle: string; theme: Theme; channel: string;
  scores: [string, string, string][]; nq: number; total: number; segments: Seg[]; thumbs: string[];
};

export const defaultTimeline: Timeline = {
  id: "demo", title: "¿QUÉ PREFIERES?", subtitle: "DEMO", channel: "DILEMAZO", scores: [], nq: 0, total: 300,
  theme: { bg1: "#FF3B4E", bg2: "#C8102E", accent: YELLOW, a: "#2F7BFF", b: "#FF8A00" }, segments: [], thumbs: [],
};

/* ---------------- helpers ---------------- */

const stroke = (px: number, color = "#111"): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${color}`,
  paintOrder: "stroke fill",
});

const pop = (frame: number, fps: number, delay = 0, damping = 11, stiffness = 160) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness } });

/* ---------------- logo (también se usa para la foto de perfil) ---------------- */

export const Logo: React.FC<{ size: number; theme?: Theme; spin?: number }> = ({ size, theme, spin = 0 }) => {
  const a = theme?.a ?? "#2F7BFF";
  const b = theme?.b ?? "#FF3B4E";
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${a} 0%, ${a} 49.5%, ${b} 50.5%, ${b} 100%)`,
        boxShadow: `0 0 0 ${size * 0.045}px #fff, 0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.45)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${spin}deg)` }}>
        {new Array(12).fill(0).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size * 0.06, background: "rgba(255,255,255,0.10)", transformOrigin: "0 50%", transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT, fontSize: size * 0.78, color: YELLOW, lineHeight: 1, paddingTop: size * 0.06, ...stroke(size * 0.05),
          textShadow: `0 ${size * 0.03}px 0 rgba(0,0,0,0.35)`,
        }}
      >
        ?
      </div>
      <div style={{ position: "absolute", left: "8%", top: "16%", fontFamily: FONT, fontSize: size * 0.22, color: "#fff", ...stroke(size * 0.022) }}>A</div>
      <div style={{ position: "absolute", right: "9%", bottom: "12%", fontFamily: FONT, fontSize: size * 0.22, color: "#fff", ...stroke(size * 0.022) }}>B</div>
    </div>
  );
};

/* ---------------- background ---------------- */

const ICONS = ["?", "✌", "?", "★", "?", "✌"];
const Background: React.FC<{ theme: Theme; tint?: number }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const cell = 170;
  const ox = (frame * 0.9) % cell;
  const oy = (frame * 0.6) % cell;
  const cols = Math.ceil(1920 / cell) + 2;
  const rows = Math.ceil(1080 / cell) + 2;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${theme.bg1} 0%, ${theme.bg2} 85%)`, overflow: "hidden" }}>
      {new Array(rows).fill(0).map((_, r) =>
        new Array(cols).fill(0).map((__, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute", left: c * cell - cell + ox + (r % 2) * (cell / 2), top: r * cell - cell + oy,
              width: cell, height: cell, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT, fontSize: 64, color: "rgba(255,255,255,0.09)", transform: `rotate(${((r + c) % 3) * 12 - 12}deg)`,
            }}
          >
            {ICONS[(r * 3 + c) % ICONS.length]}
          </div>
        )),
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.38) 100%)" }} />
    </AbsoluteFill>
  );
};

const SideRails: React.FC<{ channel: string; theme: Theme }> = ({ channel, theme }) => {
  const frame = useCurrentFrame();
  const rail = (left: boolean) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, [left ? "left" : "right"]: 0, width: 74, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          writingMode: "vertical-rl", transform: left ? "rotate(180deg)" : undefined, background: "rgba(255,255,255,0.92)",
          borderRadius: left ? "0 22px 22px 0" : "22px 0 0 22px", padding: "26px 12px", fontFamily: FONT, fontSize: 34, color: theme.bg2, letterSpacing: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {channel}
      </div>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, transform: `translateY(${Math.sin(frame / 10 + (left ? 0 : 2)) * 6}px)`, color: theme.bg2 }}>
        ▲
      </div>
    </div>
  );
  return (
    <>
      {rail(true)}
      {rail(false)}
    </>
  );
};

/* ---------------- header ---------------- */

const Header: React.FC<{ tl: Timeline; q?: QSeg }> = ({ tl, q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bob = Math.sin(frame / 14) * 4;
  const starIn = q ? pop(frame, fps, q.from + 6, 8, 180) : 0;
  const words = tl.title.replace("¿", "").replace("?", "").split(" ");
  return (
    <>
      <div style={{ position: "absolute", left: 105, top: 26 }}>
        <Logo size={118} theme={tl.theme} spin={frame * 0.4} />
      </div>
      <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", transform: `translateY(${bob}px)` }}>
        <span style={{ fontFamily: FONT, fontSize: 112, color: "#fff", letterSpacing: 1, ...stroke(14), textShadow: "0 9px 0 rgba(0,0,0,0.35)" }}>
          ¿{words[0]} <span style={{ color: tl.theme.accent }}>{words.slice(1).join(" ")}?</span>
        </span>
      </div>
      {q ? (
        <div style={{ position: "absolute", right: 102, top: 22, width: 128, height: 128, transform: `scale(${starIn}) rotate(${(1 - starIn) * 180 + Math.sin(frame / 9) * 8}deg)` }}>
          <svg viewBox="0 0 100 100" width={128} height={128} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" }}>
            <polygon points="50,4 62,36 96,38 69,59 79,93 50,74 21,93 31,59 4,38 38,36" fill="#8A2BE2" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 10, fontFamily: FONT, fontSize: q.n >= 10 ? 46 : 54, color: "#fff", ...stroke(6) }}>{q.n}</div>
        </div>
      ) : null}
    </>
  );
};

/* ---------------- question ---------------- */

const CARD_W = 790;
const CARD_H = 690;
const CARD_TOP = 180;
const IMG_H = 500;

const Card: React.FC<{ tl: Timeline; q: QSeg; side: "a" | "b" }> = ({ tl, q, side }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isA = side === "a";
  const opt = q[side];
  const color = isA ? tl.theme.a : tl.theme.b;
  const x0 = isA ? 960 - 22 - CARD_W : 960 + 22;

  const enter = pop(frame, fps, q.from + (isA ? 0 : 4), 13, 140);
  const exit = interpolate(frame, [q.to - 9, q.to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const slideY = (1 - enter) * 900;
  const slideX = exit * (isA ? -1300 : 1300);
  const rot = (1 - enter) * (isA ? -14 : 14) + exit * (isA ? -12 : 12);

  const sayAt = isA ? q.aAt : q.bAt;
  const st = frame - sayAt;
  const hl = st >= 0 && st < 12 ? Math.sin((st / 12) * Math.PI) : 0;
  const speaking = isA ? frame >= q.aAt && frame < q.bAt : frame >= q.bAt && frame < q.cdFrom;

  const inCd = frame >= q.cdFrom && frame < q.cdTo;
  const cdT = frame - q.cdFrom;
  const beat = inCd ? Math.pow(Math.max(0, Math.cos(((cdT % 30) / 30) * Math.PI * 2)), 8) * 0.025 : 0;
  const wob = inCd ? Math.sin(cdT / 4 + (isA ? 0 : 1.7)) * 1.2 : 0;

  const rt = frame - q.revealAt;
  const res = interpolate(rt, [0, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pct = isA ? q.pa : 100 - q.pa;
  const win = isA ? q.pa > 50 : q.pa < 50;
  const tie = q.pa === 50;
  const winT = win ? res : 0;
  const lose = !win && !tie ? res : 0;
  const zoom = 1.06 + (frame - q.from) * 0.0006;

  return (
    <div
      style={{
        position: "absolute", left: x0, top: CARD_TOP, width: CARD_W, height: CARD_H,
        transform: `translate(${slideX}px, ${slideY}px) rotate(${rot + wob}deg) scale(${1 + hl * 0.035 + beat + winT * 0.035 - lose * 0.04})`,
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, background: "#fff", borderRadius: 40,
          boxShadow: `0 0 0 ${winT * 12}px ${YELLOW}, 0 0 ${winT * 70 + (speaking ? 30 : 0)}px ${win && res > 0 ? YELLOW : speaking ? "rgba(255,255,255,0.9)" : "transparent"}, 0 18px 0 rgba(0,0,0,0.22), 0 24px 50px rgba(0,0,0,0.35)`,
        }}
      />
      <div style={{ position: "absolute", left: 20, top: 20, width: CARD_W - 40, height: IMG_H, borderRadius: 28, overflow: "hidden", background: "#222" }}>
        <Img
          src={staticFile(opt.img)}
          style={{
            width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`,
            filter: lose > 0 ? `grayscale(${lose * 0.85}) brightness(${1 - lose * 0.35})` : undefined,
          }}
        />
        {/* brillo que barre la imagen cuando se nombra */}
        <div style={{ position: "absolute", top: -200, left: interpolate(st, [0, 14], [-300, CARD_W + 200], clamp), width: 130, height: 900, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(18deg)" }} />
        {res > 0 ? (
          <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${0.15 * res}) 0%, rgba(0,0,0,${0.55 * res}) 100%)`, alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: FONT, fontSize: 190, color: win ? YELLOW : "#fff", ...stroke(16), lineHeight: 1, transform: `scale(${interpolate(rt, [0, 6, 26, 32], [0.3, 1.1, 1, win ? 1.12 : 1], clamp) - (rt > 32 && win ? Math.min(0.12, (rt - 32) * 0.02) : 0)})`, opacity: Math.min(1, rt / 4) }}>
              {Math.round(pct * res)}%
            </div>
          </AbsoluteFill>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: IMG_H + 20, bottom: 14, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: opt.label.length > 34 ? 50 : opt.label.length > 24 ? 56 : 64, lineHeight: 1.04, color: "#151515", letterSpacing: 0.5 }}>{opt.label}</div>
      </div>
      {/* letra A / B */}
      <div
        style={{
          position: "absolute", left: -28, top: -30, width: 112, height: 112, borderRadius: "50%", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          transform: `scale(${pop(frame, fps, q.from + 10 + (isA ? 0 : 4), 8, 200) * (1 + hl * 0.25)}) rotate(${isA ? -8 : 8}deg)`,
        }}
      >
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 66, color: "#fff", paddingTop: 6, ...stroke(5) }}>
          {isA ? "A" : "B"}
        </div>
      </div>
      {/* sello de mayoría */}
      {res > 0 && (win || tie) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: -44, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, q.revealAt + 18, 7, 220)}) rotate(${isA ? -4 : 4}deg)` }}>
          <div style={{ fontFamily: FONT, fontSize: 52, color: "#111", background: YELLOW, borderRadius: 22, padding: "10px 26px 4px", boxShadow: "0 8px 0 rgba(0,0,0,0.25)", border: "5px solid #fff" }}>👑 MAYORÍA</div>
        </div>
      ) : null}
    </div>
  );
};

const CenterBadge: React.FC<{ tl: Timeline; q: QSeg }> = ({ tl, q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, q.from + 14, 9, 170);
  const out = interpolate(frame, [q.revealAt - 2, q.revealAt + 4], [1, 0], clamp);
  const inCd = frame >= q.cdFrom - 3 && frame < q.cdTo + 4;
  const cdT = frame - q.cdFrom;
  const sec = Math.max(1, Math.min(5, 5 - Math.floor(cdT / fps)));
  const inSec = (((cdT % fps) + fps) % fps) / fps;
  const urgent = sec <= 2;
  const cy = CARD_TOP + IMG_H / 2 + 20;
  const R = 104;
  const C = 2 * Math.PI * R;
  const prog = interpolate(frame, [q.cdFrom, q.cdTo], [0, 1], clamp);
  const size = inCd ? 250 : 150;
  return (
    <div style={{ position: "absolute", left: 960 - size / 2, top: cy - size / 2, width: size, height: size, zIndex: 5, transform: `scale(${s * out}) rotate(${(1 - s) * 200}deg)` }}>
      {inCd ? (
        <>
          <svg width={250} height={250} style={{ position: "absolute", inset: 0 }}>
            <circle cx={125} cy={125} r={120} fill="#fff" />
            <circle cx={125} cy={125} r={R} fill={urgent ? "#FF2D2D" : tl.theme.bg2} />
            <circle cx={125} cy={125} r={R} fill="none" stroke={urgent ? "#FFE0E0" : YELLOW} strokeWidth={16} strokeDasharray={C} strokeDashoffset={C * prog} strokeLinecap="round" transform="rotate(-90 125 125)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 12, fontFamily: FONT, fontSize: 150, color: "#fff", ...stroke(10), transform: `scale(${interpolate(inSec, [0, 0.18], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})` }}>
            {sec}
          </div>
        </>
      ) : (
        <div style={{ width: 150, height: 150, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.35)", transform: `scale(${1 + Math.sin(frame / 5) * 0.04})` }}>
          <div style={{ width: 124, height: 124, borderRadius: "50%", background: `conic-gradient(from ${frame * 4}deg, ${tl.theme.a}, ${tl.theme.b}, ${tl.theme.a})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 64, color: "#fff", paddingTop: 6, ...stroke(7) }}>
            O
          </div>
        </div>
      )}
    </div>
  );
};

/** Barra inferior: temporizador verde (como en los vídeos del género) → barra de votos al revelar. */
const BottomBar: React.FC<{ tl: Timeline; q: QSeg }> = ({ tl, q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = pop(frame, fps, q.from + 16, 14, 150);
  const out = interpolate(frame, [q.to - 8, q.to], [1, 0], clamp);
  const left = interpolate(frame, [q.cdFrom, q.cdTo], [1, 0], clamp);
  const rt = frame - q.revealAt;
  const res = interpolate(rt, [0, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const W = 1000;
  const urgent = frame >= q.cdTo - 2 * fps && frame < q.cdTo;
  const barColor = left > 0.4 ? GREEN : left > 0.2 ? "#FFC21A" : "#FF3B3B";
  const shake = urgent ? Math.sin(frame * 2.3) * 4 : 0;
  return (
    <div style={{ position: "absolute", left: 960 - W / 2, top: 952, width: W, height: 66, transform: `translateY(${(1 - enter) * 200 + (1 - out) * 200}px) translateX(${shake}px)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "#fff", boxShadow: "0 8px 0 rgba(0,0,0,0.22)" }} />
      <div style={{ position: "absolute", left: 10, top: 10, right: 10, bottom: 10, borderRadius: 30, background: "#e9e9e9", overflow: "hidden" }}>
        {rt < 0 ? (
          <div
            style={{
              width: `${left * 100}%`, height: "100%", borderRadius: 30, background: barColor,
              backgroundImage: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.28) 0 16px, transparent 16px 32px)",
              backgroundSize: "45px 45px", backgroundPosition: `${frame * 2}px 0`,
            }}
          />
        ) : (
          <div style={{ display: "flex", height: "100%" }}>
            <div style={{ width: `${50 + (q.pa - 50) * res}%`, background: tl.theme.a, display: "flex", alignItems: "center", paddingLeft: 18, fontFamily: FONT, fontSize: 36, color: "#fff", ...stroke(4) }}>A · {Math.round(q.pa * res)}%</div>
            <div style={{ flex: 1, background: tl.theme.b, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 18, fontFamily: FONT, fontSize: 36, color: "#fff", ...stroke(4) }}>{Math.round((100 - q.pa) * res)}% · B</div>
          </div>
        )}
      </div>
      {frame >= q.cdFrom && rt < 0 ? (
        <div style={{ position: "absolute", top: -64, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 44, color: "#fff", ...stroke(7), transform: `scale(${pop(frame, fps, q.cdFrom, 8, 200)})` }}>
          ⏱️ ¡ELIGE YA!
        </div>
      ) : null}
    </div>
  );
};

const Reaction: React.FC<{ tl: Timeline; q: QSeg }> = ({ tl, q }) => {
  const frame = useCurrentFrame();
  const t = frame - q.revealAt - 8;
  if (t < 0 || frame > q.to) return null;
  const s = interpolate(t, [0, 7], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
  const o = interpolate(t, [0, 3, 50, 58], [0, 1, 1, 0], clamp);
  const winX = q.pa >= 50 ? 960 - 22 - CARD_W / 2 : 960 + 22 + CARD_W / 2;
  const colors = [YELLOW, "#fff", tl.theme.a, tl.theme.b, "#7CFF6B", "#FF7AD9"];
  return (
    <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
      {new Array(60).fill(0).map((_, i) => {
        const ct = t - 4;
        if (ct < 0 || ct > 60) return null;
        const ang = -Math.PI / 2 + (random(`a${i}${q.n}`) - 0.5) * 2.4;
        const v = 16 + random(`v${i}${q.n}`) * 22;
        const x = winX + Math.cos(ang) * v * ct;
        const y = 560 + Math.sin(ang) * v * ct + 0.75 * ct * ct;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 16, height: 26, borderRadius: 3, background: colors[i % colors.length], transform: `rotate(${ct * 18 + i * 37}deg)`, opacity: interpolate(ct, [40, 60], [1, 0], clamp) }} />
        );
      })}
      <div style={{ position: "absolute", top: 852, left: 0, right: 0, textAlign: "center", opacity: o, transform: `scale(${s}) rotate(-3deg)` }}>
        <span style={{ fontFamily: FONT, fontSize: 58, color: "#fff", background: "#111", borderRadius: 24, padding: "14px 36px 6px", border: `6px solid ${YELLOW}`, boxShadow: "0 14px 40px rgba(0,0,0,0.45)" }}>{q.reaction}</span>
      </div>
    </AbsoluteFill>
  );
};

const QuestionCounter: React.FC<{ tl: Timeline; q: QSeg }> = ({ tl, q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, q.from + 8, 12, 160);
  return (
    <div style={{ position: "absolute", top: 1040, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8, opacity: s }}>
      {new Array(tl.nq).fill(0).map((_, i) => (
        <div key={i} style={{ width: i + 1 === q.n ? 34 : 14, height: 14, borderRadius: 7, background: i + 1 < q.n ? "rgba(255,255,255,0.85)" : i + 1 === q.n ? YELLOW : "rgba(255,255,255,0.28)" }} />
      ))}
    </div>
  );
};

const QuestionScene: React.FC<{ tl: Timeline; q: QSeg }> = ({ tl, q }) => (
  <>
    <Card tl={tl} q={q} side="a" />
    <Card tl={tl} q={q} side="b" />
    <CenterBadge tl={tl} q={q} />
    <BottomBar tl={tl} q={q} />
    <Reaction tl={tl} q={q} />
    <QuestionCounter tl={tl} q={q} />
  </>
);

/* ---------------- level / mid / hook / outro ---------------- */

const Sunburst: React.FC<{ c1: string; c2: string; speed?: number }> = ({ c1, c2, speed = 0.4 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - 1500, top: 540 - 1500, width: 3000, height: 3000, background: `repeating-conic-gradient(from ${frame * speed}deg, ${c1} 0deg 12deg, ${c2} 12deg 24deg)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};

const LevelScene: React.FC<{ tl: Timeline; s: LevelSeg; levels: LevelSeg[] }> = ({ tl, s, levels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - s.from;
  const len = s.to - s.from;
  const inT = interpolate(t, [0, 8], [0, 1], clamp);
  const outT = interpolate(t, [len - 8, len], [0, 1], clamp);
  const e = pop(t, fps, 4, 8, 150);
  const txt = pop(t, fps, 10, 10, 170);
  const hue = [tl.theme.accent, "#FF8A00", "#FF3B3B", "#9B1BFF"][s.idx % 4];
  return (
    <AbsoluteFill style={{ clipPath: `circle(${inT * 120 * (1 - outT)}% at 50% 50%)` }}>
      <Sunburst c1={tl.theme.bg2} c2={tl.theme.bg1} speed={0.6} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 260, transform: `scale(${e}) rotate(${Math.sin(t / 6) * 10}deg) translateY(${Math.sin(t / 5) * 10}px)`, lineHeight: 1 }}>{s.emoji}</div>
        <div style={{ marginTop: 20, fontFamily: FONT, fontSize: 150, color: hue, ...stroke(18), textShadow: "0 12px 0 rgba(0,0,0,0.35)", transform: `scale(${txt}) rotate(-3deg)` }}>{s.name}</div>
        <div style={{ marginTop: 26, display: "flex", gap: 22 }}>
          {levels.map((l, i) => (
            <div key={i} style={{ width: 90, height: 26, borderRadius: 13, background: i <= s.idx ? hue : "rgba(255,255,255,0.3)", border: "4px solid #fff", transform: `scale(${pop(t, fps, 6 + i * 3, 12, 200)})` }} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MidScene: React.FC<{ tl: Timeline; from: number; to: number }> = ({ tl, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  const len = to - from;
  const o = interpolate(t, [0, 6, len - 6, len], [0, 1, 1, 0], clamp);
  const clickSub = t >= 36;
  const clickLike = t >= 66;
  // cursor: entra, clica «Suscribirse» (1,2 s), luego el pulgar (2,2 s)
  const cx = interpolate(t, [0, 30, 36, 60, 66], [1500, 1020, 1020, 760, 760], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(t, [0, 30, 36, 60, 66], [1000, 700, 700, 700, 700], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const press = (at: number) => (t >= at && t < at + 6 ? 0.88 : 1);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Sunburst c1={tl.theme.bg1} c2={tl.theme.bg2} speed={0.3} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 140 }}>
        <div style={{ fontFamily: FONT, fontSize: 120, color: "#fff", ...stroke(16), transform: `scale(${pop(t, fps, 2, 9, 160)}) rotate(-3deg)` }}>¿VAS BIEN? 🤔</div>
        <div style={{ fontFamily: FONT, fontSize: 64, color: tl.theme.accent, ...stroke(10), marginTop: 10, transform: `scale(${pop(t, fps, 10, 10, 160)})` }}>+7 ACIERTOS = PIENSAS COMO LA MAYORÍA</div>
        <div style={{ marginTop: 90, display: "flex", alignItems: "center", gap: 50 }}>
          <div style={{ width: 150, height: 150, borderRadius: 75, background: clickLike ? "#fff" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 86, transform: `scale(${press(66) * (clickLike ? 1 + Math.max(0, 1 - (t - 66) / 10) * 0.3 : 1)})` }}>👍</div>
          <div
            style={{
              fontFamily: FONT, fontSize: 80, color: "#fff", background: clickSub ? "#555" : "#FF0000", borderRadius: 30, padding: "26px 60px 16px",
              boxShadow: "0 10px 0 rgba(0,0,0,0.3)", transform: `scale(${press(36) * pop(t, fps, 14, 10, 160)})`,
            }}
          >
            {clickSub ? "SUSCRITO ✓" : "SUSCRIBIRSE"}
          </div>
          <div style={{ fontSize: 100, transform: `rotate(${clickSub ? Math.sin((t - 36) / 2) * 20 * Math.max(0, 1 - (t - 36) / 30) : 0}deg)` }}>🔔</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: cx, top: cy, fontSize: 90, transform: `scale(${t >= 34 && t < 40 ? 0.85 : t >= 64 && t < 70 ? 0.85 : 1})` }}>👆</div>
    </AbsoluteFill>
  );
};

const HookScene: React.FC<{ tl: Timeline; to: number }> = ({ tl, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outT = interpolate(frame, [to - 10, to], [0, 1], clamp);
  const title = pop(frame, fps, 2, 8, 140);
  const sub = pop(frame, fps, 16, 10, 160);
  const chip1 = pop(frame, fps, 60, 10, 160);
  const chip2 = pop(frame, fps, Math.round(to * 0.55), 10, 160);
  const shake = frame < 14 ? (14 - frame) * 1.6 : 0;
  const thumbs = tl.thumbs;
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + outT * 0.3})`, opacity: 1 - outT }}>
      {/* muro de miniaturas que se desliza */}
      {new Array(3).fill(0).map((_, r) => (
        <div key={r} style={{ position: "absolute", top: 40 + r * 345, left: 0, display: "flex", gap: 22, transform: `translateX(${(r % 2 ? -1 : 1) * ((frame * 2.2) % 474) - 474}px) rotate(-4deg)` }}>
          {new Array(7).fill(0).map((__, c) => {
            const src = thumbs[(r * 7 + c * 3) % Math.max(1, thumbs.length)];
            const s = pop(frame, fps, 4 + (r * 7 + c) * 2, 12, 150);
            return src ? (
              <div key={c} style={{ width: 452, height: 320, borderRadius: 26, overflow: "hidden", border: "8px solid #fff", transform: `scale(${s})`, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
                <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : null;
          })}
        </div>
      ))}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${tl.theme.bg2}EE 0%, ${tl.theme.bg2}CC 45%, ${tl.theme.bg2}55 100%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${Math.sin(frame * 7) * shake}px, ${Math.cos(frame * 5) * shake}px)` }}>
        <div style={{ transform: `scale(${title}) rotate(${(1 - title) * -20 - 2}deg)` }}>
          <Logo size={170} theme={tl.theme} spin={frame} />
        </div>
        <div style={{ marginTop: 16, fontFamily: FONT, fontSize: 170, lineHeight: 1, color: "#fff", ...stroke(20), textShadow: "0 14px 0 rgba(0,0,0,0.35)", transform: `scale(${title})` }}>
          ¿QUÉ <span style={{ color: tl.theme.accent }}>PREFIERES?</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: FONT, fontSize: 70, color: "#111", background: tl.theme.accent, borderRadius: 24, padding: "12px 40px 4px", transform: `scale(${sub}) rotate(-2deg)`, boxShadow: "0 10px 0 rgba(0,0,0,0.3)" }}>
          {tl.subtitle}
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 30 }}>
          <div style={{ fontFamily: FONT, fontSize: 52, color: "#fff", background: "rgba(0,0,0,0.45)", border: "5px solid #fff", borderRadius: 999, padding: "12px 34px 4px", transform: `scale(${chip1})` }}>🔥 {tl.nq} DILEMAS</div>
          <div style={{ fontFamily: FONT, fontSize: 52, color: "#fff", background: "rgba(0,0,0,0.45)", border: "5px solid #fff", borderRadius: 999, padding: "12px 34px 4px", transform: `scale(${chip2})` }}>🎯 CUENTA TUS ACIERTOS</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ tl: Timeline; from: number; lines: number[] }> = ({ tl, from, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  const head = pop(t, fps, 2, 9, 150);
  const rowsAt = lines[1] - from;
  const cta = pop(frame, fps, lines[2], 9, 160);
  const colors = ["#FF7AD9", "#39D353", YELLOW];
  return (
    <AbsoluteFill>
      <Sunburst c1={tl.theme.bg2} c2={tl.theme.bg1} speed={0.25} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 60 }}>
        <div style={{ fontFamily: FONT, fontSize: 130, color: "#fff", ...stroke(18), textShadow: "0 12px 0 rgba(0,0,0,0.35)", transform: `scale(${head}) rotate(-2deg)` }}>
          ¿CUÁNTAS <span style={{ color: tl.theme.accent }}>HAS ACERTADO?</span>
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
          {tl.scores.map(([range, label, emoji], i) => {
            const s = pop(t, fps, rowsAt + i * 14, 11, 160);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, transform: `translateX(${(1 - s) * (i % 2 ? 1400 : -1400)}px)` }}>
                <div style={{ width: 260, textAlign: "center", fontFamily: FONT, fontSize: 70, color: "#111", background: colors[i], borderRadius: 26, padding: "12px 0 2px", border: "6px solid #fff" }}>{range}</div>
                <div style={{ width: 1150, fontFamily: FONT, fontSize: 62, color: "#fff", background: "rgba(0,0,0,0.45)", borderRadius: 26, padding: "14px 34px 4px", border: "6px solid #fff" }}>
                  {emoji} {label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 50, display: "flex", gap: 34, alignItems: "center", transform: `scale(${cta})` }}>
          <div style={{ fontFamily: FONT, fontSize: 60, color: "#fff", ...stroke(8) }}>👇 COMENTA TU PUNTUACIÓN</div>
          <div style={{ fontFamily: FONT, fontSize: 64, color: "#fff", background: "#FF0000", borderRadius: 26, padding: "18px 44px 8px", boxShadow: "0 10px 0 rgba(0,0,0,0.3)", transform: `scale(${1 + Math.sin(frame / 5) * 0.04})` }}>SUSCRÍBETE 🔔</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Destello + rayos en cada cambio de escena. */
const Flash: React.FC<{ at: number; theme: Theme }> = ({ at, theme }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -3 || t > 9) return null;
  const o = interpolate(t, [-3, 0, 9], [0, 0.75, 0], clamp);
  return (
    <AbsoluteFill style={{ zIndex: 60, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#fff", opacity: o }} />
      {new Array(14).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 960, top: 540, width: 1500, height: 16, transformOrigin: "0 50%", transform: `rotate(${(i / 14) * 360 + t * 3}deg) translateX(${150 + t * 90}px)`, background: `linear-gradient(90deg, transparent, ${theme.accent})`, opacity: o }} />
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- main ---------------- */

export const QPLargo: React.FC<Timeline> = (tl) => {
  const frame = useCurrentFrame();
  const segs = tl.segments;
  const cur = segs.find((s) => frame >= s.from && frame < s.to) ?? segs[segs.length - 1];
  const levels = segs.filter((s): s is LevelSeg => s.type === "level");
  // escenas que se dibujan: la actual y, durante los últimos fotogramas de salida, la anterior
  const visible = segs.filter((s) => frame >= s.from - 1 && frame < s.to + 1);
  const qNow = cur?.type === "q" ? (cur as QSeg) : undefined;
  return (
    <AbsoluteFill style={{ background: tl.theme.bg2 }}>
      <Background theme={tl.theme} />
      <SideRails channel={tl.channel} theme={tl.theme} />
      {visible.some((s) => s.type === "q") ? <Header tl={tl} q={qNow} /> : null}
      {visible.map((s, i) => {
        if (s.type === "q") return <QuestionScene key={`q${s.n}`} tl={tl} q={s} />;
        if (s.type === "level") return <LevelScene key={`l${i}`} tl={tl} s={s} levels={levels} />;
        if (s.type === "mid") return <MidScene key="mid" tl={tl} from={s.from} to={s.to} />;
        if (s.type === "hook") return <HookScene key="hook" tl={tl} to={s.to} />;
        if (s.type === "outro") return <OutroScene key="outro" tl={tl} from={s.from} lines={s.lines} />;
        return null;
      })}
      {segs.filter((s) => s.type !== "q").map((s, i) => (
        <Flash key={i} at={s.from} theme={tl.theme} />
      ))}
      {tl.id !== "demo" ? <Audio src={staticFile(`qp/${tl.id}/audio.wav`)} /> : null}
    </AbsoluteFill>
  );
};
