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
import { loadFont } from "@remotion/fonts";
import { fontFamily } from "../Lumora/common";
import { World, WorldName } from "./worlds";

const SERIF = "Playfair Display";
loadFont({ family: SERIF, url: staticFile("fonts/playfair-900-italic.woff2"), weight: "900", style: "italic" });

const GOLD = "#FFC94A";
const ORANGE = "#FF7A1A";
const RED = "#E8401C";
const INK = "#2a0c03";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- data model ---------- */

export type TLine = { t: string; serif?: boolean; color?: string; bg?: string; size?: number };

export type Beat =
  | { kind: "room"; dur: number; world: WorldName; from?: number; to?: number; switchAt?: number; text?: TLine[]; textAfter?: TLine[]; cam?: "push" | "pull" | "wall" | "pan"; textPos?: "top" | "center" | "bottom" }
  | { kind: "strips"; dur: number; text: TLine[]; stamp: string; textAfter: TLine[] }
  | { kind: "chat"; dur: number; name: string; msgs: { me?: boolean; t: string; at: number }[]; text?: TLine[] }
  | { kind: "search"; dur: number; query: string; text?: TLine[] }
  | { kind: "price"; dur: number; price: string; text: TLine[]; sub?: TLine[] }
  | { kind: "lightswitch"; dur: number; world: WorldName; text1: TLine[]; text2: TLine[] }
  | { kind: "split"; dur: number; world: WorldName; text: TLine[]; a: string; b: string }
  | { kind: "board"; dur: number; text: TLine[] }
  | { kind: "camera"; dur: number; world: WorldName; textA: TLine[]; textB: TLine[] }
  | { kind: "gift"; dur: number; text: TLine[] }
  | { kind: "countdown"; dur: number; world: WorldName; text: TLine[]; textAfter: TLine[] }
  | { kind: "product"; dur: number; text: TLine[]; photo?: "real" | "estudio" }
  | { kind: "photo"; dur: number; text: TLine[]; photo?: "real" | "estudio" }
  | { kind: "montage"; dur: number; text: TLine[]; worlds: WorldName[] }
  | { kind: "urgency"; dur: number; text: TLine[] }
  | { kind: "tease"; dur: number; text: TLine[]; sub?: TLine[]; world?: WorldName; lit?: number }
  | { kind: "mystery"; dur: number; text: TLine[]; sub?: TLine[] }
  | { kind: "checklist"; dur: number; text: TLine[]; items: { t: string; ok: boolean }[]; world?: WorldName; lit?: number }
  | { kind: "offer"; dur: number; top?: string }
  | { kind: "cta"; dur: number; text?: string };

export type Reel2Props = { beats: Beat[]; music: string; musicVolume?: number; voice?: string };

export const reel2Duration = (beats: Beat[]) => beats.reduce((a, b) => a + b.dur, 0);

/* ---------- typography ---------- */

