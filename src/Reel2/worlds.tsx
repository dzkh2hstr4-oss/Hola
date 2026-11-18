import React from "react";
import { interpolateColors, random, useCurrentFrame } from "remotion";

/*
 * Five different illustrated places (1080x1920 SVG). By day they are plain and
 * bland (not dark): flat whites, beiges and greys. `lit` 0→1 brings the sunset
 * lamp on: the projected circle appears and the whole place turns warm.
 */

export type WorldName = "dormitorio" | "tiras" | "escritorio" | "salon" | "rincon";

const mix = (t: number, a: string, b: string) => interpolateColors(t, [0, 1], [a, b]);

export const SunDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <radialGradient id={`sun-${id}`}>
      <stop offset="0%" stopColor="#ff4f1a" />
      <stop offset="50%" stopColor="#ff8424" />
      <stop offset="84%" stopColor="#ffbf45" />
      <stop offset="92%" stopColor="#ffe28c" />
      <stop offset="100%" stopColor="#ffb040" stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`glow-${id}`}>
      <stop offset="0%" stopColor="#ff8a2a" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#ff5a1f" stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`halo-${id}`}>
      <stop offset="0%" stopColor="#ffd08a" stopOpacity={1} />
      <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
    </radialGradient>
    <linearGradient id={`skyday-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#bfe0f7" />
      <stop offset="100%" stopColor="#e8f4fb" />
    </linearGradient>
    <linearGradient id={`skydusk-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1d1840" />
      <stop offset="100%" stopColor="#6b3a5c" />
    </linearGradient>
    <filter id={`blur-${id}`}>
      <feGaussianBlur stdDeviation="40" />
    </filter>
    <filter id={`soft-${id}`}>
      <feGaussianBlur stdDeviation="10" />
    </filter>
  </defs>
);

/** The product: round base, thin pole, round head facing the wall. */
export const Lamp: React.FC<{ x: number; baseY: number; s?: number; on: number; id: string }> = ({ x, baseY, s = 1, on, id }) => {
  const head = baseY - 200 * s;
  return (
    <g>
      <circle cx={x} cy={head} r={130 * s} fill={`url(#halo-${id})`} opacity={on * 0.9} />
      <ellipse cx={x} cy={baseY - 3} rx={74 * s} ry={16 * s} fill="#0e0e12" />
      <rect x={x - 72 * s} y={baseY - 28 * s} width={144 * s} height={25 * s} rx={12 * s} fill="#1d1d22" />
      <rect x={x - 5 * s} y={head + 40 * s} width={10 * s} height={baseY - head - 66 * s} fill="#1a1a1e" />
      <rect x={x - 8 * s} y={head + 34 * s} width={16 * s} height={16 * s} rx={3} fill="#9a9aa4" />
      <circle cx={x} cy={head} r={56 * s} fill="#16161a" />
      <circle cx={x} cy={head} r={56 * s} fill="none" stroke={mix(on, "#2c2c33", "#ffb050")} strokeWidth={5 * s} />
      <circle cx={x - 14 * s} cy={head - 16 * s} r={17 * s} fill="#fff" opacity={0.08} />
    </g>
  );
};

const Sun: React.FC<{ cx: number; cy: number; r: number; lit: number; id: string }> = ({ cx, cy, r, lit, id }) => {
  const frame = useCurrentFrame();
  const rr = r * Math.min(1, lit * 1.6) * (1 + 0.012 * Math.sin(frame / 14));
  return (
    <g opacity={Math.min(1, lit * 1.4)}>
      <circle cx={cx} cy={cy} r={rr * 1.7} fill={`url(#glow-${id})`} opacity={0.5} />
      <circle cx={cx} cy={cy} r={rr} fill={`url(#sun-${id})`} />
    </g>
  );
};

const Wash: React.FC<{ cx: number; cy: number; lit: number; id: string }> = ({ cx, cy, lit, id }) => (
  <circle cx={cx} cy={cy + 300} r={950} fill={`url(#glow-${id})`} opacity={lit * 0.38} filter={`url(#blur-${id})`} />
);

