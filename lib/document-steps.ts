import type { Locale } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import type { DocumentId } from "./documents/catalog";
import type { Issuer } from "./documents/certification";
import type { Point } from "./documents/points";
import { ARABIC, USUAL_CHAIN, type ChainLink } from "./documents/countries";
import type { Step } from "./documents/steps";

// A document's steps (lib/documents/steps.ts) in words: the documents page
// shows them, and the chat and the check get them in English.

type Labels = Messages["app"]["documentsPage"];

/**
 * A step's full text: a lead sentence, points (numbered when their order
 * matters, like a chain of signatures), and a closing sentence. Any can be
 * left out.
 */
export type StepDetails = { lead?: string; points?: string[]; numbered?: boolean; end?: string };

const prose = (text: string): StepDetails => ({ lead: text });
/** A text written as lines, one point each. */
const pointsOf = (text: string): StepDetails => ({ points: text.split("\n") });

/** What a country's entry in issuers.ts says, in words (app.documentsPage.issuers.<document>.<country>). */
type CountryTexts = { office?: string; details?: string; apostilleBy?: string; apostilleDetails?: string };

function countryTexts(t: Labels, id: DocumentId, from: Issuer | undefined): CountryTexts | undefined {
  if (!from) return undefined;
  return (t.issuers as Partial<Record<string, Partial<Record<string, CountryTexts>>>>)[id]?.[from];
}

/** The general text, after what's particular to the country, if there is any. */
const withCountry = (particular: string | undefined, general: string): StepDetails =>
  particular ? { lead: particular, end: general } : prose(general);

/** The issuing country's name: a region, or Utah for an online marriage. */
function placeName(from: Exclude<Issuer, null>, t: Labels, locale: Locale) {
  return from === "utah" ? t.steps.utah : regionName(from, locale);
}

/**
 * The document's own signing line, where it has one: by its points, where they
 * change who signs now (AS/6 while the foreign partner's declaration waits).
 */
function signingFor(id: DocumentId, points: readonly Point[], t: Labels): string | undefined {
  const own = t.steps.signingFor as Partial<Record<string, string>>;
  return (points.includes("as6ForeignDeclarationLater") && own[`${id}ForeignLater`]) || own[id];
}

/** The step's line, and the full text behind it. `points`: what the item has to show (points.ts). */
export function stepText(
  step: Step,
  id: DocumentId,
  t: Labels,
  locale: Locale,
  points: readonly Point[] = [],
): { text: string; details?: StepDetails } {
  const s = t.steps;
  switch (step.kind) {
    case "obtain": {
      // Named after the office that issues it, where the country's is known.
      const c = countryTexts(t, id, step.from);
      return {
        text: c?.office
          ? format(s.obtainFrom, { office: c.office })
          : format(s.obtain, { country: placeName(step.from, t, locale) }),
        details: withCountry(c?.details, s.obtainDetails),
      };
    }
    case "authenticate": {
      const { authentication, exemptIfIssuedUntil } = step.certification;
      const country = step.from ? placeName(step.from, t, locale) : "";
      const c = countryTexts(t, id, step.from);
      const said = (() => {
        switch (authentication) {
          case "apostille":
            return {
              text: c?.apostilleBy ? format(s.apostilleFrom, { authority: c.apostilleBy }) : format(s.apostille, { country }),
              details: withCountry(c?.apostilleDetails, s.apostilleDetails),
            };
          case "utahApostille":
            return { text: s.utahApostille, details: prose(s.apostilleDetails) };
          case "legalization": {
            // The line names the country; the full text, its offices in order: the country's own
            // where they're known, the usual ones otherwise.
            const offices = [c?.office ?? s.issuingOffice, ...(step.chain ?? USUAL_CHAIN).map((link) => s.chain[link])];
            return {
              text: format(s.legalization, { country }),
              details: {
                lead: step.chain ? s.legalizationLead : s.legalizationUsualLead,
                points: offices.map((office) => office.charAt(0).toLocaleUpperCase(locale) + office.slice(1)),
                numbered: true,
                end: format(s.legalizationEnd, { country }),
              },
            };
          }
          default:
            return { text: s.dependsOnCountry, details: prose(s.dependsOnCountryDetails) };
        }
      })();
      return exemptIfIssuedUntil
        ? { ...said, text: format(s.unlessIssuedUntil, { what: said.text, year: exemptIfIssuedUntil }) }
        : said;
    }
    case "send":
      return { text: s.send, details: prose(s.sendDetails) };
    case "translate":
      // The line only says it might be needed; its full text, when and how.
      return step.level === "notarized"
        ? { text: s.translateNotarized, details: pointsOf(`${translationWhen(step.from, t)}\n${s.translateNotarizedDetails}`) }
        : { text: s.translateSelf, details: pointsOf(s.translateSelfDetails) };
    case "sign": {
      const own = signingFor(id, points, t);
      return step.before === "clerk"
        ? { text: s.signing.clerk }
        : { text: own ?? s.signing[step.before], details: prose(s.signingDetails) };
    }
    case "affidavit":
      // In place of a document the country doesn't issue: what the country has, then who signs it.
      return {
        text: s.affidavit[step.about],
        details: withCountry(countryTexts(t, id, step.from)?.details, s.affidavitDetails[step.about]),
      };
  }
}

/**
 * When an official document needs no translation, by the country that issued
 * it: English usually doesn't, and Arabic doesn't by law. Hebrew only when the
 * country isn't known (it may be Israel).
 */
function translationWhen(from: Issuer | undefined, t: Labels) {
  const s = t.steps;
  if (from === null || from === undefined) return `${s.translateHebrewArabic} ${s.translateEnglish}`;
  if (from !== "utah" && ARABIC.has(from)) return `${s.translateArabic} ${s.translateEnglish}`;
  return s.translateEnglish;
}

/** A legalization's offices, in order: "the foreign ministry, then the Israeli embassy". */
function chainWords(chain: readonly ChainLink[], t: Labels) {
  return chain.map((link) => t.steps.chain[link]).join(t.steps.chainJoin);
}

/** The steps as one line, in English, for the chat's and the check's view of a document: the full sentence where the line is short. */
export function stepsInWords(steps: readonly Step[], id: DocumentId, t: Labels, points: readonly Point[] = []): string {
  const say = (step: Step) => {
    if (step.kind === "translate") return step.level === "notarized" ? t.steps.translateNotarizedFull : t.steps.translateSelfFull;
    const { text } = stepText(step, id, t, "en", points);
    return step.kind === "authenticate" && step.chain ? `${text}: ${chainWords(step.chain, t)}` : text;
  };
  return steps.map((step, i) => `${i + 1}. ${say(step)}`).join(" ");
}
