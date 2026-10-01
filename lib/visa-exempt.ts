// Countries whose citizens visit Israel without a visa (with an ETA-IL), by
// region code. The chat and the document checker read it, so they can tell
// a foreign partner abroad how they'll enter after the entry permit: on the
// ETA-IL, or with a B/2 visa from the Israeli consulate. It doesn't change
// the document list.

export const VISA_EXEMPT: ReadonlySet<string> = new Set([
  "AD", "AE", "AL", "AR", "AT", "AU", "BB", "BE", "BG", "BR", "BS", "BW", "BY", "BZ", "CA", "CH", "CL", "CR",
  "CY", "CZ", "DE", "DK", "DM", "DO", "EC", "EE", "ES", "FI", "FJ", "FM", "FR", "GB", "GD", "GE", "GG", "GR",
  "GT", "HK", "HN", "HR", "HT", "HU", "IE", "IM", "IS", "IT", "JE", "JM", "JP", "KN", "KR", "LI", "LS", "LT",
  "LU", "LV", "MC", "MD", "ME", "MH", "MK", "MN", "MO", "MT", "MU", "MW", "MX", "NL", "NO", "NR", "NU", "NZ",
  "PA", "PE", "PG", "PH", "PL", "PT", "PW", "PY", "RO", "RS", "RU", "SB", "SE", "SG", "SI", "SK", "SM", "SR",
  "SV", "SZ", "TO", "TT", "TV", "TW", "UA", "US", "UY", "VC", "VU", "WS", "XK", "ZA",
]);

/** Exempt only with a biometric passport. */
export const VISA_EXEMPT_BIOMETRIC_ONLY: ReadonlySet<string> = new Set(["MD"]);