const Plant: React.FC<{ x: number; y: number; s?: number; lit: number }> = ({ x, y, s = 1, lit }) => (
  <g>
    {[-2, -1, 0, 1, 2].map((i) => (
      <ellipse key={i} cx={x + i * 18 * s} cy={y - 60 * s + Math.abs(i) * 14 * s} rx={14 * s} ry={46 * s} transform={`rotate(${i * 20} ${x + i * 18 * s} ${y - 40 * s})`} fill={mix(lit, "#7fa37a", "#4f6b2e")} />
    ))}
    <path d={`M ${x - 40 * s} ${y - 10 * s} L ${x + 40 * s} ${y - 10 * s} L ${x + 30 * s} ${y + 60 * s} L ${x - 30 * s} ${y + 60 * s} Z`} fill={mix(lit, "#d8d2c8", "#c46a3a")} />
  </g>
);

const Window: React.FC<{ x: number; y: number; w: number; h: number; lit: number; id: string; frame?: string }> = ({ x, y, w, h, lit, id, frame = "#f3f1ec" }) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={6} fill={mix(lit, frame, "#6a3216")} />
    <rect x={x} y={y} width={w} height={h} fill={`url(#skyday-${id})`} />
    <rect x={x} y={y} width={w} height={h} fill={`url(#skydusk-${id})`} opacity={lit} />
    <circle cx={x + w * 0.72} cy={y + h * 0.22} r={22} fill="#fff6d0" opacity={lit} />
    <rect x={x + w / 2 - 4} y={y} width={8} height={h} fill={mix(lit, frame, "#6a3216")} />
    <rect x={x} y={y + h / 2 - 4} width={w} height={8} fill={mix(lit, frame, "#6a3216")} />
  </g>
);

/* ---------- worlds ---------- */

const Dormitorio: React.FC<{ lit: number; id: string; lamp: boolean }> = ({ lit, id, lamp }) => {
  const sun = { cx: 640, cy: 760, r: 330 };
  return (
    <>
      <rect width={1080} height={1560} fill={mix(lit, "#ece7df", "#a9471f")} />
      <rect y={1560} width={1080} height={360} fill={mix(lit, "#d5c2a5", "#5a2810")} />
      {new Array(7).fill(0).map((_, i) => (
        <rect key={i} x={i * 160} y={1560} width={4} height={360} fill="#000" opacity={0.06} />
      ))}
      <Window x={70} y={470} w={240} h={400} lit={lit} id={id} />
      <Sun {...sun} lit={lit} id={id} />
      <rect x={760} y={500} width={240} height={14} rx={4} fill={mix(lit, "#cfc6b8", "#5a2810")} />
      <rect x={790} y={420} width={56} height={80} rx={6} fill={mix(lit, "#bfc8cf", "#e09a5a")} />
      <rect x={866} y={444} width={40} height={56} rx={4} fill={mix(lit, "#e3d6c3", "#c0703a")} />
      <Plant x={955} y={455} s={0.7} lit={lit} />
      {/* bed */}
      <rect x={420} y={1070} width={600} height={330} rx={30} fill={mix(lit, "#d9d3ca", "#6e2e12")} />
      <rect x={400} y={1330} width={640} height={200} rx={24} fill={mix(lit, "#f6f4f0", "#f0a060")} />
      <rect x={450} y={1250} width={220} height={110} rx={50} fill={mix(lit, "#ffffff", "#ffd2a0")} />
      <rect x={720} y={1250} width={220} height={110} rx={50} fill={mix(lit, "#ffffff", "#ffd2a0")} />
      <path d="M 400 1400 Q 700 1360 1040 1400 L 1040 1530 L 400 1530 Z" fill={mix(lit, "#c9cfd6", "#e2733a")} />
      <rect x={380} y={1500} width={680} height={60} rx={12} fill={mix(lit, "#bfb6a8", "#5a2610")} />
      {/* nightstand */}
      <rect x={100} y={1392} width={240} height={168} rx={10} fill={mix(lit, "#e2d8c8", "#7a3818")} />
      <rect x={90} y={1380} width={260} height={22} rx={6} fill={mix(lit, "#cfc3b0", "#94471f")} />
      {lamp && <Lamp x={220} baseY={1392} on={lit} id={id} />}
      <ellipse cx={620} cy={1740} rx={420} ry={80} fill={mix(lit, "#e6ded2", "#a24a22")} />
      <Wash cx={sun.cx} cy={sun.cy} lit={lit} id={id} />
    </>
  );
};

