import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { fontFamily } from "../Lumora/common";
import { Flash, Kinetic, Sparkle, Vignette } from "../Anuncio/Anuncio";
import { Room } from "../Anuncio/Room";

// Extra scene formats for the animated reels, so every video can look like a different kind of content
// (news flash, search, phone notes, quiz, movie trailer, unboxing, clock, meme, receipt).

for (const [family, file, weight, style] of [
  ["Anton", "anton.woff2", "400", "normal"],
  ["Playfair", "playfair-900-italic.woff2", "900", "italic"],
  ["Space Grotesk", "space-grotesk.woff2", "400", "normal"],
  ["Caveat", "caveat.woff2", "400", "normal"],
] as const) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style });
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export type Theme = { accent: string; onAccent: string; hot: string; deep: string; glow: string };
type P = { producto: "atardecer" | "aurora" };
const modo = (p: P) => (p.producto === "aurora" ? "aurora" : "sol");

export type FormatoEscena =
  | { tipo: "noticia"; titular: string; ticker: string; dur: number }
  | { tipo: "buscador"; consulta: string; resultado: string; foto: string; dur: number }
  | { tipo: "notas"; titulo: string; items: string[]; dur: number }
  | { tipo: "quiz"; pregunta: string; opciones: string[]; correcta: number; dur: number }
  | { tipo: "trailer"; frases: string[]; dur: number }
  | { tipo: "caja"; texto: string; foto: string; dur: number }
  | { tipo: "reloj"; horas: string[]; texto: string; dur: number }
  | { tipo: "meme"; arriba: string; foto?: string; dur: number }
  | { tipo: "ticket"; producto: string; antes: string; ahora: string; ahorro: string; dur: number };

const Txt: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily, fontWeight: 900, color: "#fff", ...style }}>{children}</div>
);

