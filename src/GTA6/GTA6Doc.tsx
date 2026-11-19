import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2") });
loadFont({ family: "Bebas", url: staticFile("fonts/bebas.woff2") });
loadFont({ family: "Archivo", url: staticFile("fonts/archivo-black.woff2") });
for (const weight of ["600", "800", "900"]) {
  loadFont({ family: "Montserrat", url: staticFile(`fonts/montserrat-${weight}.woff2`), weight });
}

export const DFPS = 30;
const sec = (s: number) => Math.round(s * DFPS);

type Theme = { bg: string; panel: string; accent: string; accent2: string; text: string; dim: string };
const THEMES: Record<string, Theme> = {
  doc: { bg: "#0f0f12", panel: "rgba(18,18,22,0.92)", accent: "#E9B949", accent2: "#5BD6A0", text: "#F4F1EA", dim: "#8d8a83" },
  tier: { bg: "#0d0618", panel: "rgba(20,10,36,0.92)", accent: "#FF3EA5", accent2: "#3EF6FF", text: "#FFFFFF", dim: "#a99bc4" },
};
const TIER_COLORS: Record<string, string> = { S: "#FF4D5E", A: "#FF9F43", B: "#FFD84D", C: "#5BD6A0", D: "#4DA3FF" };

export type Callout = { at: number; x: number; y: number; r: number; text: string; side?: "l" | "r" };
export type DScene = {
  s: number;
  e: number;
  kind: "clip" | "panel" | "cards" | "map" | "stat" | "quote" | "tier" | "chapter" | "intro" | "outro" | "list" | "split" | "board";
  clips?: string[];
  label?: string;
  title?: string;
  sub?: string;
  callouts?: Callout[];
  zoom?: { x: number; y: number; s: number; at?: number };
  stat?: { value: number; prefix?: string; suffix?: string; decimals?: number };
  quote?: { who: string; img?: string; text: string };
  tier?: { item: string; rank: string; thumb: string };
  map?: "chase" | "store" | "route" | "city";
  items?: string[];
  chapterNo?: number;
  sfx?: { f: string; at?: number; v?: number }[];
  flash?: boolean;
  vol?: number;
  reveal?: number;
};
export type DCaption = { t: string; s: number; e: number };
export type DocProps = {
  theme: "doc" | "tier";
  scenes: DScene[];
  captions: DCaption[];
  voice: string;
  total: number;
  clipLen: Record<string, number>;
  clipVolume?: number;
  brand?: string;
};

const ThemeCtx = React.createContext<Theme>(THEMES.doc);
const useTheme = () => React.useContext(ThemeCtx);
const ClipCtx = React.createContext<{ len: Record<string, number>; vol: number }>({ len: {}, vol: 0.12 });

