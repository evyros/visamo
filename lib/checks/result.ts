// A document check's answer: what the model returns, read and held to its
// rules. Pure: no database, no model calls.
//
//   looksGood    meets every minimum requirement; at most minor recommendations
//   canImprove   meets every minimum requirement; recommendations worth doing
//   needsFixing  at least one minimum requirement isn't met (the issues say which)
//   unreadable   the files couldn't be read; not counted as a check

export const checkRatings = ["looksGood", "canImprove", "needsFixing", "unreadable"] as const;
export type CheckRating = (typeof checkRatings)[number];

/** A finding in one language: a short title that names it, and what to do about it. */
export type FindingText = { title: string; detail: string };

/** One finding, written in both of the app's languages, so each partner reads their own. */
export type CheckFinding = { en: FindingText; he: FindingText };

export type CheckResult = {
  rating: CheckRating;
  /** Minimum requirements that aren't met; for `unreadable`, what couldn't be read. */
  issues: CheckFinding[];
  /** Ways to make the document stronger. */
  recommendations: CheckFinding[];
};

/** Longest title and detail kept, in characters, and most findings of each kind. */
export const MAX_TITLE_LENGTH = 80;
export const MAX_DETAIL_LENGTH = 400;
export const MAX_FINDINGS = 10;

/** The JSON schema the model answers in (OpenRouter structured outputs). */
export const checkResultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["rating", "issues", "recommendations"],
  properties: {
    rating: { type: "string", enum: [...checkRatings] },
    issues: { type: "array", items: { $ref: "#/$defs/finding" } },
    recommendations: { type: "array", items: { $ref: "#/$defs/finding" } },
  },
  $defs: {
    finding: {
      type: "object",
      additionalProperties: false,
      required: ["en", "he"],
      properties: { en: { $ref: "#/$defs/text" }, he: { $ref: "#/$defs/text" } },
    },
    text: {
      type: "object",
      additionalProperties: false,
      required: ["title", "detail"],
      properties: { title: { type: "string" }, detail: { type: "string" } },
    },
  },
} as const;

function readText(value: unknown): FindingText | null {
  const { title, detail } = (value ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || typeof detail !== "string") return null;
  return { title: title.trim().slice(0, MAX_TITLE_LENGTH), detail: detail.trim().slice(0, MAX_DETAIL_LENGTH) };
}

function findings(value: unknown): CheckFinding[] | null {
  if (!Array.isArray(value)) return null;
  const list: CheckFinding[] = [];
  for (const item of value) {
    const { en, he } = (item ?? {}) as Record<string, unknown>;
    const finding = { en: readText(en), he: readText(he) };
    if (!finding.en || !finding.he) return null;
    const empty = (t: FindingText) => !t.title && !t.detail;
    if (!empty(finding.en) || !empty(finding.he)) list.push({ en: finding.en, he: finding.he });
  }
  return list.slice(0, MAX_FINDINGS);
}

/**
 * A finding's text in one language. Checks from before titles were stored
 * hold a plain sentence per language: it's shown as the detail, untitled.
 */
export function findingText(finding: CheckFinding | { en: string; he: string }, locale: "en" | "he"): FindingText {
  const value = finding[locale];
  return typeof value === "string" ? { title: "", detail: value } : value;
}

/** The model's answer, or null when it isn't one (not JSON, or not this shape). */
export function parseCheck(text: string): CheckResult | null {
  // Models sometimes wrap JSON in a code fence even when asked not to.
  const json = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return null;
  }
  const { rating, issues, recommendations } = (value ?? {}) as Record<string, unknown>;
  if (!checkRatings.includes(rating as CheckRating)) return null;
  const parsed = { issues: findings(issues), recommendations: findings(recommendations) };
  if (!parsed.issues || !parsed.recommendations) return null;
  return { rating: rating as CheckRating, issues: parsed.issues, recommendations: parsed.recommendations };
}

/** Whether the rating agrees with the findings. */
export function isConsistent({ rating, issues, recommendations }: CheckResult) {
  switch (rating) {
    case "needsFixing":
      return issues.length > 0;
    case "canImprove":
      return issues.length === 0 && recommendations.length > 0;
    case "looksGood":
      return issues.length === 0;
    case "unreadable":
      return true;
  }
}

/** The rating the findings call for, for an answer that stayed inconsistent when asked again. */
export function settle(result: CheckResult): CheckResult {
  if (isConsistent(result)) return result;
  if (result.issues.length > 0) return { ...result, rating: "needsFixing" };
  // A "needs fixing" with nothing to fix, or "can be improved" with nothing to improve.
  return { ...result, rating: result.recommendations.length > 0 ? "canImprove" : "looksGood" };
}