/* ---------- noticia: breaking-news broadcast ---------- */
export const Noticia: React.FC<{ e: Extract<FormatoEscena, { tipo: "noticia" }>; p: P; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar = spring({ frame: frame - 6, fps, config: { damping: 14 } });
  const chars = Math.floor(interpolate(frame, [18, 18 + e.titular.length * 1.4], [0, e.titular.length], clamp));
  const lit = interpolate(frame, [10, 30], [0, 1], clamp);
  const tick = (frame * 7) % 2600;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, e.dur], [1.12, 1.25])})` }}>
        <Room lit={lit} lights={lit} modo={modo(p)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)" }} />
      <div style={{ position: "absolute", top: 90, left: 60, display: "flex", alignItems: "center", gap: 14, background: "rgba(0,0,0,0.6)", padding: "10px 22px", borderRadius: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: "#ff2a2a", opacity: Math.floor(frame / 12) % 2 ? 0.25 : 1 }} />
        <Txt style={{ fontSize: 40, letterSpacing: 3 }}>EN DIRECTO</Txt>
      </div>
      <Txt style={{ position: "absolute", top: 96, right: 60, fontSize: 38, letterSpacing: 4, opacity: 0.85 }}>LUMORA TV</Txt>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, transform: `translateX(${(1 - bar) * -1100}px)` }}>
        <div style={{ display: "inline-block", background: "#e1121b", padding: "12px 34px", fontFamily: "Anton", fontSize: 76, color: "#fff", letterSpacing: 2 }}>
          ÚLTIMA HORA
        </div>
        <div style={{ background: "#fff", padding: "22px 40px", minHeight: 200, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <Txt style={{ color: "#111", fontSize: 70, lineHeight: 1.08 }}>
            {e.titular.slice(0, chars)}
            <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: "#e1121b" }}>|</span>
          </Txt>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, height: 86, background: t.accent, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ background: "#111", height: "100%", display: "flex", alignItems: "center", padding: "0 24px", zIndex: 2 }}>
          <Txt style={{ fontSize: 40 }}>⚡</Txt>
        </div>
        <Txt style={{ whiteSpace: "nowrap", color: t.onAccent, fontSize: 46, transform: `translateX(${1100 - tick}px)` }}>
          {e.ticker} &nbsp;•&nbsp; {e.ticker} &nbsp;•&nbsp; {e.ticker}
        </Txt>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- buscador: typing a search, product shows up as the answer ---------- */
export const Buscador: React.FC<{ e: Extract<FormatoEscena, { tipo: "buscador" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typeEnd = 8 + e.consulta.length * 1.6;
  const chars = Math.floor(interpolate(frame, [8, typeEnd], [0, e.consulta.length], clamp));
  const go = typeEnd + 10;
  const up = interpolate(frame, [go, go + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const card = spring({ frame: frame - go - 6, fps, config: { damping: 12 } });
  const press = frame >= go - 3 && frame < go + 3 ? 0.92 : 1;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#f6f7fb,#e9ebf2)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(up, [0, 1], [640, 170]), textAlign: "center" }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 110, letterSpacing: -3, opacity: 1 - up * 0.6, transform: `scale(${1 - up * 0.35})` }}>
          <span style={{ color: "#4285f4" }}>B</span><span style={{ color: "#ea4335" }}>u</span><span style={{ color: "#fbbc05" }}>s</span>
          <span style={{ color: "#4285f4" }}>c</span><span style={{ color: "#34a853" }}>a</span><span style={{ color: "#ea4335" }}>r</span>
        </div>
        <div style={{ margin: "30px auto 0", width: 940, minHeight: 120, borderRadius: 60, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", padding: "0 40px", gap: 24, transform: `scale(${press})` }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily, fontWeight: 600, fontSize: 48, color: "#222", textAlign: "left", flex: 1 }}>
            {e.consulta.slice(0, chars)}
            <span style={{ opacity: frame % 16 < 8 && frame < go ? 1 : 0, color: "#4285f4" }}>|</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 70, right: 70, opacity: up, transform: `translateY(${(1 - card) * 300}px)` }}>
        <div style={{ fontFamily, fontWeight: 600, fontSize: 34, color: "#666", marginBottom: 16 }}>Resultado destacado</div>
        <div style={{ background: "#fff", borderRadius: 36, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
          <Img src={staticFile(e.foto)} style={{ width: "100%", height: 760, objectFit: "cover" }} />
          <div style={{ padding: "26px 36px 34px" }}>
            <div style={{ fontFamily, fontWeight: 900, fontSize: 58, color: "#1a0dab" }}>{e.resultado}</div>
            <div style={{ fontFamily, fontWeight: 800, fontSize: 40, color: "#0a7d32", marginTop: 8 }}>lumora · 🚚 envío gratis</div>
          </div>
        </div>
      </div>
      {frame > go + 20 && (
        <div style={{ position: "absolute", top: 1100, right: 140, fontSize: 120, transform: `translate(${interpolate(frame, [go + 20, go + 40], [120, 0], clamp)}px, ${interpolate(frame, [go + 20, go + 40], [200, 0], clamp)}px)` }}>👆</div>
      )}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 0 0 ${t.accent}` }} />
    </AbsoluteFill>
  );
};

