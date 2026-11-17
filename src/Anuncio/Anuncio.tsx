import React from "react";
import {
  AbsoluteFill,
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
import { LAMP, Room, SUN } from "./Room";

const ORANGE = "#FF7A1A";
const RED = "#E8401C";
const GOLD = "#FFC94A";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Scene timing (30 fps, 450 frames = 15 s)
const A = { from: 0, dur: 96 }; // ¿Tu habitación se ve así?
const B = { from: 96, dur: 66 }; // COMPRA ESTO YA
const C = { from: 162, dur: 84 }; // product reveal
const D = { from: 246, dur: 108 }; // lamp in room, switches on
const E = { from: 354, dur: 96 }; // -40% offer

/* ---------- shared FX ---------- */

const Snow: React.FC<{ count?: number; opacity?: number }> = ({
  count = 70,
  opacity = 0.8,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const size = 3 + random(`sz${i}`) * 9;
        const speed = 1.5 + random(`sp${i}`) * 3.5;
        const x0 = random(`x${i}`) * 1080;
        const y = ((random(`y${i}`) * 1960 + frame * speed) % 1960) - 40;
        const x = x0 + Math.sin(frame / 25 + i) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#fff",
              opacity: opacity * (0.4 + random(`o${i}`) * 0.6),
              filter: size > 8 ? "blur(2px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width={1080} height={1920}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

const Flash: React.FC<{ at: number; color?: string; len?: number }> = ({
  at,
  color = "#fff",
  len = 8,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 2, at, at + len], [0, 1, 0], clamp);
  return <AbsoluteFill style={{ background: color, opacity: o }} />;
};

/** Word-by-word kinetic text with springy entrances. */
const Kinetic: React.FC<{
  lines: { text: string; color?: string; bg?: string; size?: number }[];
  top: number;
  delay?: number;
  stagger?: number;
}> = ({ lines, top, delay = 0, stagger = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = 0;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 50,
        right: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
          {(line.bg ? [line.text] : line.text.split(" ")).map((w, wi) => {
            const d = delay + idx++ * stagger;
            const s = spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 180 } });
            const blur = interpolate(frame - d, [0, 6], [12, 0], clamp);
            return (
              <span
                key={wi}
                style={{
                  fontFamily,
                  fontWeight: 900,
                  fontSize: line.size ?? 110,
                  lineHeight: 1.05,
                  color: line.color ?? "#fff",
                  background: line.bg,
                  padding: line.bg ? "4px 26px 10px" : 0,
                  borderRadius: 22,
                  display: "inline-block",
                  letterSpacing: -2,
                  transform: `translateY(${(1 - s) * 90}px) scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -8}deg)`,
                  opacity: Math.min(1, s * 1.5),
                  filter: `blur(${blur}px)`,
                  textShadow: line.bg ? "none" : "0 10px 40px rgba(0,0,0,0.6)",
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

/* ---------- Scene A: dull room ---------- */

const SceneA: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, A.dur], [1.18, 1.04], { easing: Easing.out(Easing.quad) });
  const flicker = frame > 50 && frame < 60 && frame % 3 === 0 ? 0.25 : 0;
  const out = interpolate(frame, [A.dur - 8, A.dur], [1, 1.25], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom * out})`, filter: "saturate(0.35) brightness(0.8)" }}>
        <Room lit={0} lampVisible={false} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(30,45,80,0.28)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flicker }} />
      <Vignette strength={0.85} />
      <Kinetic
        top={170}
        delay={8}
        lines={[
          { text: "¿Tu habitación" },
          { text: "se ve así?", color: "#1a1d24", bg: "#c9ccd4" },
        ]}
      />
      <Sequence from={48}>
        <MehTag />
      </Sequence>
    </AbsoluteFill>
  );
};

const MehTag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 9 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 520,
        right: 70,
        transform: `rotate(-8deg) scale(${s})`,
        fontFamily,
        fontWeight: 800,
        fontSize: 46,
        color: "#c9ccd4",
        border: "5px solid #c9ccd4",
        borderRadius: 16,
        padding: "8px 22px",
      }}
    >
      oscura · sosa · fría
    </div>
  );
};

/* ---------- Scene B: COMPRA ESTO YA ---------- */

const SlamWord: React.FC<{ word: string; at: number; y: number; color: string; size: number }> = ({
  word,
  at,
  y,
  color,
  size,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const scale = interpolate(t, [0, 5], [3.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blur = interpolate(t, [0, 5], [18, 0], clamp);
  const o = interpolate(t, [0, 2], [0, 1], clamp);
  const split = interpolate(t, [0, 8], [18, 0], clamp);
  const layer = (c: string, dx: number, blend?: string): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    right: 0,
    top: y,
    textAlign: "center",
    fontFamily,
    fontWeight: 900,
    fontSize: size,
    letterSpacing: -4,
    lineHeight: 1,
    color: c,
    transform: `translateX(${dx}px) scale(${scale})`,
    filter: `blur(${blur}px)`,
    opacity: o,
    mixBlendMode: blend as React.CSSProperties["mixBlendMode"],
  });
  return (
    <>
      <div style={layer("#ff2a4a", -split, "screen")}>{word}</div>
      <div style={layer("#2affe0", split, "screen")}>{word}</div>
      <div style={layer(color, 0)}>{word}</div>
    </>
  );
};

const SceneB: React.FC = () => {
  const frame = useCurrentFrame();
  const hits = [2, 14, 26];
  const shake = hits.reduce((acc, h) => {
    const t = frame - h;
    return acc + (t >= 0 && t < 8 ? (8 - t) * 2.2 : 0);
  }, 0);
  const sx = Math.sin(frame * 13.1) * shake;
  const sy = Math.cos(frame * 9.7) * shake;
  const pulse = hits.reduce((acc, h) => acc + interpolate(frame - h, [0, 10], [1, 0], clamp), 0);
  const wipe = interpolate(frame, [B.dur - 14, B.dur], [0, 1500], { ...clamp, easing: Easing.in(Easing.cubic) });
  const underline = interpolate(frame, [32, 42], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#08060a", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,122,26,${0.25 + pulse * 0.35}), transparent 65%)`,
        }}
      />
      {/* speed lines */}
      {new Array(18).fill(0).map((_, i) => {
        const a = (i / 18) * 360 + frame * 0.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540,
              top: 960,
              width: 1400,
              height: 6,
              background: "linear-gradient(90deg, transparent 20%, rgba(255,201,74,0.35))",
              transformOrigin: "0 50%",
              transform: `rotate(${a}deg)`,
              opacity: 0.4 + pulse * 0.4,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(-4deg)` }}>
        <SlamWord word="COMPRA" at={hits[0]} y={620} color="#fff" size={210} />
        <SlamWord word="ESTO" at={hits[1]} y={850} color={GOLD} size={250} />
        <SlamWord word="YA" at={hits[2]} y={1110} color={ORANGE} size={330} />
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 1450,
            height: 26,
            width: 800 * underline,
            borderRadius: 13,
            background: `linear-gradient(90deg, ${GOLD}, ${RED})`,
          }}
        />
      </AbsoluteFill>
      {/* circle wipe into the reveal */}
      <div
        style={{
          position: "absolute",
          left: 540 - wipe,
          top: 960 - wipe,
          width: wipe * 2,
          height: wipe * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, #ffd27a, ${ORANGE} 50%, ${RED})`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- Scene C: product reveal ---------- */

const Sparkle: React.FC<{ x: number; y: number; at: number; size: number }> = ({ x, y, at, size }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const s = interpolate(t, [0, 8, 22], [0, 1, 0], clamp);
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${s}) rotate(${t * 4}deg)` }}
    >
      <path d="M0 -50 Q 6 -6 50 0 Q 6 6 0 50 Q -6 6 -50 0 Q -6 -6 0 -50 Z" fill="#fff" />
    </svg>
  );
};

const SceneC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 120 } });
  const drift = interpolate(frame, [0, C.dur], [0, 1]);
  const shine = interpolate(frame, [22, 44], [-700, 900], clamp);
  const out = interpolate(frame, [C.dur - 10, C.dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 50%, #ff9a3d 0%, ${RED} 40%, #3a0d05 100%)` }}
      />
      {/* rotating rays */}
      <AbsoluteFill
        style={{
          background:
            "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,230,160,0.18) 0deg 8deg, transparent 8deg 22deg)",
          transform: `rotate(${frame * 0.8}deg) scale(2)`,
        }}
      />
      {/* rings */}
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 18) % 54) / 54;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - 300 - t * 400,
              top: 980 - 300 - t * 400,
              width: 600 + t * 800,
              height: 600 + t * 800,
              borderRadius: "50%",
              border: `6px solid rgba(255,220,150,${0.5 * (1 - t)})`,
            }}
          />
        );
      })}
      <Kinetic
        top={150}
        delay={6}
        stagger={3}
        lines={[
          { text: "Lámpara LED", size: 104 },
          { text: "ATARDECER", size: 124, color: "#3a0d05", bg: GOLD },
        ]}
      />
      {/* product card */}
      <div
        style={{
          position: "absolute",
          left: 540 - 330,
          top: 600,
          width: 660,
          height: 880,
          borderRadius: 48,
          overflow: "hidden",
          transform: `translateY(${(1 - pop) * 600 - drift * 20}px) scale(${(0.7 + 0.3 * pop) * (1 + drift * 0.05) * (1 - out * 0.3)}) rotate(${(1 - pop) * 14 - 2 + drift * 2}deg)`,
          boxShadow: "0 50px 120px rgba(0,0,0,0.55), 0 0 0 8px rgba(255,255,255,0.9)",
          opacity: 1 - out,
        }}
      >
        <Img src={staticFile("lampara-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            top: -200,
            left: shine,
            width: 160,
            height: 1400,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            transform: "rotate(20deg)",
          }}
        />
      </div>
      <Sparkle x={230} y={640} at={18} size={90} />
      <Sparkle x={880} y={760} at={26} size={70} />
      <Sparkle x={200} y={1350} at={34} size={60} />
      <Sparkle x={870} y={1420} at={40} size={100} />
      <Sparkle x={560} y={590} at={50} size={70} />
      <Kinetic
        top={1560}
        delay={30}
        stagger={3}
        lines={[{ text: "🎁 El regalo de Navidad perfecto", size: 56 }]}
      />
      <Snow count={40} opacity={0.6} />
      <AbsoluteFill style={{ background: "#000", opacity: out }} />
    </AbsoluteFill>
  );
};