const Tiras: React.FC<{ lit: number; id: string; lamp: boolean; strips: number }> = ({ lit, id, lamp, strips }) => {
  const frame = useCurrentFrame();
  const hue = (frame * 3) % 360;
  const stripColor = `hsl(${270 + Math.sin(frame / 10) * 30}, 100%, 62%)`;
  const sun = { cx: 560, cy: 820, r: 340 };
  return (
    <>
      <rect width={1080} height={1600} fill={mix(lit, "#2b2540", "#a8461e")} />
      <rect width={1080} height={1600} fill={stripColor} opacity={strips * 0.22} />
      <rect y={1600} width={1080} height={320} fill={mix(lit, "#1d1a28", "#4c2210")} />
      {/* LED strip along ceiling and desk */}
      <rect x={0} y={250} width={1080} height={10} fill={stripColor} opacity={strips} />
      <rect x={0} y={200} width={1080} height={110} fill={stripColor} opacity={strips * 0.35} filter={`url(#soft-${id})`} />
      <Sun {...sun} lit={lit} id={id} />
      {/* poster frames */}
      <rect x={110} y={420} width={170} height={240} rx={8} fill={mix(lit, "#3a3352", "#7a3218")} />
      <rect x={830} y={430} width={150} height={210} rx={8} fill={mix(lit, "#3a3352", "#7a3218")} />
      {/* desk */}
      <rect x={60} y={1250} width={960} height={36} rx={8} fill={mix(lit, "#34304a", "#6e3016")} />
      <rect x={90} y={1286} width={30} height={314} fill={mix(lit, "#2a2640", "#5a2810")} />
      <rect x={960} y={1286} width={30} height={314} fill={mix(lit, "#2a2640", "#5a2810")} />
      <rect x={60} y={1286} width={960} height={10} fill={`hsl(${hue}, 100%, 60%)`} opacity={strips} />
      <rect x={60} y={1290} width={960} height={60} fill={`hsl(${hue}, 100%, 60%)`} opacity={strips * 0.4} filter={`url(#soft-${id})`} />
      {/* monitor */}
      <rect x={380} y={960} width={420} height={250} rx={12} fill="#111" />
      <rect x={394} y={974} width={392} height={222} rx={6} fill={mix(lit, "#4a3f7a", "#ff9a50")} opacity={0.7} />
      <rect x={570} y={1210} width={40} height={40} fill="#111" />
      <rect x={430} y={1226} width={320} height={22} rx={6} fill="#151515" />
      {lamp && <Lamp x={910} baseY={1250} s={0.9} on={lit} id={id} />}
      <Wash cx={sun.cx} cy={sun.cy} lit={lit} id={id} />
    </>
  );
};

