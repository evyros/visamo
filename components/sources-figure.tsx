import { SourceGlyphGroup, sourceGlyphs } from "./source-glyphs";

// The sources page's hero drawing: the sources flow into one knowledge base
// (the Visamo mark), which feeds the chat and the document check. The drawing
// carries no words; the two labels under it are HTML, so it serves both
// languages. It's symmetric, so it needs no mirroring in RTL.

const W = 560;
const H = 330;

const C = {
  navy: "#0f2a44",
  teal: "#2f7f76",
  teal700: "#25665f",
  teal100: "#e3f0ed",
  slate300: "#cbd5e1",
  line: "#e2e0da",
};

const sourceY = 46;
/** Spread evenly across the width, however many there are, each circle sized to leave a gap between them. */
const sourceGap = W / sourceGlyphs.length;
const sourceR = Math.min(32, sourceGap * 0.36);
/** The glyph grows with its circle: 1.25 at the full 32. */
const sourceScale = (sourceR / 32) * 1.25;
const sources = sourceGlyphs.map((name, i) => ({ name, x: sourceGap * (i + 0.5) }));

/** The knowledge base: the Visamo mark, centered. */
const hub = { x: W / 2, y: 172, size: 64 };
const hubTop = hub.y - hub.size / 2;
const hubBottom = hub.y + hub.size / 2;

const outputY = 292;
const outputR = 34;
/** Where the chat and the check sit, as a share of the width: the labels under them line up by it. */
const outputs = [
  { name: "chat" as const, x: 168 },
  { name: "check" as const, x: 392 },
];

/** From a source down into the top of the mark, gathering toward its middle. */
function inflow(x: number) {
  const end = hub.x + (x - hub.x) * 0.1;
  const start = sourceY + sourceR + 2;
  const stop = hubTop - 4;
  return `M${x} ${start}C${x} ${start + 40} ${end} ${stop - 36} ${end} ${stop}`;
}

/** From the bottom of the mark out to the chat or the check. */
function outflow(x: number) {
  const start = hubBottom + 4;
  const begin = hub.x + Math.sign(x - hub.x) * 10;
  const stop = outputY - outputR - 4;
  return `M${begin} ${start}C${begin} ${start + 30} ${x} ${stop - 30} ${x} ${stop}`;
}

function Flow({ d, delay }: { d: string; delay: number }) {
  return (
    <>
      <path d={d} stroke={C.slate300} strokeWidth={1.25} />
      <path
        d={d}
        className="sources-flow"
        style={{ animationDelay: `${delay}s` }}
        stroke={C.teal}
        strokeWidth={2.4}
        strokeDasharray="0.01 12"
        strokeLinecap="round"
      />
    </>
  );
}

export function SourcesFigure({ label, chat, check }: { label: string; chat: string; check: string }) {
  return (
    <figure className="mx-auto w-full max-w-[560px]">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full select-none" fill="none">
        <defs>
          <filter id="sources-shadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={C.navy} floodOpacity="0.09" />
          </filter>
          <radialGradient id="sources-glow">
            <stop offset="0" stopColor={C.teal} stopOpacity="0.2" />
            <stop offset="1" stopColor={C.teal} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sources-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#378d83" />
            <stop offset="1" stopColor={C.teal700} />
          </linearGradient>
        </defs>

        {sources.map((s, i) => (
          <Flow key={s.name} d={inflow(s.x)} delay={-i * 0.35} />
        ))}
        {outputs.map((o, i) => (
          <Flow key={o.name} d={outflow(o.x)} delay={-i * 0.5} />
        ))}

        {/* The sources. */}
        {sources.map((s) => (
          <g key={s.name}>
            <circle cx={s.x} cy={sourceY} r={sourceR} fill="#fff" stroke={C.line} filter="url(#sources-shadow)" />
            <SourceGlyphGroup name={s.name} x={s.x} y={sourceY} scale={sourceScale} className="text-navy-900" />
          </g>
        ))}

        {/* The knowledge base: a soft glow, a ring, and the mark. */}
        <circle cx={hub.x} cy={hub.y} r={70} fill="url(#sources-glow)" />
        <circle cx={hub.x} cy={hub.y} r={46} stroke={C.teal} strokeOpacity="0.25" strokeDasharray="2 5" strokeLinecap="round" />
        <g filter="url(#sources-shadow)">
          <rect x={hub.x - hub.size / 2} y={hubTop} width={hub.size} height={hub.size} rx={19} fill="url(#sources-mark)" />
        </g>
        <path
          d={`M${hub.x - 14} ${hub.y - 11}L${hub.x} ${hub.y + 12}L${hub.x + 14} ${hub.y - 11}`}
          stroke="#fff"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* What's built on it. */}
        {outputs.map((o) => (
          <g key={o.name}>
            <circle cx={o.x} cy={outputY} r={outputR} fill={C.teal100} stroke={C.teal} strokeOpacity="0.3" />
            <SourceGlyphGroup name={o.name} x={o.x} y={outputY} scale={1.3} className="text-teal-700" />
          </g>
        ))}
      </svg>
      {/* The labels sit under the chat and the check, at the same share of the width. */}
      <figcaption aria-hidden="true" className="relative mt-2 h-6 text-sm font-semibold text-navy-900">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(outputs[0].x / W) * 100}%` }}>
          {chat}
        </span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(outputs[1].x / W) * 100}%` }}>
          {check}
        </span>
      </figcaption>
    </figure>
  );
}
