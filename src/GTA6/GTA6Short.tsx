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
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2") });
for (const weight of ["800", "900"]) {
  loadFont({ family: "Montserrat", url: staticFile(`fonts/montserrat-${weight}.woff2`), weight });
}

export const FPS = 30;
const PINK = "#FF3EA5";
const ORANGE = "#FFB13B";
const CYAN = "#3EF6FF";

// ---------- types ----------
type Word = string; // "*word*" = highlighted
export type Overlay =
  | { kind: "stamp"; text: string; color?: string; at?: number; rot?: number; y?: number }
  | { kind: "calendar"; day: string; month: string; at?: number }
  | { kind: "chips"; items: string[]; at?: number }
  | { kind: "choice"; a: string; b: string; at?: number }
  | { kind: "comment"; text: string; at?: number }
  | { kind: "bars"; at?: number }
  | { kind: "tag"; text: string; at?: number; y?: number };

export type Scene = {
  s: number; // seconds
  e: number;
  imgs: string[]; // one = card, several = montage (equal split)
  split?: [string, string, string, string]; // imgA, labelA, imgB, labelB
  title: Word[][]; // lines of words
  titleAt?: number[]; // seconds (relative) at which each line appears
  flash?: boolean;
  shake?: boolean;
  overlays?: Overlay[];
  sfx?: { f: string; at?: number; v?: number }[];
  hook?: boolean;
  emojis?: string[];
  full?: boolean;
  vol?: number;
};

export type Caption = { t: string; s: number; e: number; full?: boolean };

export type GTA6Props = {
  scenes: Scene[];
  captions: Caption[];
  voice: string;
  music: string;
  musicVolume: number;
  total: number; // seconds
  clipLen?: Record<string, number>;
  gameVolume?: number;
  sfxGain?: number;
  capSize?: number;
  capTop?: number;
};

const sec = (s: number) => Math.round(s * FPS);

