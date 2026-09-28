// The onboarding answers: the allowed values, and the check that the server
// runs on them. Labels live in the messages (app.onboarding), keyed by these
// values, so a missing translation fails the build.

export const genders = ["male", "female"] as const;
export type Gender = (typeof genders)[number];

/** How the Israeli side is Israeli. A permanent resident's partner ends with residency, not citizenship. */
export const israeliStatuses = ["citizen", "permanentResident"] as const;
export type IsraeliStatus = (typeof israeliStatuses)[number];

/** Marriages before this relationship, and how they ended. Each ending adds its document. */
export const previousMarriages = ["none", "divorced", "widowed", "divorcedAndWidowed"] as const;
export type PreviousMarriages = (typeof previousMarriages)[number];

/** Where the foreign partner is now. */
export const locations = ["israelValid", "israelInvalid", "abroad"] as const;
export type Location = (typeof locations)[number];

/**
 * The other parent of the foreign partner's children who are moving to
 * Israel. More than one can apply when the children have different parents.
 */
export const otherParents = ["consents", "courtOrder", "deceased", "notListed"] as const;
export type OtherParent = (typeof otherParents)[number];

export const relationships = ["married", "commonLaw"] as const;
export type Relationship = (typeof relationships)[number];

/** Where a married couple married. Online is a civil marriage abroad (e.g. Utah) with its own paperwork. */
export const marriagePlaces = ["israel", "abroad", "online"] as const;
export type MarriagePlace = (typeof marriagePlaces)[number];

/** The earliest year a common-law couple can say they moved in together. */
export const TOGETHER_SINCE_MIN = 1950;

/** Where the couple is with Misrad Hapnim, in order. The overview's tracker moves through them. */
export const stages = [
  "notFiled",
  "filedAwaiting",
  "firstResponse",
  "interviewScheduled",
  "interviewDone",
  "approved",
] as const;
export type Stage = (typeof stages)[number];

/** The stages onboarding offers. The later ones are reached from the overview. */
export const onboardingStages = ["notFiled", "filedAwaiting", "firstResponse", "interviewScheduled"] as const;

/** The date asked for when moving to a stage, and the case column it's kept in. */
export const stageDates = { filedAwaiting: "filedOn", interviewScheduled: "interviewOn" } as const;
export type StageDate = (typeof stageDates)[keyof typeof stageDates];

/** How far ahead an interview date can be. */
const INTERVIEW_MAX_DAYS = 2 * 365;

/** A `yyyy-mm-dd` date that fits the stage, or null: filing can't be in the future, an interview can. */
export function parseStageDate(stage: Stage, value: unknown, today = new Date()): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  // Tomorrow in UTC is already today in Israel for part of the day.
  const tomorrow = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
  if (date.getUTCFullYear() < 2000) return null;
  if (stage === "filedAwaiting" && date.getTime() > tomorrow) return null;
  if (stage === "interviewScheduled" && date.getTime() > tomorrow + INTERVIEW_MAX_DAYS * 86_400_000) return null;
  return value;
}

/**
 * Offered in onboarding after the stages, but not supported yet: choosing it
 * stops the wizard with a notice. It isn't a Stage, so the server rejects it.
 */
export const RENEWAL = "renewal";

/** Misrad Hapnim (Population and Immigration Authority) branches. */
export const branches = [
  "telAvivCenter",
  "jerusalemCenter",
  "jerusalemEast",
  "jerusalemSouth",
  "eilat",
  "ashdod",
  "ashkelon",
  "beersheba",
  "bneiBrak",
  "ramatGanGivatayim",
  "herzliya",
  "holon",
  "hadera",
  "haifa",
  "afula",
  "tiberias",
  "kfarSaba",
  "nofHagalilNazareth",
  "netanya",
  "acre",
  "petahTikva",
  "safed",
  "krayot",
  "roshHaayin",
  "rishonLezion",
  "ramla",
  "rehovot",
] as const;
export type BranchCode = (typeof branches)[number];

/** ISO 3166 codes for the nationality list: every country except Israel. */
export const nationalities = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR",
  "BS", "BT", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM",
  "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB",
  "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GT", "GU", "GW",
  "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IM", "IN", "IQ", "IR", "IS", "IT", "JE",
  "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA",
  "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF",
  "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SK",
  "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TG", "TH",
  "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY",
  "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM",
  "ZW",
] as const;

export const NAME_MIN = 2;
export const NAME_MAX = 100;

