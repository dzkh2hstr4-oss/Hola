import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2") });
loadFont({ family: "Grotesk", url: staticFile("fonts/space-grotesk.woff2") });
for (const weight of ["600", "800", "900"]) {
  loadFont({ family: "Montserrat", url: staticFile(`fonts/montserrat-${weight}.woff2`), weight });
}

export const MFPS = 30;
const sec = (s: number) => Math.round(s * MFPS);
const C = { bg1: "#07111f", bg2: "#0d2236", green: "#2BE07A", yellow: "#FFD43B", red: "#FF4D4D", text: "#F5F7FA", dim: "#8FA3BC", card: "rgba(255,255,255,0.06)" };

export type MItem = { label: string; value?: number; display?: string; price?: string; tag?: string };
export type MScene = {
  s: number;
  e: number;
  kind: "hook" | "stat" | "bars" | "prices" | "list" | "big" | "receipt" | "timer" | "versus" | "outro" | "chapter";
  title?: string;
  sub?: string;
  label?: string;
  source?: string;
  icon?: string;
  value?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  items?: MItem[];
  pick?: number;
  total?: string;
  sfx?: { f: string; at?: number; v?: number }[];
};
export type MCaption = { t: string; s: number; e: number };
export type MoneyProps = { vertical: boolean; scenes: MScene[]; captions: MCaption[]; voice: string; total: number; brand?: string };

const useU = () => {
  const { width, height } = useVideoConfig();
  return { u: Math.min(width, height) / 1080, vert: height > width, W: width, H: height };
};

// "*word*" -> highlighted
const Rich: React.FC<{ text: string; color?: string; delay?: number; stagger?: number }> = ({ text, color = C.yellow, delay = 0, stagger = 2 }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const hi = w.startsWith("*") && w.replace(/[^*]/g, "").length >= 1;
        const clean = w.replace(/\*/g, "");
        const sp = spring({ frame: f - delay - i * stagger, fps: MFPS, config: { damping: 13, stiffness: 180 } });
        return (
          <span key={i} style={{ display: "inline-block", color: hi ? color : undefined, transform: `translateY(${(1 - sp) * 40}%) scale(${0.85 + sp * 0.15})`, opacity: sp, marginRight: "0.25em" }}>
            {clean}
          </span>
        );
      })}
    </>
  );
};

const fmt = (v: number, d = 0) => {
  const [i, dec] = v.toFixed(d).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "");
};

