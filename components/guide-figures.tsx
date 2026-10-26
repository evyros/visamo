import type { ReactNode } from "react";
import type { FigureIcon, GuideFigure as Figure } from "@/content/guides";
import type { Locale } from "@/i18n/config";
import { GuideText } from "./guide";
import { Icon } from "./icons";

// The guides' drawings. The drawings carry no words: the labels around them
// are HTML from the guide's text, so a drawing serves both languages, and
// anything with a direction mirrors in RTL (flip-rtl). Colors are the theme's.

const C = {
  navy: "#0f2a44",
  navy800: "#17385a",
  teal: "#2f7f76",
  teal700: "#25665f",
  teal100: "#e3f0ed",
  sage: "#d6e4da",
  amber: "#c98a2b",
  amber100: "#f7ecd9",
  terracotta: "#a84b36",
  slate300: "#cbd5e1",
  line: "#e2e0da",
};

/** A five-pointed star centered on (cx, cy): symmetric, so it reads the same mirrored. */
function star(cx: number, cy: number, r: number) {
  const points = Array.from({ length: 10 }, (_, k) => {
    const radius = k % 2 ? r * 0.42 : r;
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join("L")}Z`;
}

export function GuideFigure({ figure, locale }: { figure: Figure; locale: Locale }) {
  return (
    <figure className="my-8">
      {figure.figure === "path" ? (
        <PathFigure figure={figure} />
      ) : figure.figure === "trip" ? (
        <TripFigure figure={figure} />
      ) : figure.figure === "years" ? (
        <YearsFigure figure={figure} locale={locale} />
      ) : figure.figure === "routes" ? (
        <RoutesFigure figure={figure} />
      ) : figure.figure === "loop" ? (
        <LoopFigure figure={figure} />
      ) : (
        <MapFigure figure={figure} />
      )}
      <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">
        <GuideText text={figure.caption} locale={locale} />
      </figcaption>
    </figure>
  );
}

// ── The path: B/1, A/5, permanent status ─────────────────────────────────────

const pathTiles = [PassportTile, IdCardTile, HomeTile];

function PathFigure({ figure }: { figure: Extract<Figure, { figure: "path" }> }) {
  return (
    <div
      className={`rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 px-3 sm:px-8 ${
        // Room above for the pin on the current stage.
        figure.current === undefined ? "py-7 sm:py-9" : "pt-10 pb-7 sm:pt-11 sm:pb-9"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start">
        {figure.stages.map((stage, i) => {
          const Tile = pathTiles[Math.min(i, pathTiles.length - 1)];
          const current = i === figure.current;
          return [
            i > 0 && (
              <div key={`to-${i}`} aria-hidden="true" className="flex h-[72px] items-center sm:h-24">
                <PathConnector last={i === figure.stages.length - 1} />
              </div>
            ),
            <div key={i} className="flex flex-col items-center px-1 text-center">
              <div className="relative">
                {current && <YouAreHere />}
                <Tile />
              </div>
              <p
                className={`mt-3 font-display text-[16px] leading-tight font-semibold sm:text-lg ${current ? "text-teal-700" : "text-navy-900"}`}
              >
                {stage.title}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-balance text-slate-500 sm:text-[15px] sm:leading-6">
                {stage.text}
              </p>
            </div>,
          ];
        })}
      </div>
    </div>
  );
}

/** The stage the guide is about: a ring around its tile, and a pin dropped on it. */
function YouAreHere() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[7px] rounded-[25px] border-2 border-dashed border-teal-600/60 sm:rounded-[31px]"
      />
      <svg
        viewBox="0 0 24 30"
        aria-hidden="true"
        className="pointer-events-none absolute start-1/2 -top-[31px] h-[26px] w-[21px] -translate-x-1/2 select-none drop-shadow-[0_3px_5px_rgb(15_42_68_/_0.22)] rtl:translate-x-1/2 sm:-top-[34px] sm:h-[29px] sm:w-6"
      >
        <path d="M12 28.5S2.5 19.6 2.5 12a9.5 9.5 0 0 1 19 0c0 7.6-9.5 16.5-9.5 16.5Z" fill={C.teal} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3.6" fill="#fff" />
      </svg>
    </>
  );
}

function PathConnector({ last }: { last: boolean }) {
  return (
    <svg viewBox="0 0 48 12" className="flip-rtl pointer-events-none w-6 select-none sm:w-12" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h33" stroke={C.slate300} strokeWidth={2} strokeDasharray="0.1 5" />
      <path d="m38 2 5 4-5 4" stroke={last ? C.navy : C.teal} strokeWidth={2.2} />
    </svg>
  );
}

const tileClass = "pointer-events-none size-[72px] shrink-0 select-none drop-shadow-[0_6px_14px_rgb(15_42_68_/_0.12)] sm:size-24";

