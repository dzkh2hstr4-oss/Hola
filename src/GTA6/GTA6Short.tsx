import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
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
};

export type Caption = { t: string; s: number; e: number };

export type GTA6Props = {
  scenes: Scene[];
  captions: Caption[];
  voice: string;
  music: string;
  musicVolume: number;
  total: number; // seconds
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
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(20,4,40,0.75) 0%, rgba(20,4,40,0.15) 35%, rgba(20,4,40,0.2) 65%, rgba(20,4,40,0.85) 100%)",
        }}
      />
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
  const sp = spring({ frame: f, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } });
  const dir = idx % 2 === 0 ? -1 : 1;
  const scale = interpolate(sp, [0, 1], [0.55, 1]);
  const rot = interpolate(sp, [0, 1], [dir * 9, dir * 1.2]);
  const tx = interpolate(sp, [0, 1], [dir * 500, 0]);
  const zoom = 1.04 + Math.max(0, f) * 0.0022;
  if (f < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translateX(${tx}px) scale(${scale}) rotate(${rot}deg)`,
        borderRadius: 34,
        overflow: "hidden",
        border: "7px solid white",
        boxShadow: `0 0 0 4px ${PINK}, 0 0 60px ${PINK}aa, 0 30px 60px rgba(0,0,0,0.6)`,
        opacity: interpolate(sp, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <Img
        src={staticFile(`gta6/img/${img}.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
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
        <div style={{ position: "absolute", top: 1360, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
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
        <div style={{ position: "absolute", top: 1370, left: 60, right: 60, display: "flex", gap: 30 }}>
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
                top: 1370,
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
            <div style={{ position: "absolute", left: 0, right: 0, top: o.y ?? 1330, display: "flex", justifyContent: "center" }}>
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
const SceneView: React.FC<{ sc: Scene; idx: number }> = ({ sc, idx }) => {
  const f = useCurrentFrame();
  const dur = sec(sc.e - sc.s);
  const shake = sc.shake ? Math.max(0, 1 - f / 12) * 18 : 0;
  const sx = shake * Math.sin(f * 2.3);
  const sy = shake * Math.cos(f * 3.1);
  const n = sc.imgs.length;
  const per = dur / n;
  const cur = Math.min(n - 1, Math.floor(f / per));
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Bg img={sc.split ? sc.split[0] : sc.imgs[cur]} />
      {sc.split ? (
        <>
          <Card img={sc.split[0]} idx={0} w={500} h={680} x={30} y={680} label={sc.split[1]} labelColor={PINK} />
          <Card img={sc.split[2]} idx={1} w={500} h={680} x={550} y={680} label={sc.split[3]} labelColor="#3A86FF" delay={8} />
        </>
      ) : (
        sc.imgs.map((im, i) =>
          i === cur ? (
            <Sequence key={i} from={Math.round(i * per)} layout="none">
              <Card img={im} idx={idx + i} delay={sc.hook && idx === 0 && i === 0 ? -12 : 0} />
            </Sequence>
          ) : null,
        )
      )}
      <Title lines={sc.title} at={sc.titleAt ?? sc.title.map((_, i) => i * 0.4)} hook={sc.hook} />
      {(sc.overlays ?? []).map((o, i) => (
        <OverlayView key={i} o={o} />
      ))}
      {sc.flash ? (
        <AbsoluteFill style={{ background: "white", opacity: interpolate(f, [0, 6], [0.9, 0], { extrapolateRight: "clamp" }) }} />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- captions ----------
const Captions: React.FC<{ caps: Caption[] }> = ({ caps }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = caps.find((x) => t >= x.s && t < x.e);
  if (!c) return null;
  const words = c.t.split(" ");
  const prog = (t - c.s) / Math.max(0.1, c.e - c.s);
  const lit = Math.ceil(prog * words.length * 1.05);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1560, textAlign: "center" }}>
      <span
        style={{
          fontFamily: "Montserrat",
          fontWeight: 900,
          fontSize: 50,
          lineHeight: 1.3,
          padding: "8px 18px",
          background: "rgba(10,0,20,0.55)",
          borderRadius: 16,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i < lit ? ORANGE : "white" }}>
            {w}{" "}
          </span>
        ))}
      </span>
    </div>
  );
};

// ---------- main ----------
export const GTA6Short: React.FC<GTA6Props> = ({ scenes, captions, voice, music, musicVolume, total }) => {
  const f = useCurrentFrame();
  const end = sec(total);
  return (
    <AbsoluteFill style={{ background: "#14042a" }}>
      {scenes.map((sc, i) => (
        <Sequence key={i} from={sec(sc.s)} durationInFrames={Math.max(1, sec(sc.e) - sec(sc.s))}>
          <SceneView sc={sc} idx={i} />
        </Sequence>
      ))}
      <Captions caps={captions} />
      {/* progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 12, width: `${(f / end) * 100}%`, background: `linear-gradient(90deg, ${ORANGE}, ${PINK})` }} />
      {/* audio */}
      <Audio src={staticFile(voice)} />
      <Audio
        src={staticFile(music)}
        volume={(fr) => interpolate(fr, [0, 10, end - 30, end], [0, musicVolume, musicVolume, 0], { extrapolateRight: "clamp" })}
      />
      {scenes.flatMap((sc, i) =>
        (sc.sfx ?? [{ f: "wyr/sfx/whoosh.wav", at: 0, v: 0.5 }]).map((x, j) => (
          <Sequence key={`${i}-${j}`} from={sec(sc.s + (x.at ?? 0))} durationInFrames={sec(2)}>
            <Audio src={staticFile(x.f)} volume={x.v ?? 0.6} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};

export const gta6Duration = (p: GTA6Props) => sec(p.total);
