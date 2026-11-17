import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

export const fontFamily = "Montserrat";
for (const weight of ["600", "800", "900"]) {
  loadFont({
    family: fontFamily,
    url: staticFile(`fonts/montserrat-${weight}.woff2`),
    weight,
  });
}

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 20 * FPS;

export const ORANGE = "#FF7A1A";
export const DEEP = "#E8401C";

// The photo (735x1105) is drawn at full canvas height and cropped at the sides.
const IMG_W = Math.round((735 / 1105) * H); // ≈ 1277
const IMG_LEFT = -(IMG_W - W) / 2; // ≈ -98

// Points in the photo, converted to canvas pixels.
const toCanvas = (fx: number, fy: number) => ({
  x: IMG_LEFT + fx * IMG_W,
  y: fy * H,
});
export const LAMP_HEAD = toCanvas(0.78, 0.48);
export const WALL_SUN = toCanvas(0.52, 0.34);

export const Photo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img
    src={staticFile("lampara.jpg")}
    style={{
      position: "absolute",
      left: IMG_LEFT,
      top: 0,
      width: IMG_W,
      height: H,
      objectFit: "cover",
      ...style,
    }}
  />
);

/**
 * The lamp switching on: a dark room, then the warm circle opening on the wall.
 * `onAt` is the frame (relative to the parent Sequence) when it switches on.
 */
export const LampSwitch: React.FC<{ onAt: number; offFilter?: string }> = ({
  onAt,
  offFilter = "brightness(0.1) saturate(0.4)",
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [onAt, onAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const radius = reveal * 1700;
  const flash = interpolate(frame, [onAt, onAt + 2, onAt + 12], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mask = `radial-gradient(circle ${radius}px at ${WALL_SUN.x}px ${WALL_SUN.y}px, #000 70%, transparent 100%)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Photo style={{ filter: offFilter }} />
      <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <Photo />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${WALL_SUN.x}px ${WALL_SUN.y}px, rgba(255,170,60,1), rgba(255,90,20,0.6) 40%, transparent 75%)`,
          opacity: flash,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

/** Slow warm "breathing" over the lit photo, so static shots stay alive. */
export const WarmPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const o = 0.12 + 0.08 * Math.sin(frame / 18);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${WALL_SUN.x}px ${WALL_SUN.y}px, rgba(255,120,30,1), transparent 60%)`,
        opacity: o,
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Darkens the top and bottom so the text reads over the photo. */
export const Scrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.6) 100%)",
    }}
  />
);

/** On-screen headline (the "Texto" line), top of the frame. */
export const Headline: React.FC<{
  text: string;
  size?: number;
  top?: number;
  pill?: boolean;
}> = ({ text, size = 92, top = 250, pill = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s})`,
        opacity: s,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.05,
          textAlign: "center",
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: -1,
          padding: pill ? "22px 40px" : 0,
          borderRadius: 28,
          background: pill
            ? `linear-gradient(135deg, ${ORANGE}, ${DEEP})`
            : "transparent",
          textShadow: pill ? "none" : "0 6px 30px rgba(0,0,0,0.7)",
          boxShadow: pill ? "0 20px 60px rgba(232,64,28,0.45)" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Subtitle of the voice-over line, word by word, in the lower third. */
export const Caption: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const span = Math.min(durationInFrames * 0.7, words.length * 7);
  const out = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 430,
        left: 80,
        right: 140,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 18px",
        opacity: out,
      }}
    >
      {words.map((w, i) => {
        const start = (i / words.length) * span;
        const p = interpolate(frame, [start, start + 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 64,
              color: "#fff",
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px)`,
              display: "inline-block",
              WebkitTextStroke: "10px rgba(0,0,0,0.85)",
              paintOrder: "stroke fill",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Final brand card: "Lumora · 29,95 €". */
export const BrandCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13 } });
  const price = spring({ frame: frame - 10, fps, config: { damping: 11 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 960,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 150,
          color: "#fff",
          letterSpacing: 4,
          opacity: s,
          transform: `scale(${0.8 + 0.2 * s})`,
          textShadow: "0 8px 40px rgba(0,0,0,0.7)",
        }}
      >
        Lumora
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 84,
          color: "#fff",
          padding: "14px 48px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${ORANGE}, ${DEEP})`,
          boxShadow: "0 20px 60px rgba(232,64,28,0.5)",
          transform: `scale(${price})`,
        }}
      >
        29,95 €
      </div>
    </div>
  );
};
