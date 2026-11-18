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
import { fontFamily } from "../Lumora/common";
import { Room } from "../Anuncio/Room";

/*
 * Data-driven reel for the daily posts. scripts/crear-video.mjs fills the
 * props from content/plan.json + the voice take, so every video differs.
 */

export type SceneType =
  | "hook"
  | "hookLit"
  | "slam"
  | "product"
  | "lampOn"
  | "beforeAfter"
  | "uses"
  | "photo"
  | "gift"
  | "offer"
  | "cta";

export type Scene = {
  type: SceneType;
  from: number; // frames
  to: number;
  text?: string;
  textAfter?: string;
  items?: string[];
  photo?: "real" | "estudio";
};

export type Line = { from: number; to: number; text: string };

export type ReelProps = {
  voice: string; // path under public/
  music: string;
  scenes: Scene[];
  lines: Line[];
  accent?: string;
  seed?: number;
  musicVolume?: number;
};

const YELLOW = "#FFC94A";
const ORANGE = "#FF7A1A";
const RED = "#E8401C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const defaultReelProps: ReelProps = {
  voice: "voz/voz-chico.wav",
  music: "",
  accent: ORANGE,
  seed: 1,
  lines: [
    { from: 0, to: 60, text: "¿Tu habitación también se ve así?" },
    { from: 66, to: 120, text: "Mira lo que pasa con esta lámpara." },
  ],
  scenes: [
    { type: "hook", from: 0, to: 64, text: "¿TU CUARTO SE VE ASÍ?" },
    { type: "lampOn", from: 64, to: 170, text: "Mira esto…", textAfter: "¡BOOM! ✨" },
    { type: "offer", from: 170, to: 260 },
    { type: "cta", from: 260, to: 320 },
  ],
};

/* ---------- shared bits ---------- */

const Kinetic: React.FC<{ text: string; top: number; size?: number; color?: string; bg?: string; delay?: number }> = ({
  text,
  top,
  size = 104,
  color = "#fff",
  bg,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ position: "absolute", top, left: 50, right: 50, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 20px", zIndex: 5 }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * 3, fps, config: { damping: 11, stiffness: 190 } });
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1.04,
              color: bg ? "#2a0c03" : color,
              background: bg,
              padding: bg ? "2px 18px 8px" : 0,
              borderRadius: 18,
              letterSpacing: -2,
              display: "inline-block",
              opacity: Math.min(1, s * 1.6),
              transform: `translateY(${(1 - s) * 80}px) scale(${0.55 + 0.45 * s}) rotate(${(1 - s) * -10}deg)`,
              textShadow: bg ? "none" : "0 10px 40px rgba(0,0,0,0.7)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Snow: React.FC<{ n?: number; o?: number }> = ({ n = 45, o = 0.6 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 4 }}>
      {new Array(n).fill(0).map((_, i) => {
        const size = 3 + random(`s${i}`) * 8;
        const y = ((random(`y${i}`) * 1960 + frame * (1.5 + random(`v${i}`) * 3)) % 1960) - 40;
        return <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1080 + Math.sin(frame / 25 + i) * 16, top: y, width: size, height: size, borderRadius: "50%", background: "#fff", opacity: o * (0.4 + random(`o${i}`) * 0.6) }} />;
      })}
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{ s?: number }> = ({ s = 0.7 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,${s}) 100%)`, pointerEvents: "none" }} />
);

const useLocal = (sc: Scene) => {
  const frame = useCurrentFrame();
  return { t: frame, len: sc.to - sc.from };
};

/* ---------- scenes ---------- */

const HookScene: React.FC<{ sc: Scene; lit: boolean }> = ({ sc, lit }) => {
  const { t, len } = useLocal(sc);
  const zoom = interpolate(t, [0, len], [1.22, 1.05], { easing: Easing.out(Easing.quad) });
  const shake = t < 10 ? (10 - t) * 2.5 : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${Math.sin(t * 9) * shake}px, ${Math.cos(t * 7) * shake}px)`, filter: lit ? "none" : "saturate(0.3) brightness(0.75)" }}>
        <Room lit={lit ? 1 : 0} lights={lit ? 1 : 0} lampVisible={lit} />
      </AbsoluteFill>
      {!lit && <AbsoluteFill style={{ background: "rgba(30,45,80,0.3)", mixBlendMode: "multiply" }} />}
      <Vignette s={0.8} />
      <Kinetic text={sc.text ?? ""} top={190} size={sc.text && sc.text.length > 26 ? 84 : 108} />
    </AbsoluteFill>
  );
};

const SlamScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t } = useLocal(sc);
  const words = (sc.text ?? "").split(" ").slice(0, 5);
  const hits = words.map((_, i) => 2 + i * 9);
  const shake = hits.reduce((a, h) => a + (t - h >= 0 && t - h < 8 ? (8 - (t - h)) * 2.4 : 0), 0);
  const pulse = hits.reduce((a, h) => a + interpolate(t - h, [0, 10], [1, 0], clamp), 0);
  const colors = ["#fff", YELLOW, ORANGE, "#fff", YELLOW];
  return (
    <AbsoluteFill style={{ background: "#08060a", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle, rgba(255,122,26,${0.25 + pulse * 0.35}), transparent 65%)` }} />
      {new Array(18).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 540, top: 960, width: 1400, height: 6, background: "linear-gradient(90deg, transparent 20%, rgba(255,201,74,0.35))", transformOrigin: "0 50%", transform: `rotate(${(i / 18) * 360 + t * 0.6}deg)`, opacity: 0.4 + pulse * 0.4 }} />
      ))}
      <AbsoluteFill style={{ transform: `translate(${Math.sin(t * 13) * shake}px, ${Math.cos(t * 9.7) * shake}px) rotate(-4deg)`, justifyContent: "center", alignItems: "center", gap: 10 }}>
        {words.map((w, i) => {
          const tt = t - hits[i];
          const sc2 = interpolate(tt, [0, 5], [3, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const o = interpolate(tt, [0, 2], [0, 1], clamp);
          const split = interpolate(tt, [0, 8], [16, 0], clamp);
          const size = w.length <= 3 ? 280 : w.length <= 6 ? 200 : 150;
          return (
            <div key={i} style={{ position: "relative", opacity: o, transform: `scale(${sc2})`, filter: `blur(${interpolate(tt, [0, 5], [14, 0], clamp)}px)` }}>
              <div style={{ position: "absolute", inset: 0, fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1, color: "#ff2a4a", transform: `translateX(${-split}px)`, mixBlendMode: "screen" }}>{w}</div>
              <div style={{ position: "absolute", inset: 0, fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1, color: "#2affe0", transform: `translateX(${split}px)`, mixBlendMode: "screen" }}>{w}</div>
              <div style={{ position: "relative", fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1, color: colors[i % colors.length], letterSpacing: -4 }}>{w}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t, len } = useLocal(sc);
  const { fps } = useVideoConfig();
  const pop = spring({ frame: t - 3, fps, config: { damping: 12, stiffness: 120 } });
  const drift = t / len;
  const shine = interpolate(t, [18, 40], [-700, 900], clamp);
  const img = sc.photo === "estudio" ? "lampara.jpg" : "lampara-real.jpg";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle, #ff9a3d 0%, ${RED} 42%, #3a0d05 100%)` }} />
      <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,230,160,0.18) 0deg 8deg, transparent 8deg 22deg)", transform: `rotate(${t * 0.8}deg) scale(2)` }} />
      {[0, 1, 2].map((i) => {
        const r = ((t + i * 18) % 54) / 54;
        return <div key={i} style={{ position: "absolute", left: 540 - 300 - r * 400, top: 1000 - 300 - r * 400, width: 600 + r * 800, height: 600 + r * 800, borderRadius: "50%", border: `6px solid rgba(255,220,150,${0.5 * (1 - r)})` }} />;
      })}
      <Kinetic text={sc.text ?? "Lámpara LED atardecer"} top={150} size={96} />
      <div
        style={{
          position: "absolute",
          left: 540 - 320,
          top: 560,
          width: 640,
          height: 860,
          borderRadius: 46,
          overflow: "hidden",
          transform: `translateY(${(1 - pop) * 600}px) scale(${(0.7 + 0.3 * pop) * (1 + drift * 0.05)}) rotate(${(1 - pop) * 14 - 2 + drift * 3}deg)`,
          boxShadow: "0 50px 120px rgba(0,0,0,0.55), 0 0 0 8px rgba(255,255,255,0.9)",
        }}
      >
        <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + drift * 0.08})` }} />
        <div style={{ position: "absolute", top: -200, left: shine, width: 160, height: 1400, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(20deg)" }} />
      </div>
      <Snow n={35} o={0.5} />
    </AbsoluteFill>
  );
};

const LampOnScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t, len } = useLocal(sc);
  const { fps } = useVideoConfig();
  const onAt = Math.min(36, Math.round(len * 0.4));
  const drop = spring({ frame: t - 4, fps, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  const landT = t - 12;
  const squash = landT >= 0 ? 1 - 0.12 * Math.exp(-landT / 4) * Math.cos(landT / 1.5) : 1;
  const lit = interpolate(t, [onAt, onAt + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lights = interpolate(t, [onAt + 12, onAt + 26], [0, 1], clamp);
  const zoom = interpolate(t, [0, onAt, len], [1.02, 1.06, 1.2], { easing: Easing.inOut(Easing.quad) });
  const shake = t >= onAt && t < onAt + 8 ? (onAt + 8 - t) * 2 : 0;
  const flash = interpolate(t, [onAt - 1, onAt + 1, onAt + 12], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "660px 1060px", transform: `translate(${Math.sin(t * 11) * shake}px, ${Math.cos(t * 7) * shake}px) scale(${zoom})`, filter: `saturate(${0.35 + lit * 0.9}) brightness(${0.8 + lit * 0.25})` }}>
        <Room lit={lit} lights={lights} lampDropY={(1 - drop) * -1500} lampSquash={squash} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#ffb860", opacity: flash, mixBlendMode: "screen" }} />
      <Vignette s={0.6 - lit * 0.25} />
      {t < onAt ? <Kinetic text={sc.text ?? "Enciéndela…"} top={170} /> : null}
      <Sequence from={onAt + 8}>
        <Kinetic text={sc.textAfter ?? "…y todo cambia ✨"} top={160} bg={YELLOW} size={96} />
      </Sequence>
      <Snow n={25} o={0.35} />
    </AbsoluteFill>
  );
};

const BeforeAfterScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t, len } = useLocal(sc);
  const wipe = interpolate(t, [8, Math.max(20, len * 0.55)], [1080, 540], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tag = (txt: string, left: boolean, c: string) => (
    <div style={{ position: "absolute", top: 520, [left ? "left" : "right"]: 40, fontFamily, fontWeight: 900, fontSize: 56, color: "#fff", background: c, padding: "6px 22px", borderRadius: 16, transform: `rotate(${left ? -5 : 5}deg)`, zIndex: 6 }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "saturate(0.3) brightness(0.75)", transform: `scale(${1.1 - t * 0.0006})` }}>
        <Room lit={0} lampVisible={false} />
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${wipe}px)`, transform: `scale(${1.1 - t * 0.0006})` }}>
        <Room lit={1} lights={1} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: wipe - 5, width: 10, background: YELLOW, boxShadow: `0 0 30px ${YELLOW}` }} />
      {tag("ANTES 😴", true, "#444a58")}
      {wipe < 1000 ? tag("DESPUÉS 🔥", false, RED) : null}
      <Vignette s={0.55} />
      <Kinetic text={sc.text ?? "Antes vs después"} top={160} size={92} />
    </AbsoluteFill>
  );
};

const UsesScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t } = useLocal(sc);
  const { fps } = useVideoConfig();
  const items = sc.items ?? ["📚 Estudiar", "📸 Fotos", "🎮 Gaming", "😌 Relajarte"];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.3 + t * 0.001})`, filter: "blur(14px) brightness(0.55)" }}>
        <Room lit={1} lights={1} />
      </AbsoluteFill>
      <Kinetic text={sc.text ?? "Perfecta para…"} top={180} size={96} />
      <div style={{ position: "absolute", top: 560, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 34 }}>
        {items.slice(0, 5).map((it, i) => {
          const s = spring({ frame: t - 8 - i * 9, fps, config: { damping: 10, stiffness: 170 } });
          return (
            <div key={it} style={{ fontFamily, fontWeight: 900, fontSize: 70, color: "#2a0c03", background: i % 2 ? YELLOW : "#fff", borderRadius: 26, padding: "18px 34px", transform: `translateX(${(1 - s) * (i % 2 ? 900 : -900)}px) rotate(${(i % 2 ? 2 : -2)}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }}>
              {it}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const PhotoScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t, len } = useLocal(sc);
  const img = sc.photo === "estudio" ? "lampara.jpg" : "lampara-real.jpg";
  const z = interpolate(t, [0, len], [1.25, 1.05]);
  const y = interpolate(t, [0, len], [-60, 40]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img src={staticFile(img)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${y}px) scale(${z})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.6) 100%)" }} />
      <Kinetic text={sc.text ?? ""} top={170} size={96} />
    </AbsoluteFill>
  );
};

const GiftScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t } = useLocal(sc);
  const { fps } = useVideoConfig();
  const open = spring({ frame: t - 16, fps, config: { damping: 12 } });
  const rise = spring({ frame: t - 24, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "radial-gradient(ellipse at 50% 35%, #2a1410, #070303)" }}>
      {new Array(30).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`gx${i}`) * 1080, top: random(`gy${i}`) * 1300, width: 50 + random(`gs${i}`) * 90, height: 50 + random(`gs${i}`) * 90, borderRadius: "50%", background: ["#FFC94A", "#FF4A3D", "#3DDC84", "#FFE9A8"][i % 4], opacity: 0.35 + 0.35 * Math.abs(Math.sin(t / 12 + i)), filter: "blur(16px)" }} />
      ))}
      <Kinetic text={sc.text ?? "El regalo perfecto 🎁"} top={160} size={96} />
      <div style={{ position: "absolute", left: 540 - 260, top: 900 - rise * 320, width: 520, height: 700, borderRadius: 36, overflow: "hidden", transform: `scale(${0.4 + rise * 0.6})`, opacity: rise, boxShadow: "0 0 80px rgba(255,180,80,0.7)" }}>
        <Img src={staticFile("lampara-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 300, top: 1250, width: 600, height: 420, borderRadius: 20, background: "linear-gradient(160deg, #d8262f, #8e0f18)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", left: 260, top: 0, width: 80, height: "100%", background: "#F5C04A" }} />
      </div>
      <div style={{ position: "absolute", left: 540 - 330, top: 1140, width: 660, height: 120, borderRadius: 20, background: "linear-gradient(160deg, #e8333c, #a5121c)", transformOrigin: "100% 100%", transform: `translate(${open * 300}px, ${-open * 500}px) rotate(${open * 30}deg)` }}>
        <div style={{ position: "absolute", left: 290, top: 0, width: 80, height: "100%", background: "#F5C04A" }} />
      </div>
      <Snow n={40} o={0.55} />
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

const OfferScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t, len } = useLocal(sc);
  const { fps } = useVideoConfig();
  const stamp = interpolate(t, [3, 11], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const shake = t >= 11 && t < 19 ? (19 - t) * 3 : 0;
  const strike = interpolate(t, [16, 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const np = spring({ frame: t - 24, fps, config: { damping: 9 } });
  const bar = interpolate(t, [20, len], [1, 0.15], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: "scale(1.35)", filter: "blur(18px) brightness(0.5)" }}>
        <Room lit={1} lights={1} />
      </AbsoluteFill>
      <Kinetic text={sc.text ?? "SOLO POR NAVIDAD"} top={160} size={76} color={YELLOW} />
      <div style={{ position: "absolute", left: 160, top: 330, width: 760, height: 760, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${Math.sin(t * 12) * shake}px, ${Math.cos(t * 9) * shake}px) scale(${stamp}) rotate(-8deg)`, opacity: interpolate(t, [3, 6], [0, 1], clamp) }}>
        <div style={{ position: "absolute", inset: 0 }}><Burst size={760} color={RED} rot={t * 0.7} /></div>
        <div style={{ position: "absolute", inset: 50 }}><Burst size={660} color={ORANGE} rot={-t * 0.5} /></div>
        <div style={{ position: "relative", fontFamily, fontWeight: 900, fontSize: 260, color: "#fff", letterSpacing: -10, lineHeight: 1, textAlign: "center", textShadow: "0 12px 0 rgba(0,0,0,0.25)" }}>
          -40%
          <div style={{ fontSize: 62, letterSpacing: 2, marginTop: 6 }}>DESCUENTO</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1120, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative", fontFamily, fontWeight: 800, fontSize: 84, color: "rgba(255,255,255,0.75)", opacity: interpolate(t, [10, 15], [0, 1], clamp) }}>
          49,95 €
          <div style={{ position: "absolute", left: -10, top: "50%", height: 10, width: `${strike * 110}%`, background: RED, borderRadius: 5, transform: "rotate(-8deg)" }} />
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 120, color: "#2a0c03", background: YELLOW, borderRadius: 28, padding: "4px 34px 12px", transform: `scale(${np}) rotate(${(1 - np) * 20}deg)`, boxShadow: "0 20px 60px rgba(255,201,74,0.45)" }}>
          29,95 €
        </div>
      </div>
      <div style={{ position: "absolute", top: 1360, left: 120, right: 120, opacity: interpolate(t, [24, 30], [0, 1], clamp) }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 40, color: "#fff", textAlign: "center", marginBottom: 14, opacity: Math.floor(t / 6) % 2 ? 0.55 : 1 }}>⏳ OFERTA POR TIEMPO LIMITADO</div>
        <div style={{ height: 26, borderRadius: 13, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar * 100}%`, borderRadius: 13, background: `linear-gradient(90deg, ${YELLOW}, ${RED})` }} />
        </div>
      </div>
      <Snow n={50} o={0.6} />
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ sc: Scene }> = ({ sc }) => {
  const { t } = useLocal(sc);
  const { fps } = useVideoConfig();
  const s = spring({ frame: t, fps, config: { damping: 10 } });
  const s2 = spring({ frame: t - 10, fps, config: { damping: 8 } });
  const bob = Math.sin(t / 4) * 16;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.15 + t * 0.002})`, filter: "brightness(0.65)" }}>
        <Room lit={1} lights={1} />
      </AbsoluteFill>
      <Vignette s={0.75} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 150, color: "#fff", letterSpacing: 6, transform: `scale(${s})`, textShadow: "0 10px 50px rgba(0,0,0,0.7)" }}>LUMORA</div>
        <div style={{ marginTop: 30, fontFamily, fontWeight: 900, fontSize: 74, color: "#2a0c03", background: YELLOW, borderRadius: 999, padding: "14px 46px", transform: `scale(${s2})` }}>
          {sc.text ?? "🔗 Link en la bio"}
        </div>
        <div style={{ marginTop: 40, fontSize: 110, transform: `translateY(${bob}px)` }}>👆</div>
      </AbsoluteFill>
      <Snow n={40} o={0.5} />
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ sc: Scene }> = ({ sc }) => {
  switch (sc.type) {
    case "hook":
      return <HookScene sc={sc} lit={false} />;
    case "hookLit":
      return <HookScene sc={sc} lit />;
    case "slam":
      return <SlamScene sc={sc} />;
    case "product":
      return <ProductScene sc={sc} />;
    case "lampOn":
      return <LampOnScene sc={sc} />;
    case "beforeAfter":
      return <BeforeAfterScene sc={sc} />;
    case "uses":
      return <UsesScene sc={sc} />;
    case "photo":
      return <PhotoScene sc={sc} />;
    case "gift":
      return <GiftScene sc={sc} />;
    case "offer":
      return <OfferScene sc={sc} />;
    case "cta":
      return <CtaScene sc={sc} />;
  }
};

/* ---------- subtitles, transitions, sound ---------- */

const Subtitles: React.FC<{ lines: Line[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const seg = [...lines].reverse().find((s) => frame >= s.from - 2);
  if (!seg || frame > seg.to + 8) return null;
  const words = seg.text.split(" ");
  const p = interpolate(frame, [seg.from, seg.to], [0, words.length], clamp);
  const pop = interpolate(frame, [seg.from - 2, seg.from + 3], [0.75, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", top: 1560, left: 60, right: 140, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", transform: `scale(${pop})`, zIndex: 50 }}>
      {words.map((w, i) => {
        const active = p >= i && p < i + 1.2;
        return (
          <span key={i} style={{ fontFamily, fontWeight: 900, fontSize: words.length > 7 ? 54 : 64, color: active ? YELLOW : "#fff", opacity: p >= i ? 1 : 0.45, WebkitTextStroke: "12px #000", paintOrder: "stroke fill", display: "inline-block", transform: `translateY(${active ? -6 : 0}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Flash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 2, at, at + 6], [0, 0.85, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: "#fff", opacity: o, zIndex: 60, pointerEvents: "none" }} />;
};

