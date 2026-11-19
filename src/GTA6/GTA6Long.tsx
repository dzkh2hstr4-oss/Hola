import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
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

export const LFPS = 30;
const PINK = "#FF3EA5";
const ORANGE = "#FFB13B";
const CYAN = "#3EF6FF";
const INK = "#14042a";
const sec = (s: number) => Math.round(s * LFPS);

// clip lengths (seconds) — short character clips play once, loops can fill
const CLIP_LEN: Record<string, number> = {
  jason_duval: 1,
  lucia_caminos: 1.5,
  raul_bautista: 1.5,
  real_dimez: 1,
  boobie_ike: 1,
  brian_heder: 1,
  cal_hampton: 1,
  drequan_priest: 1,
  hug: 3,
  night: 8,
  beach: 10,
};

export type Beat = {
  s: number;
  e: number;
  ch: number;
  layout: "hero" | "card" | "profile" | "grid" | "chapter" | "video" | "montage" | "outro";
  media?: string[];
  title?: string[][];
  tags?: string[];
  emojis?: string[];
  name?: string;
  chapter?: string;
  stamp?: string;
  comment?: string;
  flash?: boolean;
  video?: string;
  dur?: number;
  sfx?: { f: string; at?: number; v?: number }[];
};
export type LCaption = { t: string; s: number; e: number };
export type GTA6LongProps = { beats: Beat[]; captions: LCaption[]; voice: string; chapters: string[]; total: number };

// ---------- media slots ----------
type Slot = { m: string; from: number; len: number };
const slots = (media: string[], dur: number): Slot[] => {
  if (!media.length) return [];
  const clipF = (m: string) => (m.startsWith("clip:") ? sec(CLIP_LEN[m.slice(5)] ?? 1) : 0);
  const fixed = media.map((m) => (m.startsWith("clip:") && (CLIP_LEN[m.slice(5)] ?? 1) <= 3 ? clipF(m) : 0));
  const flexN = fixed.filter((x) => x === 0).length;
  const rest = Math.max(0, dur - fixed.reduce((a, b) => a + b, 0));
  let from = 0;
  return media.map((m, i) => {
    let len = fixed[i] || (flexN ? Math.floor(rest / flexN) : 0);
    if (m.startsWith("clip:") && !fixed[i]) len = Math.min(len, clipF(m));
    const sl = { m, from, len: i === media.length - 1 ? dur - from : len };
    from += len;
    return sl;
  });
};

const Media: React.FC<{ m: string; kb?: number; fit?: "cover" | "contain" }> = ({ m, kb = 0 }) => {
  const f = useCurrentFrame();
  const z = 1.06 + f * 0.0016;
  const px = Math.sin(f / 60 + kb) * 30;
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translateX(${px}px)` };
  if (m.startsWith("clip:")) return <OffthreadVideo src={staticFile(`gta6/clips/${m.slice(5)}.mp4`)} muted style={style} />;
  return <Img src={staticFile(`gta6/img/${m}.jpg`)} style={style} />;
};

// media that cycles with punch + flash at each change
const Cycler: React.FC<{ media: string[]; dur: number; seed: number }> = ({ media, dur, seed }) => {
  const f = useCurrentFrame();
  const sl = slots(media, dur);
  return (
    <AbsoluteFill>
      {sl.map((s, i) =>
        f >= s.from && f < s.from + Math.max(1, s.len) ? (
          <Sequence key={i} from={s.from} layout="none">
            <Punch>
              <Media m={s.m} kb={seed + i} />
            </Punch>
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

const Punch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, 7], [1.18, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bl = interpolate(f, [0, 5], [10, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${sc})`, filter: bl ? `blur(${bl}px)` : undefined }}>
      {children}
      <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 4], [0.35, 0], { extrapolateRight: "clamp" }) }} />
    </AbsoluteFill>
  );
};

