import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { LILITA, Logo, Theme } from "./QPLargo";

/* Arte del canal DILEMAZO: foto de perfil, banner y miniaturas (fotogramas únicos). */

const FONT = `${LILITA}, "Noto Color Emoji", sans-serif`;
const YELLOW = "#FFD60A";
const stroke = (px: number, color = "#111"): React.CSSProperties => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: "stroke fill" });

const RED: Theme = { bg1: "#FF3B4E", bg2: "#C8102E", accent: YELLOW, a: "#2F7BFF", b: "#FF8A00" };
const BLUE: Theme = { bg1: "#1E88FF", bg2: "#0B3FB0", accent: "#FFE135", a: "#00C853", b: "#FF3D3D" };

type Thumb = { theme: Theme; a: string; b: string; la: string; lb: string; tag: string; emoji: string; split?: boolean };
const THUMBS: Record<string, Thumb> = {
  thumb1: { theme: RED, a: "qp/v1/img/20a.png", b: "qp/v1/img/20b.png", la: "1 MILLÓN YA", lb: "10 € × 2 CADA DÍA", tag: "¡SOLO EL 3% ACIERTA!", emoji: "🤯" },
  thumb2: { theme: BLUE, a: "qp/v2/img/03a.png", b: "qp/v2/img/03b.png", la: "TIBURONES", lb: "OSOS", tag: "SUPERVIVENCIA EXTREMA", emoji: "😱" },
};

export const CANAL_ARTE = [
  { id: "Canal-Perfil", kind: "avatar", w: 800, h: 800 },
  { id: "Canal-Banner", kind: "banner", w: 2560, h: 1440 },
  { id: "Miniatura-V1", kind: "thumb1", w: 1280, h: 720 },
  { id: "Miniatura-V2", kind: "thumb2", w: 1280, h: 720 },
];

const Burst: React.FC<{ c1: string; c2: string; size: number }> = ({ c1, c2, size }) => (
  <div style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: `repeating-conic-gradient(from 0deg, ${c1} 0deg 10deg, ${c2} 10deg 20deg)` }} />
);

const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: "#111", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    <Burst c1="#C8102E" c2="#FF3B4E" size={1600} />
    <div style={{ position: "relative", transform: "translateY(-40px)" }}>
      <Logo size={470} theme={{ ...RED, a: "#2F7BFF", b: "#FF8A00" }} />
    </div>
    <div style={{ position: "absolute", bottom: 105, fontFamily: FONT, fontSize: 96, color: "#fff", ...stroke(16), textShadow: "0 10px 0 rgba(0,0,0,0.35)", letterSpacing: 2 }}>DILEMAZO</div>
  </AbsoluteFill>
);

const Banner: React.FC = () => {
  // zona segura de YouTube: 1546×423 centrada
  const imgs = ["qp/v1/img/04a.png", "qp/v2/img/03a.png", "qp/v1/img/10a.png", "qp/v2/img/13b.png", "qp/v1/img/14a.png", "qp/v2/img/06a.png"];
  return (
    <AbsoluteFill style={{ background: "#C8102E", overflow: "hidden" }}>
      <Burst c1="#C8102E" c2="#E5223A" size={4000} />
      {imgs.map((src, i) => {
        const left = i < 3;
        const k = i % 3;
        return (
          <div key={i} style={{ position: "absolute", top: 230 + k * 340, left: left ? 30 - (k % 2) * 40 : undefined, right: left ? undefined : 30 - (k % 2) * 40, width: 420, height: 300, borderRadius: 26, overflow: "hidden", border: "10px solid #fff", transform: `rotate(${(left ? -1 : 1) * (6 - k * 3)}deg)`, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Logo size={230} theme={RED} />
          <div>
            <div style={{ fontFamily: FONT, fontSize: 168, lineHeight: 0.95, color: "#fff", ...stroke(22), textShadow: "0 14px 0 rgba(0,0,0,0.35)" }}>DILEMAZO</div>
            <div style={{ marginTop: 14, fontFamily: FONT, fontSize: 52, color: "#111", background: YELLOW, borderRadius: 20, padding: "8px 26px 2px", display: "inline-block", transform: "rotate(-2deg)" }}>¿QUÉ PREFIERES? · NUEVOS DILEMAS CADA SEMANA</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ThumbArt: React.FC<{ t: Thumb }> = ({ t }) => {
  const card = (src: string, label: string, letter: string, color: string, left: boolean) => (
    <div style={{ position: "absolute", top: 165, left: left ? 40 : undefined, right: left ? undefined : 40, width: 575, height: 468, background: "#fff", borderRadius: 34, transform: `rotate(${left ? -2.5 : 2.5}deg)`, boxShadow: "0 14px 0 rgba(0,0,0,0.25)" }}>
      <div style={{ position: "absolute", left: 14, top: 14, right: 14, height: 350, borderRadius: 24, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.25) contrast(1.08)" }} />
      </div>
      <div style={{ position: "absolute", left: 10, right: 10, bottom: 6, height: 98, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: label.length > 12 ? 54 : 66, color: "#111" }}>{label}</div>
      <div style={{ position: "absolute", left: left ? -20 : undefined, right: left ? undefined : -20, top: -24, width: 96, height: 96, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 56, color: "#fff", paddingTop: 4, ...stroke(4) }}>{letter}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: t.theme.bg2, overflow: "hidden" }}>
      <Burst c1={t.theme.bg2} c2={t.theme.bg1} size={2400} />
      <div style={{ position: "absolute", top: 6, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 124, color: "#fff", ...stroke(16), textShadow: "0 10px 0 rgba(0,0,0,0.35)" }}>
        ¿QUÉ <span style={{ color: t.theme.accent }}>PREFIERES?</span>
      </div>
      {card(t.a, t.la, "A", t.theme.a, true)}
      {card(t.b, t.lb, "B", t.theme.b, false)}
      <div style={{ position: "absolute", left: 640 - 80, top: 290, width: 160, height: 160, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 136, height: 136, borderRadius: "50%", background: "#FF1E1E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 72, color: "#fff", paddingTop: 6, ...stroke(6) }}>VS</div>
      </div>
      <div style={{ position: "absolute", left: 640 - 55, top: 470, fontSize: 110 }}>{t.emoji}</div>
      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: 48, color: "#111", background: t.theme.accent, borderRadius: 18, padding: "8px 26px 0", border: "5px solid #fff" }}>{t.tag}</span>
      </div>
    </AbsoluteFill>
  );
};

export const CanalArte: React.FC<{ kind: string }> = ({ kind }) => {
  if (kind === "avatar") return <Avatar />;
  if (kind === "banner") return <Banner />;
  return <ThumbArt t={THUMBS[kind]} />;
};
