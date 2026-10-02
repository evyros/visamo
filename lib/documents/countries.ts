// Country lists the facts and certification rules read. Both change rarely,
// but they do change (countries join the Apostille Convention), and a change
// here changes couples' lists: it needs a catalog version like any other.

/** The 15 former Soviet republics, by today's region codes. */
export const FORMER_USSR: ReadonlySet<string> = new Set([
  "AM", "AZ", "BY", "EE", "GE", "KG", "KZ", "LT", "LV", "MD", "RU", "TJ", "TM", "UA", "UZ",
]);

/**
 * Where a foreign partner needs a security check, and so the security CV
 * (procedure 5.2.0008 §ד.2.ט): Palestinian residents and citizens of the Arab
 * League states. The procedure calls them "risk countries" without listing
 * them; this list is from practice. Not the former USSR: those partners go
 * through Nativ instead.
 */
export const SECURITY_CHECK: ReadonlySet<string> = new Set([
  "AE", "BH", "DJ", "DZ", "EG", "IQ", "JO", "KM", "KW", "LB", "LY", "MA", "MR", "OM", "PS", "QA", "SA", "SD",
  "SO", "SY", "TN", "YE",
]);

/**
 * Where documents are certified with an apostille (Hague Apostille
 * Convention, in force with Israel), including dependent territories the
 * convention extends to. Everywhere else needs consular legalization.
 * Source: the HCCH status table for the convention (hcch.net). Last checked
 * against it: see CHANGELOG.md.
 */
export const APOSTILLE: ReadonlySet<string> = new Set([
  "AD", "AG", "AL", "AM", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BG", "BH", "BI", "BN", "BO", "BR",
  "BS", "BW", "BY", "BZ", "CA", "CH", "CK", "CL", "CN", "CO", "CR", "CV", "CY", "CZ", "DE", "DK", "DM", "DO",
  "EC", "EE", "ES", "FI", "FJ", "FR", "GB", "GD", "GE", "GR", "GT", "GY", "HN", "HR", "HU", "ID", "IE", "IN",
  "IS", "IT", "JM", "JP", "KG", "KN", "KR", "KZ", "LC", "LI", "LR", "LS", "LT", "LU", "LV", "MA", "MC", "MD",
  "ME", "MH", "MK", "MN", "MT", "MU", "MW", "MX", "NA", "NI", "NL", "NO", "NU", "NZ", "OM", "PA", "PE", "PH",
  "PK", "PL", "PT", "PW", "PY", "RO", "RS", "RU", "RW", "SA", "SC", "SE", "SG", "SI", "SK", "SM", "SN", "SR",
  "ST", "SV", "SZ", "TJ", "TN", "TO", "TR", "TT", "UA", "US", "UY", "UZ", "VC", "VE", "VU", "WS", "ZA",
  // Territories: China's special regions, and the ones France, the Netherlands, the UK, the US and Finland extended it to.
  "HK", "MO",
  "BL", "GF", "GP", "MF", "MQ", "NC", "PF", "PM", "RE", "WF", "YT",
  "AW", "BQ", "CW", "SX",
  "AI", "BM", "FK", "GG", "GI", "IM", "JE", "KY", "MS", "SH", "TC", "VG",
  "AS", "GU", "MP", "PR", "VI",
  "AX",
]);
