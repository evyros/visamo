import { locales, type Locale } from "./config";
import { regionName } from "./format";
import type { Messages } from "./messages";
import { branches, nationalities } from "@/lib/case-options";

// The select lists the case's questions use, in the user's language and
// sorted by label: onboarding, and editing the details later.

export function caseOptions(locale: Locale, t: Messages["app"]["onboarding"]) {
  const { compare } = new Intl.Collator(locales[locale].intlLocale);
  const byLabel = (a: { label: string }, b: { label: string }) => compare(a.label, b.label);
  const country = (code: string) => ({ value: code, label: regionName(code, locale) });
  return {
    countries: nationalities.map(country).sort(byLabel),
    // A foreign partner can be born in Israel.
    birthCountries: [...nationalities, "IL"].map(country).sort(byLabel),
    branches: branches.map((code) => ({ value: code, label: t.branches[code] })).sort(byLabel),
  };
}
