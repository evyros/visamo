// The onboarding answers: the allowed values, and the check that the server
// runs on them. Labels live in the messages (app.onboarding), keyed by these
// values, so a missing translation fails the build.

export const genders = ["male", "female"] as const;
export type Gender = (typeof genders)[number];

export const maritalStatuses = ["single", "commonLaw", "married", "divorced", "widowed"] as const;
export type MaritalStatus = (typeof maritalStatuses)[number];

/** Where the couple is with Misrad Hapnim. */
export const stages = ["notFiled", "filedAwaiting", "firstResponse", "interviewScheduled"] as const;
export type Stage = (typeof stages)[number];

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

export type OnboardingInput = {
  name: string;
  gender: Gender;
  isIsraeli: boolean;
  /** Required when not Israeli, null otherwise. */
  nationality: string | null;
  maritalStatus: MaritalStatus;
  /** Asked only when not Israeli, null otherwise. */
  hasChildren: boolean | null;
  /** Null when the user skipped the branch step. */
  branch: BranchCode | null;
  stage: Stage;
};

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

/** The answers as sent from the browser, checked and normalized; null if anything is off. */
export function parseOnboarding(input: unknown): OnboardingInput | null {
  if (typeof input !== "object" || input === null) return null;
  const v = input as Record<string, unknown>;
  const name = typeof v.name === "string" ? v.name.trim() : "";
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  if (!oneOf(genders, v.gender) || !oneOf(maritalStatuses, v.maritalStatus) || !oneOf(stages, v.stage)) return null;
  if (typeof v.isIsraeli !== "boolean") return null;
  if (!v.isIsraeli && (!oneOf(nationalities, v.nationality) || typeof v.hasChildren !== "boolean")) return null;
  if (v.branch !== null && !oneOf(branches, v.branch)) return null;
  return {
    name,
    gender: v.gender,
    isIsraeli: v.isIsraeli,
    nationality: v.isIsraeli ? null : (v.nationality as string),
    maritalStatus: v.maritalStatus,
    hasChildren: v.isIsraeli ? null : (v.hasChildren as boolean),
    branch: v.branch,
    stage: v.stage,
  };
}
