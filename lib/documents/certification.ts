import { APOSTILLE, FORMER_USSR } from "./countries";

// How a document from abroad has to be certified before Israel accepts it.
// A rule over the issuing country, not part of each document, so the
// catalog doesn't repeat "with apostille" / "with legalization" per entry.

/**
 * Who issued a document: a region code, "utah" for an online (Utah)
 * marriage, or null when the country isn't known (a divorce decree can come
 * from anywhere).
 */
export type Issuer = string | "utah" | null;

/**
 * The languages Misrad Hapnim accepts without a translation, by law. In
 * practice most clerks also accept English, especially a short document, but
 * a clerk can still ask for a translation of an English one.
 */
export const LANGUAGES_WITHOUT_TRANSLATION = ["he", "ar"] as const;
export const ENGLISH_USUALLY_ACCEPTED = true;

export type Certification = {
  authentication: "none" | "apostille" | "utahApostille" | "legalization" | "dependsOnCountry";
  /** No authentication needed if issued up to this year (former USSR birth certificates). The translation of a document never needs one. */
  exemptIfIssuedUntil?: number;
};

/** Exemptions some documents have, by where they're from. */
export type Exemption = "formerUSSRUntil1998";

export function certificationFor(issuer: Issuer, exemption?: Exemption): Certification {
  const certification = baseCertification(issuer);
  // Procedure 5.2.0008 §ד.2.ה: original former-USSR birth certificates issued up to 1998.
  if (exemption === "formerUSSRUntil1998" && issuer && FORMER_USSR.has(issuer)) {
    return { ...certification, exemptIfIssuedUntil: 1998 };
  }
  return certification;
}

function baseCertification(issuer: Issuer): Certification {
  if (issuer === "IL") return { authentication: "none" };
  // Issued in English by a Utah county; the apostille is from the Utah Lieutenant Governor.
  if (issuer === "utah") return { authentication: "utahApostille" };
  if (issuer === null) return { authentication: "dependsOnCountry" };
  return { authentication: APOSTILLE.has(issuer) ? "apostille" : "legalization" };
}