const Escritorio: React.FC<{ lit: number; id: string; lamp: boolean }> = ({ lit, id, lamp }) => {
  const sun = { cx: 560, cy: 640, r: 300 };
  return (
    <>
      <rect width={1080} height={1920} fill={mix(lit, "#e4e6e8", "#a5461f")} />
      <Sun {...sun} lit={lit} id={id} />
      {/* pegboard */}
      <rect x={760} y={330} width={260} height={360} rx={10} fill={mix(lit, "#d6d0c6", "#7a3818")} />
      {new Array(30).fill(0).map((_, i) => (
        <circle key={i} cx={790 + (i % 6) * 40} cy={360 + Math.floor(i / 6) * 60} r={5} fill="#000" opacity={0.15} />
      ))}
      <rect x={800} y={420} width={70} height={90} rx={6} fill={mix(lit, "#9fb4c6", "#e09a5a")} />
      <rect x={890} y={520} width={100} height={70} rx={6} fill={mix(lit, "#c6b49f", "#c0703a")} />
      {/* desk */}
      <rect x={30} y={1240} width={1020} height={44} rx={8} fill={mix(lit, "#e6dccd", "#7a3a18")} />
      <rect x={70} y={1284} width={34} height={636} fill={mix(lit, "#cfc4b2", "#5a2810")} />
      <rect x={976} y={1284} width={34} height={636} fill={mix(lit, "#cfc4b2", "#5a2810")} />
      {/* monitor + laptop + mug + books */}
      <rect x={300} y={900} width={460} height={290} rx={14} fill="#1b1b1f" />
      <rect x={316} y={916} width={428} height={258} rx={6} fill={mix(lit, "#f4f6f8", "#3a2030")} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={344} y={946 + i * 44} width={260 - i * 40} height={18} rx={9} fill={mix(lit, "#cfd6de", "#ff9a50")} opacity={0.8} />
      ))}
      <rect x={510} y={1190} width={40} height={50} fill="#1b1b1f" />
      <rect x={420} y={1226} width={220} height={16} rx={6} fill="#26262b" />
      <rect x={110} y={1150} width={150} height={26} rx={4} fill={mix(lit, "#b9c9b3", "#d06a30")} />
      <rect x={120} y={1176} width={140} height={30} rx={4} fill={mix(lit, "#d9c3a3", "#a04a20")} />
      <rect x={116} y={1206} width={150} height={34} rx={4} fill={mix(lit, "#a7b6c9", "#e08a40")} />
      <rect x={690} y={1180} width={56} height={62} rx={10} fill={mix(lit, "#ffffff", "#ffd0a0")} />
      {lamp && <Lamp x={880} baseY={1240} s={0.95} on={lit} id={id} />}
      {/* chair back */}
      <rect x={340} y={1420} width={400} height={500} rx={60} fill={mix(lit, "#bfc3c8", "#3a1a0c")} />
      <Plant x={180} y={1100} s={0.8} lit={lit} />
      <Wash cx={sun.cx} cy={sun.cy} lit={lit} id={id} />
    </>
  );
};

const Salon: React.FC<{ lit: number; id: string; lamp: boolean }> = ({ lit, id, lamp }) => {
  const sun = { cx: 560, cy: 720, r: 320 };
  return (
    <>
      <rect width={1080} height={1500} fill={mix(lit, "#efe9e1", "#a4451e")} />
      <rect y={1500} width={1080} height={420} fill={mix(lit, "#c9b293", "#4c2210")} />
      <Sun {...sun} lit={lit} id={id} />
      {/* frames */}
      <rect x={90} y={470} width={140} height={190} rx={6} fill={mix(lit, "#d9d2c6", "#6e2e12")} />
      <rect x={104} y={484} width={112} height={162} fill={mix(lit, "#b5c7d6", "#e0884a")} />
      {/* sofa */}
      <rect x={110} y={1120} width={860} height={230} rx={60} fill={mix(lit, "#b9bcc1", "#7a3416")} />
      <rect x={70} y={1240} width={940} height={200} rx={50} fill={mix(lit, "#c9ccd1", "#8c3e1a")} />
      <rect x={170} y={1170} width={170} height={130} rx={36} fill={mix(lit, "#e8e2d6", "#f2a46a")} />
      <rect x={740} y={1170} width={170} height={130} rx={36} fill={mix(lit, "#dfe6d6", "#ffb880")} />
      <rect x={110} y={1440} width={30} height={60} fill="#3a3a3a" />
      <rect x={940} y={1440} width={30} height={60} fill="#3a3a3a" />
      {/* side table + lamp */}
      <rect x={900} y={1420} width={150} height={20} rx={6} fill={mix(lit, "#d8cbb5", "#94471f")} />
      <rect x={965} y={1440} width={20} height={150} fill={mix(lit, "#bfb19a", "#6e2e12")} />
      {lamp && <Lamp x={975} baseY={1420} s={0.75} on={lit} id={id} />}
      {/* coffee table, popcorn */}
      <ellipse cx={540} cy={1700} rx={330} ry={60} fill={mix(lit, "#e2d6c2", "#a24a22")} />
      <rect x={300} y={1600} width={480} height={40} rx={18} fill={mix(lit, "#d6c6ad", "#6e2e12")} />
      <path d="M 470 1600 L 490 1530 L 590 1530 L 610 1600 Z" fill={mix(lit, "#f2f2f2", "#ffd2a0")} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={500 + i * 20} cy={1522 - (i % 2) * 8} r={14} fill="#fff6dc" />
      ))}
      <Plant x={90} y={1440} s={1.1} lit={lit} />
      <Wash cx={sun.cx} cy={sun.cy} lit={lit} id={id} />
    </>
  );
};

