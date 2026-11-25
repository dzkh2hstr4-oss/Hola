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
  kind: "hook" | "stat" | "bars" | "prices" | "list" | "big" | "receipt" | "timer" | "versus" | "outro" | "chapter" | "line" | "pie" | "people" | "stack" | "phone" | "meter" | "timeline" | "slot" | "wheel" | "jar" | "compare";
  bg?: "grid" | "rays" | "stripes" | "dots" | "waves" | "neon" | "paper" | "blueprint" | "casino";
  points?: number[];
  symbols?: string[];
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
  track?: string;
  idx?: number;
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
          <span key={i} style={{ display: "inline-block", position: "relative", color: hi ? color : undefined, transform: `translateY(${(1 - sp) * 40}%) scale(${0.85 + sp * 0.15})`, opacity: sp, marginRight: "0.25em" }}>
            {clean}
            {hi ? <span style={{ position: "absolute", left: 0, bottom: "-0.02em", height: "0.09em", borderRadius: 99, background: color, width: `${interpolate(f - delay - i * stagger, [6, 16], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%` }} /> : null}
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
const Background: React.FC<{ bg?: string }> = ({ bg = "grid" }) => {
  const f = useCurrentFrame();
  const { u, W, H } = useU();
  const syms = ["$", "%", "¢", "$", "€", "$", "↑", "$"];
  const pal: Record<string, [string, string, string]> = {
    grid: [C.bg2, C.bg1, "rgba(43,224,122,0.18)"],
    rays: ["#1b2a4a", "#070b18", "rgba(255,212,59,0.14)"],
    stripes: ["#2a1036", "#0d0618", "rgba(255,62,165,0.16)"],
    dots: ["#0f2f2a", "#06130f", "rgba(43,224,122,0.14)"],
    waves: ["#0e2a4d", "#051022", "rgba(62,198,255,0.18)"],
    neon: ["#2b0a3d", "#0a0414", "rgba(190,80,255,0.22)"],
    paper: ["#f5efe2", "#e6dcc8", "rgba(0,0,0,0.05)"],
    blueprint: ["#0b3a6e", "#062a52", "rgba(255,255,255,0.10)"],
    casino: ["#3a0d14", "#0c0406", "rgba(255,77,77,0.22)"],
  };
  const [c1, c2, acc] = pal[bg] ?? pal.grid;
  const light = bg === "paper";
  let pattern: React.ReactNode = null;
  if (bg === "grid" || bg === "blueprint") {
    const line = bg === "blueprint" ? "rgba(255,255,255,0.10)" : "rgba(43,224,122,0.06)";
    pattern = <AbsoluteFill style={{ backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, backgroundSize: `${80 * u}px ${80 * u}px`, backgroundPosition: `0 ${(f * 0.6) % (80 * u)}px` }} />;
  } else if (bg === "rays" || bg === "casino") {
    pattern = <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${f * 0.4}deg at 50% 45%, ${acc} 0deg 8deg, transparent 8deg 20deg)`, opacity: 0.55 }} />;
  } else if (bg === "stripes") {
    pattern = <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(45deg, ${acc} 0 ${30 * u}px, transparent ${30 * u}px ${90 * u}px)`, backgroundPosition: `${f * 1.5}px 0` }} />;
  } else if (bg === "dots" || bg === "paper") {
    pattern = <AbsoluteFill style={{ backgroundImage: `radial-gradient(${light ? "rgba(0,0,0,0.09)" : "rgba(43,224,122,0.16)"} ${3 * u}px, transparent ${3.5 * u}px)`, backgroundSize: `${46 * u}px ${46 * u}px`, backgroundPosition: `${f * 0.4}px ${f * 0.4}px` }} />;
  } else if (bg === "waves") {
    pattern = (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 7 }).map((_, k) => {
          const y0 = H * (0.25 + k * 0.1);
          const d = Array.from({ length: 41 }).map((__, i) => { const x = (i / 40) * W; const y = y0 + Math.sin(i / 4 + f / 20 + k) * 28 * u; return `${i ? "L" : "M"}${x.toFixed(0)},${y.toFixed(0)}`; }).join(" ");
          return <path key={k} d={d} fill="none" stroke="rgba(62,198,255,0.14)" strokeWidth={3 * u} />;
        })}
      </svg>
    );
  } else if (bg === "neon") {
    pattern = (
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * 0.5, backgroundImage: `linear-gradient(rgba(190,80,255,0.35) 2px, transparent 2px), linear-gradient(90deg, rgba(190,80,255,0.35) 2px, transparent 2px)`, backgroundSize: `${90 * u}px ${90 * u}px`, backgroundPosition: `0 ${(f * 2) % (90 * u)}px`, transform: "perspective(600px) rotateX(60deg)", transformOrigin: "bottom" }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 20%, ${c1}, ${c2} 72%)` }}>
      {[
        { sx: 0.25, sy: 0.3, r: 0.55, k: 0 },
        { sx: 0.75, sy: 0.7, r: 0.6, k: 2 },
      ].map((b, i) => (
        <div key={"b" + i} style={{ position: "absolute", left: (b.sx + 0.12 * Math.sin(f / 90 + b.k)) * W - (b.r * Math.max(W, H)) / 2, top: (b.sy + 0.1 * Math.cos(f / 110 + b.k)) * H - (b.r * Math.max(W, H)) / 2, width: b.r * Math.max(W, H), height: b.r * Math.max(W, H), borderRadius: "50%", background: `radial-gradient(circle, ${acc}, transparent 65%)` }} />
      ))}
      {pattern}
      {!light
        ? Array.from({ length: 10 }).map((_, i) => {
            const x = ((i * 137) % 100) / 100;
            const sp = 0.15 + ((i * 53) % 10) / 40;
            const y = 1.1 - (((f * sp) / H + i * 0.17) % 1.25);
            return <div key={i} style={{ position: "absolute", left: x * W, top: y * H, fontFamily: "Anton", fontSize: (40 + ((i * 29) % 60)) * u, color: C.green, opacity: 0.06 }}>{syms[i % syms.length]}</div>;
          })
        : null}
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


// ---------- coin burst (on reveals) ----------
const Burst: React.FC<{ at: number; color?: string }> = ({ at, color = C.green }) => {
  const f = useCurrentFrame() - at;
  const { u, W, H } = useU();
  if (f < 0 || f > 40) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const ang = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
        const sp = (14 + (i * 37) % 12) * u;
        const x = W / 2 + Math.cos(ang) * sp * f;
        const y = H * 0.42 + Math.sin(ang) * sp * f + 0.5 * 1.1 * u * f * f;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: "Anton", fontSize: (60 + (i % 4) * 18) * u, color: i % 4 === 0 ? C.yellow : color, opacity: 0.85 * (1 - f / 40), transform: `rotate(${f * 12 + i * 20}deg)` }}>
            {i % 2 === 0 ? "$" : "¢"}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};


// ---------- rich visual scenes ----------
const LineChart: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const pts = sc.points ?? [1, 2, 3];
  const w = (vert ? 900 : 1300) * u, h = (vert ? 620 : 520) * u;
  const mx = Math.max(...pts), mn = Math.min(0, ...pts);
  const P = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * w, y: h - ((v - mn) / (mx - mn || 1)) * h * 0.9 }));
  const prog = interpolate(f, [8, Math.max(20, dur * 0.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const segs = (pts.length - 1) * prog;
  const k = Math.min(pts.length - 2, Math.floor(segs));
  const t = segs - k;
  const tip = { x: P[k].x + (P[k + 1].x - P[k].x) * t, y: P[k].y + (P[k + 1].y - P[k].y) * t };
  const path = [...P.slice(0, k + 1), tip].map((q, i) => `${i ? "L" : "M"}${q.x},${q.y}`).join(" ");
  const val = pts[0] + (pts[pts.length - 1] - pts[0]) * prog;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 30 * u }}><Title text={sc.title} size={vert ? 76 : 72} center /></div> : null}
      <svg width={w + 120 * u} height={h + 60 * u} style={{ overflow: "visible" }}>
        <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.green} stopOpacity="0.45" /><stop offset="1" stopColor={C.green} stopOpacity="0" /></linearGradient></defs>
        <g transform={`translate(${40 * u},${20 * u})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((g, i) => <line key={i} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.08)" strokeWidth={2 * u} />)}
          <path d={`${path} L${tip.x},${h} L0,${h} Z`} fill="url(#lg)" />
          <path d={path} fill="none" stroke={C.green} strokeWidth={9 * u} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${12 * u}px rgba(43,224,122,0.7))` }} />
          {P.slice(0, k + 1).map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={10 * u} fill={C.yellow} />)}
          <circle cx={tip.x} cy={tip.y} r={(16 + 4 * Math.sin(f / 4)) * u} fill={C.green} />
          <g transform={`translate(${tip.x},${tip.y - 50 * u})`}>
            <rect x={-110 * u} y={-46 * u} width={220 * u} height={64 * u} rx={14 * u} fill="#fff" />
            <text x={0} y={0} textAnchor="middle" fontFamily="Anton" fontSize={44 * u} fill="#07111f">{(sc.prefix ?? "") + fmt(val, sc.decimals ?? 0) + (sc.suffix ?? "")}</text>
          </g>
          {(sc.items ?? []).map((it, i) => <text key={i} x={(i / Math.max(1, (sc.items ?? []).length - 1)) * w} y={h + 46 * u} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={28 * u} fill={C.dim}>{it.label}</text>)}
        </g>
      </svg>
      {sc.label ? <div style={{ marginTop: 10 * u }}><Label text={sc.label} /></div> : null}
    </AbsoluteFill>
  );
};

const Donut: React.FC<{ sc: MScene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const pct = interpolate(f, [8, 50], [0, sc.value ?? 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const R = (vert ? 300 : 260) * u, sw = 70 * u, Cc = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 30 * u }}><Title text={sc.title} size={vert ? 76 : 66} center /></div> : null}
      <div style={{ position: "relative", width: 2 * R + sw, height: 2 * R + sw, transform: `rotate(${Math.sin(f / 30) * 3}deg)` }}>
        <svg width={2 * R + sw} height={2 * R + sw}>
          <circle cx={R + sw / 2} cy={R + sw / 2} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
          <circle cx={R + sw / 2} cy={R + sw / 2} r={R} fill="none" stroke={C.green} strokeWidth={sw} strokeDasharray={`${(pct / 100) * Cc} ${Cc}`} strokeLinecap="round" transform={`rotate(-90 ${R + sw / 2} ${R + sw / 2})`} style={{ filter: `drop-shadow(0 0 ${18 * u}px rgba(43,224,122,0.6))` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: "Anton", fontSize: 150 * u, color: C.text, lineHeight: 1 }}>{fmt(pct, sc.decimals ?? 0)}%</div>
          {sc.label ? <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 30 * u, color: C.dim, textAlign: "center", maxWidth: R * 1.4 }}>{sc.label}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const People: React.FC<{ sc: MScene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const total = (sc.points ?? [100])[0];
  const hi = sc.value ?? 10;
  const cols = total <= 10 ? total : total <= 20 ? 10 : vert ? 10 : 20;
  const size = (vert ? 78 : total > 50 ? 64 : 90) * u;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 34 * u }}><Title text={sc.title} size={vert ? 76 : 68} center /></div> : null}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: 10 * u }}>
        {Array.from({ length: total }).map((_, i) => {
          const at = 6 + (i % cols) + Math.floor(i / cols) * 2;
          const sp = spring({ frame: f - at, fps: MFPS, config: { damping: 11, stiffness: 200 } });
          const on = i < hi && f > 30 + i;
          return <div key={i} style={{ fontSize: size * 0.9, lineHeight: 1, textAlign: "center", transform: `scale(${sp * (on ? 1.15 : 1)})`, filter: on ? `drop-shadow(0 0 ${10 * u}px ${C.green})` : "grayscale(1) brightness(0.55)" }}>{on ? (sc.icon ?? "🧍") : "🧍"}</div>;
        })}
      </div>
      {sc.label ? <div style={{ marginTop: 30 * u }}><Label text={sc.label} /></div> : null}
    </AbsoluteFill>
  );
};

const Stack: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const n = 14;
  const shown = interpolate(f, [6, Math.max(20, dur * 0.6)], [0, n], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = (sc.value ?? 0) * Math.min(1, shown / n);
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 20 * u }}><Title text={sc.title} size={vert ? 76 : 66} center /></div> : null}
      <div style={{ position: "relative", width: 520 * u, height: 470 * u }}>
        {Array.from({ length: n }).map((_, i) => {
          const d = shown - i;
          if (d <= 0) return null;
          const drop = interpolate(Math.min(1, d), [0, 1], [-400 * u, 0], { easing: Easing.out(Easing.bounce) });
          return (
            <div key={i} style={{ position: "absolute", left: 20 * u + ((i * 37) % 7) * 3 * u, bottom: i * 26 * u, width: 480 * u, height: 110 * u, transform: `translateY(${drop}px) rotate(${((i % 3) - 1) * 2}deg)`, borderRadius: 10 * u, background: "linear-gradient(135deg,#7ee2a8,#2a9d5c)", border: `${4 * u}px solid #1d6b40`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,0,0,0.4)" }}>
              <div style={{ width: 80 * u, height: 80 * u, borderRadius: "50%", border: `${4 * u}px solid #1d6b40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: 50 * u, color: "#1d6b40" }}>$</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: "Anton", fontSize: 150 * u, color: C.green, textShadow: `0 0 ${40 * u}px rgba(43,224,122,0.5)` }}>{(sc.prefix ?? "$") + fmt(v, sc.decimals ?? 0) + (sc.suffix ?? "")}</div>
      {sc.label ? <Label text={sc.label} /> : null}
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const items = sc.items ?? [];
  const W2 = 470 * u, H2 = 900 * u * (vert ? 1 : 0.85);
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: vert ? "column" : "row", gap: 60 * u, paddingBottom: vert ? 380 * u : 40 * u }}>
      {sc.title && !vert ? <div style={{ maxWidth: 700 * u }}><Title text={sc.title} size={80} /></div> : null}
      <div style={{ width: W2, height: H2, borderRadius: 60 * u, background: "#111", border: `${10 * u}px solid #2b2f36`, position: "relative", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `rotate(${Math.sin(f / 25) * 2}deg) translateY(${Math.sin(f / 18) * 8 * u}px)` }}>
        <div style={{ position: "absolute", left: "35%", right: "35%", top: 14 * u, height: 30 * u, borderRadius: 99, background: "#000" }} />
        <div style={{ position: "absolute", top: 70 * u, left: 0, right: 0, textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 70 * u, color: "#fff" }}>9:41</div>
        {items.map((it, i) => {
          const at = 10 + Math.round((i * dur * 0.6) / Math.max(1, items.length));
          const sp = spring({ frame: f - at, fps: MFPS, config: { damping: 13, stiffness: 190 } });
          return (
            <div key={i} style={{ position: "absolute", left: 20 * u, right: 20 * u, top: (190 + i * 140) * u, background: "rgba(255,255,255,0.92)", borderRadius: 26 * u, padding: `${16 * u}px ${20 * u}px`, transform: `translateY(${(1 - sp) * -120 * u}px)`, opacity: sp, display: "flex", gap: 14 * u, alignItems: "center" }}>
              <div style={{ fontSize: 46 * u }}>{it.tag ?? "🔔"}</div>
              <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 25 * u, color: "#111", lineHeight: 1.2 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
      {sc.title && vert ? <Title text={sc.title} size={70} center /> : null}
    </AbsoluteFill>
  );
};

const Meter: React.FC<{ sc: MScene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const target = sc.value ?? 80;
  const sp = spring({ frame: f - 8, fps: MFPS, config: { damping: 6, stiffness: 60 } });
  const v = target * sp + Math.sin(f / 3) * (f > 40 ? 1.2 : 0);
  const ang = -90 + (v / 100) * 180;
  const R = (vert ? 380 : 330) * u;
  const arc = (a0: number, a1: number) => { const p = (a: number) => [R + 30 * u + R * Math.cos(((a - 180) * Math.PI) / 180), R + 30 * u + R * Math.sin(((a - 180) * Math.PI) / 180)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`; };
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 30 * u }}><Title text={sc.title} size={vert ? 76 : 70} center /></div> : null}
      <svg width={2 * R + 60 * u} height={R + 80 * u}>
        <path d={arc(0, 60)} stroke={C.green} strokeWidth={50 * u} fill="none" />
        <path d={arc(60, 120)} stroke={C.yellow} strokeWidth={50 * u} fill="none" />
        <path d={arc(120, 180)} stroke={C.red} strokeWidth={50 * u} fill="none" />
        <g transform={`translate(${R + 30 * u},${R + 30 * u}) rotate(${ang})`}>
          <path d={`M${-14 * u},0 L0,${-R * 0.9} L${14 * u},0 Z`} fill="#fff" />
          <circle r={26 * u} fill="#fff" />
        </g>
      </svg>
      {sc.label ? <div style={{ marginTop: 10 * u }}><Label text={sc.label} color={v > 66 ? C.red : v > 33 ? C.yellow : C.green} /></div> : null}
    </AbsoluteFill>
  );
};

const Timeline: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const items = sc.items ?? [];
  const w = (vert ? 900 : 1600) * u;
  const prog = interpolate(f, [6, Math.max(20, dur * 0.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 230 * u }}><Title text={sc.title} size={vert ? 76 : 70} center /></div> : null}
      <div style={{ position: "relative", width: w, height: 8 * u, background: "rgba(255,255,255,0.12)", borderRadius: 9 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: C.green, borderRadius: 9, boxShadow: `0 0 ${18 * u}px ${C.green}` }} />
        {items.map((it, i) => {
          const x = (i / Math.max(1, items.length - 1)) * w;
          const on = prog * (items.length - 1) >= i - 0.01;
          const sp = spring({ frame: on ? f - 6 - Math.round(((i / Math.max(1, items.length - 1)) * (dur * 0.7 - 6))) : -1, fps: MFPS, config: { damping: 10, stiffness: 200 } });
          const up = i % 2 === 0;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 0 }}>
              <div style={{ position: "absolute", left: -18 * u, top: -14 * u, width: 36 * u, height: 36 * u, borderRadius: "50%", background: on ? C.yellow : "#334", transform: `scale(${0.6 + 0.6 * sp})` }} />
              <div style={{ position: "absolute", left: -160 * u, width: 320 * u, top: up ? -150 * u : 40 * u, textAlign: "center", opacity: sp, transform: `translateY(${(1 - sp) * (up ? 30 : -30) * u}px)` }}>
                <div style={{ fontFamily: "Anton", fontSize: 56 * u, color: C.yellow }}>{it.label}</div>
                <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 26 * u, color: C.text }}>{it.display}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Slot: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const fin = sc.symbols ?? ["7", "7", "🍒"];
  const pool = ["🍒", "7", "💎", "🔔", "🍋", "⭐", "BAR"];
  const cell = (vert ? 220 : 200) * u;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 30 * u }}><Title text={sc.title} size={vert ? 76 : 70} center /></div> : null}
      <div style={{ display: "flex", gap: 18 * u, padding: 26 * u, background: "linear-gradient(#c62828,#7a0f0f)", borderRadius: 40 * u, border: `${10 * u}px solid #FFD43B`, boxShadow: `0 0 ${50 * u}px rgba(255,212,59,0.4)` }}>
        {fin.map((sym, i) => {
          const stop = 25 + i * 14;
          const spinning = f < stop;
          const shown = spinning ? pool[(Math.floor(f * 1.7) + i * 3) % pool.length] : sym;
          const bounce = spinning ? 0 : Math.sin(Math.min(1, (f - stop) / 8) * Math.PI) * -18 * u;
          return (
            <div key={i} style={{ width: cell, height: cell * 1.2, background: "#fff", borderRadius: 18 * u, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: cell * 0.6, color: "#c62828", filter: spinning ? `blur(${3 * u}px)` : "none", transform: `translateY(${bounce + (spinning ? Math.sin(f) * 10 * u : 0)}px)` }}>
              {shown}
            </div>
          );
        })}
      </div>
      {sc.label ? <div style={{ marginTop: 30 * u }}><Label text={sc.label} color={C.yellow} /></div> : null}
    </AbsoluteFill>
  );
};

const Wheel: React.FC<{ sc: MScene }> = ({ sc }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const R = (vert ? 380 : 330) * u;
  const rot = 1440 * (1 - Math.pow(1 - Math.min(1, f / 75), 3));
  const ballA = -rot * 1.3 + 30;
  const n = 38;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 30 * u }}><Title text={sc.title} size={vert ? 76 : 66} center /></div> : null}
      <div style={{ position: "relative", width: 2 * R, height: 2 * R }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${16 * u}px solid #c99b2b`, background: `repeating-conic-gradient(from ${rot}deg, #c62828 0 ${360 / n}deg, #111 ${360 / n}deg ${720 / n}deg)`, boxShadow: `0 0 ${60 * u}px rgba(255,77,77,0.4)` }} />
        <div style={{ position: "absolute", left: R * 0.55, top: R * 0.55, width: R * 0.9, height: R * 0.9, borderRadius: "50%", background: "radial-gradient(circle,#2BE07A,#147a44)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: 70 * u, color: "#07111f" }}>{sc.label ?? ""}</div>
        <div style={{ position: "absolute", left: R + Math.cos((ballA * Math.PI) / 180) * R * 0.78 - 14 * u, top: R + Math.sin((ballA * Math.PI) / 180) * R * 0.78 - 14 * u, width: 28 * u, height: 28 * u, borderRadius: "50%", background: "#fff", boxShadow: "0 0 10px #fff" }} />
      </div>
    </AbsoluteFill>
  );
};

const Jar: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const fill = interpolate(f, [8, Math.max(20, dur * 0.7)], [0, (sc.value ?? 70) / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const Wj = 420 * u, Hj = 520 * u;
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: vert ? "column" : "row", gap: 70 * u, paddingBottom: vert ? 380 * u : 40 * u }}>
      {sc.title ? <div style={{ maxWidth: vert ? 900 * u : 700 * u }}><Title text={sc.title} size={vert ? 76 : 80} center={vert} /></div> : null}
      <div style={{ position: "relative", width: Wj, height: Hj }}>
        <div style={{ position: "absolute", left: Wj * 0.2, right: Wj * 0.2, top: -30 * u, height: 50 * u, borderRadius: 14 * u, background: "#c99b2b" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: `${60 * u}px ${60 * u}px ${80 * u}px ${80 * u}px`, border: `${8 * u}px solid rgba(255,255,255,0.6)`, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: "linear-gradient(#FFD43B,#d9a400)" }}>
            <svg width={Wj} height={30 * u} style={{ position: "absolute", top: -20 * u }}><path d={`M0,${15 * u} ${Array.from({ length: 11 }).map((_, i) => `L${(i / 10) * Wj},${15 * u + Math.sin(i + f / 5) * 8 * u}`).join(" ")} L${Wj},${30 * u} L0,${30 * u} Z`} fill="#FFD43B" /></svg>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ position: "absolute", left: `${(i * 37) % 90}%`, bottom: `${(i * 23) % 80}%`, width: 50 * u, height: 50 * u, borderRadius: "50%", background: "#f2c94c", border: `${4 * u}px solid #b8860b` }} />)}
          </div>
        </div>
        {f % 20 < 12 ? <div style={{ position: "absolute", left: Wj / 2 - 25 * u, top: interpolate(f % 20, [0, 12], [-140 * u, Hj * (1 - fill) - 30 * u]), width: 50 * u, height: 50 * u, borderRadius: "50%", background: "#f2c94c", border: `${4 * u}px solid #b8860b` }} /> : null}
        <div style={{ position: "absolute", left: 0, right: 0, top: Hj + 20 * u, textAlign: "center", fontFamily: "Anton", fontSize: 90 * u, color: C.yellow }}>{(sc.prefix ?? "") + fmt((sc.points ?? [sc.value ?? 0])[0] * (fill / ((sc.value ?? 70) / 100) || 0), sc.decimals ?? 0) + (sc.suffix ?? "")}</div>
      </div>
    </AbsoluteFill>
  );
};