/** B/1: a passport, its partner visa stamped in. */
function PassportTile() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={tileClass}>
      <defs>
        <linearGradient id="gf-passport-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#edf6f3" />
          <stop offset="1" stopColor={C.teal100} />
        </linearGradient>
        <linearGradient id="gf-passport-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.navy800} />
          <stop offset="1" stopColor={C.navy} />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#gf-passport-bg)" />
      <rect x="0.5" y="0.5" width="95" height="95" rx="23.5" fill="none" stroke={C.teal} strokeOpacity="0.14" />
      <g transform="rotate(-8 46 47)">
        {/* The pages, peeking out behind the cover. */}
        <rect x="31" y="21" width="36" height="50" rx="5" fill="#fff" stroke={C.line} />
        <rect x="27" y="19" width="36" height="50" rx="5" fill="url(#gf-passport-cover)" />
        <path d="M31 19v50" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
        <g fill="none" stroke={C.amber} strokeWidth="1.6">
          <circle cx="45" cy="38" r="8" />
          <ellipse cx="45" cy="38" rx="3.4" ry="8" />
          <path d="M37 38h16" />
        </g>
        <rect x="38" y="54" width="14" height="2" rx="1" fill={C.amber} fillOpacity="0.75" />
        <rect x="40" y="59" width="10" height="2" rx="1" fill={C.amber} fillOpacity="0.45" />
      </g>
      {/* The visa stamp. */}
      <g transform="rotate(-14 65 64)">
        <circle cx="65" cy="64" r="15" fill="#fff" />
        <circle cx="65" cy="64" r="13" fill="none" stroke={C.teal} strokeWidth="2.2" />
        <circle cx="65" cy="64" r="9.5" fill="none" stroke={C.teal} strokeWidth="1.2" strokeDasharray="1.6 2.2" />
        <path d="m60.5 64.3 3.2 3.2 6.3-6.6" fill="none" stroke={C.teal} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A/5: an Israeli ID card, with the health insurance that comes with it. */
function IdCardTile() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={tileClass}>
      <defs>
        <linearGradient id="gf-id-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#edf6f3" />
          <stop offset="1" stopColor={C.teal100} />
        </linearGradient>
        <clipPath id="gf-id-card">
          <rect x="14" y="27" width="62" height="42" rx="6" />
        </clipPath>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#gf-id-bg)" />
      <rect x="0.5" y="0.5" width="95" height="95" rx="23.5" fill="none" stroke={C.teal} strokeOpacity="0.14" />
      <g transform="rotate(-5 45 48)">
        <rect x="14" y="27" width="62" height="42" rx="6" fill="#fff" stroke={C.line} />
        <g clipPath="url(#gf-id-card)">
          <rect x="14" y="27" width="62" height="9" fill={C.navy} />
          <rect x="14" y="36" width="62" height="1.6" fill={C.teal} />
        </g>
        <circle cx="21" cy="31.5" r="1.5" fill={C.amber} />
        <rect x="26" y="30.6" width="16" height="1.8" rx="0.9" fill="#fff" fillOpacity="0.55" />
        {/* The photo. */}
        <rect x="20" y="42" width="15" height="19" rx="3" fill={C.teal100} />
        <circle cx="27.5" cy="49" r="3.4" fill={C.teal} />
        <path d="M21.5 61a6 6 0 0 1 12 0Z" fill={C.teal} />
        <rect x="40" y="44" width="26" height="3" rx="1.5" fill={C.navy} />
        <rect x="40" y="50.5" width="20" height="2.4" rx="1.2" fill={C.slate300} />
        {/* The ID number. */}
        <g fill={C.slate300}>
          {Array.from({ length: 9 }, (_, k) => (
            <circle key={k} cx={41 + k * 3.1} cy="58" r="1.1" />
          ))}
        </g>
      </g>
      {/* Health insurance. */}
      <circle cx="69" cy="66" r="14" fill="#fff" />
      <circle cx="69" cy="66" r="11.5" fill={C.teal} />
      <path d="M69 60.5v11M63.5 66h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Permanent status: a home, the navy destination, with a star for the status. */
function HomeTile() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={tileClass}>
      <defs>
        <linearGradient id="gf-home-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.navy800} />
          <stop offset="1" stopColor={C.navy} />
        </linearGradient>
        <radialGradient id="gf-home-glow" cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" stopColor={C.teal} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.teal} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#gf-home-bg)" />
      <circle cx="46" cy="46" r="34" fill="url(#gf-home-glow)" />
      <rect x="57" y="28" width="6" height="16" rx="1.5" fill="#fff" fillOpacity="0.9" />
      <path d="M28 47 46 32l18 15v22a3 3 0 0 1-3 3H31a3 3 0 0 1-3-3Z" fill="#fff" />
      <path d="M22 50 46 30l24 20" fill="none" stroke={C.amber} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 72V61a5 5 0 0 1 10 0v11Z" fill={C.teal} />
      <rect x="33" y="52" width="6" height="6" rx="1.2" fill={C.sage} />
      {/* The status. */}
      <circle cx="68" cy="68" r="14" fill={C.navy} />
      <circle cx="68" cy="68" r="11.5" fill={C.amber} />
      <path d={star(68, 68.6, 6.6)} fill="#fff" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

// ── A trip abroad, with the second sticker and without ──────────────────────