/** One person in the couple: the user, or their partner. */
export type PersonInput = {
  name: string;
  gender: Gender;
  /** The Israeli side of the couple, a citizen or a permanent resident. */
  isIsraeli: boolean;
  /** Null for the foreign partner. */
  israeliStatus: IsraeliStatus | null;
  previousMarriages: PreviousMarriages;
  // The foreign partner only; null for the Israeli.
  nationality: string | null;
  birthCountry: string | null;
  /** Other countries lived in as an adult, besides the nationality. Empty for none. */
  countriesLived: string[] | null;
  location: Location | null;
  nameChanged: boolean | null;
  /** Children from a previous relationship. */
  hasChildren: boolean | null;
  /** Any of those children under 18 and moving to Israel; null without children. */
  childrenMoving: boolean | null;
  /** Null unless children are moving; otherwise at least one. */
  otherParents: OtherParent[] | null;
  // The Israeli only; null for the foreign partner.
  livedAbroad: boolean | null;
};

export type RelationshipInput = {
  relationship: Relationship;
  /** Null for a common-law couple. */
  marriagePlace: MarriagePlace | null;
  /** Where an abroad marriage took place; null otherwise. */
  marriageCountry: string | null;
  /** Null for a married couple. */
  livingTogether: boolean | null;
  /** The year they moved in together; null unless living together. */
  togetherSince: number | null;
  childrenTogether: boolean;
};

export type OnboardingInput = {
  self: PersonInput;
  partner: PersonInput;
  relationship: RelationshipInput;
  /** Null when the user doesn't know their branch yet. */
  branch: BranchCode | null;
  stage: Stage;
};

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Distinct values, each passing `valid`, and at least `min` of them. */
function listOf<T>(value: unknown, valid: (item: unknown) => item is T, min: number): value is T[] {
  return (
    Array.isArray(value) && value.length >= min && value.every(valid) && new Set(value).size === value.length
  );
}

const isNationality = (v: unknown): v is string => oneOf(nationalities, v);
const isBirthCountry = (v: unknown): v is string => v === "IL" || isNationality(v);
const isOtherParent = (v: unknown): v is OtherParent => oneOf(otherParents, v);
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";

function parsePerson(v: unknown): PersonInput | null {
  if (!isObject(v)) return null;
  const name = typeof v.name === "string" ? v.name.trim() : "";
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  if (!oneOf(genders, v.gender) || !oneOf(previousMarriages, v.previousMarriages)) return null;
  if (!isBoolean(v.isIsraeli)) return null;
  const foreign = !v.isIsraeli;

  // Each role's questions answered, and the other role's left empty.
  if (foreign) {
    if (!isNationality(v.nationality) || !isBirthCountry(v.birthCountry)) return null;
    if (!listOf(v.countriesLived, isNationality, 0) || v.countriesLived.includes(v.nationality)) return null;
    if (!oneOf(locations, v.location) || !isBoolean(v.nameChanged) || !isBoolean(v.hasChildren)) return null;
    if (v.hasChildren ? !isBoolean(v.childrenMoving) : v.childrenMoving !== null) return null;
    if (v.childrenMoving ? !listOf(v.otherParents, isOtherParent, 1) : v.otherParents !== null) return null;
    if (v.livedAbroad !== null) return null;
    if (v.israeliStatus !== null) return null;
  } else {
    if (!oneOf(israeliStatuses, v.israeliStatus)) return null;
    const foreignOnly = [v.nationality, v.birthCountry, v.countriesLived, v.location, v.nameChanged, v.hasChildren];
    if (foreignOnly.some((x) => x !== null) || v.childrenMoving !== null || v.otherParents !== null) return null;
    if (!isBoolean(v.livedAbroad)) return null;
  }

  return {
    name,
    gender: v.gender,
    isIsraeli: v.isIsraeli,
    israeliStatus: foreign ? null : (v.israeliStatus as IsraeliStatus),
    previousMarriages: v.previousMarriages,
    nationality: foreign ? (v.nationality as string) : null,
    birthCountry: foreign ? (v.birthCountry as string) : null,
    countriesLived: foreign ? (v.countriesLived as string[]) : null,
    location: foreign ? (v.location as Location) : null,
    nameChanged: foreign ? (v.nameChanged as boolean) : null,
    hasChildren: foreign ? (v.hasChildren as boolean) : null,
    childrenMoving: foreign ? (v.childrenMoving as boolean | null) : null,
    otherParents: foreign ? (v.otherParents as OtherParent[] | null) : null,
    livedAbroad: foreign ? null : (v.livedAbroad as boolean),
  };
}

