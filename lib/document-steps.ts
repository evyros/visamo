import type { Locale } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import type { DocumentId } from "./documents/catalog";
import type { Issuer } from "./documents/certification";
import type { Point } from "./documents/points";
import { ARABIC, USUAL_CHAIN } from "./documents/countries";
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

/** A signature in words: the line under its title, its full text, and the whole requirement as one sentence. */
type Said = { text: string; details: string; sentence: string };

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
  return (
    signingFor(step, id, points, t) ?? {
      text: t.steps.signing[step.before],
      details: t.steps.signingDetails[step.before],
      sentence: t.steps.signingSentence[step.before],
    }
  );
}

/**
 * What the case adds to a step's words: what the item has to show
 * (points.ts), and the partners' names, for a step they do themselves.
 */
export type StepCase = { points?: readonly Point[]; foreign?: string; israeli?: string };

/** What a step is, as the short title over its line: "Where to get it", "Apostille". */
export type StepLabel = keyof Labels["steps"]["labels"];

function labelOf(step: Step): StepLabel {
  switch (step.kind) {
    case "authenticate":
      switch (step.certification.authentication) {
        case "apostille":
        case "utahApostille":
          return "apostille";
        case "legalization":
          return "legalization";
        default:
          return "certification";
      }
    case "signByEmail":
      return "sign";
    default:
      return step.kind;
  }
}

/** The step's title, its line under it, and the full text behind the line. */
export function stepText(
  step: Step,
  id: DocumentId,
  t: Labels,
  locale: Locale,
  c: StepCase = {},
): { label: string; text: string; details?: StepDetails } {
  return { label: t.steps.labels[labelOf(step)], ...stepLine(step, id, t, locale, c) };
}

/** The line goes on from the title, so it says only what the title doesn't: "From Germany" under "Apostille". */
function stepLine(
  step: Step,
  id: DocumentId,
  t: Labels,
  locale: Locale,
  { points = [], foreign = "", israeli = "" }: StepCase,
): { text: string; details?: StepDetails } {
  const s = t.steps;
  switch (step.kind) {
    case "obtain": {
      // Named after the office that issues it, where the country's is known.
      const c = countryTexts(t, id, step.from);
      return {
        text: c?.office
          ? capitalize(format(s.obtainFrom, { office: c.office }), locale)
          : format(s.obtain, { country: placeName(step.from, t, locale) }),
        // A file has no paper original: the general advice about one doesn't apply.
        details: step.electronic && c?.details ? prose(c.details) : withCountry(c?.details, s.obtainDetails),
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
            // The line names the country, and the third country it goes through, or the one whose
            // Israeli embassy serves it, if there's one; the full text, its offices in order: the
            // country's own where they're known, the usual ones otherwise.
            const via = step.via ? regionName(step.via, locale) : "";
            const mission = step.mission ? regionName(step.mission, locale) : "";
            const offices = [c?.office ?? s.issuingOffice, ...chainOffices(step, t, locale)];
            return {
              text: via
                ? format(s.legalizationVia, { country, via })
                : mission
                  ? format(s.legalizationMission, { country, mission })
                  : format(s.legalization, { country }),
              details: {
                lead: step.chain ? s.legalizationLead : s.legalizationUsualLead,
                points: offices.map((office) => capitalize(office, locale)),
                numbered: true,
                end: via
                  ? format(s.legalizationViaEnd, { country, via })
                  : mission
                    ? format(s.legalizationMissionEnd, { country, mission })
                    : format(s.legalizationEnd, { country }),
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
      // The line only says it might be needed, and where; its full text, not abroad, when and how.
      return step.level === "notarized"
        ? { text: s.translateNotarized, details: pointsOf(`${s.translateNotarizedAbroad}\n${translationWhen(step.from, t)}\n${s.translateNotarizedDetails}`) }
        : { text: s.translateSelf, details: pointsOf(s.translateSelfDetails) };
    case "sign": {
      const { text, details } = signingText(step, id, points, t);
      return { text: format(text, { israeli, foreign }), details: prose(format(details, { israeli, foreign })) };
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

/** An office's name as the start of a line: "the registry office" → "The registry office". */
const capitalize = (text: string, locale: Locale) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

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

/**
 * A legalization's offices after the issuing one, in order ("the foreign ministry", "the Israeli
 * embassy"), naming the country and the third country (`via`) where an office is theirs, and where
 * the Israeli embassy is when it's in another country (`mission`).
 */
function chainOffices(step: Extract<Step, { kind: "authenticate" }>, t: Labels, locale: Locale) {
  const country = step.from ? placeName(step.from, t, locale) : "";
  const via = step.via ? regionName(step.via, locale) : "";
  const mission = step.mission ? regionName(step.mission, locale) : "";
  return (step.chain ?? USUAL_CHAIN).map((link) =>
    link === "israeliConsulate" && mission
      ? format(t.steps.israeliConsulateIn, { mission })
      : format(t.steps.chain[link], { country, via }),
  );
}

/**
 * The steps as one line, in English, for the chat's and the check's view of a
 * document: each as its title and line ("Apostille: From Germany"), with the
 * full sentence where the line is short.
 */
export function stepsInWords(steps: readonly Step[], id: DocumentId, t: Labels, c: StepCase = {}): string {
  const say = (step: Step) => {
    const { label, text, details } = stepText(step, id, t, "en", c);
    if (step.kind === "translate") return `${label}: ${step.level === "notarized" ? t.steps.translateNotarizedFull : t.steps.translateSelfFull}`;
    if (step.kind === "authenticate" && step.chain) return `${label}: ${text}, in this order: ${chainOffices(step, t, "en").join(t.steps.chainJoin)}`;
    const full = [details?.lead, ...(details?.points ?? []), details?.end].filter(Boolean).join(" ");
    // A signature as the whole requirement in one sentence, then how: split into a title and a line
    // ("Must be signed: In front of an Israeli lawyer."), the check took a lawyer's stamp for a flaw.
    if (step.kind === "sign") {
      const { sentence } = signingText(step, id, c.points ?? [], t);
      return `${format(sentence, { israeli: c.israeli ?? "", foreign: c.foreign ?? "" })}: ${full}`;
    }
    if (step.kind === "signByEmail") return `${format(t.steps.signByEmail.sentence, { name: c.foreign ?? "" })}: ${full}`;
    // An affidavit's line doesn't say who confirms it: its full text does.
    if (step.kind === "affidavit") return `${label}: ${text}. ${full}`;
    return `${label}: ${text}`;
  };
  return steps.map((step, i) => `${i + 1}. ${say(step)}`).join(" ");
}