// ---------- media ----------
const Media: React.FC<{ m: string; kb?: number; style?: React.CSSProperties; still?: boolean }> = ({ m, kb = 0, style, still }) => {
  const f = useCurrentFrame();
  const { len, vol } = React.useContext(ClipCtx);
  const z = still ? 1 : 1.04 + f * 0.0009;
  const px = still ? 0 : Math.sin(f / 70 + kb) * 18;
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translateX(${px}px)`, ...style };
  if (m.startsWith("img:")) return <Img src={staticFile(`gta6/img/${m.slice(4)}.jpg`)} style={st} />;
  const L = Math.max(2, Math.round((len[m] ?? 3) * DFPS) - 1);
  return (
    <Loop durationInFrames={L} layout="none">
      <OffthreadVideo src={staticFile(`gta6/gp/${m}.mp4`)} volume={vol} style={st} />
    </Loop>
  );
};

// cycles a list of media with a quick punch at each cut
const Cycle: React.FC<{ clips: string[]; dur: number; seed?: number; still?: boolean }> = ({ clips, dur, seed = 0, still }) => {
  const f = useCurrentFrame();
  const n = Math.max(1, clips.length);
  const per = dur / n;
  const cur = Math.min(n - 1, Math.floor(f / per));
  return (
    <AbsoluteFill>
      {clips.map((c, i) =>
        i === cur ? (
          <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.max(1, Math.round(per) + 1)} layout="none">
            <Punch first={i === 0}>
              <Media m={c} kb={seed + i} still={still} />
            </Punch>
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

const Punch: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  const sc = first ? 1 : interpolate(f, [0, 6], [1.08, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ transform: `scale(${sc})` }}>{children}</AbsoluteFill>;
};

// ---------- small UI atoms ----------
const Label: React.FC<{ text: string; delay?: number; center?: boolean }> = ({ text, delay = 0, center }) => {
  const t = useTheme();
  const f = useCurrentFrame() - delay;
  const w = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const chars = Math.round(text.length * interpolate(f, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: center ? "center" : "flex-start" }}>
      <div style={{ width: 5, height: 30, background: t.accent, transform: `scaleY(${w})` }} />
      <div style={{ fontFamily: "Bebas", fontSize: 38, letterSpacing: 5, color: t.text, opacity: 0.92 }}>{text.slice(0, chars)}</div>
      <div style={{ height: 3, width: 90 * w, background: `linear-gradient(90deg, ${t.accent}, transparent)` }} />
    </div>
  );
};

const BigTitle: React.FC<{ text: string; size?: number; delay?: number; center?: boolean }> = ({ text, size = 92, delay = 4, center }) => {
  const t = useTheme();
  const f = useCurrentFrame() - delay;
  const p = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        fontFamily: "Archivo",
        fontSize: size,
        lineHeight: 1.02,
        color: t.text,
        textTransform: "uppercase",
        textAlign: center ? "center" : "left",
        clipPath: `inset(0 ${100 - p * 100}% 0 0)`,
        transform: `translateY(${(1 - p) * 20}px)`,
        textShadow: "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  );
};

const Panel: React.FC<{ children: React.ReactNode; w?: number; delay?: number }> = ({ children, w = 760, delay = 0 }) => {
  const t = useTheme();
  const f = useCurrentFrame() - delay;
  const sp = spring({ frame: f, fps: DFPS, config: { damping: 16, stiffness: 170 } });
  return (
    <div
      style={{
        width: w,
        padding: "34px 44px",
        background: t.panel,
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: 18,
        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        transform: `translateY(${(1 - sp) * 40}px) scale(${0.94 + sp * 0.06})`,
        opacity: sp,
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
};

const BlurBg: React.FC<{ clips: string[]; dur: number; dim?: number }> = ({ clips, dur, dim = 0.35 }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: `blur(22px) brightness(${dim}) saturate(1.1)`, transform: "scale(1.1)" }}>
      <Cycle clips={clips} dur={dur} still />
    </AbsoluteFill>
    <Vignette />
  </AbsoluteFill>
);

const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)" }} />;

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.06,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        transform: `translateY(${(f % 3) - 1}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

// circle + label drawn on top of the gameplay
const CalloutView: React.FC<{ c: Callout }> = ({ c }) => {
  const t = useTheme();
  const f = useCurrentFrame() - sec(c.at);
  if (f < 0) return null;
  const draw = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pulse = 1 + 0.04 * Math.sin(f / 6);
  const circ = 2 * Math.PI * c.r;
  const side = c.side ?? (c.x > 960 ? "l" : "r");
  const lx = side === "r" ? c.x + c.r + 30 : c.x - c.r - 30;
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "visible" }}>
        <circle cx={c.x} cy={c.y} r={c.r * pulse} fill="none" stroke={t.accent} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} style={{ filter: `drop-shadow(0 0 10px ${t.accent})` }} />
        <line x1={side === "r" ? c.x + c.r : c.x - c.r} y1={c.y} x2={lx} y2={c.y} stroke={t.accent} strokeWidth={4} opacity={draw} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: c.y - 30,
          left: side === "r" ? lx : undefined,
          right: side === "l" ? 1920 - lx : undefined,
          padding: "10px 20px",
          background: t.panel,
          border: `2px solid ${t.accent}`,
          borderRadius: 10,
          fontFamily: "Montserrat",
          fontWeight: 900,
          fontSize: 32,
          color: t.text,
          whiteSpace: "nowrap",
          opacity: interpolate(f, [6, 14], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateX(${interpolate(f, [6, 14], [side === "r" ? -20 : 20, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        {c.text}
      </div>
    </>
  );
};

// ---------- schematic maps ----------
const MapView: React.FC<{ kind: string; dur: number }> = ({ kind, dur }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const p = f / Math.max(1, dur);
  const blocks: React.ReactNode[] = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 9; c++) {
      const green = (r * 7 + c * 3) % 11 === 0;
      blocks.push(
        <rect key={`${r}-${c}`} x={40 + c * 210} y={30 + r * 180} width={170} height={140} rx={6} fill={green ? "#1d2a20" : "#1c1b1f"} stroke="#2a2930" strokeWidth={2} />,
      );
    }
  // roads are the gaps; draw dashed centre lines
  const lanes: React.ReactNode[] = [];
  for (let r = 0; r <= 6; r++) lanes.push(<line key={`h${r}`} x1={0} x2={1920} y1={10 + r * 180} y2={10 + r * 180} stroke="#3a3840" strokeWidth={2} strokeDasharray="14 14" />);
  for (let c = 0; c <= 9; c++) lanes.push(<line key={`v${c}`} y1={0} y2={1080} x1={20 + c * 210} x2={20 + c * 210} stroke="#3a3840" strokeWidth={2} strokeDasharray="14 14" />);
  // traffic
  const traffic = Array.from({ length: 14 }).map((_, i) => {
    const horiz = i % 2 === 0;
    const lane = horiz ? 10 + ((i * 3) % 7) * 180 : 20 + ((i * 5) % 10) * 210;
    const pos = ((f * (2 + (i % 3)) + i * 260) % 2200) - 140;
    return horiz ? <rect key={i} x={pos} y={lane - 9} width={34} height={18} rx={4} fill="#5a5862" /> : <rect key={i} x={lane - 9} y={pos % 1200} width={18} height={34} rx={4} fill="#5a5862" />;
  });
  // player path: along row 3 road then up column 5
  const path = (q: number) => {
    const qq = Math.min(1, Math.max(0, q));
    if (qq < 0.6) return { x: interpolate(qq, [0, 0.6], [-60, 20 + 5 * 210]), y: 10 + 3 * 180, a: 0 };
    return { x: 20 + 5 * 210, y: interpolate(qq, [0.6, 1], [10 + 3 * 180, 10]), a: -90 };
  };
  const pl = path(p * 1.15);
  const cops = kind === "chase" ? [0.08, 0.15, 0.22].map((d) => path(p * 1.15 - d)) : [];
  const flash = Math.floor(f / 6) % 2 === 0;
  let extra: React.ReactNode = null;
  if (kind === "route") {
    const pts = Array.from({ length: 60 }).map((_, i) => path(i / 59));
    const k = Math.round(interpolate(p, [0, 0.8], [1, 60], { extrapolateRight: "clamp" }));
    extra = <polyline points={pts.slice(0, k).map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke="#FF5FA8" strokeWidth={10} strokeLinecap="round" opacity={0.85} />;
  }
  const radius = kind === "chase" ? 160 + 40 * Math.sin(f / 8) : 0;
  return (
    <AbsoluteFill style={{ background: "#141317" }}>
      <svg width={1920} height={1080}>
        {blocks}
        {lanes}
        {traffic}
        {extra}
        {kind === "chase" ? <circle cx={pl.x} cy={pl.y} r={radius} fill="rgba(255,60,60,0.08)" stroke="rgba(255,60,60,0.5)" strokeWidth={3} strokeDasharray="10 10" /> : null}
        {cops.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.a})`}>
            <rect x={-20} y={-11} width={40} height={22} rx={5} fill="#e9e9ee" />
            <rect x={-8} y={-11} width={8} height={22} fill={flash ? "#ff3b3b" : "#3b7bff"} />
            <rect x={0} y={-11} width={8} height={22} fill={flash ? "#3b7bff" : "#ff3b3b"} />
          </g>
        ))}
        <g transform={`translate(${pl.x},${pl.y}) rotate(${pl.a})`}>
          <polygon points="20,0 140,-60 140,60" fill={`${t.accent}22`} />
          <rect x={-22} y={-12} width={44} height={24} rx={6} fill={t.accent} style={{ filter: `drop-shadow(0 0 12px ${t.accent})` }} />
        </g>
      </svg>
      {kind === "store" ? <StoreOverlay /> : null}
      <Vignette />
    </AbsoluteFill>
  );
};

const StoreOverlay: React.FC = () => {
  const t = useTheme();
  const f = useCurrentFrame();
  const n = Math.min(3, Math.floor(f / 25));
  return (
    <AbsoluteFill style={{ background: "#141317" }}>
      <svg width={1920} height={1080}>
        <rect x={620} y={240} width={680} height={600} fill="none" stroke="#cfcfd6" strokeWidth={6} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={760 + i * 150} y={380} width={46} height={300} rx={6} fill="#2a2834" />
            {Array.from({ length: 10 }).map((_, k) => (
              <rect key={k} x={766 + i * 150} y={390 + k * 29} width={14} height={20} fill={["#E9B949", "#5BD6A0", "#FF5FA8"][(k + i) % 3]} />
            ))}
          </g>
        ))}
        <rect x={1060} y={270} width={200} height={60} rx={6} fill="#2a2834" />
        <path d="M 760 840 A 80 80 0 0 1 840 760" fill="none" stroke="#cfcfd6" strokeWidth={4} strokeDasharray="8 8" />
        <circle cx={interpolate(f, [0, 60], [800, 1150], { extrapolateRight: "clamp" })} cy={interpolate(f, [0, 60], [820, 360], { extrapolateRight: "clamp" })} r={16} fill={t.accent} style={{ filter: `drop-shadow(0 0 10px ${t.accent})` }} />
        {Array.from({ length: n }).map((_, i) => (
          <circle key={i} cx={700 + i * 60} cy={560 + i * 70} r={12} fill="#9aa0ff" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 1340, top: 300, width: 240, padding: 22, background: t.panel, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontFamily: "Bebas", fontSize: 30, letterSpacing: 4, color: t.dim }}>👁 TESTIGOS</div>
        <div style={{ fontFamily: "Archivo", fontSize: 110, color: t.accent, lineHeight: 1 }}>{n}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- tier board ----------
const TierBoard: React.FC<{ placed: { item: string; rank: string; thumb: string; at: number }[]; now: number }> = ({ placed, now }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const rows = ["S", "A", "B", "C", "D"];
  return (
    <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => {
        const items = placed.filter((p) => p.rank === r);
        return (
          <div key={r} style={{ display: "flex", alignItems: "stretch", gap: 10, height: 124, background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ width: 110, background: TIER_COLORS[r], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo", fontSize: 70, color: "#140a20" }}>{r}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap", padding: "0 6px", overflow: "hidden" }}>
              {items.map((it, i) => {
                const age = f - (it.at - now);
                const sp = spring({ frame: age, fps: DFPS, config: { damping: 11, stiffness: 200 } });
                return (
                  <div key={i} style={{ width: 150, height: 104, borderRadius: 8, overflow: "hidden", position: "relative", border: `3px solid ${age < 40 ? t.accent2 : "rgba(255,255,255,0.25)"}`, transform: `scale(${age < 0 ? 0 : sp})` }}>
                    <Img src={staticFile(`gta6/thumbs/${it.thumb}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontFamily: "Montserrat", fontWeight: 900, fontSize: 15, color: "white", background: "rgba(0,0,0,0.7)", padding: "3px 4px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}>{it.item}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- scene renderer ----------
const SceneView: React.FC<{ sc: DScene; idx: number; all: DScene[] }> = ({ sc, idx, all }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const dur = sec(sc.e - sc.s);
  const clips = sc.clips ?? [];
  const inT = interpolate(f, [0, 6], [1, 0], { extrapolateRight: "clamp" });
  let body: React.ReactNode = null;

  if (sc.kind === "clip") {
    const z = sc.zoom;
    const zp = z ? interpolate(f, [sec(z.at ?? 0.5), sec(z.at ?? 0.5) + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 0;
    const scale = 1 + (z ? (z.s - 1) * zp : 0);
    const ox = z ? (960 - z.x) * (scale - 1) / scale : 0;
    const oy = z ? (540 - z.y) * (scale - 1) / scale : 0;
    body = (
      <>
        <AbsoluteFill style={{ transform: `scale(${scale}) translate(${ox}px, ${oy}px)` }}>
          <Cycle clips={clips} dur={dur} seed={idx} />
          {(sc.callouts ?? []).map((c, i) => (
            <CalloutView key={i} c={c} />
          ))}
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.45) 100%)" }} />
        {sc.label || sc.title ? (
          <div style={{ position: "absolute", left: 70, top: 60 }}>
            {sc.label ? <Label text={sc.label} /> : null}
            {sc.title ? (
              <div style={{ marginTop: 10 }}>
                <BigTitle text={sc.title} size={64} />
              </div>
            ) : null}
          </div>
        ) : null}
      </>
    );
  } else if (sc.kind === "panel" || sc.kind === "list") {
    body = (
      <>
        <BlurBg clips={clips.length ? clips : ["img:skyline_dusk"]} dur={dur} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Panel w={sc.kind === "list" ? 1100 : 860}>
            {sc.label ? <Label text={sc.label} delay={4} /> : null}
            <div style={{ marginTop: 14 }}>
              <BigTitle text={sc.title ?? ""} size={sc.kind === "list" ? 72 : 84} delay={8} />
            </div>
            {sc.sub ? <div style={{ marginTop: 18, fontFamily: "Montserrat", fontWeight: 600, fontSize: 34, color: t.dim, opacity: interpolate(f, [14, 24], [0, 1], { extrapolateRight: "clamp" }) }}>{sc.sub}</div> : null}
            {sc.items ? (
              <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
                {sc.items.map((it, i) => {
                  const at = 14 + Math.round((i * dur * 0.7) / sc.items!.length);
                  const v = interpolate(f, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <div key={i} style={{ display: "flex", gap: 18, alignItems: "center", opacity: v, transform: `translateX(${(1 - v) * -30}px)` }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: t.accent, color: "#111", fontFamily: "Archivo", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                      <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 38, color: t.text }}>{it}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Panel>
        </AbsoluteFill>
      </>
    );
  } else if (sc.kind === "cards") {
    const n = Math.min(3, clips.length);
    body = (
      <>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${t.accent}18, ${t.bg} 65%)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}>
          <Label text={sc.label ?? ""} center />
        </div>
        {sc.title ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 180 }}>
            <BigTitle text={sc.title} size={70} center />
          </div>
        ) : null}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", perspective: 1400 }}>
          {clips.slice(0, n).map((c, i) => {
            const off = i - (n - 1) / 2;
            const sp = spring({ frame: f - 6 - i * 5, fps: DFPS, config: { damping: 14, stiffness: 150 } });
            const focus = Math.floor((f / dur) * n) === i;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 620,
                  height: 349,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `3px solid ${focus ? t.accent : "rgba(255,255,255,0.15)"}`,
                  boxShadow: focus ? `0 0 50px ${t.accent}66` : "0 20px 50px rgba(0,0,0,0.6)",
                  transform: `translateX(${off * 560 * sp}px) translateY(${(1 - sp) * 200 + 40}px) rotateY(${-off * 18}deg) scale(${focus ? 1.08 : 0.92})`,
                  zIndex: focus ? 5 : 1,
                  opacity: sp,
                }}
              >
                <Media m={c} kb={i} />
              </div>
            );
          })}
        </AbsoluteFill>
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 120 }}>
          {clips.slice(0, n).map((_, i) => (
            <div key={i} style={{ width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: `24px solid ${t.accent}`, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((f - i * 8) / 8)) }} />
          ))}
        </div>
      </>
    );
  } else if (sc.kind === "map") {
    body = (
      <>
        <MapView kind={sc.map ?? "city"} dur={dur} />
        {sc.label || sc.title ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
            <Panel w={720}>
              {sc.label ? <Label text={sc.label} delay={4} /> : null}
              {sc.title ? (
                <div style={{ marginTop: 8 }}>
                  <BigTitle text={sc.title} size={58} delay={8} />
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}
      </>
    );
  } else if (sc.kind === "stat") {
    const st = sc.stat ?? { value: 0 };
    const v = interpolate(f, [6, 40], [0, st.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    body = (
      <>
        <BlurBg clips={clips.length ? clips : ["img:keyart"]} dur={dur} dim={0.28} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          {sc.label ? <Label text={sc.label} center delay={2} /> : null}
          <div style={{ fontFamily: "Archivo", fontSize: 260, color: t.accent, lineHeight: 1, textShadow: `0 0 60px ${t.accent}55` }}>
            {st.prefix ?? ""}
            {v.toFixed(st.decimals ?? 0)}
            {st.suffix ?? ""}
          </div>
          {sc.title ? <BigTitle text={sc.title} size={58} center delay={12} /> : null}
        </AbsoluteFill>
      </>
    );
  } else if (sc.kind === "quote") {
    const q = sc.quote!;
    body = (
      <>
        <BlurBg clips={clips.length ? clips : ["img:keyart"]} dur={dur} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Panel w={1240}>
            <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
              {q.img ? <Img src={staticFile(`gta6/img/${q.img}.jpg`)} style={{ width: 200, height: 200, borderRadius: 100, objectFit: "cover", border: `5px solid ${t.accent}` }} /> : null}
              <div>
                <div style={{ fontFamily: "Archivo", fontSize: 120, color: t.accent, lineHeight: 0.6, height: 50 }}>“</div>
                <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 52, color: t.text, lineHeight: 1.2 }}>{q.text.slice(0, Math.round(q.text.length * interpolate(f, [6, 6 + q.text.length * 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))}</div>
                <div style={{ marginTop: 18, fontFamily: "Bebas", fontSize: 38, letterSpacing: 4, color: t.accent }}>— {q.who}</div>
              </div>
            </div>
          </Panel>
        </AbsoluteFill>
      </>
    );
  } else if (sc.kind === "tier") {
    const tier = sc.tier!;
    const placed = all
      .filter((s) => s.kind === "tier" && s.s <= sc.s)
      .map((s) => ({ ...s.tier!, at: sec(s.s) + sec(s.reveal ?? Math.max(1.2, (s.e - s.s) * 0.62)) }));
    const now = sec(sc.s);
    const revealAt = sec(sc.reveal ?? Math.max(1.2, (sc.e - sc.s) * 0.62));
    const rv = spring({ frame: f - revealAt, fps: DFPS, config: { damping: 9, stiffness: 220 } });
    body = (
      <>
        <AbsoluteFill style={{ background: t.bg }} />
        <div style={{ position: "absolute", left: 60, top: 110, width: 860, height: 484, borderRadius: 20, overflow: "hidden", border: `4px solid ${t.accent}`, boxShadow: `0 0 60px ${t.accent}55` }}>
          <Cycle clips={clips} dur={dur} seed={idx} />
          {f >= revealAt ? (
            <div style={{ position: "absolute", right: 24, top: 24, width: 170, height: 170, borderRadius: 24, background: TIER_COLORS[tier.rank], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo", fontSize: 130, color: "#140a20", transform: `scale(${interpolate(rv, [0, 1], [3, 1])}) rotate(${interpolate(rv, [0, 1], [-30, -6])}deg)`, boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>{tier.rank}</div>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: 60, top: 625, width: 860 }}>
          <Label text={sc.label ?? "PUNTUANDO"} />
          <div style={{ marginTop: 12 }}>
            <BigTitle text={tier.item} size={76} />
          </div>
        </div>
        <div style={{ position: "absolute", right: 60, top: 110 }}>
          <TierBoard placed={placed} now={now} />
        </div>
      </>
    );
  } else if (sc.kind === "board") {
    const placed = all.filter((s) => s.kind === "tier" && s.s <= sc.s).map((s) => ({ ...s.tier!, at: 0 }));
    const sp = spring({ frame: f, fps: DFPS, config: { damping: 15, stiffness: 140 } });
    body = (
      <>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${t.accent}22, ${t.bg} 70%)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>
          <Label text={sc.label ?? "RESULTADO FINAL"} center />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center", transform: `scale(${0.6 + 0.55 * sp})`, transformOrigin: "50% 0%" }}>
          <TierBoard placed={placed} now={0} />
        </div>
      </>
    );
  } else if (sc.kind === "chapter") {
    const w = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    body = (
      <>
        <BlurBg clips={clips.length ? clips : ["img:skyline_dusk"]} dur={dur} dim={0.3} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: "Bebas", fontSize: 44, letterSpacing: 14, color: t.accent, opacity: w }}>{sc.label ?? `PARTE ${String(sc.chapterNo ?? 1).padStart(2, "0")}`}</div>
          <div style={{ width: 600 * w, height: 3, background: t.accent, margin: "16px 0 22px" }} />
          <BigTitle text={sc.title ?? ""} size={120} center delay={6} />
          {sc.sub ? <div style={{ marginTop: 18, fontFamily: "Montserrat", fontWeight: 600, fontSize: 34, color: t.dim, opacity: interpolate(f, [16, 26], [0, 1], { extrapolateRight: "clamp" }) }}>{sc.sub}</div> : null}
        </AbsoluteFill>
      </>
    );
  } else if (sc.kind === "intro") {
    // hook: fast cuts full-screen + big statement
    body = (
      <>
        <Cycle clips={clips} dur={dur} seed={idx} />
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.5))" }} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 120px" }}>
          {sc.label ? <Label text={sc.label} center delay={2} /> : null}
          <div style={{ marginTop: 16 }}>
            <BigTitle text={sc.title ?? ""} size={110} center delay={4} />
          </div>
        </AbsoluteFill>
      </>
    );
  } else if (sc.kind === "split") {
    body = (
      <>
        <AbsoluteFill style={{ background: t.bg }} />
        {clips.slice(0, 2).map((c, i) => {
          const sp = spring({ frame: f - i * 6, fps: DFPS, config: { damping: 14, stiffness: 160 } });
          return (
            <div key={i} style={{ position: "absolute", top: 190, left: i === 0 ? 70 : 990, width: 860, height: 484, borderRadius: 16, overflow: "hidden", border: `3px solid ${i === 0 ? t.accent : t.accent2}`, transform: `translateY(${(1 - sp) * 120}px)`, opacity: sp }}>
              <Media m={c} kb={i} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 80, display: "flex", justifyContent: "center" }}>
          <Label text={sc.label ?? ""} center />
        </div>
        {sc.items ? (
          <div style={{ position: "absolute", top: 700, left: 70, right: 70, display: "flex", justifyContent: "space-between" }}>
            {sc.items.slice(0, 2).map((it, i) => (
              <div key={i} style={{ width: 860, textAlign: "center", fontFamily: "Archivo", fontSize: 46, color: i === 0 ? t.accent : t.accent2 }}>{it}</div>
            ))}
          </div>
        ) : null}
      </>
    );
  } else if (sc.kind === "outro") {
    const btn = spring({ frame: f - 30, fps: DFPS, config: { damping: 10, stiffness: 200 } });
    const clicked = f > 75;
    body = (
      <>
        <BlurBg clips={clips.length ? clips : ["img:extended"]} dur={dur} dim={0.35} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
          <BigTitle text={sc.title ?? ""} size={96} center />
          <div style={{ transform: `scale(${btn})`, fontFamily: "Montserrat", fontWeight: 900, fontSize: 56, color: "white", background: clicked ? "#444" : "#FF0000", padding: "20px 54px", borderRadius: 999 }}>{clicked ? "SUSCRITO ✓ 🔔" : "SUSCRÍBETE"}</div>
          {sc.sub ? <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 40, color: t.text, opacity: interpolate(f, [40, 55], [0, 1], { extrapolateRight: "clamp" }) }}>{sc.sub}</div> : null}
        </AbsoluteFill>
        <div style={{ position: "absolute", left: interpolate(f, [40, 72], [1500, 1080], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), top: interpolate(f, [40, 72], [1000, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), fontSize: 80 }}>👆</div>
      </>
    );
  }

  return (
    <AbsoluteFill>
      {body}
      <AbsoluteFill style={{ background: "black", opacity: inT * 0.6, pointerEvents: "none" }} />
      {sc.flash ? <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 6], [0.8, 0], { extrapolateRight: "clamp" }) }} /> : null}
    </AbsoluteFill>
  );
};