// ---------- decor ----------
const Particles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: 34 }).map((_, i) => {
        const x = (i * 571) % 1920;
        const sp = 1.5 + (i % 5);
        const y = 1080 - ((f * sp + i * 137) % 1250);
        const r = 4 + (i % 4) * 3;
        const c = i % 3 === 0 ? PINK : i % 3 === 1 ? CYAN : ORANGE;
        return <div key={i} style={{ position: "absolute", left: x + Math.sin((f + i * 20) / 18) * 30, top: y, width: r, height: r, borderRadius: r, background: c, boxShadow: `0 0 ${r * 3}px ${c}`, opacity: 0.6 }} />;
      })}
    </AbsoluteFill>
  );
};

const BlurBg: React.FC<{ m: string }> = ({ m }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: "blur(40px) brightness(0.4) saturate(1.4)", transform: "scale(1.2)" }}>
      <Media m={m.startsWith("clip:") ? "keyart" : m} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 40%, rgba(255,62,165,0.18), rgba(20,4,42,0.75) 70%)" }} />
    <Particles />
  </AbsoluteFill>
);

const Words: React.FC<{ lines: string[][]; size: number; align?: "left" | "center"; delay?: number; glitch?: boolean }> = ({ lines, size, align = "left", delay = 4, glitch }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + 0.03 * Math.max(0, 1 - (f % 15) / 5);
  const g = glitch && f < 18 ? (f % 4 < 2 ? 10 : -10) : 0;
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", transform: `scale(${pulse})`, transformOrigin: align === "left" ? "left center" : "center" }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", gap: "0 24px", justifyContent: align === "left" ? "flex-start" : "center" }}>
          {line.map((raw, wi) => {
            const d = delay + k * 4;
            k++;
            const sp = spring({ frame: f - d, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
            const hl = raw.includes("*");
            const w = raw.replace(/\*/g, "");
            return (
              <span
                key={wi}
                style={{
                  fontFamily: "Anton",
                  fontSize: size,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  display: "inline-block",
                  opacity: f < d ? 0 : interpolate(sp, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `scale(${interpolate(sp, [0, 1], [2, 1])}) rotate(${interpolate(sp, [0, 1], [k % 2 ? -8 : 8, 0])}deg)`,
                  color: hl ? "transparent" : "white",
                  backgroundImage: hl ? `linear-gradient(180deg, ${ORANGE} 10%, ${PINK} 90%)` : undefined,
                  WebkitBackgroundClip: hl ? "text" : undefined,
                  backgroundClip: hl ? "text" : undefined,
                  WebkitTextStroke: hl ? undefined : `3px ${INK}`,
                  filter: `drop-shadow(0 7px 0 ${INK}) drop-shadow(0 0 22px ${hl ? PINK : "rgba(0,0,0,0.6)"})`,
                  textShadow: g ? `${g}px 0 0 rgba(255,0,80,0.9), ${-g}px 0 0 rgba(0,240,255,0.9)` : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Tags: React.FC<{ tags: string[]; start?: number; dir?: "col" | "row" }> = ({ tags, start = 10, dir = "col" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: dir === "col" ? "column" : "row", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
      {tags.map((t, i) => {
        const d = start + i * 9;
        const sp = spring({ frame: f - d, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
        if (f < d) return null;
        return (
          <div
            key={i}
            style={{
              fontFamily: "Montserrat",
              fontWeight: 900,
              fontSize: 40,
              color: INK,
              background: i % 2 ? `linear-gradient(90deg, ${CYAN}, #7CFFEA)` : `linear-gradient(90deg, ${ORANGE}, ${PINK})`,
              padding: "12px 26px",
              borderRadius: 14,
              transform: `translateX(${interpolate(sp, [0, 1], [-120, 0])}px) scale(${sp}) rotate(${i % 2 ? 1.5 : -1.5}deg)`,
              boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
};

const Card: React.FC<{ media: string[]; dur: number; x: number; y: number; w: number; h: number; seed: number; tilt?: number }> = ({ media, dur, x, y, w, h, seed, tilt = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
  const float = Math.sin(f / 16) * 10;
  const rot = interpolate(sp, [0, 1], [tilt * 10, tilt * 1.5]) + Math.sin(f / 26) * 0.8;
  const pulse = 1 + 0.015 * Math.max(0, 1 - (f % 15) / 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 30,
        overflow: "hidden",
        border: "7px solid white",
        boxShadow: `0 0 0 4px ${PINK}, 0 0 70px ${PINK}99, 0 30px 70px rgba(0,0,0,0.6)`,
        transform: `translate(${interpolate(sp, [0, 1], [tilt * 700, 0])}px, ${float}px) rotate(${rot}deg) scale(${interpolate(sp, [0, 1], [0.6, 1]) * pulse})`,
      }}
    >
      <Cycler media={media} dur={dur} seed={seed} />
    </div>
  );
};

const Stickers: React.FC<{ emojis: string[]; dur: number; seed: number }> = ({ emojis, dur, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spots = [
    [1700, 90], [740, 120], [1720, 740], [700, 760], [60, 90],
  ];
  return (
    <>
      {emojis.map((e, i) => {
        const at = Math.round(8 + (i * dur) / Math.max(2, emojis.length + 0.6));
        if (f < at) return null;
        const sp = spring({ frame: f - at, fps, config: { damping: 8, stiffness: 240, mass: 0.5 } });
        const [x, y] = spots[(seed + i * 2) % spots.length];
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 130, transform: `scale(${sp}) rotate(${Math.sin((f - at) / 5) * 10 + (i % 2 ? 12 : -12)}deg)`, filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.6))" }}>
            {e}
          </div>
        );
      })}
    </>
  );
};

const Stamp: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const sp = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 1000, top: 560, transform: `scale(${interpolate(sp, [0, 1], [3, 1])}) rotate(-9deg)`, opacity: interpolate(sp, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ fontFamily: "Anton", fontSize: 110, color: "#FF2D2D", border: "12px solid #FF2D2D", borderRadius: 20, padding: "4px 36px", background: "rgba(10,0,20,0.75)", boxShadow: "0 0 50px #FF2D2D99", whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

const Comment: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const sp = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 90, top: 700, background: "white", borderRadius: 36, padding: "22px 34px", display: "flex", gap: 20, alignItems: "center", transform: `scale(${sp}) translateY(${Math.sin(f / 6) * 6}px)`, boxShadow: `0 0 0 6px ${PINK}, 0 20px 50px rgba(0,0,0,0.5)` }}>
      <div style={{ fontSize: 64 }}>💬</div>
      <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 48, color: INK }}>{text}</div>
    </div>
  );
};

// ---------- layouts ----------
const BeatView: React.FC<{ b: Beat; idx: number }> = ({ b, idx }) => {
  const f = useCurrentFrame();
  const dur = sec(b.e - b.s);
  const media = b.media ?? [];
  const whip = interpolate(f, [0, 7], [idx % 2 ? 300 : -300, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const blur = interpolate(f, [0, 6], [18, 0], { extrapolateRight: "clamp" });
  const shake = (b.flash || b.layout === "chapter" ? 16 : 5) * Math.max(0, 1 - f / 10);
  const wrap: React.CSSProperties = { transform: `translate(${whip + shake * Math.sin(f * 2.3)}px, ${shake * Math.cos(f * 3.1)}px)`, filter: blur ? `blur(${blur}px)` : undefined };
  let body: React.ReactNode = null;

  if (b.layout === "hero" || b.layout === "montage") {
    body = (
      <>
        <Cycler media={media} dur={dur} seed={idx} />
        <AbsoluteFill style={{ background: b.layout === "hero" ? "linear-gradient(90deg, rgba(20,4,42,0.85) 0%, rgba(20,4,42,0.25) 55%, rgba(20,4,42,0) 100%)" : "radial-gradient(circle, rgba(20,4,42,0.2), rgba(20,4,42,0.75))" }} />
        <div style={{ position: "absolute", left: b.layout === "hero" ? 90 : 0, right: b.layout === "hero" ? undefined : 0, top: b.layout === "hero" ? 300 : 330 }}>
          <Words lines={b.title ?? []} size={b.layout === "hero" ? 150 : 190} align={b.layout === "hero" ? "left" : "center"} glitch={idx === 0} />
          {b.tags ? <div style={{ marginTop: 26 }}><Tags tags={b.tags} start={16} /></div> : null}
        </div>
      </>
    );
  } else if (b.layout === "card") {
    body = (
      <>
        <BlurBg m={media[0] ?? "keyart"} />
        <Card media={media} dur={dur} x={820} y={170} w={1010} h={568} seed={idx} tilt={idx % 2 ? 1 : -1} />
        <div style={{ position: "absolute", left: 90, top: 230, width: 720 }}>
          <Words lines={b.title ?? []} size={112} />
          {b.tags ? <div style={{ marginTop: 30 }}><Tags tags={b.tags} start={14} /></div> : null}
        </div>
        {b.stamp ? <Stamp text={b.stamp} at={sec(1.6)} /> : null}
        {b.comment ? <Comment text={b.comment} at={10} /> : null}
      </>
    );
  } else if (b.layout === "profile") {
    const nf = spring({ frame: f - 3, fps: LFPS, config: { damping: 12, stiffness: 180 } });
    body = (
      <>
        <BlurBg m={media.find((m) => !m.startsWith("clip:")) ?? "keyart"} />
        <Card media={media} dur={dur} x={80} y={150} w={1000} h={562} seed={idx} tilt={-1} />
        <div style={{ position: "absolute", left: 1130, top: 140, width: 720 }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 30, letterSpacing: 8, color: CYAN, opacity: nf }}>PERSONAJE</div>
          <div
            style={{
              fontFamily: "Anton",
              fontSize: (b.name ?? "").length > 10 ? 104 : 140,
              lineHeight: 1,
              color: "transparent",
              backgroundImage: `linear-gradient(180deg, white 30%, ${ORANGE} 60%, ${PINK})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              filter: `drop-shadow(0 7px 0 ${INK}) drop-shadow(0 0 26px ${PINK})`,
              transform: `translateX(${interpolate(nf, [0, 1], [200, 0])}px)`,
              opacity: nf,
            }}
          >
            {b.name}
          </div>
          <div style={{ marginTop: 26 }}>
            <Tags tags={b.tags ?? []} start={8} />
          </div>
          <div style={{ marginTop: 34 }}>
            <Words lines={b.title ?? []} size={72} delay={14} />
          </div>
        </div>
      </>
    );
  } else if (b.layout === "grid") {
    const n = Math.min(6, media.length);
    const W = n <= 3 ? 560 : 540;
    const H = Math.round(W * 0.5625);
    body = (
      <>
        <BlurBg m={media[0]} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 50 }}>
          <Words lines={b.title ?? []} size={104} align="center" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: n <= 3 ? 330 : 240, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 34, padding: "0 80px" }}>
          {media.slice(0, n).map((m, i) => {
            const at = 6 + Math.round((i * (dur * 0.55)) / n);
            const sp = spring({ frame: f - at, fps: LFPS, config: { damping: 11, stiffness: 200, mass: 0.6 } });
            const lit = Math.floor(((f - 6) / (dur * 0.55)) * n) === i;
            return (
              <div
                key={i}
                style={{
                  width: W,
                  height: H,
                  borderRadius: 22,
                  overflow: "hidden",
                  position: "relative",
                  border: `6px solid ${lit ? ORANGE : "white"}`,
                  boxShadow: `0 0 0 3px ${PINK}, 0 0 ${lit ? 60 : 30}px ${PINK}99, 0 20px 40px rgba(0,0,0,0.6)`,
                  transform: `scale(${(f < at ? 0 : sp) * (lit ? 1.06 : 1)}) rotate(${i % 2 ? 2 : -2}deg)`,
                }}
              >
                <Media m={m} kb={i} />
                {b.tags?.[i] ? (
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 0", textAlign: "center", fontFamily: "Anton", fontSize: 40, letterSpacing: 2, color: "white", background: `linear-gradient(0deg, ${PINK}ee, ${PINK}00)` }}>{b.tags[i]}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </>
    );
  } else if (b.layout === "chapter") {
    const wipe = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    body = (
      <>
        <AbsoluteFill style={{ filter: "brightness(0.45) saturate(1.3)" }}>
          <Media m={media[0] ?? "keyart"} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: `linear-gradient(90deg, ${INK}ee, ${INK}66, ${INK}ee)` }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 0, top: 380 + i * 110, height: 14, width: `${wipe * 100}%`, background: i === 1 ? CYAN : PINK, opacity: 0.8, transform: `translateX(${(i % 2 ? 1 : -1) * (1 - wipe) * 100}%)` }} />
        ))}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 40, letterSpacing: 14, color: CYAN, marginBottom: 10, opacity: wipe }}>CAPÍTULO {String(b.ch).padStart(2, "0")}</div>
          <Words lines={b.title ?? []} size={200} align="center" glitch />
        </AbsoluteFill>
        <Particles />
      </>
    );
  } else if (b.layout === "video") {
    const inF = spring({ frame: f, fps: LFPS, config: { damping: 14, stiffness: 120 } });
    const lower = interpolate(f, [20, 30, sec(6), sec(6.5)], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    body = (
      <>
        <AbsoluteFill style={{ background: "#000" }} />
        <AbsoluteFill style={{ transform: `scale(${interpolate(inF, [0, 1], [0.7, 1])})`, borderRadius: interpolate(inF, [0, 1], [40, 0]), overflow: "hidden" }}>
          <OffthreadVideo src={staticFile(b.video!)} style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 50, top: 50, fontFamily: "Montserrat", fontWeight: 900, fontSize: 34, color: "white", background: "#FF2D2D", padding: "10px 22px", borderRadius: 10, opacity: interpolate(Math.sin(f / 8), [-1, 1], [0.6, 1]) }}>▶ VÍDEO OFICIAL · ROCKSTAR GAMES</div>
        <div style={{ position: "absolute", left: 80, bottom: 90, opacity: lower, transform: `translateX(${(1 - lower) * -200}px)` }}>
          <Words lines={b.title ?? []} size={70} delay={20} />
        </div>
      </>
    );
  } else if (b.layout === "outro") {
    const btn = spring({ frame: f - 20, fps: LFPS, config: { damping: 9, stiffness: 200 } });
    const clicked = f > 60;
    const cur = interpolate(f, [30, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    body = (
      <>
        <BlurBg m={media[0] ?? "extended"} />
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
          <Words lines={b.title ?? []} size={150} align="center" />
          <div style={{ transform: `scale(${btn * (clicked ? 1 : 1.05)})`, fontFamily: "Montserrat", fontWeight: 900, fontSize: 60, color: "white", background: clicked ? "#555" : "#FF0000", padding: "22px 56px", borderRadius: 999, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
            {clicked ? "SUSCRITO ✓  🔔" : "SUSCRÍBETE"}
          </div>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: interpolate(cur, [0, 1], [1500, 1090]), top: interpolate(cur, [0, 1], [1000, 690]), fontSize: 80, transform: `scale(${f > 56 && f < 64 ? 0.8 : 1})` }}>👆</div>
      </>
    );
  }

  return (
    <AbsoluteFill style={wrap}>
      {body}
      {b.layout !== "video" ? <Stickers emojis={b.emojis ?? []} dur={dur} seed={idx} /> : null}
      {b.flash ? <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 7], [0.9, 0], { extrapolateRight: "clamp" }) }} /> : null}
    </AbsoluteFill>
  );
};

// ---------- kinetic captions ----------
const Captions: React.FC<{ caps: LCaption[] }> = ({ caps }) => {
  const f = useCurrentFrame();
  const t = f / LFPS;
  const c = caps.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const words = c.t.split(" ").filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const tot = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.1, c.e - 0.1 - c.s);
  let acc = 0;
  let wi = words.length - 1;
  let ws = c.s;
  for (let i = 0; i < words.length; i++) {
    const a = c.s + (acc / tot) * span;
    acc += weights[i];
    if (t < c.s + (acc / tot) * span) {
      wi = i;
      ws = a;
      break;
    }
  }
  // two-word window keeps it readable at landscape size
  const i0 = wi - (wi % 2);
  const shown = words.slice(i0, i0 + 2);
  const local = f - Math.round(ws * LFPS);
  const sp = spring({ frame: local, fps: LFPS, config: { damping: 10, stiffness: 300, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", gap: 22 }}>
      {shown.map((w, i) => {
        const active = i0 + i === wi;
        return (
          <span
            key={i}
            style={{
              fontFamily: "Anton",
              fontSize: 84,
              textTransform: "uppercase",
              color: active ? "#FFE14A" : "white",
              WebkitTextStroke: `8px ${INK}`,
              paintOrder: "stroke fill",
              transform: `scale(${active ? interpolate(sp, [0, 1], [1.35, 1.08]) : 1})`,
              filter: `drop-shadow(0 6px 0 ${INK})`,
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

const ChapterBar: React.FC<{ chapters: string[]; beats: Beat[] }> = ({ chapters, beats }) => {
  const f = useCurrentFrame();
  const t = f / LFPS;
  const cur = beats.find((b) => t >= b.s && t < b.e)?.ch ?? 0;
  if (cur === 0) return null;
  return (
    <div style={{ position: "absolute", top: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
      {chapters.slice(1).map((c, i) => (
        <div
          key={i}
          style={{
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: 2,
            padding: "6px 14px",
            borderRadius: 999,
            color: i + 1 === cur ? INK : "rgba(255,255,255,0.7)",
            background: i + 1 === cur ? `linear-gradient(90deg, ${ORANGE}, ${PINK})` : i + 1 < cur ? "rgba(255,62,165,0.35)" : "rgba(20,4,42,0.55)",
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
};

// ---------- main ----------
export const GTA6Long: React.FC<GTA6LongProps> = ({ beats, captions, voice, chapters, total }) => {
  const f = useCurrentFrame();
  const end = sec(total);
  return (
    <AbsoluteFill style={{ background: INK }}>
      {beats.map((b, i) => (
        <Sequence key={i} from={sec(b.s)} durationInFrames={Math.max(1, sec(b.e) - sec(b.s))}>
          <BeatView b={b} idx={i} />
        </Sequence>
      ))}
      <ChapterBar chapters={chapters} beats={beats} />
      <Captions caps={captions} />
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(f / end) * 100}%`, background: `linear-gradient(90deg, ${ORANGE}, ${PINK})` }} />
      <Audio src={staticFile(voice)} />
      {beats.flatMap((b, i) => {
        if (b.layout === "video") return [];
        const base = b.sfx ?? [{ f: "wyr/sfx/whoosh.wav", at: 0, v: 0.45 }];
        const extra: { f: string; at?: number; v?: number }[] = [];
        const dur = sec(b.e - b.s);
        if (b.layout !== "grid") {
          slots(b.media ?? [], dur).forEach((s, k) => {
            if (k > 0) extra.push({ f: "wyr/sfx/whoosh.wav", at: s.from / LFPS, v: 0.3 });
          });
        } else {
          (b.media ?? []).slice(0, 6).forEach((_, k, arr) => extra.push({ f: "wyr/sfx/pop.wav", at: (6 + Math.round((k * dur * 0.55) / arr.length)) / LFPS, v: 0.5 }));
        }
        (b.emojis ?? []).forEach((_, k, arr) => extra.push({ f: "wyr/sfx/pop.wav", at: (8 + (k * dur) / Math.max(2, arr.length + 0.6)) / LFPS, v: 0.4 }));
        if (b.layout !== "grid") (b.tags ?? []).forEach((_, k) => extra.push({ f: "wyr/sfx/tick.wav", at: ((b.layout === "profile" ? 8 : 14) + k * 9) / LFPS, v: 0.6 }));
        if (b.stamp) extra.push({ f: "wyr/sfx/boom.wav", at: 1.6, v: 0.7 });
        if (b.layout === "outro") extra.push({ f: "voz/click.wav", at: 2, v: 0.9 }, { f: "wyr/sfx/ding.wav", at: 2.05, v: 0.6 });
        return [...base, ...extra].map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(b.s + (x.at ?? 0))} durationInFrames={sec(2)}>
            <Audio src={staticFile(x.f)} volume={x.v ?? 0.6} />
          </Sequence>
        ));
      })}
    </AbsoluteFill>
  );
};

export const gta6LongDuration = (p: GTA6LongProps) => sec(p.total);
