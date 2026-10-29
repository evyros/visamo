import type { BranchStats, BranchesTexts, Plural, SentimentId, StageId, WaitSummary } from "@/content/branches";
import { sentimentIds } from "@/content/branches";
import { locales, type Locale } from "@/i18n/config";
import { format } from "@/i18n/messages";
import type { BranchLoad } from "@/lib/branch-load";
import { StageBars, type StageRow } from "./stage-bars";

// The branches page's charts (app/[lang]/branches). The drawings carry
// no words, so they serve both languages; positions use inline-start, so
// every chart reads from the start of the line in either direction. The busy
// gauge is the exception: like a real dial, it reads left to right in both.
// Colors are the theme's (app/globals.css).
// Every color comes with its value in words beside it: color is never the only cue.

const C = {
  navy: "#0f2a44",
  teal: "#2f7f76",
  slate500: "#5b6b80",
  slate300: "#cbd5e1",
  amber: "#c98a2b",
  line: "#e2e0da",
};

/** Satisfied, neutral, unsatisfied: the two ends of one scale, and the gray between them. */
const SENTIMENT_COLOR: Record<SentimentId, string> = { satisfied: C.teal, neutral: C.slate300, unsatisfied: C.amber };
/** The share written on each: white on teal (4.75:1), navy on gray (9.9:1) and on amber (5:1). */
const SENTIMENT_TEXT: Record<SentimentId, string> = { satisfied: "text-white", neutral: "text-navy-900", unsatisfied: "text-navy-900" };
const LEVEL_COLOR: Record<BranchLoad, string> = { lessBusy: C.teal, typical: C.slate500, busier: C.amber, unknown: C.line };
/** The segment the needle points at; an unknown level has no needle. */
const LEVEL_STEP: Record<BranchLoad, number | null> = { lessBusy: 0, typical: 1, busier: 2, unknown: null };

/** A plural form, by the locale's rules: "{n}" and "{count}" are the number. */
export function plural(forms: Plural, n: number, locale: Locale) {
  const category = new Intl.PluralRules(locales[locale].intlLocale).select(n);
  const form = (category === "one" || category === "two" ? forms[category] : undefined) ?? forms.other;
  const number = n.toLocaleString(locales[locale].intlLocale);
  return form.replace("{n}", number).replace("{count}", number);
}

/** A wait's unit and count: days up to two weeks, weeks up to two months, then months. */
function measure(days: number): { unit: keyof BranchesTexts["units"]; n: number } {
  if (days < 14) return { unit: "day", n: Math.max(1, Math.round(days)) };
  if (days < 60) return { unit: "week", n: Math.round(days / 7) };
  return { unit: "month", n: Math.round(days / 30) };
}

/** A wait in words: "6 weeks", "a month". */
export function duration(days: number, t: BranchesTexts, locale: Locale) {
  const { unit, n } = measure(days);
  return plural(t.units[unit], n, locale);
}

const about = (days: number, t: BranchesTexts, locale: Locale) => format(t.about, { time: duration(days, t, locale) });

/** The middle half of couples: "7–8 months" in one unit, "4 weeks to 3 months" across two. */
function range(w: WaitSummary, t: BranchesTexts, locale: Locale) {
  const low = measure(w.low);
  const high = measure(w.high);
  if (low.unit !== high.unit) return format(t.range, { low: duration(w.low, t, locale), high: duration(w.high, t, locale) });
  if (low.n === high.n) return duration(w.high, t, locale);
  const number = (n: number) => n.toLocaleString(locales[locale].intlLocale);
  // Isolated left to right (LRI…PDI): in Hebrew, the dash would otherwise take the line's direction and show "8–7".
  return t.units[high.unit].other.replace("{n}", `⁦${number(low.n)}–${number(high.n)}⁩`);
}

/** Shares that add up to 100, by the largest remainder. */
function percentages(counts: Record<SentimentId, number>) {
  const total = sentimentIds.reduce((a, id) => a + counts[id], 0);
  const exact = sentimentIds.map((id) => ({ id, value: (counts[id] / total) * 100 }));
  const rounded = exact.map((e) => ({ ...e, pct: Math.floor(e.value) }));
  let left = 100 - rounded.reduce((a, e) => a + e.pct, 0);
  for (const e of [...rounded].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (left-- <= 0) break;
    e.pct++;
  }
  return Object.fromEntries(rounded.map((e) => [e.id, e.pct])) as Record<SentimentId, number>;
}