const Compare: React.FC<{ sc: MScene; dur: number }> = ({ sc, dur }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const items = sc.items ?? [];
  const bad = items.filter((i) => i.tag === "bad"), good = items.filter((i) => i.tag !== "bad");
  const col = (arr: MItem[], ok: boolean, off: number) => (
    <div style={{ flex: 1, background: ok ? "rgba(43,224,122,0.10)" : "rgba(255,77,77,0.10)", border: `${3 * u}px solid ${ok ? C.green : C.red}`, borderRadius: 26 * u, padding: 30 * u }}>
      {arr.map((it, i) => {
        const at = 8 + off + i * Math.round((dur * 0.6) / Math.max(1, items.length));
        const sp = spring({ frame: f - at, fps: MFPS, config: { damping: 12, stiffness: 190 } });
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 * u, marginBottom: 20 * u, opacity: sp, transform: `scale(${0.8 + 0.2 * sp})` }}>
            <div style={{ fontSize: 50 * u }}>{ok ? "✅" : "❌"}</div>
            <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: (vert ? 40 : 38) * u, color: C.text }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${vert ? 60 * u : 140 * u}px`, paddingBottom: vert ? 380 * u : 60 * u }}>
      {sc.title ? <div style={{ marginBottom: 36 * u }}><Title text={sc.title} size={vert ? 76 : 70} center /></div> : null}
      <div style={{ display: "flex", flexDirection: vert ? "column" : "row", gap: 30 * u }}>
        {col(bad, false, 0)}
        {col(good, true, 4)}
      </div>
    </AbsoluteFill>
  );
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
    const size = sc.kind === "hook" ? (vert ? 128 : 130) : sc.kind === "chapter" ? 140 : vert ? 104 : 116;
    const pulse = 1 + Math.sin(f / 6) * 0.03;
    body = (
      <AbsoluteFill style={center}>
        {sc.icon ? (
          <div style={{ position: "relative", marginBottom: 30 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[0, 1].map((k) => {
              const ph = ((f + k * 22) % 44) / 44;
              return <div key={k} style={{ position: "absolute", width: (vert ? 260 : 200) * u, height: (vert ? 260 : 200) * u, borderRadius: "50%", border: `${4 * u}px solid ${C.green}`, opacity: (1 - ph) * 0.5, transform: `scale(${0.8 + ph * 0.9})` }} />;
            })}
            <div style={{ fontSize: (vert ? 230 : 210) * u, transform: `translateY(${Math.sin(f / 9) * 10 * u}px) rotate(${Math.sin(f / 13) * 6}deg) scale(${spring({ frame: f, fps: MFPS, config: { damping: 8, stiffness: 160 } }) * pulse})` }}>{sc.icon}</div>
          </div>
        ) : null}
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
  } else if (sc.kind === "line") {
    body = <LineChart sc={sc} dur={dur} />;
  } else if (sc.kind === "pie") {
    body = <Donut sc={sc} />;
  } else if (sc.kind === "people") {
    body = <People sc={sc} />;
  } else if (sc.kind === "stack") {
    body = <Stack sc={sc} dur={dur} />;
  } else if (sc.kind === "phone") {
    body = <Phone sc={sc} dur={dur} />;
  } else if (sc.kind === "meter") {
    body = <Meter sc={sc} />;
  } else if (sc.kind === "timeline") {
    body = <Timeline sc={sc} dur={dur} />;
  } else if (sc.kind === "slot") {
    body = <Slot sc={sc} dur={dur} />;
  } else if (sc.kind === "wheel") {
    body = <Wheel sc={sc} />;
  } else if (sc.kind === "jar") {
    body = <Jar sc={sc} dur={dur} />;
  } else if (sc.kind === "compare") {
    body = <Compare sc={sc} dur={dur} />;
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

  const fadeIn = interpolate(f, [0, 7], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mode = (sc.idx ?? 0) % 3;
  const ein = interpolate(f, [0, 9], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const eout = interpolate(f, [dur - 6, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const push = 1 + interpolate(f, [0, Math.max(1, dur)], [0, 0.05]);
  const BEAT = 72;
  const bk = Math.floor(f / BEAT);
  const bf = f - bk * BEAT;
  const beatOn = bk >= 1 && dur - bk * BEAT > 20;
  const bp = beatOn ? interpolate(bf, [0, 10], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;
  const beatMove = [
    { s: 0.1, r: 0, x: 0, y: 0 },
    { s: -0.08, r: 2.5, x: 0, y: 0 },
    { s: 0.06, r: 0, x: 60, y: 0 },
    { s: 0.12, r: -2, x: 0, y: -30 },
  ][bk % 4];
  const drift = bk >= 1 ? { x: Math.sin(bk * 1.7) * 18, y: Math.cos(bk * 1.3) * 10 } : { x: 0, y: 0 };
  const sc0 = mode === 0 ? 1 + 0.18 * ein : 1;
  const tx = mode === 1 ? 160 * u * ein : mode === 2 ? -160 * u * ein : 0;
  const shake = sc.kind === "hook" && f < 12 ? Math.sin(f * 2.3) * (12 - f) * 1.6 * u : 0;
  const revealAt = sc.kind === "stat" ? 45 : sc.kind === "prices" && sc.pick !== undefined ? Math.round(dur * 0.45) : sc.kind === "hook" ? 4 : -999;
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), transform: `translate(${tx + shake + (drift.x + beatMove.x * bp) * u}px, ${shake * 0.6 + (drift.y + beatMove.y * bp) * u}px) scale(${push * sc0 * (1 - 0.06 * eout) * (1 + beatMove.s * bp)}) rotate(${beatMove.r * bp}deg)`, filter: `blur(${(ein + eout) * 10 * u}px)` }}>
      {revealAt > -999 ? <Burst at={revealAt} color={sc.kind === "hook" ? C.yellow : C.green} /> : null}
      {body}
      <Source text={sc.source} />
      {sc.kind === "hook" && f < 6 ? <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 6], [0.7, 0]) }} /> : null}
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


const Tracker: React.FC<{ scenes: MScene[] }> = ({ scenes }) => {
  const f = useCurrentFrame();
  const { u, vert } = useU();
  const t = f / MFPS;
  let cur: MScene | undefined;
  for (const sc of scenes) if (sc.s <= t && sc.track) cur = sc;
  if (!cur || !cur.track || vert) return null;
  const k = f - sec(cur.s);
  const sp = spring({ frame: k, fps: MFPS, config: { damping: 12, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: 40 * u, top: 30 * u, display: "flex", alignItems: "center", gap: 14 * u, transform: `scale(${0.6 + 0.4 * sp})`, transformOrigin: "left center" }}>
      <div style={{ background: C.green, color: "#07111f", fontFamily: "Anton", fontSize: 34 * u, padding: `${6 * u}px ${18 * u}px`, borderRadius: 10 * u }}>{cur.track}</div>
    </div>
  );
};

export const MoneyVid2: React.FC<MoneyProps> = ({ scenes, captions, voice, total, brand }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const end = sec(total);
  return (
    <AbsoluteFill style={{ background: C.bg1, color: C.text }}>
      <Background bg={(() => { const t = f / MFPS; let b: string | undefined; for (const sc of scenes) if (sc.s <= t && sc.bg) b = sc.bg; return b; })()} />
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s))}>
          <SceneView sc={{ ...sc, idx: i }} />
        </Sequence>
      ))}
      <Tracker scenes={scenes} />
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
        for (let k = 1; (k * 72 + 20) / 30 < sc.e - sc.s; k++) extra.push({ f: k % 2 ? "wyr/sfx/whoosh.wav" : "wyr/sfx/zap.wav", at: (k * 72) / 30, v: 0.22 });
        if (sc.kind === "slot") { for (let k = 0; k < 10; k++) extra.push({ f: "wyr/sfx/tick.wav", at: 0.1 + k * 0.15, v: 0.3 }); [25, 39, 53].forEach((fr) => extra.push({ f: "wyr/sfx/tock.wav", at: fr / 30, v: 0.5 })); extra.push({ f: "wyr/sfx/ding.wav", at: 1.9, v: 0.45 }); }
        if (sc.kind === "wheel") for (let k = 0; k < 14; k++) extra.push({ f: "wyr/sfx/tick.wav", at: 0.1 + k * 0.08 * (1 + k * 0.12), v: 0.3 });
        if (sc.kind === "stack") for (let k = 0; k < 8; k++) extra.push({ f: "wyr/sfx/pop.wav", at: 0.3 + k * (sc.e - sc.s) * 0.07, v: 0.3 });
        if (sc.kind === "phone") (sc.items ?? []).forEach((_, k) => extra.push({ f: "wyr/sfx/ding.wav", at: (10 + (k * (sc.e - sc.s) * 30 * 0.6) / Math.max(1, (sc.items ?? []).length)) / 30, v: 0.35 }));
        if (sc.kind === "people") extra.push({ f: "wyr/sfx/sparkle.wav", at: 1.0, v: 0.4 });
        if (sc.kind === "meter") extra.push({ f: "wyr/sfx/riser.wav", at: 0.2, v: 0.35 });
        if (sc.kind === "line" || sc.kind === "timeline") extra.push({ f: "wyr/sfx/riser.wav", at: 0.2, v: 0.3 });
        if (sc.kind === "jar") for (let k = 0; k < 6; k++) extra.push({ f: "wyr/sfx/pop.wav", at: 0.4 + k * 0.66, v: 0.3 });
        if (sc.kind === "compare") (sc.items ?? []).forEach((_, k) => extra.push({ f: "wyr/sfx/pop.wav", at: 0.3 + k * 0.5, v: 0.3 }));
        return [...base, ...extra].map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(sc.s + (x.at ?? 0))} durationInFrames={sec(2)}>
            <Audio src={staticFile(x.f)} volume={x.v ?? 0.5} />
          </Sequence>
        ));
      })}
    </AbsoluteFill>
  );
};

export const moneyDuration2 = (p: MoneyProps) => sec(p.total);
