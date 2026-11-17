import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import {
  BrandCard,
  Caption,
  FPS,
  fontFamily,
  Headline,
  LAMP_HEAD,
  LampSwitch,
  Photo,
  Scrim,
  W,
  WarmPulse,
} from "./common";

const s = (sec: number) => Math.round(sec * FPS);

// 3–8 s: close-up of the lamp head with the sun behind, camera pushing in.
const CloseUp: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, s(5)], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: "clamp",
  });
  const scale = 1.25 + p * 0.8;
  const tx = -(LAMP_HEAD.x - W / 2) * (0.55 + p * 0.37);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${LAMP_HEAD.x}px ${LAMP_HEAD.y}px`,
          transform: `translateX(${tx}px) scale(${scale})`,
        }}
      >
        <Photo />
        <WarmPulse />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 8–14 s: the warm, cosy room: slow pan across the whole scene.
const Cozy: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, s(6)], [0, 1], {
    easing: Easing.inOut(Easing.sin),
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${1.18 - p * 0.1}) translate(${-50 + p * 90}px, ${30 - p * 40}px)`,
          filter: "saturate(1.1) contrast(1.03)",
        }}
      >
        <Photo />
        <WarmPulse />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const UsbBadges: React.FC = () => {
  const frame = useCurrentFrame();
  const items = ["🔌 USB", "Sin instalación"];
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {items.map((t, i) => {
        const p = interpolate(frame, [i * 8, i * 8 + 10], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(2)),
        });
        return (
          <div
            key={t}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 64,
              color: "#fff",
              padding: "18px 36px",
              borderRadius: 24,
              background: "rgba(20,10,5,0.55)",
              border: "3px solid rgba(255,140,50,0.9)",
              transform: `scale(${p})`,
              opacity: Math.min(1, p),
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
};

// 14–20 s: static shot of lamp + lit wall, brand + price.
const Final: React.FC = () => (
  <AbsoluteFill>
    <Photo />
    <WarmPulse />
  </AbsoluteFill>
);

export const Video1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 0–3 s */}
      <Sequence durationInFrames={s(3)}>
        <LampSwitch onAt={14} />
        <Scrim />
        <Sequence from={16}>
          <Headline text="Cambia tu cuarto en 1 segundo" size={100} />
        </Sequence>
        <Caption text="Mira lo que hace esta lámpara." durationInFrames={s(3)} />
      </Sequence>

      {/* 3–8 s */}
      <Sequence from={s(3)} durationInFrames={s(5)}>
        <CloseUp />
        <Scrim />
        <Headline text="Lámpara de atardecer" pill />
        <Caption
          text="Un atardecer en tu pared, todo el año."
          durationInFrames={s(5)}
        />
      </Sequence>

      {/* 8–14 s */}
      <Sequence from={s(8)} durationInFrames={s(6)}>
        <Cozy />
        <Scrim />
        <UsbBadges />
        <Caption text="Se conecta por USB y ya está." durationInFrames={s(6)} />
      </Sequence>

      {/* 14–20 s */}
      <Sequence from={s(14)} durationInFrames={s(6)}>
        <Final />
        <Scrim />
        <BrandCard />
        <Caption text="Consíguela en Lumora." durationInFrames={s(6)} />
      </Sequence>
    </AbsoluteFill>
  );
};