// ── How busy: a three-step dial ──────────────────────────────────────────────

/** A point on the dial's circle, the angle from the start (0) to the end (180), in degrees. */
function polar(angle: number, r: number) {
  const rad = ((180 - angle) * Math.PI) / 180;
  return [32 + r * Math.cos(rad), 34 - r * Math.sin(rad)];
}

function arc(from: number, to: number, r: number) {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function BusyGauge({ level, className = "size-14" }: { level: BranchLoad; className?: string }) {
  const step = LEVEL_STEP[level];
  // Three segments with a small gap between them; the needle points at the middle of the level's.
  const segments = [0, 1, 2].map((i) => [i * 60 + 3, i * 60 + 57]);
  const needle = step === null ? null : polar(step * 60 + 30, 17);
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className={`shrink-0 ${className}`} fill="none" strokeLinecap="round">
      {segments.map(([from, to], i) => (
        <path key={i} d={arc(from, to, 26)} stroke={i === step ? LEVEL_COLOR[level] : C.line} strokeWidth={7} />
      ))}
      {needle && (
        <>
          <path d={`M32 34L${needle[0].toFixed(2)} ${needle[1].toFixed(2)}`} stroke={C.navy} strokeWidth={2.5} />
          <circle cx="32" cy="34" r="3.5" fill={C.navy} />
        </>
      )}
    </svg>
  );
}

/** A branch's level: the dial, and its name beside it. */
export function BusyLevel({ level, t }: { level: BranchLoad; t: BranchesTexts }) {
  return (
    <span className="flex items-center gap-2">
      <BusyGauge level={level} className="h-7 w-11" />
      <span className={`text-sm font-semibold whitespace-nowrap ${level === "unknown" ? "text-slate-500" : "text-navy-900"}`}>
        <span className="sr-only">{t.card.busy}: </span>
        {t.levels.items[level].label}
      </span>
    </span>
  );
}

// ── How couples felt ─────────────────────────────────────────────────────────

export function SentimentBar({ stats, t, locale }: { stats: BranchStats; t: BranchesTexts; locale: Locale }) {
  if (!stats.sentiment) {
    return (
      <div className="rounded-xl bg-sand-50 px-4 py-3 text-sm text-slate-500">
        <p className="font-semibold">{t.sentiment.notEnough}</p>
        {stats.couples > 0 && <p className="mt-0.5">{plural(t.sentiment.couples, stats.couples, locale)}</p>}
      </div>
    );
  }
  const pct = percentages(stats.sentiment);
  const total = sentimentIds.reduce((a, id) => a + stats.sentiment![id], 0);
  return (
    <div>
      {/* Each share written inside its segment; which is which is the shared legend's (SentimentLegend), and the
          order never changes. A segment grows with its share but never narrower than its number, and 2px gaps
          keep the segments apart without relying on color. Its name is there too, hidden from sight, so screen
          readers and search engines read "Satisfied 11%", not a bare number. */}
      <div className="flex h-7 gap-[2px] overflow-hidden rounded-lg">
        {sentimentIds
          .filter((id) => stats.sentiment![id] > 0)
          .map((id) => (
            <span
              key={id}
              title={`${t.sentiment.items[id]}: ${pct[id]}%`}
              style={{ flex: `${stats.sentiment![id]} 1 0`, minWidth: "2.5rem", background: SENTIMENT_COLOR[id] }}
              className={`flex items-center justify-center text-[13px] font-semibold tabular-nums ${SENTIMENT_TEXT[id]}`}
            >
              <span className="sr-only">{t.sentiment.items[id]} </span>
              {pct[id]}%
            </span>
          ))}
      </div>
      <p className="mt-2 text-sm text-slate-500">{plural(t.sentiment.couples, total, locale)}</p>
    </div>
  );
}

/** Which color is which, once for every card's bar. */
export function SentimentLegend({ t }: { t: BranchesTexts }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="font-semibold text-navy-900">{t.sentiment.title}:</span>
      {sentimentIds.map((id) => (
        <span key={id} className="flex items-center gap-1.5 text-slate-700">
          <span className="size-3 rounded-[4px]" style={{ background: SENTIMENT_COLOR[id] }} />
          {t.sentiment.items[id]}
        </span>
      ))}
    </p>
  );
}

