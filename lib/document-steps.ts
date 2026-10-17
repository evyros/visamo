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

type Said = { text: string; details: string };

/**
 * The document's own signing line and full text, where it has them: the
 * landlord's, or by its points, where they change who signs (AS/6 without the
 * foreign partner's declaration, which is a document of its own then).
 */
function signingFor(step: Extract<Step, { kind: "sign" }>, id: DocumentId, points: readonly Point[], t: Labels): Said | undefined {
  const own = t.steps.signingFor as Partial<Record<string, Said>>;
  if (step.by === "landlord") return own.landlordAffidavit;
  if (id === "statusApplicationMarried" && !points.includes("as6ForeignDeclaration")) return own[`${id}IsraeliOnly`];
  return own[id];
}

/** A signature's line and its full text: the document's own, or who confirms it. */
function signingText(step: Extract<Step, { kind: "sign" }>, id: DocumentId, points: readonly Point[], t: Labels): Said {
  return signingFor(step, id, points, t) ?? { text: t.steps.signing[step.before], details: t.steps.signingDetails[step.before] };
}

/**
 * What the case adds to a step's words: what the item has to show
 * (points.ts), and the partners' names, for a step they do themselves.
 */
export type StepCase = { points?: readonly Point[]; foreign?: string; israeli?: string };

/** The step's line, and the full text behind it. */
export function stepText(
  step: Step,
  id: DocumentId,
  t: Labels,
  locale: Locale,
  { points = [], foreign = "", israeli = "" }: StepCase = {},
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
      const { text, details } = signingText(step, id, points, t);
      return { text: format(text, { israeli }), details: prose(details) };
    }
    case "signByEmail":
      return {
        text: format(s.signByEmail.text, { name: foreign }),
        details: prose(format(s.signByEmail.details, { name: foreign, israeli })),
      };
    case "affidavit":
      // In place of a document the country doesn't issue: what the country has, then who signs it.
      return { text: s.affidavit, details: withCountry(countryTexts(t, id, step.from)?.details, s.affidavitDetails) };
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
export function stepsInWords(steps: readonly Step[], id: DocumentId, t: Labels, c: StepCase = {}): string {
  const say = (step: Step) => {
    if (step.kind === "translate") return step.level === "notarized" ? t.steps.translateNotarizedFull : t.steps.translateSelfFull;
    const { text, details } = stepText(step, id, t, "en", c);
    if (step.kind === "authenticate" && step.chain) return `${text}: ${chainWords(step.chain, t)}`;
    // The line names the signer in short, or not at all (an affidavit): its full text says who and how.
    if (step.kind === "affidavit" || step.kind === "sign" || step.kind === "signByEmail") {
      return `${text}: ${[details?.lead, ...(details?.points ?? []), details?.end].filter(Boolean).join(" ")}`;
    }
    return text;
  };
  return steps.map((step, i) => `${i + 1}. ${say(step)}`).join(" ");
}