const Sfx: React.FC<{ at: number; file: string; vol: number }> = ({ at, file, vol }) => (
  <Sequence from={Math.max(0, at)}>
    <Audio src={staticFile(`wyr/sfx/${file}`)} volume={vol} />
  </Sequence>
);

const SoundDesign: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const out: React.ReactNode[] = [];
  let k = 0;
  const add = (at: number, file: string, vol: number) => out.push(<Sfx key={k++} at={at} file={file} vol={vol} />);
  scenes.forEach((sc, i) => {
    const len = sc.to - sc.from;
    if (i > 0) add(sc.from - 8, "whoosh.wav", 0.3);
    switch (sc.type) {
      case "hook":
      case "hookLit":
        add(sc.from, "boom.wav", 0.4);
        add(sc.from + 2, "pop.wav", 0.25);
        break;
      case "slam":
        (sc.text ?? "").split(" ").slice(0, 5).forEach((_, j) => add(sc.from + 2 + j * 9, "boom.wav", 0.35));
        break;
      case "product":
        add(sc.from + 3, "sparkle.wav", 0.3);
        add(sc.from + 10, "ding.wav", 0.25);
        break;
      case "lampOn": {
        const onAt = Math.min(36, Math.round(len * 0.4));
        add(sc.from + 12, "boom.wav", 0.2);
        add(sc.from + onAt - 1, "tick.wav", 0.8);
        add(sc.from + onAt, "sparkle.wav", 0.35);
        add(sc.from + onAt, "boom.wav", 0.25);
        break;
      }
      case "beforeAfter":
        add(sc.from + 8, "riser.wav", 0.25);
        add(sc.from + Math.round(len * 0.55), "ding.wav", 0.3);
        break;
      case "uses":
        (sc.items ?? [1, 2, 3, 4]).slice(0, 5).forEach((_, j) => add(sc.from + 8 + j * 9, "pop.wav", 0.35));
        break;
      case "gift":
        add(sc.from + 16, "whoosh.wav", 0.3);
        add(sc.from + 24, "sparkle.wav", 0.35);
        break;
      case "offer":
        add(sc.from - 30, "riser.wav", 0.3);
        add(sc.from + 11, "boom.wav", 0.45);
        add(sc.from + 24, "ding.wav", 0.35);
        break;
      case "cta":
        add(sc.from, "boom.wav", 0.35);
        add(sc.from + 10, "pop.wav", 0.3);
        break;
      default:
        add(sc.from, "pop.wav", 0.3);
    }
  });
  return <>{out}</>;
};

export const Reel: React.FC<ReelProps> = ({ voice, music, scenes, lines, musicVolume = 0.16 }) => {
  const end = scenes.length ? scenes[scenes.length - 1].to : 300;
  const musicVol = (f: number) => interpolate(f, [0, 10, end - 30, end], [0, musicVolume, musicVolume, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sc.from} durationInFrames={sc.to - sc.from}>
          <SceneView sc={sc} />
        </Sequence>
      ))}
      {scenes.slice(1).map((sc, i) => (
        <Flash key={i} at={sc.from} />
      ))}
      <Subtitles lines={lines} />
      {music ? <Audio src={staticFile(music)} volume={musicVol} /> : null}
      {voice ? <Audio src={staticFile(voice)} /> : null}
      <SoundDesign scenes={scenes} />
    </AbsoluteFill>
  );
};