const Rincon: React.FC<{ lit: number; id: string; lamp: boolean }> = ({ lit, id, lamp }) => {
  const sun = { cx: 610, cy: 780, r: 300 };
  return (
    <>
      <rect width={540} height={1560} fill={mix(lit, "#e8e3da", "#9c401b")} />
      <rect x={540} width={540} height={1560} fill={mix(lit, "#f1ede6", "#a8471f")} />
      <rect y={1560} width={1080} height={360} fill={mix(lit, "#dcd3c5", "#552510")} />
      <Sun {...sun} lit={lit} id={id} />
      {/* shelves */}
      {[560, 760].map((y, i) => (
        <g key={y}>
          <rect x={120} y={y} width={300} height={14} rx={4} fill={mix(lit, "#cbbfae", "#5a2810")} />
          <rect x={150 + i * 40} y={y - 90} width={36} height={90} rx={4} fill={mix(lit, "#c8b9a2", "#e09a5a")} />
          <rect x={196 + i * 40} y={y - 70} width={30} height={70} rx={4} fill={mix(lit, "#a9b8c4", "#c0703a")} />
        </g>
      ))}
      <Plant x={340} y={540} s={0.7} lit={lit} />
      <Plant x={300} y={740} s={0.6} lit={lit} />
      {/* armchair */}
      <rect x={560} y={1220} width={420} height={300} rx={70} fill={mix(lit, "#d9cbb6", "#8c3e1a")} />
      <rect x={520} y={1350} width={500} height={190} rx={60} fill={mix(lit, "#e4d8c4", "#a24a22")} />
      <rect x={600} y={1260} width={150} height={120} rx={30} fill={mix(lit, "#f4efe6", "#ffbf8a")} />
      {/* stool + lamp */}
      <rect x={180} y={1330} width={220} height={24} rx={8} fill={mix(lit, "#cdbda5", "#94471f")} />
      <rect x={200} y={1354} width={22} height={206} fill={mix(lit, "#b7a78e", "#6e2e12")} />
      <rect x={358} y={1354} width={22} height={206} fill={mix(lit, "#b7a78e", "#6e2e12")} />
      {lamp && <Lamp x={290} baseY={1330} s={0.9} on={lit} id={id} />}
      <Plant x={980} y={1560} s={1.3} lit={lit} />
      <Wash cx={sun.cx} cy={sun.cy} lit={lit} id={id} />
    </>
  );
};

export const World: React.FC<{
  name: WorldName;
  lit: number;
  lamp?: boolean;
  strips?: number;
  id?: string;
}> = ({ name, lit, lamp = true, strips = 0, id }) => {
  const key = id ?? `${name}-${Math.round(random(name) * 1e6)}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <SunDefs id={key} />
      {name === "dormitorio" && <Dormitorio lit={lit} id={key} lamp={lamp} />}
      {name === "tiras" && <Tiras lit={lit} id={key} lamp={lamp} strips={strips} />}
      {name === "escritorio" && <Escritorio lit={lit} id={key} lamp={lamp} />}
      {name === "salon" && <Salon lit={lit} id={key} lamp={lamp} />}
      {name === "rincon" && <Rincon lit={lit} id={key} lamp={lamp} />}
    </svg>
  );
};