// ---------- background ----------
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const { u, W, H } = useU();
  const syms = ["$", "%", "¢", "$", "€", "$", "↑", "$"];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 20%, ${C.bg2}, ${C.bg1} 70%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(43,224,122,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(43,224,122,0.06) 1px, transparent 1px)`,
          backgroundSize: `${80 * u}px ${80 * u}px`,
          backgroundPosition: `0 ${(f * 0.6) % (80 * u)}px`,
        }}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = ((i * 137) % 100) / 100;
        const sp = 0.15 + ((i * 53) % 10) / 40;
        const y = 1.1 - (((f * sp) / H + (i * 0.17)) % 1.25);
        return (
          <div key={i} style={{ position: "absolute", left: x * W, top: y * H, fontFamily: "Anton", fontSize: (40 + ((i * 29) % 60)) * u, color: C.green, opacity: 0.07 + ((i * 7) % 5) / 100 }}>
            {syms[i % syms.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Label: React.FC<{ text: string; color?: string }> = ({ text, color = C.green }) => {
  const { u } = useU();
  return <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 30 * u, letterSpacing: 4 * u, color, textTransform: "uppercase" }}>{text}</div>;
};

const Title: React.FC<{ text: string; size: number; delay?: number; center?: boolean }> = ({ text, size, delay = 4, center }) => {
  const { u } = useU();
  return <div style={{ fontFamily: "Anton", fontSize: size * u, lineHeight: 1.05, color: C.text, textAlign: center ? "center" : "left", textTransform: "uppercase" }}><Rich text={text} delay={delay} /></div>;
};

const Source: React.FC<{ text?: string }> = ({ text }) => {
  const { u, vert } = useU();
  if (!text) return null;
  return <div style={{ position: "absolute", left: 50 * u, bottom: vert ? 190 * u : 30 * u, fontFamily: "Grotesk", fontSize: 22 * u, color: C.dim }}>Source: {text}</div>;
};

// ---------- scenes ----------
const SceneView: React.FC<{ sc: MScene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const dur = sec(sc.e - sc.s);
  const items = sc.items ?? [];
  const pad = vert ? 70 * u : 120 * u;
  const center: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `0 ${pad}px`, paddingBottom: vert ? 420 * u : 120 * u };
  let body: React.ReactNode = null;

  if (sc.kind === "hook" || sc.kind === "big" || sc.kind === "chapter") {
    const size = sc.kind === "hook" ? (vert ? 128 : 120) : sc.kind === "chapter" ? 130 : vert ? 104 : 96;
    const pulse = 1 + Math.sin(f / 6) * 0.03;
    body = (
      <AbsoluteFill style={center}>
        {sc.icon ? <div style={{ fontSize: (vert ? 230 : 170) * u, transform: `scale(${spring({ frame: f, fps: MFPS, config: { damping: 8, stiffness: 160 } }) * pulse})`, marginBottom: 30 * u }}>{sc.icon}</div> : null}
        {sc.label ? <Label text={sc.label} /> : null}
        <div style={{ marginTop: 16 * u }}>
          <Title text={sc.title ?? ""} size={size} center />
        </div>
        {sc.sub ? <div style={{ marginTop: 26 * u, fontFamily: "Montserrat", fontWeight: 800, fontSize: 40 * u, color: C.dim, textAlign: "center", opacity: interpolate(f, [12, 22], [0, 1], { extrapolateRight: "clamp" }) }}>{sc.sub}</div> : null}
      </AbsoluteFill>
    );
  } else if (sc.kind === "stat") {
    const v = interpolate(f, [6, 45], [0, sc.value ?? 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const done = f > 45;
    body = (
      <AbsoluteFill style={center}>
        {sc.label ? <Label text={sc.label} /> : null}
        <div style={{ fontFamily: "Anton", fontSize: (vert ? 210 : 230) * u, color: C.green, lineHeight: 1.05, textShadow: `0 0 ${60 * u}px rgba(43,224,122,0.45)`, transform: `scale(${done ? 1 + Math.max(0, 0.08 - (f - 45) * 0.01) : 1})` }}>
          {sc.prefix ?? ""}
          {fmt(v, sc.decimals ?? 0)}
          {sc.suffix ?? ""}
        </div>
        {sc.title ? <Title text={sc.title} size={vert ? 62 : 64} center delay={14} /> : null}
      </AbsoluteFill>
    );
  } else if (sc.kind === "bars") {
    const mx = Math.max(...items.map((i) => i.value ?? 0), 1);
    const best = items.findIndex((i) => (i.value ?? 0) === mx);
    body = (
      <AbsoluteFill style={{ ...center, alignItems: "stretch" }}>
        {sc.title ? <div style={{ marginBottom: 40 * u }}><Title text={sc.title} size={vert ? 76 : 70} /></div> : null}
        {items.map((it, i) => {
          const at = 8 + i * 8;
          const p = interpolate(f, [at, at + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const w = ((it.value ?? 0) / mx) * 100 * p;
          const col = sc.pick === i || (sc.pick === undefined && i === best) ? C.green : "rgba(255,255,255,0.25)";
          return (
            <div key={i} style={{ marginBottom: 26 * u, opacity: interpolate(f, [at - 4, at + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Montserrat", fontWeight: 800, fontSize: (vert ? 46 : 36) * u, color: C.text, marginBottom: 8 * u }}>
                <span>{it.label}</span>
                <span style={{ color: col === C.green ? C.green : C.text }}>{it.display ?? fmt((it.value ?? 0) * p)}</span>
              </div>
              <div style={{ height: (vert ? 70 : 44) * u, borderRadius: 12 * u, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${w}%`, background: col, borderRadius: 12 * u, boxShadow: col === C.green ? `0 0 ${30 * u}px rgba(43,224,122,0.5)` : undefined }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  } else if (sc.kind === "prices" || sc.kind === "versus") {
    const n = items.length;
    body = (
      <AbsoluteFill style={center}>
        {sc.title ? <div style={{ marginBottom: 50 * u }}><Title text={sc.title} size={vert ? 76 : 70} center /></div> : null}
        <div style={{ display: "flex", flexDirection: vert && n > 2 ? "column" : "row", gap: 30 * u, alignItems: "center", justifyContent: "center" }}>
          {items.map((it, i) => {
            const picked = sc.pick === i;
            const reveal = sc.pick !== undefined && f > dur * 0.45;
            const sp = spring({ frame: f - 6 - i * 7, fps: MFPS, config: { damping: 12, stiffness: 170 } });
            return (
              <div key={i} style={{ transform: `scale(${sp * (reveal && picked ? 1.12 : reveal ? 0.92 : 1)}) rotate(${(i - (n - 1) / 2) * 3}deg)`, opacity: reveal && !picked ? 0.45 : 1, transition: "none" }}>
                <div style={{ minWidth: (vert ? 620 : 360) * u, padding: `${26 * u}px ${34 * u}px`, borderRadius: 24 * u, background: picked && reveal ? C.green : "#F5F7FA", color: "#0b1220", textAlign: "center", boxShadow: `0 ${18 * u}px ${50 * u}px rgba(0,0,0,0.5)`, position: "relative" }}>
                  <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: (vert ? 38 : 30) * u, opacity: 0.7, textTransform: "uppercase" }}>{it.label}</div>
                  <div style={{ fontFamily: "Anton", fontSize: (vert ? 150 : 120) * u, lineHeight: 1.05 }}>{it.price ?? it.display}</div>
                  {it.tag ? <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 28 * u, color: picked && reveal ? "#0b1220" : C.red }}>{it.tag}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  } else if (sc.kind === "list") {
    body = (
      <AbsoluteFill style={{ ...center, alignItems: "stretch" }}>
        {sc.title ? <div style={{ marginBottom: 36 * u }}><Title text={sc.title} size={vert ? 80 : 74} /></div> : null}
        {items.map((it, i) => {
          const at = 10 + Math.round((i * dur * 0.6) / Math.max(1, items.length));
          const v = spring({ frame: f - at, fps: MFPS, config: { damping: 14, stiffness: 170 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 * u, marginBottom: 22 * u, opacity: v, transform: `translateX(${(1 - v) * -80 * u}px)` }}>
              <div style={{ width: 70 * u, height: 70 * u, flexShrink: 0, borderRadius: 18 * u, background: C.green, color: "#07111f", fontFamily: "Anton", fontSize: 42 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: (vert ? 50 : 42) * u, color: C.text }}>{it.label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  } else if (sc.kind === "receipt") {
    const lines = items.length;
    const shown = interpolate(f, [6, Math.max(8, dur * 0.7)], [0, lines + 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    body = (
      <AbsoluteFill style={center}>
        <div style={{ width: (vert ? 760 : 700) * u, background: "#FBFAF6", color: "#111", padding: `${40 * u}px ${46 * u}px`, fontFamily: "Grotesk", fontSize: 34 * u, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.6)`, transform: `rotate(-2deg) translateY(${(1 - Math.min(1, f / 12)) * 300 * u}px)`, clipPath: "polygon(0 0,100% 0,100% 97%,95% 100%,90% 97%,85% 100%,80% 97%,75% 100%,70% 97%,65% 100%,60% 97%,55% 100%,50% 97%,45% 100%,40% 97%,35% 100%,30% 97%,25% 100%,20% 97%,15% 100%,10% 97%,5% 100%,0 97%)" }}>
          <div style={{ textAlign: "center", fontFamily: "Anton", fontSize: 50 * u, letterSpacing: 2 * u }}>{sc.title ?? "RECEIPT"}</div>
          <div style={{ borderTop: `${3 * u}px dashed #111`, margin: `${18 * u}px 0` }} />
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", opacity: shown > i ? 1 : 0, marginBottom: 10 * u }}>
              <span>{it.label}</span>
              <span style={{ fontWeight: 700, color: it.tag === "bad" ? "#c62828" : "#111" }}>{it.price}</span>
            </div>
          ))}
          <div style={{ borderTop: `${3 * u}px dashed #111`, margin: `${18 * u}px 0`, opacity: shown > lines ? 1 : 0 }} />
          {sc.total ? <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Anton", fontSize: 56 * u, opacity: shown > lines ? 1 : 0 }}><span>TOTAL</span><span>{sc.total}</span></div> : null}
        </div>
      </AbsoluteFill>
    );
  } else if (sc.kind === "timer") {
    const left = Math.max(0, 3599 - f * 7);
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    const blink = Math.floor(f / 8) % 2 === 0;
    body = (
      <AbsoluteFill style={center}>
        {sc.label ? <Label text={sc.label} color={C.red} /> : null}
        <div style={{ marginTop: 20 * u, fontFamily: "Anton", fontSize: (vert ? 200 : 220) * u, color: blink ? C.red : "#ff8a8a", textShadow: `0 0 ${50 * u}px rgba(255,77,77,0.6)`, letterSpacing: 6 * u }}>00:{mm}:{ss}</div>
        {sc.title ? <Title text={sc.title} size={vert ? 70 : 66} center delay={8} /> : null}
      </AbsoluteFill>
    );
  } else if (sc.kind === "outro") {
    const btn = spring({ frame: f - 20, fps: MFPS, config: { damping: 10, stiffness: 200 } });
    const clicked = f > 60;
    body = (
      <AbsoluteFill style={{ ...center, gap: 40 * u }}>
        <Title text={sc.title ?? ""} size={vert ? 96 : 90} center />
        <div style={{ transform: `scale(${btn})`, fontFamily: "Montserrat", fontWeight: 900, fontSize: 56 * u, color: "white", background: clicked ? "#3a3a3a" : "#FF0000", padding: `${20 * u}px ${54 * u}px`, borderRadius: 999 }}>{clicked ? "SUBSCRIBED ✓" : "SUBSCRIBE"}</div>
        {sc.sub ? <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 40 * u, color: C.dim, textAlign: "center" }}>{sc.sub}</div> : null}
      </AbsoluteFill>
    );
  }

  const fadeIn = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {body}
      <Source text={sc.source} />
    </AbsoluteFill>
  );
};

// ---------- captions ----------
const Captions: React.FC<{ caps: MCaption[] }> = ({ caps }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const time = f / MFPS;
  const c = caps.find((x) => time >= x.s && time < x.e);
  if (!c) return null;
  const per = vert ? 4 : 7;
  const words = c.t.split(" ").filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const tot = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.1, c.e - 0.1 - c.s);
  let acc = 0;
  let wi = words.length - 1;
  for (let i = 0; i < words.length; i++) {
    acc += weights[i];
    if (time < c.s + (acc / tot) * span) {
      wi = i;
      break;
    }
  }
  const ci = Math.floor(wi / per);
  const chunk = words.slice(ci * per, ci * per + per);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: vert ? 1380 * u : undefined, bottom: vert ? undefined : 60 * u, display: "flex", justifyContent: "center", padding: `0 ${50 * u}px` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.42em", textAlign: "center", fontFamily: "Montserrat", fontWeight: 900, fontSize: (vert ? 64 : 50) * u, lineHeight: 1.2, padding: `${8 * u}px ${22 * u}px`, background: vert ? "transparent" : "rgba(0,0,0,0.45)", borderRadius: 14 * u, WebkitTextStroke: vert ? `${3 * u}px #000` : undefined, paintOrder: "stroke", textShadow: vert ? `0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.7)` : undefined }}>
        {chunk.map((w, i) => {
          const idx = ci * per + i;
          return (
            <span key={i} style={{ color: idx === wi ? C.yellow : C.text, display: "inline-block", transform: idx === wi ? `scale(1.04)` : undefined }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Brand: React.FC<{ text: string }> = ({ text }) => {
  const { u, vert } = useU();
  return (
    <div style={{ position: "absolute", left: vert ? 0 : undefined, right: vert ? 0 : 40 * u, top: (vert ? 120 : 34) * u, textAlign: "center", fontFamily: "Montserrat", fontWeight: 900, fontSize: 28 * u, letterSpacing: 5 * u, color: C.green, opacity: 0.85 }}>
      {text}
    </div>
  );
};

export const MoneyVid: React.FC<MoneyProps> = ({ scenes, captions, voice, total, brand }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const end = sec(total);
  return (
    <AbsoluteFill style={{ background: C.bg1, color: C.text }}>
      <Background />
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s))}>
          <SceneView sc={sc} />
        </Sequence>
      ))}
      {brand ? <Brand text={brand} /> : null}
      <Captions caps={captions} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8 * u, width: `${(f / end) * 100}%`, background: C.green }} />
      <Audio src={staticFile(voice)} />
      {scenes.flatMap((sc, i) => {
        const base = sc.sfx ?? [{ f: "wyr/sfx/whoosh.wav", at: 0, v: 0.25 }];
        const extra: { f: string; at?: number; v?: number }[] = [];
        if (sc.kind === "stat") extra.push({ f: "wyr/sfx/tick.wav", at: 0.3, v: 0.35 }, { f: "wyr/sfx/ding.wav", at: 1.5, v: 0.4 });
        if (sc.kind === "hook" || sc.kind === "chapter") extra.push({ f: "voz/impacto.wav", at: 0, v: 0.5 });
        if (sc.kind === "prices" && sc.pick !== undefined) extra.push({ f: "wyr/sfx/ding.wav", at: (sc.e - sc.s) * 0.45, v: 0.45 });
        if (sc.kind === "timer") for (let k = 0; k < 6; k++) extra.push({ f: "wyr/sfx/tock.wav", at: 0.2 + k * 0.5, v: 0.3 });
        if (sc.kind === "receipt") for (let k = 0; k < (sc.items ?? []).length; k++) extra.push({ f: "wyr/sfx/tick.wav", at: 0.3 + k * 0.35, v: 0.3 });
        if (sc.kind === "list") (sc.items ?? []).forEach((_, k) => extra.push({ f: "wyr/sfx/pop.wav", at: (10 + (k * (sc.e - sc.s) * 30 * 0.6) / Math.max(1, (sc.items ?? []).length)) / 30, v: 0.35 }));
        if (sc.kind === "outro") extra.push({ f: "voz/click.wav", at: 2.0, v: 0.9 });
        return [...base, ...extra].map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(sc.s + (x.at ?? 0))} durationInFrames={sec(2)}>
            <Audio src={staticFile(x.f)} volume={x.v ?? 0.5} />
          </Sequence>
        ));
      })}
    </AbsoluteFill>
  );
};

export const moneyDuration = (p: MoneyProps) => sec(p.total);