function parseRelationship(v: unknown): RelationshipInput | null {
  if (!isObject(v) || !oneOf(relationships, v.relationship) || !isBoolean(v.childrenTogether)) return null;
  const married = v.relationship === "married";
  if (married ? !oneOf(marriagePlaces, v.marriagePlace) : v.marriagePlace !== null) return null;
  if (v.marriagePlace === "abroad" ? !isNationality(v.marriageCountry) : v.marriageCountry !== null) return null;
  if (married ? v.livingTogether !== null : !isBoolean(v.livingTogether)) return null;
  const year = v.togetherSince;
  const validYear =
    Number.isInteger(year) && (year as number) >= TOGETHER_SINCE_MIN && (year as number) <= new Date().getFullYear();
  if (v.livingTogether ? !validYear : year !== null) return null;
  return {
    relationship: v.relationship,
    marriagePlace: v.marriagePlace as MarriagePlace | null,
    marriageCountry: v.marriageCountry as string | null,
    livingTogether: v.livingTogether as boolean | null,
    togetherSince: year as number | null,
    childrenTogether: v.childrenTogether,
  };
}

/** The answers as sent from the browser, checked and normalized; null if anything is off. */
export function parseOnboarding(input: unknown): OnboardingInput | null {
  if (!isObject(input)) return null;
  const self = parsePerson(input.self);
  const partner = parsePerson(input.partner);
  const relationship = parseRelationship(input.relationship);
  if (!self || !partner || !relationship || !oneOf(onboardingStages, input.stage)) return null;
  // The process is for an Israeli side and a foreign partner: exactly one of each.
  if (self.isIsraeli === partner.isIsraeli) return null;
  if (input.branch !== null && !oneOf(branches, input.branch)) return null;
  return { self, partner, relationship, branch: input.branch, stage: input.stage };
}

// ── Editing the details ────────────────────────────────────────────────────
// After onboarding, a case's answers can be changed from the overview, a few
// times (cases.detailEditsAllowed). Who the people are can't: a different
// name, nationality or status is a different case, and goes through support.

/** The answers about a person that can change after onboarding. The rest stay as they were. */
export const editablePersonFields = {
  israeli: ["previousMarriages", "livedAbroad"],
  foreign: [
    "previousMarriages",
    "countriesLived",
    "location",
    "nameChanged",
    "hasChildren",
    "childrenMoving",
    "otherParents",
  ],
} as const satisfies Record<"israeli" | "foreign", readonly (keyof PersonInput)[]>;

/** A case's answers by role, as the edit form sends and saves them. */
export type CaseDetails = { relationship: RelationshipInput; israeli: PersonInput; foreign: PersonInput };

/** The fields a details edit changed, as `relationship.marriagePlace` or `foreign.location`. */
export function changedFields(before: CaseDetails, after: CaseDetails): string[] {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const changed: string[] = [];
  for (const key of Object.keys(before.relationship) as (keyof RelationshipInput)[]) {
    if (!same(before.relationship[key], after.relationship[key])) changed.push(`relationship.${key}`);
  }
  for (const role of ["israeli", "foreign"] as const) {
    for (const key of Object.keys(before[role]) as (keyof PersonInput)[]) {
      if (!same(before[role][key], after[role][key])) changed.push(`${role}.${key}`);
    }
  }
  return changed;
}

/**
 * The edit form's answers laid over the case's: only the editable fields are
 * taken from `input`, and the result is checked like onboarding's answers.
 * Null if anything is off.
 */
export function parseDetails(input: unknown, current: CaseDetails): CaseDetails | null {
  if (!isObject(input) || !isObject(input.israeli) || !isObject(input.foreign)) return null;
  const merge = (role: "israeli" | "foreign", from: Record<string, unknown>) => {
    const person: Record<string, unknown> = { ...current[role] };
    for (const key of editablePersonFields[role]) person[key] = from[key];
    return parsePerson(person);
  };
  const israeli = merge("israeli", input.israeli);
  const foreign = merge("foreign", input.foreign);
  const relationship = parseRelationship(input.relationship);
  if (!israeli?.isIsraeli || !foreign || foreign.isIsraeli || !relationship) return null;
  return { relationship, israeli, foreign };
}