// ---------- captions (phrase subtitles, current word highlighted) ----------
const Captions: React.FC<{ caps: DCaption[] }> = ({ caps }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const time = f / DFPS;
  const c = caps.find((x) => time >= x.s && time < x.e);
  if (!c) return null;
  const words = c.t.split(" ").filter(Boolean);
  // split into chunks of up to 7 words, show the chunk being spoken
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += 7) chunks.push(words.slice(i, i + 7));
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
  const ci = Math.floor(wi / 7);
  const chunk = chunks[ci] ?? [];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: "Montserrat", fontWeight: 900, fontSize: 50, lineHeight: 1.25, padding: "8px 22px", background: "rgba(0,0,0,0.5)", borderRadius: 12 }}>
        {chunk.map((w, i) => (
          <span key={i} style={{ color: ci * 7 + i === wi ? t.accent : ci * 7 + i < wi ? t.text : "rgba(255,255,255,0.75)" }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

const Brand: React.FC<{ text: string }> = ({ text }) => {
  const t = useTheme();
  return <div style={{ position: "absolute", right: 40, top: 34, fontFamily: "Bebas", fontSize: 30, letterSpacing: 4, color: t.text, opacity: 0.55 }}>{text}</div>;
};

// ---------- main ----------
export const GTA6Doc: React.FC<DocProps> = ({ theme, scenes, captions, voice, total, clipLen, clipVolume = 0.12, brand }) => {
  const f = useCurrentFrame();
  const t = THEMES[theme] ?? THEMES.doc;
  const end = sec(total);
  return (
    <ThemeCtx.Provider value={t}>
      <ClipCtx.Provider value={{ len: clipLen, vol: clipVolume }}>
        <AbsoluteFill style={{ background: t.bg }}>
          {scenes.map((sc, i) => (
            <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s))}>
              <ClipCtx.Provider value={{ len: clipLen, vol: sc.vol ?? clipVolume }}>
                <SceneView sc={sc} idx={i} all={scenes} />
              </ClipCtx.Provider>
            </Sequence>
          ))}
          <Grain />
          {brand ? <Brand text={brand} /> : null}
          <Captions caps={captions} />
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${(f / end) * 100}%`, background: t.accent }} />
          <Audio src={staticFile(voice)} />
          {scenes.flatMap((sc, i) => {
            const base = sc.sfx ?? [{ f: "wyr/sfx/whoosh.wav", at: 0, v: 0.22 }];
            const extra: { f: string; at?: number; v?: number }[] = [];
            if (sc.label && sc.kind !== "clip") extra.push({ f: "wyr/sfx/tick.wav", at: 0.15, v: 0.5 });
            (sc.callouts ?? []).forEach((c) => extra.push({ f: "wyr/sfx/pop.wav", at: c.at, v: 0.45 }));
            if (sc.kind === "chapter") extra.push({ f: "wyr/sfx/boom.wav", at: 0, v: 0.5 });
            if (sc.kind === "tier") {
              const rv = sc.reveal ?? Math.max(1.2, (sc.e - sc.s) * 0.62);
              extra.push({ f: "wyr/sfx/redoble.wav", at: Math.max(0, rv - 1.2), v: 0.3 }, { f: "voz/impacto.wav", at: rv, v: 0.6 });
            }
            if (sc.kind === "board") extra.push({ f: "wyr/sfx/sparkle.wav", at: 0.3, v: 0.5 });
            if (sc.kind === "stat") extra.push({ f: "wyr/sfx/ding.wav", at: 1.3, v: 0.45 });
            if (sc.kind === "outro") extra.push({ f: "voz/click.wav", at: 2.5, v: 0.9 }, { f: "wyr/sfx/ding.wav", at: 2.55, v: 0.5 });
            if (sc.kind === "map" && sc.map === "chase") extra.push({ f: "wyr/sfx/heart.wav", at: 0.5, v: 0.4 }, { f: "wyr/sfx/heart.wav", at: 1.2, v: 0.4 });
            return [...base, ...extra].map((x, j) => (
              <Sequence key={`${i}-${j}`} from={sec(sc.s + (x.at ?? 0))} durationInFrames={sec(2)}>
                <Audio src={staticFile(x.f)} volume={x.v ?? 0.5} />
              </Sequence>
            ));
          })}
        </AbsoluteFill>
      </ClipCtx.Provider>
    </ThemeCtx.Provider>
  );
};

export const docDuration = (p: DocProps) => sec(p.total);