// ---------- background ----------
const Bg: React.FC<{ img: string }> = ({ img }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(`gta6/img/${img}.jpg`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(38px) brightness(0.42) saturate(1.4)",
          transform: `scale(${1.25 + f * 0.0008})`,
        }}
      />
      <Particles />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(20,4,40,0.75) 0%, rgba(20,4,40,0.15) 35%, rgba(20,4,40,0.2) 65%, rgba(20,4,40,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Particles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 397) % 1080;
        const sp = 2 + (i % 5);
        const y = 1920 - ((f * sp + i * 173) % 2100);
        const r = 4 + (i % 4) * 3;
        const c = i % 3 === 0 ? PINK : i % 3 === 1 ? CYAN : ORANGE;
        return <div key={i} style={{ position: "absolute", left: x + Math.sin((f + i * 20) / 18) * 30, top: y, width: r, height: r, borderRadius: r, background: c, boxShadow: `0 0 ${r * 3}px ${c}`, opacity: 0.7 }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- image card ----------
const Card: React.FC<{ img: string; idx: number; w?: number; h?: number; x?: number; y?: number; label?: string; labelColor?: string; delay?: number }> = ({
  img,
  idx,
  w = 980,
  h = 620,
  x = 50,
  y = 690,
  label,
  labelColor = PINK,
  delay = 0,
}) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f, fps, config: { damping: 12, stiffness: 260, mass: 0.6 } });
  const dir = idx % 2 === 0 ? -1 : 1;
  const v = idx % 4;
  const pulse = 1 + 0.025 * Math.max(0, 1 - (Math.max(0, f) % 15) / 5);
  const float = Math.sin(f / 14) * 10;
  const scale = (v === 1 ? interpolate(sp, [0, 1], [1.5, 1]) : interpolate(sp, [0, 1], [0.5, 1])) * pulse;
  const rot = interpolate(sp, [0, 1], [v === 3 ? dir * 25 : dir * 9, dir * 1.2]) + Math.sin(f / 22) * 1.3;
  const tx = v === 0 ? interpolate(sp, [0, 1], [dir * 600, 0]) : 0;
  const ty = (v === 2 ? interpolate(sp, [0, 1], [-900, 0]) : 0) + float;
  const zoom = 1.08 + Math.max(0, f) * 0.004 + (idx % 2 ? 0 : 0.05);
  const pan = Math.sin(f / 40 + idx) * 25;
  if (f < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)`,
        filter: `blur(${interpolate(sp, [0, 0.6], [14, 0], { extrapolateRight: "clamp" })}px)`,
        borderRadius: 34,
        overflow: "hidden",
        border: "7px solid white",
        boxShadow: `0 0 0 4px ${PINK}, 0 0 60px ${PINK}aa, 0 30px 60px rgba(0,0,0,0.6)`,
        opacity: interpolate(sp, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <Img
        src={staticFile(`gta6/img/${img}.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}px)` }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "16px 0 12px",
            textAlign: "center",
            fontFamily: "Anton",
            fontSize: 74,
            letterSpacing: 4,
            color: "white",
            background: `linear-gradient(0deg, ${labelColor}ee, ${labelColor}00)`,
            textShadow: "0 4px 0 rgba(0,0,0,0.5)",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

// ---------- title ----------
const Title: React.FC<{ lines: Word[][]; at: number[]; hook?: boolean }> = ({ lines, at, hook }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const size = hook ? 150 : 118;
  const tp = 1 + 0.04 * Math.max(0, 1 - (f % 15) / 5);
  const g = hook && f < 20 ? (f % 4 < 2 ? 8 : -8) : 0;
  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        top: hook ? 150 : 200,
        left: 40,
        right: 40,
        height: 470,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 4,
        transform: `scale(${tp})`,
        textShadow: g ? `${g}px 0 0 rgba(255,0,80,0.9), ${-g}px 0 0 rgba(0,240,255,0.9)` : undefined,
      }}
    >
      {lines.map((line, li) => {
        const start = sec(at[li] ?? li * 0.35);
        return (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px" }}>
            {line.map((raw, wi) => {
              const d = start + wi * 3 - (hook && li === 0 ? 8 : 0);
              k++;
              const sp = spring({ frame: f - d, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
              const hl = raw.startsWith("*");
              const w = raw.replace(/\*/g, "");
              if (f < d) return <span key={wi} style={{ fontFamily: "Anton", fontSize: size, opacity: 0 }}>{w}</span>;
              return (
                <span
                  key={wi}
                  style={{
                    fontFamily: "Anton",
                    fontSize: size,
                    lineHeight: 1.08,
                    textTransform: "uppercase",
                    display: "inline-block",
                    transform: `scale(${interpolate(sp, [0, 1], [2.2, 1])}) rotate(${interpolate(sp, [0, 1], [k % 2 ? -8 : 8, 0])}deg)`,
                    opacity: interpolate(sp, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                    color: hl ? "transparent" : "white",
                    backgroundImage: hl ? `linear-gradient(180deg, ${ORANGE} 10%, ${PINK} 90%)` : undefined,
                    WebkitBackgroundClip: hl ? "text" : undefined,
                    backgroundClip: hl ? "text" : undefined,
                    filter: `drop-shadow(0 6px 0 #1b0631) drop-shadow(0 0 22px ${hl ? PINK : "rgba(0,0,0,0.6)"})`,
                    WebkitTextStroke: hl ? "0px" : "2px #1b0631",
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ---------- overlays ----------
const Pop: React.FC<{ at: number; children: (sp: number, f: number) => React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame() - sec(at);
  const { fps } = useVideoConfig();
  if (f < 0) return null;
  const sp = spring({ frame: f, fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  return <>{children(sp, f)}</>;
};

const OverlayView: React.FC<{ o: Overlay }> = ({ o }) => {
  const at = o.at ?? 0.3;
  switch (o.kind) {
    case "stamp":
      return (
        <Pop at={at}>
          {(sp) => (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: o.y ?? 900,
                display: "flex",
                justifyContent: "center",
                transform: `scale(${interpolate(sp, [0, 1], [3, 1])}) rotate(${o.rot ?? -10}deg)`,
                opacity: interpolate(sp, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              <div
                style={{
                  fontFamily: "Anton",
                  fontSize: 120,
                  padding: "6px 40px",
                  color: o.color ?? "#FF2D2D",
                  border: `12px solid ${o.color ?? "#FF2D2D"}`,
                  borderRadius: 22,
                  background: "rgba(10,0,20,0.72)",
                  letterSpacing: 6,
                  boxShadow: `0 0 50px ${o.color ?? "#FF2D2D"}99`,
                }}
              >
                {o.text}
              </div>
            </div>
          )}
        </Pop>
      );
    case "calendar":
      return (
        <Pop at={at}>
          {(sp) => (
            <div
              style={{
                position: "absolute",
                right: 60,
                top: 1150,
                width: 300,
                borderRadius: 30,
                overflow: "hidden",
                background: "white",
                boxShadow: `0 0 0 6px ${PINK}, 0 20px 50px rgba(0,0,0,0.6)`,
                transform: `scale(${sp}) rotate(${interpolate(sp, [0, 1], [30, 6])}deg)`,
                textAlign: "center",
              }}
            >
              <div style={{ background: PINK, color: "white", fontFamily: "Montserrat", fontWeight: 900, fontSize: 48, padding: "10px 0" }}>{o.month}</div>
              <div style={{ fontFamily: "Anton", fontSize: 170, color: "#1b0631", lineHeight: 1.15 }}>{o.day}</div>
            </div>
          )}
        </Pop>
      );
    case "chips":
      return (
        <div style={{ position: "absolute", top: 1235, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
          {o.items.map((it, i) => (
            <Pop key={i} at={at + i * 0.45}>
              {(sp) => (
                <div
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 900,
                    fontSize: 56,
                    color: "white",
                    padding: "18px 34px",
                    borderRadius: 999,
                    background: i === 0 ? "linear-gradient(135deg,#0070D1,#00439C)" : "linear-gradient(135deg,#1DB954,#107C10)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.5), inset 0 -6px 0 rgba(0,0,0,0.25)",
                    transform: `scale(${sp}) translateY(${interpolate(sp, [0, 1], [80, 0])}px)`,
                  }}
                >
                  {it}
                </div>
              )}
            </Pop>
          ))}
        </div>
      );
    case "choice":
      return (
        <div style={{ position: "absolute", top: 1215, left: 60, right: 60, display: "flex", gap: 30 }}>
          {[o.a, o.b].map((t, i) => (
            <Pop key={i} at={at + i * 0.35}>
              {(sp, f) => (
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: "Anton",
                    fontSize: 72,
                    color: "white",
                    padding: "22px 0",
                    borderRadius: 28,
                    background: i === 0 ? `linear-gradient(135deg, ${PINK}, #B5179E)` : `linear-gradient(135deg, ${CYAN}, #3A86FF)`,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.5), inset 0 -8px 0 rgba(0,0,0,0.25)",
                    transform: `scale(${sp * (1 + 0.04 * Math.sin((f + i * 8) / 5))})`,
                  }}
                >
                  {t}
                </div>
              )}
            </Pop>
          ))}
        </div>
      );
    case "comment":
      return (
        <Pop at={at}>
          {(sp, f) => (
            <div
              style={{
                position: "absolute",
                left: 90,
                right: 90,
                top: 1200,
                background: "white",
                borderRadius: 40,
                padding: "26px 34px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                transform: `scale(${sp}) translateY(${Math.sin(f / 6) * 6}px)`,
                boxShadow: `0 0 0 6px ${PINK}, 0 20px 50px rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{ fontSize: 80 }}>💬</div>
              <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 56, color: "#1b0631" }}>{o.text}</div>
            </div>
          )}
        </Pop>
      );
    case "bars":
      return (
        <Pop at={at}>
          {(sp) => (
            <div style={{ position: "absolute", left: 50, top: 690, width: 980, height: 620, display: "flex", justifyContent: "space-around", borderRadius: 34, overflow: "hidden" }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 26,
                    height: "100%",
                    background: "linear-gradient(90deg,#555,#ddd,#555)",
                    transform: `translateY(${interpolate(sp, [0, 1], [-640, 0])}px)`,
                    boxShadow: "6px 0 14px rgba(0,0,0,0.6)",
                  }}
                />
              ))}
            </div>
          )}
        </Pop>
      );
    case "tag":
      return (
        <Pop at={at}>
          {(sp) => (
            <div style={{ position: "absolute", left: 0, right: 0, top: o.y ?? 1250, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 900,
                  fontSize: 54,
                  color: "#1b0631",
                  background: `linear-gradient(90deg, ${ORANGE}, ${PINK})`,
                  padding: "14px 34px",
                  borderRadius: 16,
                  transform: `scaleX(${sp}) rotate(-2deg)`,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                }}
              >
                {o.text}
              </div>
            </div>
          )}
        </Pop>
      );
  }
};

// ---------- scene ----------
const Stickers: React.FC<{ emojis: string[]; dur: number; seed: number }> = ({ emojis, dur, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spots = [
    [40, 640], [880, 620], [60, 1250], [870, 1240], [470, 600],
  ];
  return (
    <>
      {emojis.map((e, i) => {
        const at = Math.round(6 + (i * dur) / Math.max(2, emojis.length + 0.6));
        const sp = spring({ frame: f - at, fps, config: { damping: 8, stiffness: 240, mass: 0.5 } });
        if (f < at) return null;
        const [x, y] = spots[(seed + i * 2) % spots.length];
        const wob = Math.sin((f - at) / 5) * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 130, transform: `scale(${sp}) rotate(${wob + (i % 2 ? 14 : -14)}deg)`, filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.6))" }}>
            {e}
          </div>
        );
      })}
    </>
  );
};

const FullMedia: React.FC<{ m: string; clipLen: Record<string, number>; vol: number; seed: number }> = ({ m, clipLen, vol, seed }) => {
  const f = useCurrentFrame();
  const punch = seed === 0 ? 1.06 : interpolate(f, [0, 7], [1.25, 1.06], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const z = punch + f * 0.0012;
  const px = Math.sin(f / 50 + seed) * 20;
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translateX(${px}px)` };
  const isV = m.startsWith("v:");
  const name = isV ? m.slice(2) : m;
  const len = Math.max(1, Math.round((clipLen[name] ?? 3) * FPS) - 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {isV ? (
        <Loop durationInFrames={len} layout="none">
          <OffthreadVideo src={staticFile(`gta6/gp/${name}.mp4`)} volume={vol} style={style} />
        </Loop>
      ) : (
        <Img src={staticFile(`gta6/img/${m}.jpg`)} style={style} />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,4,42,0.82) 0%, rgba(20,4,42,0.1) 32%, rgba(20,4,42,0) 55%, rgba(20,4,42,0.75) 100%)" }} />
      {seed === 0 ? null : <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 4], [0.4, 0], { extrapolateRight: "clamp" }) }} />}
    </AbsoluteFill>
  );
};

const GameBadge: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 40, top: 40, display: "flex", alignItems: "center", gap: 12, fontFamily: "Montserrat", fontWeight: 900, fontSize: 34, color: "white", background: "rgba(10,0,20,0.6)", border: `3px solid ${CYAN}`, padding: "10px 20px", borderRadius: 14 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: "#FF2D2D", opacity: Math.sin(f / 5) > 0 ? 1 : 0.3 }} />
      GAMEPLAY REAL
    </div>
  );
};