/* ---------- notas: phone notes app being written ---------- */
export const Notas: React.FC<{ e: Extract<FormatoEscena, { tipo: "notas" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = Math.max(14, Math.floor((e.dur - 30) / (e.items.length + 1)));
  const phone = spring({ frame, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${t.deep}, #0a0612 75%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 140, bottom: 140, borderRadius: 70, background: "#fffdf5", boxShadow: "0 0 0 14px #111, 0 40px 120px rgba(0,0,0,0.6)", transform: `translateY(${(1 - phone) * 1400}px) rotate(${(1 - phone) * 8}deg)`, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "40px 50px 0", fontFamily, fontWeight: 800, fontSize: 36, color: "#d9a400" }}>
          <span>‹ Notas</span>
          <span>Listo</span>
        </div>
        <div style={{ padding: "40px 56px 0" }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 88, color: "#111", lineHeight: 1.05 }}>{e.titulo}</div>
          <div style={{ fontFamily, fontWeight: 600, fontSize: 30, color: "#999", margin: "14px 0 30px" }}>hoy</div>
          {e.items.map((it, i) => {
            const at = 14 + (i + 1) * step;
            const n = Math.floor(interpolate(frame, [at, at + it.length * 1.1], [0, it.length], clamp));
            const done = frame > at + it.length * 1.1 + 6;
            if (frame < at) return null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 34 }}>
                <div style={{ width: 62, height: 62, minWidth: 62, borderRadius: 31, border: `5px solid ${done ? "#d9a400" : "#bbb"}`, background: done ? "#d9a400" : "transparent", color: "#fff", fontSize: 40, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily }}>
                  {done ? "✓" : ""}
                </div>
                <div style={{ fontFamily, fontWeight: 800, fontSize: 64, color: "#222", lineHeight: 1.1 }}>{it.slice(0, n)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- quiz: guess with a timer, right answer lights up ---------- */
export const Quiz: React.FC<{ e: Extract<FormatoEscena, { tipo: "quiz" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = e.dur - 34;
  const timer = interpolate(frame, [24, reveal], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${t.deep}, #120a24)`, overflow: "hidden" }}>
      <Kinetic top={170} delay={2} lines={[{ text: e.pregunta, size: 88 }]} />
      <div style={{ position: "absolute", top: 560, left: 110, right: 110, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.2)" }}>
        <div style={{ width: `${timer * 100}%`, height: "100%", borderRadius: 13, background: timer < 0.3 ? "#ff3b3b" : t.accent }} />
      </div>
      {e.opciones.map((o, i) => {
        const s = spring({ frame: frame - 14 - i * 5, fps, config: { damping: 12 } });
        const ok = frame >= reveal && i === e.correcta;
        const bad = frame >= reveal && i !== e.correcta;
        const wob = bad && frame < reveal + 10 ? Math.sin(frame * 2) * 10 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 110, right: 110, top: 680 + i * 230, height: 190, borderRadius: 40, display: "flex", alignItems: "center", gap: 36, padding: "0 46px", background: ok ? "#2bd46b" : "rgba(255,255,255,0.12)", border: `6px solid ${ok ? "#fff" : "rgba(255,255,255,0.35)"}`, opacity: bad ? 0.35 : 1, transform: `translateX(${(1 - s) * (i % 2 ? 900 : -900) + wob}px) scale(${ok ? 1 + 0.06 * Math.sin((frame - reveal) / 3) : 1})` }}>
            <div style={{ fontFamily: "Anton", fontSize: 90, color: ok ? "#fff" : t.accent }}>{"ABC"[i]}</div>
            <Txt style={{ fontSize: 76 }}>{o}</Txt>
            {ok && <div style={{ marginLeft: "auto", fontSize: 90 }}>✅</div>}
          </div>
        );
      })}
      {frame >= reveal && <Flash at={reveal} color="#fff" len={5} />}
    </AbsoluteFill>
  );
};

/* ---------- trailer: letterbox, serif lines, slow reveal ---------- */
export const Trailer: React.FC<{ e: Extract<FormatoEscena, { tipo: "trailer" }>; p: P; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const seg = e.dur / e.frases.length;
  const lit = interpolate(frame, [e.dur * 0.55, e.dur * 0.75], [0, 1], clamp);
  const bars = interpolate(frame, [0, 12], [0, 260], { ...clamp, easing: Easing.out(Easing.cubic) });
  const flare = interpolate(frame, [e.dur * 0.55, e.dur], [-400, 1400]);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, e.dur], [1.35, 1.1])})`, filter: `brightness(${0.35 + lit * 0.65}) contrast(1.1)` }}>
        <Room lit={lit} lights={lit} modo={modo(p)} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 820, left: flare, width: 500, height: 120, background: `radial-gradient(ellipse, ${t.glow}aa, transparent 70%)`, opacity: lit, mixBlendMode: "screen" }} />
      {e.frases.map((f, i) => {
        const a = i * seg;
        const last = i === e.frases.length - 1;
        const o = interpolate(frame, [a, a + 8, a + seg - 8, a + seg], [0, 1, 1, last ? 1 : 0], clamp);
        const sc = interpolate(frame, [a, a + seg], [1.08, 1]);
        return (
          <div key={i} style={{ position: "absolute", left: 60, right: 60, top: last ? 780 : 860, textAlign: "center", opacity: o, transform: `scale(${sc})` }}>
            <div style={last ? { fontFamily: "Anton", fontSize: 150, color: "#fff", letterSpacing: 6, textShadow: `0 0 40px ${t.glow}` } : { fontFamily: "Playfair", fontStyle: "italic", fontWeight: 900, fontSize: 84, color: "#f1e4c3", textShadow: "0 4px 30px #000" }}>
              {f}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: bars, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bars, background: "#000" }} />
    </AbsoluteFill>
  );
};

/* ---------- caja: gift box shakes, lid pops, product rises ---------- */
export const Caja: React.FC<{ e: Extract<FormatoEscena, { tipo: "caja" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const POP = 40;
  const shake = frame < POP ? Math.sin(frame * 1.6) * interpolate(frame, [0, POP], [2, 16]) : 0;
  const lid = interpolate(frame, [POP, POP + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = spring({ frame: frame - POP - 4, fps, config: { damping: 11 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, ${t.hot}, ${t.deep} 45%, #0a0612)`, overflow: "hidden" }}>
      {frame > POP && (
        <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 62%, rgba(255,255,255,0.16) 0deg 7deg, transparent 7deg 20deg)", transform: `rotate(${frame * 0.6}deg) scale(2.2)`, opacity: lid }} />
      )}
      <Kinetic top={150} delay={2} lines={[{ text: e.texto, size: 88 }]} />
      <div style={{ position: "absolute", left: 540 - 300, top: interpolate(rise, [0, 1], [1100, 470]), width: 600, height: 700, borderRadius: 40, overflow: "hidden", boxShadow: `0 0 80px ${t.glow}`, opacity: rise, transform: `rotate(${(1 - rise) * -10}deg)` }}>
        <Img src={staticFile(e.foto)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 330, top: 1180, width: 660, height: 520, transform: `rotate(${shake}deg)`, transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", inset: 0, background: "#c81d3a", borderRadius: 26, boxShadow: "inset 0 -40px 0 rgba(0,0,0,0.18)" }} />
        <div style={{ position: "absolute", left: 290, top: 0, bottom: 0, width: 80, background: "#ffd34d" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 360, top: 1110, width: 720, height: 120, borderRadius: 22, background: "#e0294a", transform: `translate(${lid * 520}px, ${-lid * 700}px) rotate(${lid * 60 + shake}deg)`, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "absolute", left: 320, top: 0, bottom: 0, width: 80, background: "#ffd34d" }} />
        <div style={{ position: "absolute", left: 270, top: -90, fontSize: 150 }}>🎀</div>
      </div>
      {frame > POP &&
        new Array(40).fill(0).map((_, i) => {
          const a = random(`c${i}`) * Math.PI * 2;
          const v = 10 + random(`v${i}`) * 26;
          const k = frame - POP;
          return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * v * k, top: 1150 + Math.sin(a) * v * k * 0.8 + k * k * 0.35, width: 22, height: 34, background: ["#fff", t.accent, "#ffd34d", t.hot][i % 4], transform: `rotate(${k * 20 + i * 30}deg)`, opacity: interpolate(k, [0, 30, 45], [1, 1, 0], clamp) }} />;
        })}
      <Flash at={POP} color="#fff" len={6} />
    </AbsoluteFill>
  );
};

