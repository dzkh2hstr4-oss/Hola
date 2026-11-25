import React from "react";
import { interpolate, interpolateColors, random, useCurrentFrame } from "remotion";

// Illustrated bedroom, 1080x1920. `lit` 0 = grey, switched-off room;
// 1 = room lit by the sunset lamp.
export const SUN = { x: 660, y: 760, r: 330 };
export const LAMP = { x: 220, baseY: 1392 };
const FLOOR_Y = 1560;

const mix = (lit: number, a: string, b: string) =>
  interpolateColors(lit, [0, 1], [a, b]);

/** Re-tints a warm "lit" colour into the cold aurora palette (same lightness/saturation, blue-violet hue). */
export const coolOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  const h = 235 + (r * 40 - g * 10); // blue-violet, a little variation
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  [r, g, b] = h < 240 ? [0, x, c] : [x, 0, c];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

/** Small white cube projector (proyector aurora) standing on the nightstand. */
export const ProjectorShape: React.FC<{ x: number; baseY: number; on: number; squash?: number }> = ({
  x,
  baseY,
  on,
  squash = 1,
}) => {
  const frame = useCurrentFrame();
  const top = baseY - 150;
  return (
    <g transform={`translate(${x} ${baseY}) scale(${2 - squash} ${squash}) translate(${-x} ${-baseY})`}>
      {/* light beams towards the ceiling */}
      <path d={`M ${x - 30} ${top + 20} L ${x - 380} ${-200} L ${x + 520} ${-200} L ${x + 30} ${top + 20} Z`} fill="url(#beam)" opacity={on * (0.55 + 0.1 * Math.sin(frame / 6))} />
      <ellipse cx={x} cy={baseY - 2} rx={95} ry={14} fill="#0d0d10" opacity={0.6} />
      <rect x={x - 75} y={top} width={150} height={148} rx={26} fill="#f2f2f6" />
      <rect x={x - 75} y={top + 100} width={150} height={48} rx={20} fill="#d9d9e2" />
      <ellipse cx={x} cy={top + 8} rx={58} ry={20} fill={interpolateColors(on, [0, 1], ["#c9cbd6", "#a8fff0"])} />
      <ellipse cx={x} cy={top + 8} rx={90} ry={34} fill="#8affe0" opacity={on * 0.45} filter="url(#soft)" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x - 30 + i * 30} cy={top + 124} r={6} fill={i === 1 ? (on > 0.5 ? "#4cff9a" : "#9a9aa6") : "#9a9aa6"} />
      ))}
    </g>
  );
};