function TripFigure({ figure }: { figure: Extract<Figure, { figure: "trip" }> }) {
  return (
    <div className="rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 p-2.5 sm:p-6">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {(["kept", "ended"] as const).map((way) => (
          <div key={way} className="rounded-xl border border-line-200 bg-white p-1.5 sm:p-2.5">
            <TripScene ended={way === "ended"} />
            <div className="px-1.5 pt-2.5 pb-1.5 sm:px-2 sm:pt-3">
              <p className="text-[14px] leading-5 font-semibold text-navy-900 sm:text-[15px] sm:leading-6">{figure[way].title}</p>
              <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-[15px] sm:leading-6">{figure[way].text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A cloud with a flat bottom, its top-left corner at (x, y). */
function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#fff">
      <circle cx="8" cy="7.5" r="5" />
      <circle cx="15" cy="6.5" r="6" />
      <circle cx="21.5" cy="8.5" r="4" />
      <rect x="8" y="7.5" width="13.5" height="5" />
    </g>
  );
}

/** A plane at (x, y), turned `angle` degrees from flying toward +x, on a halo so it sits over the route. */
function Plane({ x, y, angle, scale = 0.72 }: { x: number; y: number; angle: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale}) translate(-27 -24)`}>
      <g stroke="#fff" strokeWidth="5" strokeLinejoin="round" style={{ paintOrder: "stroke" }}>
        {planeShape}
      </g>
    </g>
  );
}

/** An ink stamp from passport control: an arrow out of the country, or back in. */
function BorderStamp({ x, y, angle, back = false }: { x: number; y: number; angle: number; back?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-9" y="-5.5" width="18" height="11" rx="2.5" stroke={back ? C.navy : C.teal700} strokeOpacity="0.5" strokeWidth="1.2" />
      <path
        d={back ? "M4 0h-8m2.6-2.6L-4 0l2.6 2.6" : "M-4 0h8M1.4-2.6 4 0l-2.6 2.6"}
        stroke={back ? C.navy : C.teal700}
        strokeOpacity="0.6"
        strokeWidth="1.3"
      />
    </g>
  );
}

/**
 * A visa sticker on a passport page: a colored band, then the photo and the
 * holder's details, or (`roundTrip`) the inter-visa's two arrows.
 */
function VisaSticker({ x, y, band, roundTrip = false, id }: { x: number; y: number; band: string; roundTrip?: boolean; id: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width="40" height="31" rx="2.5" />
        </clipPath>
        <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.amber} />
          <stop offset="0.5" stopColor="#f2d9a6" />
          <stop offset="1" stopColor={C.teal} />
        </linearGradient>
      </defs>
      <rect width="40" height="31" rx="2.5" fill="#fff" stroke={C.line} strokeWidth="0.8" />
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="40" height="7" fill={band} />
        {/* A faint security pattern across the sticker. */}
        <path
          d="M0 25q5-3 10 0t10 0 10 0 10 0M0 28q5-3 10 0t10 0 10 0 10 0"
          fill="none"
          stroke={band}
          strokeOpacity="0.1"
          strokeWidth="0.8"
        />
      </g>
      <circle cx="4" cy="3.5" r="1.5" fill={C.amber} />
      <rect x="8" y="2.8" width="12" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.6" />
      {roundTrip ? (
        <g fill="none" stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.4 16.2a5.6 5.6 0 0 1 10.3-1.8" />
          <path d="m16.3 11.6-.6 2.8-2.8-.5" />
          <path d="M16.2 19.3a5.6 5.6 0 0 1-10.3 1.8" />
          <path d="m5.3 23.9.6-2.8 2.8.5" />
        </g>
      ) : (
        <>
          <rect x="3" y="10" width="10" height="13" rx="1.5" fill={C.teal100} />
          <circle cx="8" cy="14.6" r="2.4" fill={C.teal} />
          <path d="M4.4 23a3.6 3.6 0 0 1 7.2 0Z" fill={C.teal} />
        </>
      )}
      <rect x="16" y="11" width="18" height="2.2" rx="1.1" fill={C.navy} />
      <rect x="16" y="15.5" width="13" height="1.8" rx="0.9" fill={C.slate300} />
      <rect x="16" y="19.5" width="15" height="1.8" rx="0.9" fill={C.slate300} />
      <circle cx="34.5" cy="20" r="3.1" fill={`url(#${id}-holo)`} fillOpacity="0.85" />
      {/* The machine-readable line. */}
      <g fill={C.slate300}>
        {Array.from({ length: 12 }, (_, k) => (
          <circle key={k} cx={3.5 + k * 3} cy="27.5" r="0.6" />
        ))}
      </g>
    </g>
  );
}

/**
 * A passport, open on its visa pages, beside a dotted flight out to a globe.
 * Kept: two stickers, an exit and an entry stamp, and the flight back. Ended:
 * the inter-visa's place is empty, the B/1 is stamped void, and the plane
 * only flies out.
 */
function TripScene({ ended }: { ended: boolean }) {
  const id = ended ? "gf-trip-ended" : "gf-trip-kept";
  const accent = ended ? C.terracotta : C.teal;
  return (
    <svg viewBox="0 0 240 136" aria-hidden="true" className="flip-rtl pointer-events-none block h-auto w-full select-none">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ended ? "#fcf8f1" : "#f1f8f6"} />
          <stop offset="1" stopColor={ended ? C.amber100 : C.teal100} />
        </linearGradient>
        <linearGradient id={`${id}-cover`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.navy800} />
          <stop offset="1" stopColor={C.navy} />
        </linearGradient>
        {/* The fold between the pages. */}
        <linearGradient id={`${id}-fold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.navy} stopOpacity="0" />
          <stop offset="0.5" stopColor={C.navy} stopOpacity="0.13" />
          <stop offset="1" stopColor={C.navy} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-globe`}>
          <circle cx="210" cy="70" r="15" />
        </clipPath>
      </defs>

      <rect width="240" height="136" rx="10" fill={`url(#${id}-bg)`} />
      <Cloud x={140} y={56} />
      <Cloud x={204} y={20} scale={0.7} />
      {ended && <Cloud x={176} y={104} scale={0.85} />}

      {/* The passport's shadow on the ground. */}
      <ellipse cx="68" cy="118" rx="48" ry="4.5" fill={C.navy} fillOpacity="0.08" />

      <g transform="rotate(-6 66 72)">
        <rect x="13" y="33" width="106" height="78" rx="7" fill={`url(#${id}-cover)`} />
        <rect x="17" y="36.5" width="49" height="71" rx="4" fill="#fff" />
        <rect x="66" y="36.5" width="49" height="71" rx="4" fill="#fdfbf7" />
        <rect x="60" y="36.5" width="12" height="71" fill={`url(#${id}-fold)`} />
        {/* The guilloche printed on every page. */}
        <path
          d="M21 96q4-3 8 0t8 0 8 0 8 0 8 0M21 101q4-3 8 0t8 0 8 0 8 0 8 0"
          fill="none"
          stroke={C.teal}
          strokeOpacity="0.16"
          strokeWidth="0.9"
        />

        <g opacity={ended ? 0.55 : 1}>
          <VisaSticker id={`${id}-b1`} x={21.5} y={42} band={C.teal} />
        </g>
        {ended ? (
          <>
            {/* Where the inter-visa would be. */}
            <rect x="70.5" y="42" width="40" height="31" rx="2.5" fill="none" stroke={C.slate300} strokeWidth="1.1" strokeDasharray="2.6 2.4" />
            <BorderStamp x={82} y={90} angle={-8} />
            {/* The B/1, stamped void. */}
            <g transform="rotate(-16 41.5 57.5)" fill="none" stroke={C.terracotta}>
              <rect x="25" y="49.5" width="33" height="16" rx="3" strokeWidth="1.9" />
              <rect x="27.6" y="52.1" width="27.8" height="10.8" rx="1.8" strokeWidth="0.8" strokeOpacity="0.7" />
              <path d="M31 57.5h21" strokeWidth="2" strokeLinecap="round" strokeDasharray="3.2 1.9" />
            </g>
          </>
        ) : (
          <>
            <VisaSticker id={`${id}-inter`} x={70.5} y={42} band={C.navy} roundTrip />
            <BorderStamp x={82} y={90} angle={-8} />
            <BorderStamp x={102} y={86} angle={9} back />
          </>
        )}
      </g>

      {/* The globe: abroad. */}
      <circle cx="210" cy="70" r="16.5" fill="#fff" />
      <g clipPath={`url(#${id}-globe)`} fill="none" stroke={C.teal} strokeWidth="1.1" strokeOpacity="0.75">
        <circle cx="210" cy="70" r="15" fill={C.teal100} stroke="none" />
        <path d="M203 60.5c3 1.5 5.5.5 7.5 3s-1 5-3.5 6-4.5 4-2.5 7.5" fill={C.sage} stroke="none" />
        <path d="M216 74c2.5-1 5 .5 6 3s-1.5 5-4 5.5-4-1.5-3.5-4" fill={C.sage} stroke="none" />
        <ellipse cx="210" cy="70" rx="6.5" ry="15" />
        <path d="M195 70h30M196 62h28M196 78h28" />
      </g>
      <circle cx="210" cy="70" r="15" fill="none" stroke={C.navy} strokeWidth="1.6" />

      {/* Out: dotted, under the plane, ending in an arrow at the globe. */}
      <path d="M124 46C146 16 182 16 197 54" fill="none" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 5.2" />
      <path d="m192.6 51.4 4.6 3.4 1.2-5.6" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Plane x={163} y={24.6} angle={5} />

      {!ended && (
        <>
          {/* And back, home to the same visa. */}
          <path d="M198 88C184 120 150 122 133 101" fill="none" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 5.2" />
          <path d="m133.6 106.4-.9-5.6 5.6-.5" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Plane x={166.5} y={114} angle={171} />
        </>
      )}

      {/* The verdict, pinned to the passport's corner. */}
      <circle cx="113" cy="106" r="12.5" fill="#fff" />
      <circle cx="113" cy="106" r="10.5" fill={accent} />
      {ended ? (
        <path d="M109.2 102.2l7.6 7.6M116.8 102.2l-7.6 7.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        // A check reads only one way round: turned back when the scene mirrors.
        <path
          d="m108.2 106.3 3.3 3.3 6.4-6.7"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="origin-center [transform-box:fill-box] rtl:-scale-x-100"
        />
      )}
    </svg>
  );
}

// ── The years on each visa, a bar per track ─────────────────────────────────

/** Where a number of months falls on the axis, as a percentage of its width. */
const at = (months: number, axis: number) => `${((months / axis) * 100).toFixed(3)}%`;

function YearsFigure({ figure, locale }: { figure: Extract<Figure, { figure: "years" }>; locale: Locale }) {
  const longest = Math.max(...figure.tracks.map((t) => t.b1 + t.a5));
  const years = Math.ceil(longest / 12);
  // Room past the last year for the star at the end of the longest bar.
  const axis = years * 12 + 6;
  const ticks = Array.from({ length: years + 1 }, (_, y) => y);

  return (
    <div className="rounded-2xl border border-line-200 bg-white px-4 py-6 sm:px-7 sm:py-7">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-full bg-teal-600" />
          {figure.legend.b1}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-full bg-navy-900" />
          {figure.legend.a5}
        </li>
        <li className="flex items-center gap-2">
          <svg viewBox="-10 -10 20 20" aria-hidden="true" className="pointer-events-none size-4 select-none">
            <circle r="9.5" fill={C.amber} />
            <path d={star(0, 0.6, 5.4)} fill="#fff" />
          </svg>
          {figure.legend.end}
        </li>
      </ul>

      <div className="mt-6 space-y-5">
        {figure.tracks.map((track, i) => {
          const end = track.b1 + track.a5;
          return (
            <div key={i}>
              <p className="flex items-baseline justify-between gap-3 text-[15px] leading-6">
                <span className="font-semibold text-navy-900">{track.name}</span>
                <span className="text-sm text-slate-500">{track.total}</span>
              </p>
              {/* Percentages without a viewBox, so the bar stretches and the circles stay round. */}
              <svg aria-hidden="true" className="flip-rtl pointer-events-none mt-2 h-7 w-full overflow-visible select-none">
                <defs>
                  <clipPath id={`gf-years-${i}`}>
                    <rect x="0" y="7" width={at(end, axis)} height="14" rx="7" />
                  </clipPath>
                  <linearGradient id={`gf-years-a5-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor={C.navy800} />
                    <stop offset="1" stopColor={C.navy} />
                  </linearGradient>
                </defs>
                <rect x="0" y="12.5" width="100%" height="3" rx="1.5" fill={C.line} fillOpacity="0.7" />
                {ticks.slice(1).map((y) => (
                  <circle key={y} cx={at(y * 12, axis)} cy="14" r="2" fill={C.slate300} />
                ))}
                <g clipPath={`url(#gf-years-${i})`}>
                  <rect x="0" y="7" width={at(track.b1, axis)} height="14" fill={C.teal} />
                  <rect x={at(track.b1, axis)} y="7" width={at(track.a5, axis)} height="14" fill={`url(#gf-years-a5-${i})`} />
                  <rect x={at(track.b1, axis)} y="7" width="2.5" height="14" fill="#fff" />
                  <rect x="0" y="7" width="100%" height="5" fill="#fff" fillOpacity="0.12" />
                </g>
                <svg x={at(end, axis)} y="14" overflow="visible">
                  <circle r="12.5" fill="#fff" />
                  <circle r="10.5" fill={C.amber} />
                  <path d={star(0, 0.6, 6)} fill="#fff" stroke="#fff" strokeWidth="0.7" strokeLinejoin="round" />
                </svg>
              </svg>
            </div>
          );
        })}
      </div>

      {/* The years, under the dots on the bars. */}
      <div aria-hidden="true" className="pointer-events-none relative mt-2 h-5 text-xs text-slate-500 tabular-nums select-none">
        {ticks.map((y) => (
          <span
            key={y}
            className={`absolute top-0 ${y === 0 ? "" : "-translate-x-1/2 rtl:translate-x-1/2"}`}
            style={{ insetInlineStart: at(y * 12, axis) }}
          >
            {y.toLocaleString(locale)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Two routes that join ─────────────────────────────────────────────────────

function RoutesFigure({ figure }: { figure: Extract<Figure, { figure: "routes" }> }) {
  return (
    <div className="rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 p-3 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {figure.routes.map((route, i) => (
          <div key={i} className="rounded-xl border border-line-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <IconTile name={route.icon} className="size-11" />
              <p className="text-[15px] leading-6 font-semibold text-navy-900">{route.title}</p>
            </div>
            <ol className="mt-4 space-y-2.5">
              {route.steps.map((step, j) => (
                <li key={j} className="relative flex gap-3 text-[14px] leading-6 text-slate-700 sm:text-[15px]">
                  {/* A dotted line on to the next step's dot. */}
                  {j < route.steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute start-[7px] top-[20px] -bottom-[14px] border-s-2 border-dotted border-slate-300"
                    />
                  )}
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none mt-1 size-4 shrink-0 select-none">
                    <circle cx="8" cy="8" r="5.6" fill="#fff" stroke={C.teal} strokeWidth="2.6" />
                  </svg>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* The routes join, down into where they lead: a bracket from sm up, an arrow on a phone. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none hidden h-10 w-full overflow-visible select-none sm:block"
        fill="none"
        stroke={C.slate300}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="25%" y1="0" x2="25%" y2="14" />
        <line x1="75%" y1="0" x2="75%" y2="14" />
        <line x1="25%" y1="14" x2="75%" y2="14" />
        <line x1="50%" y1="14" x2="50%" y2="33" />
        <svg x="50%" y="34" overflow="visible">
          <path d="m-5 -5.5 5 5 5-5" stroke={C.navy} strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </svg>
      <svg
        viewBox="0 0 16 28"
        aria-hidden="true"
        className="pointer-events-none mx-auto my-1 h-7 w-4 select-none sm:hidden"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 2v20" stroke={C.slate300} strokeWidth="2" />
        <path d="m3 19 5 5 5-5" stroke={C.navy} strokeWidth="2.2" />
      </svg>

      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl bg-navy-900 p-4 text-white shadow-soft">
        <IconTile name={figure.end.icon} className="size-11" />
        <div className="min-w-0">
          <p className="text-[15px] leading-6 font-semibold">{figure.end.title}</p>
          {figure.end.text && <p className="mt-0.5 text-sm leading-5 text-white/75">{figure.end.text}</p>}
        </div>
      </div>
    </div>
  );
}

// ── A loop ───────────────────────────────────────────────────────────────────

function LoopFigure({ figure }: { figure: Extract<Figure, { figure: "loop" }> }) {
  const n = figure.stages.length;
  // Each stage's center along the width, as a share of it (the columns are equal).
  const center = (i: number) => (i + 0.5) / n;
  const first = center(0) * 600;
  const last = center(n - 1) * 600;

  return (
    <div className="rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 px-2 pt-7 pb-5 sm:px-8 sm:pt-9 sm:pb-7">
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {figure.stages.map((stage, i) => (
          <div key={i} className="flex flex-col items-center px-1.5 text-center">
            <IconTile name={stage.icon} className="size-16 drop-shadow-[0_6px_14px_rgb(15_42_68_/_0.12)] sm:size-20" />
            <p className="mt-3 text-[13px] leading-5 font-semibold text-balance text-navy-900 sm:text-[15px] sm:leading-6">
              {stage.title}
            </p>
          </div>
        ))}
        {figure.stages.slice(1).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute top-8 -translate-x-1/2 -translate-y-1/2 sm:top-10 rtl:translate-x-1/2"
            style={{ insetInlineStart: `${((i + 1) / n) * 100}%` }}
          >
            <PathConnector last={false} />
          </div>
        ))}
      </div>

      {/* The way back: from under the last stage around to the first. Its cost sits on
          the line from sm up, and under it on a phone, where it would hide the line. */}
      <div className="relative mt-3 h-[92px] sm:h-16">
        <svg
          viewBox="0 0 600 64"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="flip-rtl pointer-events-none absolute inset-x-0 top-0 h-16 w-full overflow-visible select-none"
          fill="none"
        >
          <path
            d={`M${last} 2V26Q${last} 44 ${last - 36} 44H${first + 36}Q${first} 44 ${first} 26V9`}
            stroke={C.terracotta}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="0.1 6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <svg
          viewBox="0 0 12 8"
          aria-hidden="true"
          className="pointer-events-none absolute top-0 w-3 -translate-x-1/2 select-none rtl:translate-x-1/2"
          style={{ insetInlineStart: `${center(0) * 100}%` }}
          fill="none"
        >
          <path d="m1.5 6.5 4.5-5 4.5 5" stroke={C.terracotta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="absolute top-[74px] left-1/2 w-max max-w-[94%] -translate-x-1/2 -translate-y-1/2 sm:top-[44px] sm:max-w-[85%] rounded-full border border-terracotta-600/25 bg-white px-3 py-1 text-center text-xs leading-5 font-semibold text-terracotta-600 shadow-soft sm:px-3.5 sm:text-sm">
          {figure.cost}
        </p>
      </div>
    </div>
  );
}

// ── A map of the guide's sections ────────────────────────────────────────────

function MapFigure({ figure }: { figure: Extract<Figure, { figure: "map" }> }) {
  return (
    <div className="rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 p-3 sm:p-4">
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {figure.items.map((item) => (
          <li key={item.section}>
            <a
              href={`#${item.section}`}
              className="group flex h-full items-center gap-3 rounded-xl border border-line-200 bg-white p-2.5 transition-colors hover:border-teal-600 sm:p-3"
            >
              <IconTile name={item.icon} className="size-10 sm:size-11" />
              <span className="min-w-0 flex-1 text-[14px] leading-5 font-semibold text-navy-900 group-hover:text-teal-700 sm:text-[15px]">
                {item.title}
              </span>
              <Icon name="chevronDown" className="hidden size-4 text-slate-300 group-hover:text-teal-600 sm:block" strokeWidth={2.2} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── The small drawings ───────────────────────────────────────────────────────

/** The ones that point somewhere, mirrored in RTL. */
const directional = new Set<FigureIcon>(["plane", "send"]);

function IconTile({ name, className }: { name: FigureIcon; className: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={`pointer-events-none shrink-0 select-none ${directional.has(name) ? "flip-rtl " : ""}${className}`}
    >
      <rect width="48" height="48" rx="13" fill="#e9f4f1" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="12.5" fill="none" stroke={C.teal} strokeOpacity="0.14" />
      {icons[name]}
    </svg>
  );
}

/** A plane seen from above, nose toward +x, centered near (27, 24). */
const planeShape = (
  <>
    <path d="M14 24c0-1.4 1-2.4 2.4-2.4H36c2.2 0 4.4 1.1 4.4 2.4s-2.2 2.4-4.4 2.4H16.4C15 26.4 14 25.4 14 24Z" fill={C.navy} />
    <path d="M29 22 22.5 11.5h-3L24 22ZM29 26l-6.5 10.5h-3L24 26Z" fill={C.navy} />
    <path d="M18.5 22.2 14.5 17h-2l2 5.2ZM18.5 25.8 14.5 31h-2l2-5.2Z" fill={C.navy} />
    <rect x="33" y="23.2" width="3.4" height="1.6" rx="0.8" fill={C.amber} stroke="none" />
  </>
);

const heart = "M22 35.5c-.6-.4-11-6.6-11-14.2A5.9 5.9 0 0 1 22 18.4a5.9 5.9 0 0 1 11 2.9c0 7.6-10.4 13.8-11 14.2Z";

const icons: Record<FigureIcon, ReactNode> = {
  home: (
    <>
      <path d="M15 24.5 24 17l9 7.5V35a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2Z" fill={C.navy} />
      <path d="M11.5 26.5 24 16l12.5 10.5" fill="none" stroke={C.amber} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 37v-5a2.5 2.5 0 0 1 5 0v5Z" fill={C.teal100} />
    </>
  ),
  consulate: (
    <>
      <path d="M24 6.5v6" stroke={C.navy} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24.7 6.5h6.3l-1.6 2 1.6 2h-6.3Z" fill={C.amber} />
      <path d="M10.5 19.5 24 12.5l13.5 7Z" fill={C.navy} stroke={C.navy} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="12" y="20.5" width="24" height="2.6" rx="0.8" fill={C.navy} />
      {[15, 21, 27, 33].map((x) => (
        <rect key={x} x={x - 1.5} y="24.5" width="3" height="8.5" rx="0.6" fill={C.teal} />
      ))}
      <rect x="10.5" y="34" width="27" height="3.5" rx="1" fill={C.navy} />
    </>
  ),
  seal: (
    <>
      <path d="M18.5 28 15 39.5l4.6-1.8 2.9 3.8 2.3-11Z" fill={C.teal} />
      <path d="M29.5 28 33 39.5l-4.6-1.8-2.9 3.8-2.3-11Z" fill={C.teal700} />
      <circle cx="24" cy="21" r="11.5" fill={C.amber} />
      <circle cx="24" cy="21" r="8.2" fill="none" stroke="#fff" strokeWidth="1.3" strokeDasharray="1.4 1.8" />
      <path d={star(24, 21.5, 5)} fill="#fff" />
    </>
  ),
  chain: (
    <g fill="none" strokeWidth="3.2" transform="rotate(-40 24 24)">
      <rect x="5" y="20" width="15" height="8" rx="4" stroke={C.navy} />
      <rect x="16.5" y="20" width="15" height="8" rx="4" stroke={C.teal} />
      <rect x="28" y="20" width="15" height="8" rx="4" stroke={C.navy} />
    </g>
  ),
  plane: (
    <g transform="rotate(-28 24 24) translate(-3 0)">
      <path d="M5 24h7" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 3.6" />
      {planeShape}
    </g>
  ),
  translation: (
    <>
      <rect x="8.5" y="9.5" width="19" height="24" rx="3" fill={C.navy} />
      <g fill="#fff" fillOpacity="0.5">
        <rect x="12" y="14" width="12" height="2" rx="1" />
        <rect x="12" y="18.5" width="9" height="2" rx="1" />
        <rect x="12" y="23" width="11" height="2" rx="1" />
      </g>
      <rect x="20.5" y="15.5" width="19" height="24" rx="3" fill="#fff" stroke={C.teal} strokeWidth="1.6" />
      <rect x="24" y="21" width="12" height="2" rx="1" fill={C.teal} />
      <g fill={C.slate300}>
        <rect x="24" y="25.5" width="9" height="2" rx="1" />
        <rect x="24" y="30" width="11" height="2" rx="1" />
        <rect x="24" y="34.5" width="7" height="2" rx="1" />
      </g>
      <path d="M31 6.5a7.5 7.5 0 0 1 7.5 7M35.8 11.6l2.7 2.4 2.4-2.8" fill="none" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  forms: (
    <>
      <rect x="12" y="10" width="24" height="30" rx="3.5" fill={C.navy} />
      <rect x="15" y="14.5" width="18" height="22.5" rx="1.8" fill="#fff" />
      <rect x="19" y="8" width="10" height="5.5" rx="2" fill={C.amber} />
      <path d="m17.6 20.4 1.4 1.4 2.6-2.8M17.6 26.4l1.4 1.4 2.6-2.8" fill="none" stroke={C.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <g fill={C.slate300}>
        <rect x="23.5" y="19.8" width="7" height="1.8" rx="0.9" />
        <rect x="23.5" y="25.8" width="7" height="1.8" rx="0.9" />
        <rect x="17.6" y="31.8" width="13" height="1.8" rx="0.9" />
      </g>
    </>
  ),
  passport: (
    <g transform="rotate(-8 24 24)">
      <rect x="16" y="10" width="19" height="28" rx="3" fill="#fff" stroke={C.line} />
      <rect x="13" y="9" width="19" height="28" rx="3" fill={C.navy} />
      <g fill="none" stroke={C.amber}>
        <circle cx="22.5" cy="19.5" r="4.6" strokeWidth="1.3" />
        <ellipse cx="22.5" cy="19.5" rx="2" ry="4.6" strokeWidth="1.1" />
        <path d="M17.9 19.5h9.2" strokeWidth="1.1" />
      </g>
      <rect x="18.5" y="28" width="8" height="1.6" rx="0.8" fill={C.amber} fillOpacity="0.75" />
    </g>
  ),
  hearts: (
    <>
      <path d={heart} fill={C.teal} transform="translate(-1 1)" />
      <path d={heart} fill={C.amber} stroke="#e9f4f1" strokeWidth="3.6" transform="translate(19 5) scale(0.55)" />
    </>
  ),
  certificate: (
    <>
      <rect x="10" y="9" width="26" height="29" rx="3" fill="#fff" stroke={C.line} strokeWidth="1.2" />
      <rect x="14" y="14" width="18" height="2.4" rx="1.2" fill={C.navy} />
      <g fill={C.slate300}>
        <rect x="14" y="19.5" width="14" height="1.8" rx="0.9" />
        <rect x="14" y="24" width="11" height="1.8" rx="0.9" />
      </g>
      <path d="M31.5 35l-2 7 3-1.3 2 2.3 1-7.4Z" fill={C.teal} />
      <path d="M37.5 35l2 7-3-1.3-2 2.3-1-7.4Z" fill={C.teal700} />
      <circle cx="34.5" cy="32" r="6" fill={C.amber} />
      <path d={star(34.5, 32.3, 3.2)} fill="#fff" />
    </>
  ),
  shield: (
    <>
      <path d="M24 8.5 36 13v9.5c0 8-5.2 13.4-12 16-6.8-2.6-12-8-12-16V13Z" fill={C.navy} />
      <path d="M24 8.5 36 13v9.5c0 8-5.2 13.4-12 16Z" fill="#fff" fillOpacity="0.07" />
      <path d="m18.8 23.6 3.6 3.6 7-7.2" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  rejected: (
    <>
      <rect x="11" y="9" width="22" height="29" rx="3" fill="#fff" stroke={C.line} strokeWidth="1.2" />
      <rect x="15" y="14" width="12" height="2.4" rx="1.2" fill={C.navy} />
      <g fill={C.slate300}>
        <rect x="15" y="19.5" width="14" height="1.8" rx="0.9" />
        <rect x="15" y="24" width="10" height="1.8" rx="0.9" />
      </g>
      <circle cx="33" cy="33" r="8.5" fill="#fff" />
      <circle cx="33" cy="33" r="7" fill={C.terracotta} />
      <path d="M30.2 30.2l5.6 5.6M35.8 30.2l-5.6 5.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  send: (
    <>
      <path d="M6.5 32h5M9.5 37h4" stroke={C.slate300} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 22.5 40 9 22.5 29Z" fill={C.teal} />
      <path d="M22.5 29 40 9 30 38.5Z" fill={C.teal700} />
      <path d="M22.5 29 23 37.5 26.8 33.4Z" fill={C.navy} />
    </>
  ),
  hourglass: (
    <>
      <rect x="13" y="8.5" width="22" height="3.2" rx="1.6" fill={C.navy} />
      <rect x="13" y="36.3" width="22" height="3.2" rx="1.6" fill={C.navy} />
      <path
        d="M16.5 11.7h15c0 6.2-5.2 8.4-5.2 12.3s5.2 6.1 5.2 12.3h-15c0-6.2 5.2-8.4 5.2-12.3s-5.2-6.1-5.2-12.3Z"
        fill="#fff"
        stroke={C.navy}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M19.3 15h9.4c-.7 3-3.3 4.4-4.7 6.6-1.4-2.2-4-3.6-4.7-6.6Z" fill={C.amber} />
      <path d="M18.6 35c.9-3.6 3.7-5.6 5.4-5.6s4.5 2 5.4 5.6Z" fill={C.amber} />
      <path d="M24 23.5v5" stroke={C.amber} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.1 2" />
    </>
  ),
};