/* ---------- reloj: time passes, room gets darker, then it switches on ---------- */
export const Reloj: React.FC<{ e: Extract<FormatoEscena, { tipo: "reloj" }>; p: P; t: Theme }> = ({ e, p, t }) => {
  const frame = useCurrentFrame();
  const ON = e.dur - 40;
  const seg = ON / e.horas.length;
  const idx = Math.min(e.horas.length - 1, Math.floor(frame / seg));
  const dark = interpolate(frame, [0, ON], [0.85, 0.25], clamp);
  const lit = frame >= ON ? interpolate(frame, [ON, ON + 10], [0, 1], clamp) : 0;
  const flip = interpolate((frame % seg) / seg, [0, 0.12], [0.6, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: lit ? "none" : `brightness(${dark}) saturate(${dark})` }}>
        <Room lit={lit} lights={lit} modo={modo(p)} />
      </AbsoluteFill>
      {lit === 0 && <AbsoluteFill style={{ background: "rgba(20,30,70,0.35)" }} />}
      <div style={{ position: "absolute", top: 180, left: 0, right: 0, textAlign: "center", opacity: lit ? 0 : 1 }}>
        <div style={{ display: "inline-block", background: "rgba(0,0,0,0.65)", borderRadius: 40, padding: "10px 60px", transform: `scaleY(${flip})` }}>
          <div style={{ fontFamily: "Space Grotesk", fontSize: 230, color: "#ff3b3b", letterSpacing: 8, textShadow: "0 0 30px #ff3b3b88" }}>{e.horas[idx]}</div>
        </div>
      </div>
      {lit > 0 && <Kinetic top={200} delay={ON + 4} lines={[{ text: e.texto, bg: t.accent, color: t.onAccent, size: 92 }]} />}
      <Flash at={ON} color="#fff" len={6} />
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

/* ---------- meme: white caption bar + punch-in ---------- */
export const Meme: React.FC<{ e: Extract<FormatoEscena, { tipo: "meme" }>; p: P }> = ({ e, p }) => {
  const frame = useCurrentFrame();
  const PUNCH = Math.round(e.dur * 0.55);
  const z = frame >= PUNCH ? interpolate(frame, [PUNCH, PUNCH + 4], [1, 1.35], clamp) : 1;
  return (
    <AbsoluteFill style={{ background: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 120, left: 60, right: 60, minHeight: 380, display: "flex", alignItems: "center" }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 80, color: "#111", lineHeight: 1.15 }}>{e.arriba}</div>
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, bottom: 0, overflow: "hidden", background: "#000" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${z})`, filter: frame >= PUNCH ? "contrast(1.25) saturate(1.3)" : "none" }}>
          {e.foto ? (
            <Img src={staticFile(e.foto)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", top: -560, left: 0 }}>
              <Room lit={1} lights={1} modo={modo(p)} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- ticket: receipt prints with the real prices ---------- */
export const Ticket: React.FC<{ e: Extract<FormatoEscena, { tipo: "ticket" }>; t: Theme }> = ({ e, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const print = interpolate(frame, [4, 50], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const jitter = frame < 50 ? Math.sin(frame * 3) * 3 : 0;
  const stamp = spring({ frame: frame - 56, fps, config: { damping: 8 } });
  const btn = spring({ frame: frame - 74, fps, config: { damping: 10 } });
  const row = (a: string, b: string, big = false, strike = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Space Grotesk", fontSize: big ? 78 : 52, color: "#222", margin: "14px 0", fontWeight: big ? 700 : 400 }}>
      <span>{a}</span>
      <span style={{ textDecoration: strike ? "line-through" : "none", color: strike ? "#999" : "#222" }}>{b}</span>
    </div>
  );
  const dash = <div style={{ borderTop: "5px dashed #bbb", margin: "22px 0" }} />;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${t.deep}, #0a0612 80%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 100, left: 150, right: 150, height: 40, borderRadius: 20, background: "#222" }} />
      <div style={{ position: "absolute", top: 118, left: 180, right: 180, height: 1100 * print, overflow: "hidden", transform: `translateX(${jitter}px)` }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1100, background: "#fbfaf4", padding: "50px 56px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", fontFamily: "Anton", fontSize: 76, letterSpacing: 8, color: "#111" }}>LUMORA</div>
          <div style={{ textAlign: "center", fontFamily: "Space Grotesk", fontSize: 34, color: "#777" }}>ticket de compra</div>
          {dash}
          {row(e.producto, e.antes, false, true)}
          {row("Descuento", `-${e.ahorro}`)}
          {row("Envío", "0,00 €")}
          {dash}
          {row("TOTAL", e.ahora, true)}
          {dash}
          <div style={{ textAlign: "center", fontFamily: "Caveat", fontSize: 64, color: t.deep }}>¡gracias! ✨</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 860, right: 120, transform: `scale(${(2 - stamp) * stamp}) rotate(-14deg)`, opacity: stamp, border: `10px solid ${t.deep}`, borderRadius: 24, padding: "10px 30px", fontFamily: "Anton", fontSize: 84, color: t.deep, background: "rgba(255,255,255,0.85)" }}>
        AHORRAS {e.ahorro}
      </div>
      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${btn})` }}>
        <div style={{ fontSize: 90, transform: `translateY(${Math.sin(frame / 4) * 12}px)` }}>☝️</div>
        <Txt style={{ fontSize: 64, padding: "22px 54px", borderRadius: 60, background: `linear-gradient(90deg, ${t.deep}, ${t.hot})`, boxShadow: "0 0 0 6px rgba(255,255,255,0.85)" }}>Cómpralo en mi bio</Txt>
      </div>
      <Txt style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", fontSize: 52, letterSpacing: 6, opacity: interpolate(frame, [80, 90], [0, 0.9], clamp) }}>LUMORA</Txt>
      {frame > 56 && [0, 1, 2, 3].map((i) => <Sparkle key={i} x={200 + i * 220} y={820 + (i % 2) * 120} at={56 + i * 3} size={70} />)}
    </AbsoluteFill>
  );
};