const BigText: React.FC<{ lines: TLine[]; pos?: "top" | "center" | "bottom"; delay?: number; instant?: boolean }> = ({ lines, pos = "top", delay = 0, instant = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const top = pos === "top" ? 170 : pos === "bottom" ? 1260 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: pos === "center" ? 0 : top,
        bottom: pos === "center" ? 0 : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        zIndex: 20,
      }}
    >
      {lines.map((l, i) => {
        const s = spring({ frame: frame - delay - i * (instant ? 2 : 5), fps, config: { damping: 12, stiffness: instant ? 320 : 200 } });
        const size = l.size ?? (l.serif ? 118 : 104);
        return (
          <div
            key={i}
            style={{
              fontFamily: l.serif ? SERIF : fontFamily,
              fontStyle: l.serif ? "italic" : "normal",
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1.02,
              textAlign: "center",
              letterSpacing: l.serif ? -1 : -2,
              color: l.bg ? INK : l.color ?? "#fff",
              background: l.bg,
              padding: l.bg ? "4px 26px 12px" : 0,
              borderRadius: 22,
              textShadow: l.bg ? "none" : "0 6px 0 rgba(0,0,0,0.18), 0 14px 40px rgba(0,0,0,0.45)",
              boxShadow: l.bg ? "0 16px 40px rgba(0,0,0,0.3)" : "none",
              opacity: Math.min(1, s * 1.8),
              transform: `translateY(${(1 - s) * 70}px) scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg)`,
            }}
          >
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

const Shade: React.FC<{ top?: boolean; bottom?: boolean; s?: number }> = ({ top = true, bottom = false, s = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, ${top ? `rgba(0,0,0,${s})` : "transparent"} 0%, ${top ? `rgba(0,0,0,${s * 0.6})` : "transparent"} 20%, transparent 38%, transparent 62%, ${bottom ? `rgba(0,0,0,${s})` : "transparent"} 100%)`,
      zIndex: 10,
    }}
  />
);

const Sparkles: React.FC<{ n?: number; seed?: string }> = ({ n = 24, seed = "s" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ zIndex: 15, pointerEvents: "none" }}>
      {new Array(n).fill(0).map((_, i) => {
        const x = random(`${seed}x${i}`) * 1080;
        const y = 300 + random(`${seed}y${i}`) * 1300 - frame * (0.6 + random(`${seed}v${i}`));
        const o = 0.3 + 0.7 * Math.abs(Math.sin(frame / 8 + i));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 7, height: 7, borderRadius: 4, background: "#ffe2a0", opacity: o, boxShadow: "0 0 12px #ffb050" }} />;
      })}
    </AbsoluteFill>
  );
};

const camTransform = (cam: string | undefined, t: number, dur: number) => {
  const p = t / dur;
  switch (cam) {
    case "pull":
      return `scale(${1.25 - p * 0.18})`;
    case "wall":
      return `translateY(${p * 160}px) scale(${1.15 + p * 0.25})`;
    case "pan":
      return `translateX(${-40 + p * 80}px) scale(1.12)`;
    default:
      return `scale(${1.05 + p * 0.14})`;
  }
};

/* ---------- beats ---------- */

const RoomBeat: React.FC<{ b: Extract<Beat, { kind: "room" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const sw = b.switchAt ?? -1;
  const lit = sw >= 0 ? interpolate(t, [sw, sw + 16], [b.from ?? 0, b.to ?? 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : b.to ?? b.from ?? 0;
  const flash = sw >= 0 ? interpolate(t, [sw - 1, sw + 1, sw + 12], [0, 0.8, 0], clamp) : 0;
  const shake = sw >= 0 && t >= sw && t < sw + 8 ? (sw + 8 - t) * 2.2 : first && t < 8 ? (8 - t) * 2 : 0;
  const showAfter = sw >= 0 && t >= sw + 6;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `${camTransform(b.cam, t, b.dur)} translate(${Math.sin(t * 11) * shake}px, ${Math.cos(t * 7) * shake}px)`, transformOrigin: "50% 45%" }}>
        <World name={b.world} lit={lit} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#ffc078", opacity: flash, mixBlendMode: "screen", zIndex: 12 }} />
      {lit > 0.5 && <Sparkles seed={b.world} />}
      <Shade s={0.6} />
      {b.text && !showAfter ? <BigText lines={b.text} pos={b.textPos} instant={first} /> : null}
      {b.textAfter && showAfter ? (
        <Sequence from={sw + 6}>
          <BigText lines={b.textAfter} pos={b.textPos} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const StripsBeat: React.FC<{ b: Extract<Beat, { kind: "strips" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const off = Math.round(b.dur * 0.55);
  const strips = interpolate(t, [off - 4, off + 4], [1, 0], clamp);
  const lit = interpolate(t, [off, off + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const stampT = t - 12;
  const stampS = interpolate(stampT, [0, 6], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const flash = interpolate(t, [off - 1, off + 1, off + 12], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: camTransform("push", t, b.dur) }}>
        <World name="tiras" lit={lit} strips={strips} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#ffc078", opacity: flash, mixBlendMode: "screen", zIndex: 12 }} />
      <Shade s={0.5} />
      {t < off ? <BigText lines={b.text} instant={first} /> : <BigText lines={b.textAfter} />}
      {stampT >= 0 && t < off ? (
        <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 25, transform: `scale(${stampS}) rotate(-12deg)`, opacity: interpolate(stampT, [0, 3], [0, 1], clamp) }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 130, color: "#ff2d2d", border: "14px solid #ff2d2d", borderRadius: 26, padding: "4px 36px", background: "rgba(255,255,255,0.9)", letterSpacing: 4 }}>{b.stamp}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ children: React.ReactNode; y?: number; s?: number }> = ({ children, y = 0, s = 1 }) => (
  <div style={{ position: "absolute", left: 540 - 340, top: 470 + y, width: 680, height: 1340, borderRadius: 80, background: "#111", padding: 22, boxShadow: "0 60px 120px rgba(0,0,0,0.45)", transform: `scale(${s})`, zIndex: 18 }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", background: "#f4f1ec" }}>
      <div style={{ position: "absolute", top: 18, left: 250, width: 120, height: 34, borderRadius: 17, background: "#111", zIndex: 5 }} />
      {children}
    </div>
  </div>
);

const ChatBeat: React.FC<{ b: Extract<Beat, { kind: "chat" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = first ? 1 : spring({ frame: t, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ filter: "blur(10px) brightness(0.85)", transform: "scale(1.15)" }}>
        <World name="dormitorio" lit={0} />
      </AbsoluteFill>
      <Phone y={(1 - enter) * 900}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "flex-end", padding: "0 30px 22px", gap: 18 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: "linear-gradient(135deg,#ffb36b,#ff6a3d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>👩</div>
          <div>
            <div style={{ fontFamily, fontWeight: 800, fontSize: 44, color: "#111" }}>{b.name}</div>
            <div style={{ fontFamily, fontWeight: 600, fontSize: 24, color: "#2a9d5b" }}>en línea</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 200, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {b.msgs.map((m, i) => {
            const s = spring({ frame: t - m.at, fps, config: { damping: 11, stiffness: 220 } });
            if (t < m.at) return null;
            return (
              <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "82%", background: m.me ? "#d9fdd3" : "#fff", borderRadius: 26, padding: "18px 24px", fontFamily, fontWeight: 700, fontSize: 50, color: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", transform: `scale(${s})`, transformOrigin: m.me ? "100% 100%" : "0 100%" }}>
                {m.t}
              </div>
            );
          })}
        </div>
      </Phone>
      {b.text ? <BigText lines={b.text} instant={first} /> : null}
    </AbsoluteFill>
  );
};

const SearchBeat: React.FC<{ b: Extract<Beat, { kind: "search" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.min(b.query.length, Math.floor(t * 1.6));
  const full = b.query.slice(0, chars);
  const typed = full.length > 26 ? "…" + full.slice(-25) : full;
  const doneAt = Math.ceil(b.query.length / 1.6) + 6;
  const res = spring({ frame: t - doneAt, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#fbfaf7,#efe9df)", overflow: "hidden" }}>
      {b.text ? <BigText lines={b.text} instant={first} /> : null}
      <div style={{ position: "absolute", top: 560, left: 60, right: 60, height: 130, borderRadius: 65, background: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 40px", gap: 22, zIndex: 18 }}>
        <div style={{ fontSize: 50 }}>🔍</div>
        <div style={{ fontFamily, fontWeight: 600, fontSize: 40, color: "#222", whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed}
          <span style={{ opacity: Math.floor(t / 8) % 2 ? 0 : 1 }}>|</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 760, left: 60, right: 60, borderRadius: 40, background: "#fff", overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.18)", transform: `translateY(${(1 - res) * 900}px)`, zIndex: 18 }}>
        <div style={{ height: 620, overflow: "hidden" }}>
          <Img src={staticFile("lampara-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.1 + t * 0.001})` }} />
        </div>
        <div style={{ padding: "28px 36px" }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 50, color: "#111" }}>Lámpara LED atardecer</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
            <span style={{ fontFamily, fontWeight: 900, fontSize: 56, color: RED }}>29,95 €</span>
            <span style={{ fontFamily, fontWeight: 700, fontSize: 38, color: "#999", textDecoration: "line-through" }}>49,95 €</span>
            <span style={{ fontFamily, fontWeight: 900, fontSize: 34, color: "#fff", background: RED, borderRadius: 12, padding: "4px 14px" }}>-40%</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PriceBeat: React.FC<{ b: Extract<Beat, { kind: "price" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const swing = Math.sin(t / 6) * 10 * Math.exp(-t / 40);
  const drop = interpolate(t, [0, 7], [-900, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ filter: "blur(6px)", transform: "scale(1.1)" }}>
        <World name="rincon" lit={0} />
      </AbsoluteFill>
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", left: 540 - 300, top: 560, width: 600, transformOrigin: "50% 0", transform: `translateY(${first ? 0 : drop}px) rotate(${swing}deg)`, zIndex: 18 }}>
        <div style={{ margin: "0 auto", width: 6, height: 120, background: "#7a5a3a" }} />
        <div style={{ position: "relative", background: GOLD, borderRadius: 40, padding: "70px 30px 60px", textAlign: "center", boxShadow: "0 40px 80px rgba(0,0,0,0.35)" }}>
          <div style={{ position: "absolute", top: 26, left: "50%", marginLeft: -22, width: 44, height: 44, borderRadius: 22, background: "#efe9df" }} />
          <div style={{ fontFamily, fontWeight: 900, fontSize: 150, color: INK, letterSpacing: -5, whiteSpace: "nowrap" }}>{b.price}</div>
        </div>
      </div>
      {b.sub ? (
        <Sequence from={14}>
          <BigText lines={b.sub} pos="bottom" />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const LightswitchBeat: React.FC<{ b: Extract<Beat, { kind: "lightswitch" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const flip = Math.round(b.dur * 0.38);
  const on = t >= flip;
  const lit = interpolate(t, [flip, flip + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(t, [flip - 1, flip + 1, flip + 10], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#0b0a0c", overflow: "hidden" }}>
      {!on ? (
        <>
          <BigText lines={b.text1} pos="top" instant={first} />
          <div style={{ position: "absolute", left: 540 - 130, top: 760, width: 260, height: 400, borderRadius: 30, background: "#2b2a2e", boxShadow: "inset 0 0 0 6px #3a393e", zIndex: 18 }}>
            <div style={{ position: "absolute", left: 70, top: 80, width: 120, height: 240, borderRadius: 20, background: "#47464c" }}>
              <div style={{ position: "absolute", left: 10, right: 10, top: t > flip - 6 ? 120 : 10, height: 110, borderRadius: 14, background: "#e9e6e0" }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <AbsoluteFill style={{ transform: camTransform("push", t - flip, b.dur - flip) }}>
            <World name={b.world} lit={lit} />
          </AbsoluteFill>
          <Sparkles seed="sw" />
          <Shade s={0.4} />
          <BigText lines={b.text2} />
        </>
      )}
      <AbsoluteFill style={{ background: "#ffc078", opacity: flash, zIndex: 30 }} />
    </AbsoluteFill>
  );
};

const SplitBeat: React.FC<{ b: Extract<Beat, { kind: "split" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sA = first ? 1 : spring({ frame: t, fps, config: { damping: 14 } });
  const sB = first ? 1 : spring({ frame: t - 6, fps, config: { damping: 14 } });
  const pick = t > b.dur * 0.55;
  const badge = (n: string, left: boolean, s: number) => (
    <div style={{ position: "absolute", top: 1180, [left ? "left" : "right"]: 170, width: 200, height: 200, borderRadius: 100, background: left ? "#fff" : GOLD, color: INK, fontFamily, fontWeight: 900, fontSize: 130, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s * (pick && !left ? 1.18 + Math.sin(t / 3) * 0.05 : 1)})`, boxShadow: "0 20px 50px rgba(0,0,0,0.35)", zIndex: 22 }}>
      {n}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, overflow: "hidden", transform: `translateX(${(1 - sA) * -540}px)` }}>
        <div style={{ position: "absolute", left: -270, width: 1080, height: 1920 }}>
          <World name={b.world} lit={0} id="splitA" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1920, overflow: "hidden", transform: `translateX(${(1 - sB) * 540}px)` }}>
        <div style={{ position: "absolute", left: -270, width: 1080, height: 1920 }}>
          <World name={b.world} lit={1} id="splitB" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 534, top: 0, width: 12, height: 1920, background: "#fff", zIndex: 15 }} />
      <Shade s={0.5} />
      <BigText lines={b.text} instant={first} />
      {badge("1", true, sA)}
      {badge("2", false, sB)}
      <div style={{ position: "absolute", top: 1420, left: 0, width: 540, textAlign: "center", fontFamily, fontWeight: 800, fontSize: 44, color: "#fff", zIndex: 22, textShadow: "0 4px 18px #000" }}>{b.a}</div>
      <div style={{ position: "absolute", top: 1420, left: 540, width: 540, textAlign: "center", fontFamily, fontWeight: 800, fontSize: 44, color: "#fff", zIndex: 22, textShadow: "0 4px 18px #000" }}>{b.b}</div>
    </AbsoluteFill>
  );
};

const BoardBeat: React.FC<{ b: Extract<Beat, { kind: "board" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles: ({ w: WorldName } | { img: string })[] = [{ w: "salon" }, { img: "lampara-real.jpg" }, { w: "escritorio" }, { w: "rincon" }, { img: "lampara.jpg" }, { w: "dormitorio" }];
  return (
    <AbsoluteFill style={{ background: "#f7f3ee", overflow: "hidden" }}>
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", top: 520, left: 40, right: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, transform: `translateY(${-t * 1.2}px)` }}>
        {tiles.map((tile, i) => {
          const s = spring({ frame: t - (first ? 0 : 4) - i * 4, fps, config: { damping: 12 } });
          const h = i % 3 === 1 ? 560 : 420;
          return (
            <div key={i} style={{ position: "relative", height: h, borderRadius: 34, overflow: "hidden", transform: `scale(${s}) rotate(${(i % 2 ? 2 : -2) * (1 - s)}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,0.18)" }}>
              {"w" in tile ? (
                <div style={{ position: "absolute", left: -270, top: -(1920 - h * 2) / 2 - h / 2, width: 1080, height: 1920, transform: "scale(0.5)", transformOrigin: "50% 50%" }}>
                  <World name={tile.w} lit={1} id={`tile${i}`} />
                </div>
              ) : (
                <Img src={staticFile(tile.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{ position: "absolute", top: 16, right: 16, width: 56, height: 56, borderRadius: 28, background: "#e60023", color: "#fff", fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", opacity: s }}>♥</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CameraBeat: React.FC<{ b: Extract<Beat, { kind: "camera" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const shot = Math.round(b.dur * 0.45);
  const lit = interpolate(t, [shot, shot + 6], [0, 1], clamp);
  const flash = interpolate(t, [shot - 1, shot, shot + 6], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.18 + t * 0.0015})` }}>
        <World name={b.world} lit={lit} />
      </AbsoluteFill>
      {/* camera UI */}
      <AbsoluteFill style={{ zIndex: 14 }}>
        {[1, 2].map((i) => (
          <div key={`v${i}`} style={{ position: "absolute", left: (1080 / 3) * i, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.35)" }} />
        ))}
        {[1, 2].map((i) => (
          <div key={`h${i}`} style={{ position: "absolute", top: (1920 / 3) * i, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.35)" }} />
        ))}
        <div style={{ position: "absolute", bottom: 90, left: 540 - 70, width: 140, height: 140, borderRadius: 70, border: "10px solid #fff", background: t >= shot && t < shot + 4 ? "#ddd" : "transparent" }} />
        <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 800, fontSize: 30, color: GOLD, letterSpacing: 6 }}>FOTO</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, zIndex: 30 }} />
      <Shade s={0.4} />
      {t < shot ? <BigText lines={b.textA} instant={first} /> : <BigText lines={b.textB} />}
    </AbsoluteFill>
  );
};

const GiftBeat: React.FC<{ b: Extract<Beat, { kind: "gift" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = spring({ frame: t - 10, fps, config: { damping: 12 } });
  const rise = spring({ frame: t - 16, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(180deg,#fbf6ef,#efe2d0)" }}>
      {new Array(18).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`gx${i}`) * 1080, top: random(`gy${i}`) * 1900 + Math.sin(t / 10 + i) * 20, width: 30, height: 30, borderRadius: 6, background: ["#e8333c", "#1f9e5a", GOLD][i % 3], transform: `rotate(${t * 3 + i * 30}deg)`, opacity: 0.6 * open }} />
      ))}
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", left: 540 - 250, top: 1000 - rise * 420, width: 500, height: 660, borderRadius: 36, overflow: "hidden", transform: `scale(${0.4 + rise * 0.6})`, opacity: rise, boxShadow: "0 0 90px rgba(255,160,60,0.8)", zIndex: 16 }}>
        <Img src={staticFile("lampara-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 300, top: 1300, width: 600, height: 420, borderRadius: 20, background: "linear-gradient(160deg, #d8262f, #8e0f18)", boxShadow: "0 40px 80px rgba(0,0,0,0.3)", zIndex: 17 }}>
        <div style={{ position: "absolute", left: 260, top: 0, width: 80, height: "100%", background: "#F5C04A" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 330, top: 1190, width: 660, height: 120, borderRadius: 20, background: "linear-gradient(160deg, #e8333c, #a5121c)", transformOrigin: "100% 100%", transform: `translate(${open * 320}px, ${-open * 520}px) rotate(${open * 32}deg)`, zIndex: 18 }}>
        <div style={{ position: "absolute", left: 290, top: 0, width: 80, height: "100%", background: "#F5C04A" }} />
      </div>
    </AbsoluteFill>
  );
};

const CountdownBeat: React.FC<{ b: Extract<Beat, { kind: "countdown" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const step = 11;
  const n = 3 - Math.floor(t / step);
  const inStep = (t % step) / step;
  const sw = step * 3;
  const lit = interpolate(t, [sw, sw + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(t, [sw - 1, sw + 1, sw + 10], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.05 + (t < sw ? (3 - n) * 0.06 + inStep * 0.06 : 0.25)})` }}>
        <World name={b.world} lit={lit} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#ffc078", opacity: flash, mixBlendMode: "screen", zIndex: 12 }} />
      <Shade s={0.6} />
      {t < sw ? (
        <>
          <BigText lines={b.text} instant={first} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 22 }}>
            <div style={{ fontFamily, fontWeight: 900, fontSize: 520, color: "#fff", lineHeight: 1, transform: `scale(${interpolate(inStep, [0, 0.25], [1.6, 1], clamp)})`, opacity: interpolate(inStep, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]), textShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>{n}</div>
          </AbsoluteFill>
        </>
      ) : (
        <>
          <Sparkles seed="cd" />
          <BigText lines={b.textAfter} />
        </>
      )}
    </AbsoluteFill>
  );
};

const ProductBeat: React.FC<{ b: Extract<Beat, { kind: "product" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = first ? 1 : spring({ frame: t - 2, fps, config: { damping: 12, stiffness: 130 } });
  const shine = interpolate(t, [14, 34], [-700, 900], clamp);
  const img = b.photo === "estudio" ? "lampara.jpg" : "lampara-real.jpg";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, #ffb36b 0%, ${ORANGE} 35%, #5a1a08 100%)` }} />
      <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 55%, rgba(255,235,180,0.16) 0deg 7deg, transparent 7deg 20deg)", transform: `rotate(${t * 0.7}deg) scale(2)` }} />
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", left: 540 - 320, top: 600, width: 640, height: 860, borderRadius: 46, overflow: "hidden", transform: `translateY(${(1 - pop) * 700}px) rotate(${(1 - pop) * 12 - 2 + t * 0.03}deg) scale(${1 + t * 0.0012})`, boxShadow: "0 50px 120px rgba(0,0,0,0.5), 0 0 0 8px rgba(255,255,255,0.92)", zIndex: 16 }}>
        <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: -200, left: shine, width: 160, height: 1400, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(20deg)" }} />
      </div>
      <Sparkles seed="pr" />
    </AbsoluteFill>
  );
};

const PhotoBeat: React.FC<{ b: Extract<Beat, { kind: "photo" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const img = b.photo === "estudio" ? "lampara.jpg" : "lampara-real.jpg";
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img src={staticFile(img)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.3 - (t / b.dur) * 0.2}) translateY(${-30 + (t / b.dur) * 50}px)` }} />
      <Shade s={0.55} bottom />
      <BigText lines={b.text} instant={first} />
    </AbsoluteFill>
  );
};

const MontageBeat: React.FC<{ b: Extract<Beat, { kind: "montage" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const cut = Math.max(10, Math.floor(b.dur / b.worlds.length));
  const idx = Math.min(b.worlds.length - 1, Math.floor(t / cut));
  const local = t - idx * cut;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.25 - local * 0.008}) rotate(${(idx % 2 ? 1 : -1) * 1.5}deg)` }}>
        <World name={b.worlds[idx]} lit={1} id={`m${idx}`} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(local, [0, 4], [0.6, 0], clamp), zIndex: 12 }} />
      <Shade s={0.6} />
      <BigText lines={b.text} instant={first} />
    </AbsoluteFill>
  );
};

const UrgencyBeat: React.FC<{ b: Extract<Beat, { kind: "urgency" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const secs = 59 - Math.floor(t / 3) % 60;
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t / 5));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(circle at 50% 50%, #ff5a2a, #6a0f05)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse, transparent 50%, rgba(0,0,0,${0.3 + pulse * 0.3}) 100%)` }} />
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, zIndex: 18 }}>
        {["23", "59", String(secs).padStart(2, "0")].map((d, i) => (
          <div key={i} style={{ fontFamily, fontWeight: 900, fontSize: 170, color: "#fff", background: "#1a0703", borderRadius: 30, padding: "10px 26px", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 1100, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 800, fontSize: 44, color: "#fff", letterSpacing: 8, zIndex: 18 }}>HORAS · MIN · SEG</div>
    </AbsoluteFill>
  );
};


/** Big intriguing question over a slowly drifting, softened place. */
const TeaseBeat: React.FC<{ b: Extract<Beat, { kind: "tease" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const p = t / b.dur;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {b.world ? (
        <AbsoluteFill style={{ transform: `scale(${1.15 + p * 0.12}) rotate(${-1 + p * 2}deg)`, filter: "blur(7px) brightness(0.42) saturate(0.8)" }}>
          <World name={b.world} lit={b.lit ?? 0} id={`tease-${b.world}`} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #3a2a24, #0e0a09)" }} />
      )}
      {/* floating question marks */}
      {new Array(9).fill(0).map((_, i) => {
        const x = 80 + random(`qx${i}`) * 900;
        const y = 1700 - ((t * (2 + random(`qv${i}`) * 3) + random(`qy${i}`) * 1700) % 1700);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: SERIF, fontStyle: "italic", fontWeight: 900, fontSize: 90 + random(`qs${i}`) * 120, color: GOLD, opacity: 0.18, transform: `rotate(${(random(`qr${i}`) - 0.5) * 40}deg)` }}>?</div>
        );
      })}
      <BigText lines={b.text} pos="center" instant={first} />
      {b.sub ? (
        <Sequence from={Math.min(18, Math.round(b.dur * 0.3))}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1330, zIndex: 21 }}>
            <BigText lines={b.sub.map((l) => ({ ...l, size: l.size ?? 62 }))} pos="top" />
          </div>
        </Sequence>
      ) : null}
      {/* "something is coming" bar */}
      <div style={{ position: "absolute", left: 140, right: 140, bottom: 260, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.18)", zIndex: 21 }}>
        <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 5, background: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

/** The product hidden behind blur + a big pulsing question mark. */
const MysteryBeat: React.FC<{ b: Extract<Beat, { kind: "mystery" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const p = t / b.dur;
  const pulse = 1 + 0.08 * Math.sin(t / 4);
  const blur = interpolate(p, [0, 1], [38, 18]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "radial-gradient(circle at 50% 50%, #3a1a0c, #050302)" }}>
      <div style={{ position: "absolute", left: 540 - 300, top: 560, width: 600, height: 800, borderRadius: 40, overflow: "hidden", filter: `blur(${blur}px) brightness(0.45)`, transform: `scale(${1 + p * 0.06})` }}>
        <Img src={staticFile("lampara-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 18 }}>
        <div style={{ marginTop: 120, fontFamily: SERIF, fontStyle: "italic", fontWeight: 900, fontSize: 420, color: GOLD, transform: `scale(${pulse}) rotate(${Math.sin(t / 9) * 6}deg)`, textShadow: "0 0 60px rgba(255,180,60,0.6)" }}>?</div>
      </AbsoluteFill>
      <BigText lines={b.text} instant={first} />
      {b.sub ? (
        <Sequence from={14}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1420, zIndex: 21 }}>
            <BigText lines={b.sub.map((l) => ({ ...l, size: l.size ?? 62 }))} pos="top" />
          </div>
        </Sequence>
      ) : null}
      <div style={{ position: "absolute", left: 160, right: 160, top: 1640, zIndex: 21, textAlign: "center", fontFamily, fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: 6 }}>
        REVELANDO… {Math.round(p * 100)}%
        <div style={{ marginTop: 14, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${RED})` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Title + items that land one by one with ✅ / ❌. */
const ChecklistBeat: React.FC<{ b: Extract<Beat, { kind: "checklist" }>; first: boolean }> = ({ b, first }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gap = Math.max(10, Math.floor((b.dur - 20) / (b.items.length + 1)));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.2 + t * 0.001})`, filter: "blur(9px) brightness(0.42)" }}>
        <World name={b.world ?? "dormitorio"} lit={b.lit ?? 0} id={`chk-${b.world}`} />
      </AbsoluteFill>
      <BigText lines={b.text} instant={first} />
      <div style={{ position: "absolute", top: 640, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 36, zIndex: 20 }}>
        {b.items.map((it, i) => {
          const at = 8 + i * gap;
          const s = spring({ frame: t - at, fps, config: { damping: 11, stiffness: 190 } });
          const strike = it.ok ? 0 : interpolate(t - at, [6, 14], [0, 1], clamp);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, background: it.ok ? "rgba(255,255,255,0.95)" : "rgba(30,20,18,0.85)", borderRadius: 30, padding: "22px 30px", transform: `translateX(${(1 - s) * (i % 2 ? 900 : -900)}px) rotate(${i % 2 ? 1.5 : -1.5}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}>
              <div style={{ fontSize: 72 }}>{it.ok ? "✅" : "❌"}</div>
              <div style={{ position: "relative", fontFamily, fontWeight: 900, fontSize: 58, color: it.ok ? INK : "#fff", lineHeight: 1.05 }}>
                {it.t}
                {!it.ok ? <div style={{ position: "absolute", left: -6, top: "52%", height: 8, width: `${strike * 104}%`, background: RED, borderRadius: 4 }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Burst: React.FC<{ size: number; color: string; rot: number }> = ({ size, color, rot }) => {
  const pts = new Array(32)
    .fill(0)
    .map((_, i) => {
      const a = (i / 32) * Math.PI * 2;
      const r = i % 2 === 0 ? 50 : 41;
      return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    })
    .join(" ");
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ transform: `rotate(${rot}deg)` }}>
      <polygon points={pts} fill={color} />
    </svg>
  );
};

const OfferBeat: React.FC<{ b: Extract<Beat, { kind: "offer" }> }> = ({ b }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = interpolate(t, [2, 10], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const shake = t >= 10 && t < 18 ? (18 - t) * 3 : 0;
  const strike = interpolate(t, [14, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const np = spring({ frame: t - 22, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: "scale(1.3)", filter: "blur(16px) brightness(0.6)" }}>
        <World name="salon" lit={1} id="offerbg" />
      </AbsoluteFill>
      <BigText lines={[{ t: b.top ?? "Solo por Navidad", serif: true, color: GOLD, size: 96 }]} />
      <div style={{ position: "absolute", left: 160, top: 360, width: 760, height: 760, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${Math.sin(t * 12) * shake}px, ${Math.cos(t * 9) * shake}px) scale(${stamp}) rotate(-8deg)`, opacity: interpolate(t, [2, 5], [0, 1], clamp), zIndex: 18 }}>
        <div style={{ position: "absolute", inset: 0 }}><Burst size={760} color={RED} rot={t * 0.7} /></div>
        <div style={{ position: "absolute", inset: 50 }}><Burst size={660} color={ORANGE} rot={-t * 0.5} /></div>
        <div style={{ position: "relative", fontFamily, fontWeight: 900, fontSize: 250, color: "#fff", letterSpacing: -10, lineHeight: 1, textAlign: "center" }}>
          -40%
        </div>
      </div>
      <div style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40, zIndex: 18 }}>
        <div style={{ position: "relative", fontFamily, fontWeight: 800, fontSize: 84, color: "rgba(255,255,255,0.8)", opacity: interpolate(t, [8, 13], [0, 1], clamp) }}>
          49,95 €
          <div style={{ position: "absolute", left: -10, top: "50%", height: 10, width: `${strike * 110}%`, background: RED, borderRadius: 5, transform: "rotate(-8deg)" }} />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 124, color: INK, background: GOLD, borderRadius: 28, padding: "4px 34px 12px", transform: `scale(${np}) rotate(${(1 - np) * 20}deg)` }}>29,95 €</div>
      </div>
    </AbsoluteFill>
  );
};