/* ---------- Scene D: lamp lands in the room, switches on ---------- */

const ON_AT = 40;

const SceneD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 6, fps, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  const dropY = (1 - drop) * -1500;
  const landT = frame - 14;
  const squash = landT >= 0 ? 1 - 0.12 * Math.exp(-landT / 4) * Math.cos(landT / 1.5) : 1;
  const lit = interpolate(frame, [ON_AT, ON_AT + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lights = interpolate(frame, [ON_AT + 14, ON_AT + 30], [0, 1], clamp);
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);

  // camera: start wide, push towards the sun after it switches on
  const zoom = interpolate(frame, [0, ON_AT, D.dur], [1.02, 1.06, 1.22], { easing: Easing.inOut(Easing.quad) });
  const cy = interpolate(frame, [ON_AT, D.dur], [0, 120], clamp);
  const shake = frame >= ON_AT && frame < ON_AT + 8 ? (ON_AT + 8 - frame) * 2 : 0;

  // particles of light after switch-on
  const dust = new Array(40).fill(0).map((_, i) => {
    const t = frame - ON_AT - random(`dd${i}`) * 20;
    const ang = random(`da${i}`) * Math.PI * 2;
    const dist = Math.max(0, t) * (4 + random(`ds${i}`) * 10);
    return {
      x: SUN.x + Math.cos(ang) * dist,
      y: SUN.y + Math.sin(ang) * dist,
      o: t > 0 ? interpolate(t, [0, 10, 50], [0, 1, 0], clamp) : 0,
      s: 4 + random(`dz${i}`) * 10,
    };
  });

  return (
    <AbsoluteFill style={{ background: "#000", opacity: fadeIn, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${SUN.x}px ${SUN.y + 300}px`,
          transform: `translate(${Math.sin(frame * 11) * shake}px, ${cy + Math.cos(frame * 7) * shake}px) scale(${zoom})`,
          filter: `saturate(${0.35 + lit * 0.9}) brightness(${0.8 + lit * 0.25})`,
        }}
      >
        <Room lit={lit} lights={lights} lampDropY={dropY} lampSquash={squash} />
        {dust.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: d.s,
              height: d.s,
              borderRadius: "50%",
              background: "#ffd98a",
              opacity: d.o,
              boxShadow: "0 0 12px #ffb050",
            }}
          />
        ))}
      </AbsoluteFill>
      {/* the "click" */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${LAMP.x}px ${LAMP.baseY - 205}px, rgba(255,220,150,0.95), transparent 40%)`,
          opacity: interpolate(frame, [ON_AT - 2, ON_AT, ON_AT + 10], [0, 1, 0], clamp),
          mixBlendMode: "screen",
        }}
      />
      <Flash at={ON_AT + 1} color="#ffb860" len={12} />
      <Vignette strength={0.6 - lit * 0.25} />
      <Sequence from={4} durationInFrames={ON_AT - 4}>
        <Kinetic top={170} lines={[{ text: "Enciéndela..." }]} />
      </Sequence>
      <Sequence from={ON_AT + 12}>
        <Kinetic
          top={150}
          stagger={5}
          lines={[{ text: "...y todo" }, { text: "cambia ✨", color: "#3a0d05", bg: GOLD }]}
        />
      </Sequence>
      <Snow count={30} opacity={0.35} />
    </AbsoluteFill>
  );
};

