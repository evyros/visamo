import { SourceGlyphGroup, sourceGlyphs } from "./source-glyphs";

// The /how-we-built page's drawings. Same hand as the sources page's glyphs
// (components/source-glyphs.tsx): a fine navy line, white paper, a touch of
// teal, and amber or terracotta only where something goes wrong. They carry
// no words, so they serve both languages, and none points along the reading
// direction, so none mirrors in RTL.

const C = {
  navy: "#0f2a44",
  teal: "#2f7f76",
  teal700: "#25665f",
  teal100: "#e3f0ed",
  sand: "#f8f6f1",
  slate300: "#cbd5e1",
  line: "#e2e0da",
  amber: "#c98a2b",
  amber100: "#f7ecd9",
  terracotta: "#a84b36",
  terracotta100: "#f6e5e0",
};

const stroke = {
  fill: "none",
  stroke: C.navy,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// ── Why the rules on paper aren't enough ────────────────────────────────────

/** A published page whose key line is a squiggle: vague on paper. */
function Vague() {
  return (
    <>
      <rect x="48" y="18" width="58" height="80" rx="6" fill="#fff" />
      <path d="M57 32h40M57 42h32" stroke={C.slate300} strokeWidth={2.4} />
      <rect x="53" y="49" width="48" height="13" rx="4" fill={C.amber100} stroke="none" />
      <path d="M57 55.5q3-3.5 6 0t6 0 6 0 6 0 6 0 6 0" stroke={C.amber} strokeWidth={1.8} />
      <path d="M57 70h36M57 80h22" stroke={C.slate300} strokeWidth={2.4} />
      <circle cx="110" cy="34" r="14" fill="#fff" stroke={C.amber} />
      <path d="M105.6 30.4a4.4 4.4 0 1 1 6 4.1c-1 .45-1.6 1.25-1.6 2.3v.9" stroke={C.amber} strokeWidth={1.9} />
      <circle cx="110" cy="41.6" r="1.25" fill={C.amber} stroke="none" />
    </>
  );
}

/** The published checklist, and a note stuck on it at the counter: one more document. */
function Counter() {
  const rows = [42, 55, 68];
  return (
    <>
      <rect x="40" y="16" width="62" height="84" rx="6" fill="#fff" />
      <path d="M50 28h26" strokeWidth={2.2} />
      {rows.map((y) => (
        <g key={y}>
          <rect x="50" y={y - 4.5} width="9" height="9" rx="2.5" fill={C.teal100} stroke={C.teal} />
          <path d={`m52.2 ${y}l1.8 1.8 3.2-3.4`} stroke={C.teal} strokeWidth={1.4} />
          <path d={`M65 ${y}h28`} stroke={C.slate300} strokeWidth={2.4} />
        </g>
      ))}
      <g transform="rotate(9 106 80)">
        <rect x="86" y="62" width="40" height="36" rx="3" fill={C.amber100} stroke={C.amber} />
        <path d="M95 80h7M98.5 76.5v7" stroke={C.amber} strokeWidth={1.9} />
        <path d="M106 80h12" stroke={C.amber} strokeWidth={1.9} strokeOpacity={0.55} />
      </g>
    </>
  );
}

function Office({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M0 58 22 44l22 14Z" fill={C.teal100} />
      <rect x="4" y="58" width="36" height="34" fill="#fff" />
      <path d="M12 64v22M22 64v22M32 64v22M-2 94h48" />
    </g>
  );
}

/** One document, two offices: a tick at one, sent back at the other. */
function Branches() {
  return (
    <>
      <path d="M50 30Q80 4 110 30" stroke={C.slate300} strokeDasharray="1 5" strokeWidth={2} />
      <rect x="73" y="8" width="14" height="18" rx="2.5" fill="#fff" />
      <path d="M76.5 14h7M76.5 18h5" strokeWidth={1.3} />
      <Office x={28} />
      <Office x={88} />
      <circle cx="50" cy="32" r="10" fill={C.teal100} stroke={C.teal} />
      <path d="m45.6 32.2 3 3 5.8-6.2" stroke={C.teal} strokeWidth={1.9} />
      <circle cx="110" cy="32" r="10" fill={C.terracotta100} stroke={C.terracotta} />
      <path d="M107.6 27.4 104.6 30.4l3 3M104.6 30.4h7a3.3 3.3 0 0 1 0 6.6h-2.6" stroke={C.terracotta} strokeWidth={1.7} />
    </>
  );
}

const gapFigures = { file: Vague, refresh: Counter, building: Branches };

export function isGapFigure(name: string): name is keyof typeof gapFigures {
  return name in gapFigures;
}

/** A gap's drawing, on a soft disc. */
export function GapFigure({ name, className = "" }: { name: keyof typeof gapFigures; className?: string }) {
  const Figure = gapFigures[name];
  return (
    <svg viewBox="0 0 160 116" aria-hidden="true" focusable="false" className={`block h-auto ${className}`} {...stroke}>
      <circle cx="80" cy="58" r="56" fill={C.sand} stroke="none" />
      <Figure />
    </svg>
  );
}

// ── How we built it ─────────────────────────────────────────────────────────

/** The seven sources, a constellation: four above, three between them. */
function Sources() {
  const spots = [
    [44, 46],
    [86, 46],
    [128, 46],
    [170, 46],
    [65, 92],
    [107, 92],
    [149, 92],
  ] as const;
  const nodes = sourceGlyphs.map((name, i) => ({ name, x: spots[i][0], y: spots[i][1] }));
  // Each lower one ties to the two above it.
  const links = [4, 5, 6].flatMap((i) => [
    [nodes[i], nodes[i - 4]],
    [nodes[i], nodes[i - 3]],
  ]);
  return (
    <>
      <defs>
        <filter id="hwb-sources-shadow" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={C.navy} floodOpacity="0.1" />
        </filter>
      </defs>
      {links.map(([a, b], i) => (
        <path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke={C.teal} strokeOpacity={0.3} strokeDasharray="1 4" />
      ))}
      {nodes.map((n) => (
        <g key={n.name}>
          <circle cx={n.x} cy={n.y} r="19" fill="#fff" stroke={C.line} filter="url(#hwb-sources-shadow)" />
          <SourceGlyphGroup name={n.name} x={n.x} y={n.y} scale={0.78} />
        </g>
      ))}
    </>
  );
}

/** Sorted into a grid by document, stage and office, one cell marked where practice differs. */
function Organize() {
  const cols = [62, 107, 152];
  const rows = [70, 92, 114];
  return (
    <>
      {/* The column heads: a document, a stage's flag, an office. */}
      <g transform={`translate(${cols[0] - 9} 30)`}>
        <path d="M2 0h9l5 5v15H2Z" fill="#fff" />
        <path d="M11 0v5h5" />
      </g>
      <g transform={`translate(${cols[1] - 7} 30)`}>
        <path d="M2 21V1" />
        <path d="M2 2h11l-3 4.5 3 4.5H2" fill={C.teal100} />
      </g>
      <g transform={`translate(${cols[2] - 10} 30)`}>
        <path d="M0 8 10 2l10 6Z" fill={C.teal100} />
        <path d="M2 8h16v12H2ZM6 11v6M10 11v6M14 11v6" />
      </g>
      <path d="M38 58h138" stroke={C.line} />
      {rows.map((y, r) =>
        cols.map((x, c) => {
          const marked = r === 1 && c === 2;
          return (
            <rect
              key={`${r}-${c}`}
              x={x - 19}
              y={y - 8}
              width="38"
              height="16"
              rx="5"
              fill={marked ? C.amber100 : r === 0 || c === 0 ? C.teal100 : "#fff"}
              stroke={marked ? C.amber : C.line}
            />
          );
        }),
      )}
      <circle cx={cols[2] + 13} cy={rows[1]} r="2.5" fill={C.amber} stroke="none" />
    </>
  );
}

/** Visamo's mark, and what's built on it: the chat and the check. */
function Ai() {
  const mark = { x: 110, y: 78, size: 52 };
  return (
    <>
      <defs>
        <filter id="hwb-ai-shadow" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={C.navy} floodOpacity="0.1" />
        </filter>
        <radialGradient id="hwb-ai-glow">
          <stop offset="0" stopColor={C.teal} stopOpacity="0.22" />
          <stop offset="1" stopColor={C.teal} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hwb-ai-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#378d83" />
          <stop offset="1" stopColor={C.teal700} />
        </linearGradient>
      </defs>
      <circle cx={mark.x} cy={mark.y} r="50" fill="url(#hwb-ai-glow)" stroke="none" />
      <circle cx={mark.x} cy={mark.y} r="40" stroke={C.teal} strokeOpacity={0.3} strokeDasharray="2 5" />
      <path d="M78 78H62M142 78h16" stroke={C.teal} strokeWidth={2.2} strokeDasharray="0.01 6" className="sources-flow" />
      <g filter="url(#hwb-ai-shadow)">
        <rect x={mark.x - mark.size / 2} y={mark.y - mark.size / 2} width={mark.size} height={mark.size} rx="15" fill="url(#hwb-ai-mark)" stroke="none" />
      </g>
      <path d={`M${mark.x - 11} ${mark.y - 9}L${mark.x} ${mark.y + 10}L${mark.x + 11} ${mark.y - 9}`} stroke="#fff" strokeWidth={4.2} />
      {[
        { name: "chat" as const, x: 40 },
        { name: "check" as const, x: 180 },
      ].map((o) => (
        <g key={o.name}>
          <circle cx={o.x} cy={mark.y} r="21" fill={C.teal100} stroke={C.teal} strokeOpacity={0.35} />
          <SourceGlyphGroup name={o.name} x={o.x} y={mark.y} scale={0.85} className="text-teal-700" />
        </g>
      ))}
    </>
  );
}

const stepFigures = { people: Sources, guide: Organize, sparkle: Ai };

export function isStepFigure(name: string): name is keyof typeof stepFigures {
  return name in stepFigures;
}

export function StepFigure({ name, className = "" }: { name: keyof typeof stepFigures; className?: string }) {
  const Figure = stepFigures[name];
  return (
    <svg viewBox="0 0 220 140" aria-hidden="true" focusable="false" className={`block h-auto ${className}`} {...stroke}>
      <Figure />
    </svg>
  );
}

// ── Your documents stay yours ───────────────────────────────────────────────

/**
 * On the dark band: your document inside a closed ring, with its lock, and
 * the AI checking it from inside the ring.
 */
export function PrivacyFigure({ className = "" }: { className?: string }) {
  const c = { x: 180, y: 150 };
  return (
    <svg viewBox="0 0 360 300" aria-hidden="true" focusable="false" className={`block h-auto ${className}`} {...stroke}>
      <defs>
        <radialGradient id="hwb-privacy-glow">
          <stop offset="0" stopColor={C.teal} stopOpacity="0.45" />
          <stop offset="1" stopColor={C.teal} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c.x} cy={c.y} r="140" fill="url(#hwb-privacy-glow)" stroke="none" />
      <circle cx={c.x} cy={c.y} r="112" stroke="#d6e4da" strokeOpacity={0.45} strokeWidth={1.4} strokeDasharray="2 7" />
      <circle cx={c.x} cy={c.y} r="86" stroke="#fff" strokeOpacity={0.1} />

      {/* The document. */}
      <g transform={`rotate(-4 ${c.x} ${c.y})`}>
        <rect x={c.x - 38} y={c.y - 50} width="76" height="100" rx="8" fill="#fff" stroke="none" />
        <path
          d={`M${c.x - 24} ${c.y - 30}h48M${c.x - 24} ${c.y - 18}h36M${c.x - 24} ${c.y - 6}h44M${c.x - 24} ${c.y + 6}h28`}
          stroke={C.slate300}
          strokeWidth={3}
        />
      </g>
      {/* Its lock. */}
      <g transform={`translate(${c.x + 30} ${c.y + 42})`}>
        <circle r="20" fill={C.teal} stroke="#0f2a44" strokeWidth={4} />
        <rect x="-7" y="-2" width="14" height="11" rx="2.5" fill="#fff" stroke="none" />
        <path d="M-4.2-2v-3.2a4.2 4.2 0 0 1 8.4 0V-2" stroke="#fff" strokeWidth={2} />
      </g>

      {/* The AI, inside the ring: it reads the document and gives back the result. */}
      <path d={`M${c.x - 44} ${c.y - 62}q-22-18-40 4`} stroke={C.teal100} strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray="0.01 6" className="sources-flow" />
      <g transform={`translate(${c.x - 92} ${c.y - 46})`}>
        <circle r="20" fill="#17385a" stroke={C.teal100} strokeOpacity={0.5} />
        <path
          d="M0-9c.9 4.6 3.4 7.1 8 8-4.6.9-7.1 3.4-8 8-.9-4.6-3.4-7.1-8-8 4.6-.9 7.1-3.4 8-8Z"
          fill={C.teal100}
          stroke="none"
        />
      </g>
    </svg>
  );
}