/** Moving aurora ribbons + stars projected on the wall and ceiling. */
const Aurora: React.FC<{ lit: number }> = ({ lit }) => {
  const frame = useCurrentFrame();
  const ribbons = [
    { y: 260, amp: 70, c1: "#3dffb0", c2: "#1fd2ff", w: 150, sp: 0.035, ph: 0 },
    { y: 430, amp: 90, c1: "#7b5bff", c2: "#3dffb0", w: 130, sp: 0.028, ph: 2 },
    { y: 620, amp: 60, c1: "#1fd2ff", c2: "#c05bff", w: 110, sp: 0.04, ph: 4 },
    { y: 820, amp: 80, c1: "#3dffb0", c2: "#7b5bff", w: 120, sp: 0.03, ph: 1 },
  ];
  const path = (r: (typeof ribbons)[number], off: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = -100 + i * 55;
      const y = r.y + off + Math.sin(i * 0.45 + frame * r.sp + r.ph) * r.amp + Math.sin(i * 0.17 - frame * r.sp * 0.6) * r.amp * 0.6;
      pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return pts.join(" ");
  };
  return (
    <g opacity={lit}>
      <defs>
        {ribbons.map((r, i) => (
          <linearGradient key={i} id={`rib${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={r.c1} />
            <stop offset="100%" stopColor={r.c2} />
          </linearGradient>
        ))}
      </defs>
      {ribbons.map((r, i) => (
        <g key={i} filter="url(#big)" opacity={0.75 + 0.25 * Math.sin(frame / 20 + i)}>
          <path d={path(r, 0)} stroke={`url(#rib${i})`} strokeWidth={r.w} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {ribbons.map((r, i) => (
        <path key={`t${i}`} d={path(r, -r.w * 0.2)} stroke={`url(#rib${i})`} strokeWidth={r.w * 0.25} fill="none" opacity={0.45} filter="url(#soft)" />
      ))}
      {new Array(90).fill(0).map((_, i) => (
        <circle
          key={i}
          cx={random(`ax${i}`) * 1080}
          cy={random(`ay${i}`) * 1150}
          r={1.5 + random(`ar${i}`) * 3.5}
          fill="#fff"
          opacity={0.25 + 0.75 * Math.abs(Math.sin(frame / (8 + random(`at${i}`) * 10) + i))}
        />
      ))}
    </g>
  );
};

export const LampShape: React.FC<{
  x: number;
  baseY: number;
  on: number;
  squash?: number;
}> = ({ x, baseY, on, squash = 1 }) => {
  const headY = baseY - 205;
  return (
    <g
      transform={`translate(${x} ${baseY}) scale(${2 - squash} ${squash}) translate(${-x} ${-baseY})`}
    >
      {/* halo behind the head */}
      <circle cx={x} cy={headY} r={120} fill="url(#lampHalo)" opacity={on} />
      <ellipse cx={x} cy={baseY - 4} rx={78} ry={18} fill="#0d0d10" />
      <rect x={x - 76} y={baseY - 30} width={152} height={26} rx={12} fill="#1b1b20" />
      <rect x={x - 6} y={headY + 40} width={12} height={baseY - headY - 66} fill="#18181c" />
      <rect x={x - 8} y={headY + 34} width={16} height={18} rx={3} fill="#3a3a40" />
      <circle cx={x} cy={headY} r={58} fill="#141418" />
      <circle
        cx={x}
        cy={headY}
        r={58}
        fill="none"
        stroke={mix(on, "#2a2a30", "#ffb050")}
        strokeWidth={5}
      />
      <circle cx={x - 14} cy={headY - 16} r={18} fill="#ffffff" opacity={0.06} />
    </g>
  );
};

const FairyLights: React.FC<{ on: number }> = ({ on }) => {
  const frame = useCurrentFrame();
  const bulbs = 15;
  const colors = ["#ffcf5a", "#ff5a4a", "#5ae08a", "#ffe9b0", "#ff9a3d"];
  const pts = new Array(bulbs).fill(0).map((_, i) => {
    const t = i / (bulbs - 1);
    const x = 40 + t * 1000;
    const y = 300 + Math.sin(t * Math.PI * 2) * 0 + 90 * 4 * t * (1 - t);
    return { x, y };
  });
  return (
    <g>
      <path
        d={`M 20 300 Q 540 ${300 + 2 * 90} 1060 300`}
        stroke="#1a1a1a"
        strokeWidth={4}
        fill="none"
      />
      {pts.map((p, i) => {
        const tw = 0.55 + 0.45 * Math.abs(Math.sin(frame / 7 + i * 1.7));
        const c = colors[i % colors.length];
        const o = on * tw;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y + 14} r={30} fill={c} opacity={o * 0.35} filter="url(#soft)" />
            <rect x={p.x - 5} y={p.y} width={10} height={8} fill="#222" />
            <ellipse cx={p.x} cy={p.y + 16} rx={8} ry={11} fill={mix(o, "#4a4a50", c)} />
          </g>
        );
      })}
    </g>
  );
};