/* ---------- Scene E: -40% offer ---------- */

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

const SceneE: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = interpolate(frame, [4, 12], [3, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const stampO = interpolate(frame, [4, 7], [0, 1], clamp);
  const shake = frame >= 12 && frame < 20 ? (20 - frame) * 3 : 0;
  const strike = interpolate(frame, [26, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const newPrice = spring({ frame: frame - 34, fps, config: { damping: 9 } });
  const bar = interpolate(frame, [40, E.dur], [1, 0.12], clamp);
  const urgentBlink = Math.floor(frame / 6) % 2 === 0 ? 1 : 0.55;
  const bgZoom = interpolate(frame, [0, E.dur], [1.3, 1.4]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${bgZoom})`, filter: "blur(18px) brightness(0.55)" }}>
        <Room lit={1} lights={1} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(58,13,5,0.2), rgba(20,4,2,0.75))" }} />
      <Flash at={1} color="#fff" len={6} />

      <Kinetic top={150} delay={0} stagger={3} lines={[{ text: "SOLO POR NAVIDAD", size: 80, color: GOLD }]} />

      {/* -40% stamp */}
      <div
        style={{
          position: "absolute",
          left: 540 - 380,
          top: 330,
          width: 760,
          height: 760,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${Math.sin(frame * 12) * shake}px, ${Math.cos(frame * 9) * shake}px) scale(${stamp}) rotate(-8deg)`,
          opacity: stampO,
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <Burst size={760} color={RED} rot={frame * 0.7} />
        </div>
        <div style={{ position: "absolute", inset: 50 }}>
          <Burst size={660} color={ORANGE} rot={-frame * 0.5} />
        </div>
        <div
          style={{
            position: "relative",
            fontFamily,
            fontWeight: 900,
            fontSize: 270,
            color: "#fff",
            letterSpacing: -10,
            textShadow: "0 12px 0 rgba(0,0,0,0.25)",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          -40%
          <div style={{ fontSize: 64, letterSpacing: 2, marginTop: 6 }}>DESCUENTO</div>
        </div>
      </div>

      {/* prices */}
      <div
        style={{
          position: "absolute",
          top: 1120,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div style={{ position: "relative", fontFamily, fontWeight: 800, fontSize: 84, color: "rgba(255,255,255,0.75)", opacity: interpolate(frame, [18, 24], [0, 1], clamp) }}>
          49,95 €
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "50%",
              height: 10,
              width: `${strike * 110}%`,
              background: RED,
              borderRadius: 5,
              transform: "rotate(-8deg)",
            }}
          />
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 120,
            color: "#3a0d05",
            background: GOLD,
            borderRadius: 28,
            padding: "4px 34px 12px",
            transform: `scale(${newPrice}) rotate(${(1 - newPrice) * 20}deg)`,
            boxShadow: "0 20px 60px rgba(255,201,74,0.45)",
          }}
        >
          29,95 €
        </div>
      </div>

      <Sequence from={44}>
        <Kinetic
          top={1330}
          stagger={2}
          lines={[
            { text: "¡Aprovéchalo antes", size: 78 },
            { text: "de que sea tarde!", size: 78 },
          ]}
        />
      </Sequence>

      {/* urgency bar */}
      <div style={{ position: "absolute", top: 1560, left: 120, right: 120, opacity: interpolate(frame, [40, 46], [0, 1], clamp) }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 38, color: "#fff", opacity: urgentBlink, textAlign: "center", marginBottom: 14 }}>
          ⏳ ÚLTIMAS UNIDADES
        </div>
        <div style={{ height: 26, borderRadius: 13, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar * 100}%`, borderRadius: 13, background: `linear-gradient(90deg, ${GOLD}, ${RED})` }} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 64,
          letterSpacing: 6,
          color: "#fff",
          opacity: interpolate(frame, [60, 70], [0, 1], clamp),
        }}
      >
        LUMORA
      </div>
      <Snow count={60} opacity={0.7} />
    </AbsoluteFill>
  );
};

export const Anuncio: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={A.from} durationInFrames={A.dur}>
        <SceneA />
      </Sequence>
      <Sequence from={B.from} durationInFrames={B.dur}>
        <SceneB />
      </Sequence>
      <Sequence from={C.from} durationInFrames={C.dur}>
        <SceneC />
      </Sequence>
      <Sequence from={D.from} durationInFrames={D.dur}>
        <SceneD />
      </Sequence>
      <Sequence from={E.from} durationInFrames={E.dur}>
        <SceneE />
      </Sequence>
      <Flash at={B.from} len={6} />
      <Grain />
    </AbsoluteFill>
  );
};

export const ANUNCIO_DURATION = 450;