// ── Where the knowledge comes from ──────────────────────────────────────────

/** Where each source sits in the web, in the sources page's order. */
const webSpots = [
  [34, 72],
  [104, 28],
  [100, 118],
  [160, 74],
  [222, 30],
  [226, 116],
  [292, 70],
] as const;

/** Who ties to whom: every source to three others, the last to two. */
const webLinks = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 3],
  [1, 4],
  [2, 3],
  [2, 5],
  [4, 5],
  [4, 6],
  [5, 6],
] as const;

/** How far from a glyph's middle a line stops, so the glyphs float free. */
const webGap = 25;

/**
 * The seven sources as a web, drawn in white straight on the link strip's
 * green: the glyphs bare, their paper and tint turned to a wash of white
 * (`.glyphs-on-dark` in globals.css), the lines between them carrying a
 * slow flow of dots.
 */
export function SourcesWeb({ className = "" }: { className?: string }) {
  const nodes = sourceGlyphs.map((name, i) => ({ name, x: webSpots[i][0], y: webSpots[i][1] }));
  return (
    <svg viewBox="0 0 326 146" aria-hidden="true" focusable="false" className={`block h-auto ${className}`} fill="none">
      {webLinks.map(([from, to], i) => {
        const a = nodes[from];
        const b = nodes[to];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const ux = (b.x - a.x) / len;
        const uy = (b.y - a.y) / len;
        const d = `M${a.x + ux * webGap} ${a.y + uy * webGap}L${b.x - ux * webGap} ${b.y - uy * webGap}`;
        return (
          <g key={i}>
            <path d={d} stroke="#fff" strokeOpacity={0.28} strokeWidth={1} />
            <path
              d={d}
              className="sources-flow"
              style={{ animationDelay: `${-i * 0.3}s` }}
              stroke="#fff"
              strokeOpacity={0.75}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="0.01 12"
            />
          </g>
        );
      })}
      {nodes.map((n) => (
        <SourceGlyphGroup key={n.name} name={n.name} x={n.x} y={n.y} scale={1.2} className="glyphs-on-dark text-white" />
      ))}
    </svg>
  );
}
