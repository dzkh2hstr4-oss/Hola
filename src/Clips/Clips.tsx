// Reel made from real-looking clips (Google Flow / Veo) in the style that works:
// hook in white labels from frame 0, big numbers per option, "comenta 1, 2, 3 o 4",
// "Cómpralo en mi bio" button, punch-in cuts, whooshes, pops and a music bed.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../Lumora/common";

export type Clip = {
  src: string; // path inside public/
  frames: number; // frames to use
  from?: number; // start offset inside the clip (frames)
  numero?: string; // big number / label in the middle ("1", "2"...)
  texto?: string[]; // labels for this clip (replace the question)
  audio?: number; // volume of the clip's own sound (0 = mute)
};

export type ClipsProps = {
  clips: Clip[];
  gancho: string[]; // hook, shown on the first clip(s) from frame 0
  ganchoFrames?: number; // how long the hook stays (default: first clip)
  pregunta?: string[]; // shown on numbered clips
  comenta?: string; // e.g. "comenta 1, 2, 3 o 4 💬"
  boton?: string; // e.g. "Cómpralo en mi bio"
  finalFrames?: number; // how many last frames show comenta + button
  music?: string;
  musicVolume?: number;
  voice?: string;
};

export const clipsDuration = (p: ClipsProps) =>
  p.clips.reduce((a, c) => a + c.frames, 0);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- pieces ---------- */