// ── How long the stages take ─────────────────────────────────────────────────

/** Days to a position on the shared axis, as a percentage from the start. */
const position = (days: number, max: number) => `${Math.min(100, (days / max) * 100)}%`;

/** The axis's length: whole months, past the longest wait shown. */
export const axisMonths = (stages: WaitSummary[]) => Math.max(1, Math.ceil(Math.max(...stages.map((s) => s.high)) / 30));

/** Room at each end of the track, as a percentage of its width, so a pin at either end isn't cut off. */
const PAD = 2.5;

/**
 * Each stage across all branches, drawn by StageBars (components/stage-bars.tsx):
 * the middle half of couples on a month track, and a pin at the typical wait.
 * Here, the numbers in words and where each sits, mirrored for RTL.
 */
/** A stage across all branches in words, as the chart and the page's structured data say it. */
export function stageWords(s: { id: StageId } & WaitSummary, t: BranchesTexts, locale: Locale) {
  return {
    title: t.stages.items[s.id].title,
    /** "about 2 months". */
    value: about(s.median, t, locale),
    /** "4 weeks to 3 months". */
    range: range(s, t, locale),
    /** "21 waits reported". */
    count: plural(t.stages.reports, s.n, locale),
  };
}

export function StageChart({
  stages,
  t,
  locale,
}: {
  stages: ({ id: StageId } & WaitSummary)[];
  t: BranchesTexts;
  locale: Locale;
}) {
  const rtl = locales[locale].dir === "rtl";
  const months = axisMonths(stages);
  const max = months * 30;
  const x = (days: number) => {
    const at = PAD + Math.min(1, days / max) * (100 - 2 * PAD);
    return rtl ? 100 - at : at;
  };
  // A label every month, or every other month on a long axis, so they don't crowd a phone.
  const every = months > 6 ? 2 : 1;
  const ticks = Array.from({ length: months + 1 }, (_, m) => ({
    at: x(m * 30),
    label: m % every === 0 ? m.toLocaleString(locales[locale].intlLocale) : "",
  }));
  const rows: StageRow[] = stages.map((s) => ({
    id: s.id,
    detail: t.stages.items[s.id].detail,
    ...stageWords(s, t, locale),
    from: x(s.low),
    to: x(s.high),
    median: x(s.median),
  }));
  return (
    <StageBars
      rows={rows}
      ticks={ticks}
      rtl={rtl}
      labels={{ info: t.stages.info, typical: t.stages.typical, usual: t.stages.usual, axis: t.stages.axis }}
    />
  );
}

/** A branch's own waits, each against the same stage across all branches (the navy mark). Not shown for now: too few per branch. */
export function BranchWaits({
  stats,
  stages,
  t,
  locale,
}: {
  stats: BranchStats;
  stages: ({ id: StageId } & WaitSummary)[];
  t: BranchesTexts;
  locale: Locale;
}) {
  const shown = stages.filter((s) => stats.waits[s.id]);
  if (!shown.length) return <p className="text-sm leading-6 text-slate-500">{t.card.noWaits}</p>;
  const max = axisMonths([...stages, ...shown.map((s) => stats.waits[s.id]!)]) * 30;
  return (
    <ul className="space-y-4">
      {shown.map((national) => {
        const w = stats.waits[national.id]!;
        return (
          <li key={national.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-semibold text-navy-900">{t.stages.items[national.id].title}</span>
              <span className="text-slate-500">{plural(t.stages.reports, w.n, locale)}</span>
            </div>
            <div
              className="relative mt-2 h-2.5 rounded-full bg-sand-50 ring-1 ring-line-200"
              role="img"
              aria-label={`${about(w.median, t, locale)}. ${format(t.card.national, { time: about(national.median, t, locale) })}.`}
            >
              <span className="absolute inset-y-0 start-0 rounded-full bg-teal-600" style={{ width: position(w.median, max) }} />
              <span
                title={format(t.card.national, { time: about(national.median, t, locale) })}
                className="absolute -inset-y-1 w-0.5 rounded-full bg-navy-900"
                style={{ insetInlineStart: position(national.median, max) }}
              />
            </div>
            <p className="mt-1.5 text-sm">
              <span className="font-semibold text-navy-900">{about(w.median, t, locale)}</span>
              <span className="text-slate-500"> · {format(t.card.national, { time: about(national.median, t, locale) })}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