const SceneView: React.FC<{ sc: Scene; idx: number; clipLen?: Record<string, number>; gameVolume?: number }> = ({ sc, idx, clipLen = {}, gameVolume = 0.3 }) => {
  const f = useCurrentFrame();
  const dur = sec(sc.e - sc.s);
  const shake = (sc.shake ? 18 : 7) * Math.max(0, 1 - f / 10);
  const sx = shake * Math.sin(f * 2.3);
  const sy = shake * Math.cos(f * 3.1);
  const n = sc.imgs.length;
  const per = dur / Math.max(1, n);
  const cur = Math.min(n - 1, Math.floor(f / per));
  const whip = idx === 0 ? 0 : interpolate(f, [0, 6], [idx % 2 ? 260 : -260, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const blur = idx === 0 ? 0 : interpolate(f, [0, 6], [18, 0], { extrapolateRight: "clamp" });
  const zoomIn = interpolate(f, [0, 8], [1.12, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `translate(${sx + whip}px, ${sy}px) scale(${zoomIn})`, filter: blur ? `blur(${blur}px)` : undefined }}>
      {sc.full ? null : <Bg img={sc.split ? sc.split[0] : sc.imgs[cur]} />}
      {sc.full ? (
        sc.imgs.map((im, i) =>
          i === cur ? (
            <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.max(1, Math.round(per))}>
              <FullMedia m={im} clipLen={clipLen} vol={sc.vol ?? gameVolume} seed={idx + i} />
            </Sequence>
          ) : null,
        )
      ) : sc.split ? (
        <>
          <Card img={sc.split[0]} idx={0} w={500} h={680} x={30} y={680} label={sc.split[1]} labelColor={PINK} />
          <Card img={sc.split[2]} idx={1} w={500} h={680} x={550} y={680} label={sc.split[3]} labelColor="#3A86FF" delay={8} />
        </>
      ) : (
        sc.imgs.map((im, i) =>
          i === cur ? (
            <Sequence key={i} from={Math.round(i * per)} layout="none">
              <Card img={im} idx={idx === 0 && i === 0 ? 1 : idx + i} delay={sc.hook && idx === 0 && i === 0 ? -12 : 0} />
            </Sequence>
          ) : null,
        )
      )}
      {sc.full && (sc.imgs[cur] ?? "").startsWith("v:") ? <GameBadge /> : null}
      <Stickers emojis={sc.emojis ?? []} dur={dur} seed={idx} />
      <Title lines={sc.title} at={sc.titleAt ?? sc.title.map((_, i) => i * 0.4)} hook={sc.hook} />
      {(sc.overlays ?? []).map((o, i) => (
        <OverlayView key={i} o={o} />
      ))}
      {/* cut flashes: every scene start and every image change */}
      <AbsoluteFill
        style={{
          background: sc.flash ? "white" : PINK,
          mixBlendMode: sc.flash ? "normal" : "screen",
          opacity: idx === 0 && f < per ? 0 : interpolate(f - (n > 1 && !sc.split ? Math.floor(f / per) * per : 0), [0, sc.flash ? 6 : 4], [sc.flash ? 0.9 : 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- kinetic captions (word by word) ----------
const Captions: React.FC<{ caps: Caption[]; size?: number; top?: number }> = ({ caps, size = 132, top = 1400 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / FPS;
  const c = caps.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  if (c.full) {
    const fp = interpolate(f - Math.round(c.s * FPS), [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ position: "absolute", left: 60, right: 60, top: top - 40, display: "flex", justifyContent: "center", opacity: fp, transform: `translateY(${(1 - fp) * 20}px)` }}>
        <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 52, lineHeight: 1.3, color: "#FFE14A", textAlign: "center", padding: "14px 24px", background: "rgba(10,0,20,0.6)", borderRadius: 18 }}>{c.t}</div>
      </div>
    );
  }
  const words = c.t.split(" ").filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const tot = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.1, c.e - 0.15 - c.s);
  let acc = 0;
  let wi = words.length - 1;
  let wStart = c.s;
  for (let i = 0; i < words.length; i++) {
    const ws = c.s + (acc / tot) * span;
    acc += weights[i];
    const we = c.s + (acc / tot) * span;
    if (t < we) {
      wi = i;
      wStart = ws;
      break;
    }
  }
  // show the current word plus the next short one, if it is tiny
  const shown = [words[wi]];
  const local = f - Math.round(wStart * FPS);
  const sp = spring({ frame: local, fps, config: { damping: 9, stiffness: 300, mass: 0.5 } });
  const colors = ["#FFFFFF", "#FFE14A", "#FFFFFF", "#7CFFEA"];
  const col = colors[wi % colors.length];
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: "Anton",
          fontSize: size,
          textTransform: "uppercase",
          color: col,
          transform: `scale(${interpolate(sp, [0, 1], [0.4, 1])}) rotate(${wi % 2 ? -3 : 3}deg)`,
          WebkitTextStroke: "10px #12031f",
          paintOrder: "stroke fill",
          filter: "drop-shadow(0 8px 0 #12031f) drop-shadow(0 0 24px rgba(255,62,165,0.6))",
          whiteSpace: "nowrap",
        }}
      >
        {shown.join(" ")}
      </div>
    </div>
  );
};

