import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BrandCard,
  Caption,
  FPS,
  H,
  Headline,
  LampSwitch,
  Photo,
  Scrim,
  W,
  WarmPulse,
} from "./common";

const s = (sec: number) => Math.round(sec * FPS);

const LIGHT_COLORS = ["#FFC94A", "#FF4A3D", "#3DDC84", "#FFE9A8", "#FF8A3D"];

/** Blurred, twinkling Christmas lights in the background. */
const ChristmasLights: React.FC<{ count?: number }> = ({ count = 34 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 35%, #2a1410 0%, #120807 60%, #070303 100%)",
      }}
    >
      {new Array(count).fill(0).map((_, i) => {
        const x = random(`x${i}`) * W;
        const y = random(`y${i}`) * H * 0.75;
        const size = 40 + random(`s${i}`) * 110;
        const color = LIGHT_COLORS[Math.floor(random(`c${i}`) * LIGHT_COLORS.length)];
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(frame / (10 + random(`t${i}`) * 14) + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: tw * 0.75,
              filter: `blur(${8 + random(`b${i}`) * 14}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BOX_W = 620;
const BOX_H = 460;
const BOX_TOP = 800;

const GiftBox: React.FC<{ openAt: number }> = ({ openAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = spring({ frame: frame - openAt, fps, config: { damping: 12 } });
  const glow = interpolate(frame, [openAt, openAt + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const left = (W - BOX_W) / 2;
  const ribbon = "#F5C04A";
  return (
    <AbsoluteFill>
      {/* glow from inside the box */}
      <div
        style={{
          position: "absolute",
          left: left - 100,
          top: BOX_TOP - 420,
          width: BOX_W + 200,
          height: 520,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,200,100,0.9), transparent 70%)",
          opacity: glow,
        }}
      />
      {/* hands */}
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: BOX_TOP + 120 - open * 220,
            left: side < 0 ? left - 120 : left + BOX_W - 20,
            width: 140,
            height: 260,
            borderRadius: 70,
            background: "linear-gradient(180deg, #e9b48f, #c98b66)",
            transform: `rotate(${side * (12 - open * 30)}deg)`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          }}
        />
      ))}
      {/* box body */}
      <div
        style={{
          position: "absolute",
          left,
          top: BOX_TOP,
          width: BOX_W,
          height: BOX_H,
          borderRadius: 18,
          background: "linear-gradient(160deg, #d8262f, #8e0f18)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: BOX_W / 2 - 40,
            top: 0,
            width: 80,
            height: "100%",
            background: ribbon,
          }}
        />
      </div>
      {/* lid */}
      <div
        style={{
          position: "absolute",
          left: left - 30,
          top: BOX_TOP - 110,
          width: BOX_W + 60,
          height: 120,
          borderRadius: 18,
          background: "linear-gradient(160deg, #e8333c, #a5121c)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          transformOrigin: "100% 100%",
          transform: `translate(${open * 260}px, ${-open * 420}px) rotate(${open * 28}deg)`,
          opacity: 1 - open * 0.15,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: (BOX_W + 60) / 2 - 40,
            top: 0,
            width: 80,
            height: "100%",
            background: ribbon,
          }}
        />
        {/* bow */}
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: "absolute",
              left: (BOX_W + 60) / 2 - 90 + side * 70,
              top: -90,
              width: 180,
              height: 110,
              borderRadius: "50%",
              border: `26px solid ${ribbon}`,
              transform: `rotate(${side * 20}deg)`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// 3–9 s: the lamp comes out of the box and lands on the table (photo, lamp off).
const Unbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 16 }, durationInFrames: 40 });
  const expand = interpolate(frame, [s(1.6), s(3)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const settle = interpolate(frame, [s(3), s(6)], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(expand, [0, 1], [0.42, 1]);
  const cardY = interpolate(rise, [0, 1], [700, 0]) * (1 - expand);
  const radius = interpolate(expand, [0, 1], [40, 0]);
  const boxOut = interpolate(expand, [0, 0.6], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <ChristmasLights />
      <AbsoluteFill style={{ opacity: boxOut }}>
        <GiftBox openAt={-100} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translateY(${cardY}px) scale(${cardScale * settle})`,
          borderRadius: radius / cardScale,
          overflow: "hidden",
          boxShadow: `0 30px 90px rgba(0,0,0,${0.7 * (1 - expand)})`,
        }}
      >
        <Photo style={{ filter: "brightness(0.38) saturate(0.35) hue-rotate(-15deg)" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Video2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 0–3 s: hands open a box, Christmas lights behind */}
      <Sequence durationInFrames={s(3)}>
        <ChristmasLights />
        <GiftBox openAt={s(1.7)} />
        <Headline text="¿Sin ideas para regalar?" size={98} />
        <Caption
          text="¿No sabes qué regalar esta Navidad?"
          durationInFrames={s(3)}
        />
      </Sequence>

      {/* 3–9 s: the lamp comes out and goes on the table */}
      <Sequence from={s(3)} durationInFrames={s(6)}>
        <Unbox />
        <Caption text="Prueba con esto." durationInFrames={s(6)} />
      </Sequence>

      {/* 9–15 s: it switches on, the orange circle appears */}
      <Sequence from={s(9)} durationInFrames={s(6)}>
        <LampSwitch
          onAt={12}
          offFilter="brightness(0.38) saturate(0.35) hue-rotate(-15deg)"
        />
        <Sequence from={12}>
          <WarmPulse />
        </Sequence>
        <Scrim />
        <Sequence from={18}>
          <Headline text="Regalo original" pill />
        </Sequence>
        <Caption
          text="Un regalo original que se nota nada más encenderlo."
          durationInFrames={s(6)}
        />
      </Sequence>

      {/* 15–20 s: lit wall, static */}
      <Sequence from={s(15)} durationInFrames={s(5)}>
        <Photo />
        <WarmPulse />
        <Scrim />
        <BrandCard />
        <Caption
          text="Lámpara de atardecer, en Lumora."
          durationInFrames={s(5)}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