const Label: React.FC<{ lines: string[]; top: number; delay?: number }> = ({
  lines,
  top,
  delay = 0,
}) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        zIndex: 40,
      }}
    >
      {lines.map((l, i) => {
        const s =
          delay < 0
            ? 1
            : spring({
                frame: t - delay - i * 3,
                fps,
                config: { damping: 13, stiffness: 190 },
              });
        return (
          <div
            key={i}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: i === 0 && lines.length > 1 ? 54 : 60,
              color: "#111",
              background: "#fff",
              borderRadius: 18,
              padding: "8px 26px 10px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
              transform: `scale(${0.6 + 0.4 * s})`,
              opacity: s,
              maxWidth: 940,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

const BigNumber: React.FC<{ n: string }> = ({ n }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: t - 2, fps, config: { damping: 9, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontWeight: 900,
        fontSize: n.length > 2 ? 150 : 260,
        color: "#fff",
        WebkitTextStroke: "12px #111",
        paintOrder: "stroke fill",
        textShadow: "0 14px 40px rgba(0,0,0,0.45)",
        transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`,
        zIndex: 41,
      }}
    >
      {n}
    </div>
  );
};

const Sparkles: React.FC<{ seed: string; n?: number }> = ({ seed, n = 16 }) => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{ zIndex: 39, pointerEvents: "none" }}>
      {new Array(n).fill(0).map((_, i) => {
        const tw = Math.max(0, Math.sin(t / 5 + i * 1.9));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 120 + random(`${seed}x${i}`) * 840,
              top: 720 + random(`${seed}y${i}`) * 520,
              fontSize: 26 + (i % 3) * 10,
              color: "#fff",
              opacity: tw,
              textShadow: "0 0 14px #fff",
            }}
          >
            +
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const BuyButton: React.FC<{ text: string }> = ({ text }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: t - 4, fps, config: { damping: 10, stiffness: 150 } });
  const pulse = 1 + 0.035 * Math.sin(t / 4);
  const shine = interpolate(t % 45, [0, 25], [-300, 1100], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 930,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 42,
      }}
    >
      <div
        style={{
          fontSize: 96,
          transform: `translateY(${Math.sin(t / 4) * 14}px)`,
          opacity: s,
          marginBottom: 8,
        }}
      >
        ☝️
      </div>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily,
          fontWeight: 900,
          fontSize: 62,
          color: "#fff",
          padding: "18px 44px 18px 22px",
          borderRadius: 999,
          background: "linear-gradient(90deg, #2fe0b0 0%, #4aa8ff 50%, #b06bff 100%)",
          border: "5px solid #fff",
          boxShadow: "0 10px 40px rgba(120,90,255,0.55)",
          textShadow: "0 3px 10px rgba(0,0,0,0.35)",
          transform: `scale(${s * pulse})`,
        }}
      >
        <span
          style={{
            width: 78,
            height: 78,
            borderRadius: 40,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
          }}
        >
          🛒
        </span>
        {text}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: shine,
            width: 90,
            height: 220,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            transform: "rotate(20deg)",
          }}
        />
      </div>
    </div>
  );
};

const ClipView: React.FC<{ c: Clip; first: boolean }> = ({ c, first }) => {
  const t = useCurrentFrame();
  // punch-in on every cut, slow push afterwards
  const punch = first
    ? 1
    : 1 + 0.1 * Math.exp(-t / 5);
  const push = 1 + (t / Math.max(1, c.frames)) * 0.05;
  const flash = first ? 0 : interpolate(t, [0, 4], [0.45, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch * push})` }}>
        <OffthreadVideo
          src={staticFile(c.src)}
          startFrom={c.from ?? 0}
          volume={c.audio ?? 0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, zIndex: 30 }} />
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; file: string; vol: number }> = ({
  at,
  file,
  vol,
}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={90} layout="none">
    <Audio src={staticFile(`wyr/sfx/${file}`)} volume={vol} />
  </Sequence>
);

/* ---------- composition ---------- */

export const Clips: React.FC<ClipsProps> = (p) => {
  const starts: number[] = [];
  let acc = 0;
  for (const c of p.clips) {
    starts.push(acc);
    acc += c.frames;
  }
  const end = acc;
  const ganchoEnd = p.ganchoFrames ?? p.clips[0]?.frames ?? 60;
  const finalFrames = p.finalFrames ?? (p.clips[p.clips.length - 1]?.frames ?? 60);
  const finalStart = end - finalFrames;
  const mv = p.musicVolume ?? (p.voice ? 0.2 : 0.4);
  const vol = (f: number) =>
    interpolate(f, [0, 3, end - 20, end], [0.0, mv, mv, 0], clamp);

  const sfx: [number, string, number][] = [[0, "boom.wav", 0.35]];
  starts.slice(1).forEach((s) => sfx.push([s - 5, "whoosh.wav", 0.4]));
  p.clips.forEach((c, i) => {
    if (c.numero) sfx.push([starts[i] + 2, "pop.wav", 0.55], [starts[i] + 3, "sparkle.wav", 0.3]);
  });
  if (p.boton || p.comenta) sfx.push([finalStart + 2, "ding.wav", 0.4], [finalStart + 4, "sparkle.wav", 0.4]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {p.clips.map((c, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={c.frames}>
          <ClipView c={c} first={i === 0} />
          {c.numero ? <BigNumber n={c.numero} /> : null}
          {c.texto ? <Label lines={c.texto} top={260} delay={2} /> : null}
        </Sequence>
      ))}

      {/* hook: visible from frame 0 */}
      <Sequence from={0} durationInFrames={ganchoEnd}>
        <Label lines={p.gancho} top={260} delay={-1} />
      </Sequence>

      {/* question over the numbered clips */}
      {p.pregunta
        ? p.clips.map((c, i) =>
            c.numero && !c.texto && starts[i] >= ganchoEnd ? (
              <Sequence key={`q${i}`} from={starts[i]} durationInFrames={c.frames}>
                <Label lines={p.pregunta!} top={260} delay={-1} />
              </Sequence>
            ) : null,
          )
        : null}

      {/* ending */}
      {p.comenta || p.boton ? (
        <Sequence from={finalStart} durationInFrames={finalFrames}>
          {p.comenta ? <Label lines={[p.comenta]} top={260} delay={0} /> : null}
          {p.boton ? <BuyButton text={p.boton} /> : null}
          <Sparkles seed="fin" />
        </Sequence>
      ) : null}

      {p.music ? <Audio src={staticFile(p.music)} volume={vol} /> : null}
      {p.voice ? (
        <Sequence from={6} layout="none">
          <Audio src={staticFile(p.voice)} />
        </Sequence>
      ) : null}
      {sfx.map(([at, f, v], k) => (
        <Sfx key={k} at={at} file={f} vol={v} />
      ))}
    </AbsoluteFill>
  );
};

export const defaultClipsProps: ClipsProps = {
  clips: [],
  gancho: ["POV: por fin llegó", "el proyector aurora 🌌"],
  comenta: "comenta 1, 2, 3 o 4 💬",
  boton: "Cómpralo en mi bio",
};