const CtaBeat: React.FC<{ b: Extract<Beat, { kind: "cta" }> }> = ({ b }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: t, fps, config: { damping: 10 } });
  const s2 = spring({ frame: t - 8, fps, config: { damping: 8 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.12 + t * 0.002})`, filter: "brightness(0.7)" }}>
        <World name="dormitorio" lit={1} id="ctabg" />
      </AbsoluteFill>
      <Sparkles seed="cta" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 20 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 900, fontSize: 160, color: "#fff", transform: `scale(${s})`, textShadow: "0 12px 50px rgba(0,0,0,0.6)" }}>Lumora</div>
        <div style={{ marginTop: 30, fontFamily, fontWeight: 900, fontSize: 70, color: INK, background: GOLD, borderRadius: 999, padding: "14px 46px", transform: `scale(${s2})` }}>{b.text ?? "🔗 Link en la bio"}</div>
        <div style={{ marginTop: 40, fontSize: 110, transform: `translateY(${Math.sin(t / 4) * 16}px)` }}>👆</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ b: Beat; first: boolean }> = ({ b, first }) => {
  switch (b.kind) {
    case "room":
      return <RoomBeat b={b} first={first} />;
    case "strips":
      return <StripsBeat b={b} first={first} />;
    case "chat":
      return <ChatBeat b={b} first={first} />;
    case "search":
      return <SearchBeat b={b} first={first} />;
    case "price":
      return <PriceBeat b={b} first={first} />;
    case "lightswitch":
      return <LightswitchBeat b={b} first={first} />;
    case "split":
      return <SplitBeat b={b} first={first} />;
    case "board":
      return <BoardBeat b={b} first={first} />;
    case "camera":
      return <CameraBeat b={b} first={first} />;
    case "gift":
      return <GiftBeat b={b} first={first} />;
    case "countdown":
      return <CountdownBeat b={b} first={first} />;
    case "product":
      return <ProductBeat b={b} first={first} />;
    case "photo":
      return <PhotoBeat b={b} first={first} />;
    case "montage":
      return <MontageBeat b={b} first={first} />;
    case "urgency":
      return <UrgencyBeat b={b} first={first} />;
    case "tease":
      return <TeaseBeat b={b} first={first} />;
    case "mystery":
      return <MysteryBeat b={b} first={first} />;
    case "checklist":
      return <ChecklistBeat b={b} first={first} />;
    case "offer":
      return <OfferBeat b={b} />;
    case "cta":
      return <CtaBeat b={b} />;
  }
};

/* ---------- sound ---------- */

const Sfx: React.FC<{ at: number; file: string; vol: number }> = ({ at, file, vol }) => (
  <Sequence from={Math.max(0, at)}>
    <Audio src={staticFile(`wyr/sfx/${file}`)} volume={vol} />
  </Sequence>
);

const sfxFor = (b: Beat, from: number): [number, string, number][] => {
  const L = b.dur;
  const out: [number, string, number][] = [];
  if (from > 0) out.push([from - 6, "whoosh.wav", 0.35]);
  switch (b.kind) {
    case "room":
      if (from === 0) out.push([0, "boom.wav", 0.5]);
      if (b.switchAt !== undefined) out.push([from + b.switchAt - 1, "tick.wav", 0.9], [from + b.switchAt, "sparkle.wav", 0.4], [from + b.switchAt, "boom.wav", 0.3]);
      break;
    case "strips": {
      const off = Math.round(L * 0.55);
      out.push([from, "boom.wav", 0.5], [from + 12, "boom.wav", 0.5], [from + 12, "zap.wav", 0.4], [from + off - 1, "tick.wav", 0.9], [from + off, "sparkle.wav", 0.4]);
      break;
    }
    case "chat":
      b.msgs.forEach((m) => out.push([from + m.at, "pop.wav", 0.5], [from + m.at, "ding.wav", 0.18]));
      break;
    case "search":
      for (let i = 0; i < Math.ceil(b.query.length / 1.6); i += 2) out.push([from + i, "tick.wav", 0.25]);
      out.push([from + Math.ceil(b.query.length / 1.6) + 6, "whoosh.wav", 0.35], [from + Math.ceil(b.query.length / 1.6) + 10, "ding.wav", 0.35]);
      break;
    case "price":
      out.push([from, "boom.wav", 0.5], [from + 14, "pop.wav", 0.4]);
      break;
    case "lightswitch": {
      const flip = Math.round(L * 0.38);
      out.push([from, "boom.wav", 0.35], [from + flip - 1, "tick.wav", 1], [from + flip, "boom.wav", 0.4], [from + flip, "sparkle.wav", 0.4]);
      break;
    }
    case "split":
      out.push([from, "pop.wav", 0.45], [from + 6, "pop.wav", 0.45], [from + Math.round(L * 0.55), "ding.wav", 0.35]);
      break;
    case "board":
      for (let i = 0; i < 6; i++) out.push([from + 4 + i * 4, "pop.wav", 0.3]);
      break;
    case "camera": {
      const shot = Math.round(L * 0.45);
      out.push([from + shot - 1, "tick.wav", 1], [from + shot, "zap.wav", 0.25], [from + shot + 2, "sparkle.wav", 0.35]);
      break;
    }
    case "gift":
      out.push([from + 10, "whoosh.wav", 0.4], [from + 16, "sparkle.wav", 0.45]);
      break;
    case "countdown":
      [0, 11, 22].forEach((d) => out.push([from + d, "beep.wav", 0.5]));
      out.push([from + 33, "beepfin.wav", 0.4], [from + 33, "sparkle.wav", 0.4], [from + 33, "boom.wav", 0.35]);
      break;
    case "product":
      out.push([from + 2, "sparkle.wav", 0.35], [from + 14, "ding.wav", 0.25]);
      break;
    case "montage": {
      const cut = Math.max(10, Math.floor(L / b.worlds.length));
      for (let i = 0; i < b.worlds.length; i++) out.push([from + i * cut, "boom.wav", 0.25]);
      break;
    }
    case "urgency":
      for (let i = 0; i < L; i += 15) out.push([from + i, i % 30 ? "tock.wav" : "tick.wav", 0.45]);
      out.push([from, "heart.wav", 0.5]);
      break;
    case "tease":
      out.push([from, "boom.wav", 0.28], [from + 2, "heart.wav", 0.45]);
      if (b.sub) out.push([from + Math.min(18, Math.round(L * 0.3)), "pop.wav", 0.35]);
      break;
    case "mystery":
      out.push([from, "zap.wav", 0.3], [from + 4, "riser.wav", 0.35], [from + 30, "heart.wav", 0.5]);
      break;
    case "checklist": {
      const gap = Math.max(10, Math.floor((L - 20) / (b.items.length + 1)));
      b.items.forEach((it, i) => out.push([from + 8 + i * gap, it.ok ? "ding.wav" : "zap.wav", it.ok ? 0.3 : 0.35], [from + 8 + i * gap, "pop.wav", 0.3]));
      break;
    }
    case "offer":
      out.push([from - 30, "riser.wav", 0.3], [from + 10, "boom.wav", 0.5], [from + 22, "ding.wav", 0.4]);
      break;
    case "cta":
      out.push([from, "boom.wav", 0.35], [from + 8, "pop.wav", 0.35]);
      break;
    default:
      out.push([from, "pop.wav", 0.3]);
  }
  return out;
};

export const defaultReel2Props: Reel2Props = {
  music: "",
  beats: [
    { kind: "strips", dur: 75, text: [{ t: "¿Todavía con" }, { t: "tiras LED?", serif: true, color: GOLD }], stamp: "CADUCADO", textAfter: [{ t: "Ahora se lleva" }, { t: "esto", serif: true, color: GOLD, size: 150 }] },
    { kind: "offer", dur: 75 },
    { kind: "cta", dur: 50 },
  ],
};

export const Reel2: React.FC<Reel2Props> = ({ beats, music, musicVolume = 0.42, voice }) => {
  let acc = 0;
  const starts = beats.map((b) => {
    const s = acc;
    acc += b.dur;
    return s;
  });
  const end = acc;
  const vol = (f: number) => interpolate(f, [0, 4, end - 25, end], [0.0, musicVolume, musicVolume, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {beats.map((b, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={b.dur}>
          <BeatView b={b} first={i === 0} />
        </Sequence>
      ))}
      {music ? <Audio src={staticFile(music)} volume={vol} /> : null}
      {voice ? <Audio src={staticFile(voice)} /> : null}
      {beats.flatMap((b, i) => sfxFor(b, starts[i])).map(([at, file, v], k) => (
        <Sfx key={k} at={at} file={file} vol={v} />
      ))}
    </AbsoluteFill>
  );
};