export const Room: React.FC<{
  lit: number;
  lights?: number;
  lampVisible?: boolean;
  lampDropY?: number;
  lampSquash?: number;
  modo?: "sol" | "aurora";
}> = ({ lit, lights = 0, lampVisible = true, lampDropY = 0, lampSquash = 1, modo = "sol" }) => {
  const aur = modo === "aurora";
  const mix = (l: number, a: string, b: string) => interpolateColors(l, [0, 1], [a, aur ? coolOf(b) : b]);
  const frame = useCurrentFrame();
  const sunR = SUN.r * interpolate(lit, [0, 0.6], [0.05, 1], {
    extrapolateRight: "clamp",
  });
  const breathe = 1 + 0.015 * Math.sin(frame / 14);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="sunGrad">
          <stop offset="0%" stopColor="#ff5a1a" />
          <stop offset="55%" stopColor="#ff8a24" />
          <stop offset="86%" stopColor="#ffc548" />
          <stop offset="93%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ffb040" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sunGlow">
          <stop offset="0%" stopColor="#ff8a2a" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lampHalo">
          <stop offset="0%" stopColor="#ffb050" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1026" />
          <stop offset="100%" stopColor="#1c2448" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#a8fff0" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#7b5bff" stopOpacity={0} />
        </linearGradient>
        <filter id="big">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      {/* wall */}
      <rect width={1080} height={FLOOR_Y} fill={mix(lit, "#2c303a", "#7e3a1c")} />
      {/* wall skirting */}
      <rect y={FLOOR_Y - 24} width={1080} height={24} fill={mix(lit, "#353946", "#93482a")} />
      {/* floor */}
      <rect y={FLOOR_Y} width={1080} height={1920 - FLOOR_Y} fill={mix(lit, "#1c1e25", "#4c2210")} />
      {new Array(6).fill(0).map((_, i) => (
        <line
          key={i}
          x1={0}
          x2={1080}
          y1={FLOOR_Y + 40 + i * 60}
          y2={FLOOR_Y + 40 + i * 60}
          stroke="#000"
          opacity={0.12}
          strokeWidth={3}
        />
      ))}

      {/* window */}
      <rect x={52} y={462} width={256} height={426} rx={8} fill={mix(lit, "#3a3e4a", "#6a3015")} />
      <rect x={68} y={478} width={224} height={394} fill="url(#sky)" />
      <circle cx={230} cy={560} r={34} fill="#e8ecff" opacity={0.85} />
      <circle cx={244} cy={550} r={30} fill="#141a38" />
      {new Array(14).fill(0).map((_, i) => (
        <circle
          key={i}
          cx={80 + random(`sx${i}`) * 200}
          cy={490 + random(`sy${i}`) * 360}
          r={1.5 + random(`sr${i}`) * 2}
          fill="#fff"
          opacity={0.4 + 0.5 * Math.abs(Math.sin(frame / 9 + i))}
        />
      ))}
      <rect x={176} y={478} width={8} height={394} fill={mix(lit, "#3a3e4a", "#6a3015")} />
      <rect x={68} y={670} width={224} height={8} fill={mix(lit, "#3a3e4a", "#6a3015")} />
      {/* curtains */}
      <path d="M 30 440 L 110 440 Q 90 700 120 930 L 30 930 Z" fill={mix(lit, "#454a58", "#c25a2a")} />
      <path d="M 250 440 L 330 440 L 330 930 L 240 930 Q 270 700 250 440 Z" fill={mix(lit, "#454a58", "#c25a2a")} />
      <rect x={20} y={430} width={330} height={14} rx={7} fill="#15161a" />

      {aur && <Aurora lit={lit} />}
      {/* the projected sunset */}
      <g opacity={aur ? 0 : lit} transform={`translate(${SUN.x} ${SUN.y}) scale(${breathe}) translate(${-SUN.x} ${-SUN.y})`}>
        <circle cx={SUN.x} cy={SUN.y} r={sunR * 1.6} fill="url(#sunGlow)" opacity={0.4} />
        <circle cx={SUN.x} cy={SUN.y} r={sunR} fill="url(#sunGrad)" />
      </g>

      {/* shelf + plant shadow */}
      <rect x={760} y={520} width={250} height={14} rx={4} fill={mix(lit, "#3a3e4a", "#5a2810")} />
      <rect x={790} y={440} width={60} height={80} rx={6} fill={mix(lit, "#4a4f5c", "#d98a4a")} />
      <rect x={870} y={460} width={40} height={60} rx={4} fill={mix(lit, "#40444f", "#b8642e")} />
      <path d="M 945 520 L 935 470 L 985 470 L 975 520 Z" fill={mix(lit, "#40444f", "#a04a20")} />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx={960 + (i - 2) * 16}
          cy={450 - Math.abs(i - 2) * -6}
          rx={10}
          ry={26}
          transform={`rotate(${(i - 2) * 22} ${960 + (i - 2) * 16} 450)`}
          fill={mix(lit, "#3c4a40", "#2f5a2a")}
        />
      ))}

      {/* bed */}
      <rect x={420} y={1060} width={600} height={340} rx={30} fill={mix(lit, "#363a46", "#6b2e14")} />
      <rect x={400} y={1330} width={640} height={200} rx={24} fill={mix(lit, "#454a57", "#d7894f")} />
      <rect x={380} y={1500} width={680} height={60} rx={12} fill={mix(lit, "#2a2d36", "#5a2610")} />
      <rect x={450} y={1250} width={220} height={110} rx={50} fill={mix(lit, "#5c616e", "#f3c08c")} />
      <rect x={720} y={1250} width={220} height={110} rx={50} fill={mix(lit, "#5c616e", "#f3c08c")} />
      <path
        d="M 400 1400 Q 700 1360 1040 1400 L 1040 1530 L 400 1530 Z"
        fill={mix(lit, "#3e4350", "#e0703a")}
      />
      <path
        d="M 400 1440 Q 700 1410 1040 1440"
        stroke="#000"
        opacity={0.12}
        strokeWidth={6}
        fill="none"
      />

      {/* nightstand */}
      <rect x={100} y={1392} width={240} height={168} rx={10} fill={mix(lit, "#30333c", "#7a3818")} />
      <rect x={90} y={1380} width={260} height={22} rx={6} fill={mix(lit, "#3a3e48", "#94471f")} />
      <rect x={118} y={1430} width={204} height={56} rx={6} fill="#000" opacity={0.12} />
      <circle cx={220} cy={1458} r={7} fill={mix(lit, "#55596a", "#ffcf8a")} />

      {lampVisible && (
        <g transform={`translate(0 ${lampDropY})`}>
          {aur ? (
            <ProjectorShape x={LAMP.x} baseY={LAMP.baseY - 12} on={lit} squash={lampSquash} />
          ) : (
            <LampShape x={LAMP.x} baseY={LAMP.baseY} on={lit} squash={lampSquash} />
          )}
        </g>
      )}

      {/* rug */}
      <ellipse cx={600} cy={1730} rx={420} ry={80} fill={mix(lit, "#2a2c34", "#a24a22")} />
      <ellipse cx={600} cy={1730} rx={380} ry={62} fill="none" stroke={mix(lit, "#33363f", "#f0a060")} strokeWidth={6} strokeDasharray="18 14" />

      {/* gifts */}
      <g>
        <rect x={60} y={1660} width={210} height={170} rx={10} fill={mix(lit, "#4a3036", "#d8262f")} />
        <rect x={150} y={1660} width={30} height={170} fill={mix(lit, "#6b6550", "#f5c04a")} />
        <rect x={50} y={1630} width={230} height={44} rx={8} fill={mix(lit, "#553a40", "#e8333c")} />
        <rect x={150} y={1630} width={30} height={44} fill={mix(lit, "#6b6550", "#f5c04a")} />
        <rect x={250} y={1730} width={150} height={110} rx={8} fill={mix(lit, "#2e3f3a", "#1f9e5a")} />
        <rect x={312} y={1730} width={24} height={110} fill={mix(lit, "#6b6550", "#f5c04a")} />
      </g>

      <FairyLights on={lights} />

      {/* warm light wash */}
      <circle cx={SUN.x} cy={SUN.y + 300} r={900} fill={aur ? "#3dffb0" : "url(#sunGlow)"} opacity={lit * (aur ? 0.08 : 0.35)} filter="url(#big)" />
    </svg>
  );
};