/* sound cues for the new formats (frame offsets inside the scene) */
export const formatoSfx = (e: FormatoEscena): { at: number; f: string; v: number }[] => {
  switch (e.tipo) {
    case "noticia":
      return [{ at: 2, f: "impacto.wav", v: 0.4 }, { at: 6, f: "whoosh.wav", v: 0.35 }];
    case "buscador": {
      const end = 8 + e.consulta.length * 1.6;
      const keys = [];
      for (let f = 8; f < end; f += 3) keys.push({ at: Math.round(f), f: "click.wav", v: 0.18 });
      return [...keys, { at: Math.round(end + 10), f: "click.wav", v: 0.6 }, { at: Math.round(end + 16), f: "brillo.wav", v: 0.3 }];
    }
    case "notas":
      return [{ at: 0, f: "whoosh.wav", v: 0.3 }];
    case "quiz":
      return [{ at: 10, f: "whoosh.wav", v: 0.3 }, { at: e.dur - 34, f: "brillo.wav", v: 0.4 }, { at: e.dur - 34, f: "impacto.wav", v: 0.3 }];
    case "trailer":
      return e.frases.map((_, i) => ({ at: Math.round((i * e.dur) / e.frases.length), f: "impacto.wav", v: 0.45 }));
    case "caja":
      return [{ at: 0, f: "whoosh.wav", v: 0.25 }, { at: 39, f: "impacto.wav", v: 0.45 }, { at: 41, f: "brillo.wav", v: 0.35 }];
    case "reloj":
      return [...e.horas.map((_, i) => ({ at: Math.round((i * (e.dur - 40)) / e.horas.length), f: "click.wav", v: 0.35 })), { at: e.dur - 41, f: "click.wav", v: 0.8 }, { at: e.dur - 39, f: "brillo.wav", v: 0.3 }];
    case "meme":
      return [{ at: Math.round(e.dur * 0.55), f: "impacto.wav", v: 0.6 }];
    case "ticket":
      return [{ at: 4, f: "whoosh.wav", v: 0.2 }, { at: 56, f: "impacto.wav", v: 0.45 }, { at: 74, f: "click.wav", v: 0.5 }];
  }
};

export const FORMATO_MIN: Record<FormatoEscena["tipo"], number> = {
  noticia: 110, buscador: 120, notas: 120, quiz: 130, trailer: 150, caja: 100, reloj: 130, meme: 90, ticket: 125,
};
