import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import type { CheckedProgress, Progress, Standing } from "@/lib/documents/progress";
import { standings } from "@/lib/documents/progress";

// The documents' progress bar, on the documents page and the overview. Without
// Full file check it counts uploads, in navy: an upload isn't a pass. With it,
// a segment per standing, green only for ready.

export type ProgressValue = { kind: "uploads"; progress: Progress } | { kind: "checks"; progress: CheckedProgress };

/** Each standing's color, in the bar and on the dot by its count. Not uploaded is the bar's own track. */
const standingColor: Record<Standing, string> = {
  ready: "bg-teal-600",
  fix: "bg-crimson-600",
  unchecked: "bg-navy-900/30",
  notUploaded: "bg-line-200",
};

export type StandingCount = { standing: Standing; text: string };

/** Each count with its text ("3 need fixing"), in the language's plural forms, those at zero left out. */
export function standingCounts(
  progress: CheckedProgress,
  forms: Messages["app"]["documentsPage"]["progressChecked"],
  locale: string,
): StandingCount[] {
  const plural = new Intl.PluralRules(locale);
  return standings
    .filter((standing) => progress[standing] > 0)
    .map((standing) => {
      const n = progress[standing];
      return { standing, text: format(forms[standing][plural.select(n) === "one" ? "one" : "other"], { count: n }) };
    });
}

/** The counts in a line, each by a dot of its segment's color. */
export function StandingCounts({ counts }: { counts: StandingCount[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-navy-900">
      {counts.map(({ standing, text }) => (
        <span key={standing} className="inline-flex items-center gap-2">
          <span aria-hidden className={`size-2.5 rounded-full ${standingColor[standing]}`} />
          {text}
        </span>
      ))}
    </p>
  );
}

export function ProgressBar({ value, label, thin = false }: { value: ProgressValue; label: string; thin?: boolean }) {
  const total = value.progress.total;
  const segments =
    value.kind === "uploads"
      ? [{ key: "uploaded", n: value.progress.done, color: "bg-navy-800" }]
      : standings
          .filter((standing) => standing !== "notUploaded")
          .map((standing) => ({ key: standing, n: value.progress[standing], color: standingColor[standing] }));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value.kind === "uploads" ? value.progress.done : value.progress.ready}
      aria-label={label}
      className={`flex overflow-hidden rounded-full bg-line-200 ${thin ? "h-1.5" : "h-2"}`}
    >
      {segments.map((segment) => (
        <div
          key={segment.key}
          className={`h-full transition-[width] ${segment.color}`}
          style={{ width: `${total ? (segment.n / total) * 100 : 0}%` }}
        />
      ))}
    </div>
  );
}