// ---------- main ----------
export const GTA6Short: React.FC<GTA6Props> = ({ scenes, captions, voice, music, musicVolume, total, clipLen, gameVolume, sfxGain = 1, capSize, capTop }) => {
  const f = useCurrentFrame();
  const end = sec(total);
  return (
    <AbsoluteFill style={{ background: "#14042a" }}>
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s))}>
          <SceneView sc={sc} idx={i} clipLen={clipLen} gameVolume={gameVolume} />
        </Sequence>
      ))}
      <Captions caps={captions} size={capSize} top={capTop} />
      {/* progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 12, width: `${(f / end) * 100}%`, background: `linear-gradient(90deg, ${ORANGE}, ${PINK})` }} />
      {/* audio */}
      <Audio src={staticFile(voice)} />
      {musicVolume > 0 ? <Audio
        src={staticFile(music)}
        volume={(fr) => interpolate(fr, [0, 10, end - 30, end], [0, musicVolume, musicVolume, 0], { extrapolateRight: "clamp" })}
      /> : null}
      {scenes.flatMap((sc, i) => {
        const base = sc.sfx ?? [{ f: "wyr/sfx/whoosh.wav", at: 0, v: 0.5 }];
        const extra: { f: string; at?: number; v?: number }[] = [];
        const n = sc.split ? 0 : sc.imgs.length;
        for (let k = 1; k < n; k++) {
          const at = ((sc.e - sc.s) * k) / n;
          if (!base.some((b) => Math.abs((b.at ?? 0) - at) < 0.25)) extra.push({ f: "wyr/sfx/whoosh.wav", at, v: 0.4 });
        }
        (sc.emojis ?? []).forEach((_, k) => extra.push({ f: "wyr/sfx/pop.wav", at: (6 + (k * sec(sc.e - sc.s)) / Math.max(2, (sc.emojis ?? []).length + 0.6)) / FPS, v: 0.45 }));
        return [...base, ...extra].map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(sc.s + (x.at ?? 0))} durationInFrames={sec(2)}>
            <Audio src={staticFile(x.f)} volume={(x.v ?? 0.6) * sfxGain} />
          </Sequence>
        ));
      })}
    </AbsoluteFill>
  );
};

export const gta6Duration = (p: GTA6Props) => sec(p.total);
