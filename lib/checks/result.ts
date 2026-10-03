import { parts as partOrder, type Part } from "@/lib/documents/points";

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

/**
 * One finding, written in both of the app's languages, so each partner reads
 * their own. For a document made of parts (form AS/6), the part it's about.
 */
export type CheckFinding = { en: FindingText; he: FindingText; part?: Part };

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

/**
 * The JSON schema the model answers in (OpenRouter structured outputs). For a
 * document made of parts, each finding names one of `parts`.
 */
export function checkResultSchema(parts: readonly Part[] = []) {
  const part = parts.length > 0;
  return {
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
        required: part ? ["part", "en", "he"] : ["en", "he"],
        properties: {
          ...(part && { part: { type: "string", enum: [...parts] } }),
          en: { $ref: "#/$defs/text" },
          he: { $ref: "#/$defs/text" },
        },
      },
      text: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: { title: { type: "string" }, detail: { type: "string" } },
      },
    },
  };
}

function readText(value: unknown): FindingText | null {
  const { title, detail } = (value ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || typeof detail !== "string") return null;
  return { title: title.trim().slice(0, MAX_TITLE_LENGTH), detail: detail.trim().slice(0, MAX_DETAIL_LENGTH) };
}

function findings(value: unknown, parts: readonly Part[]): CheckFinding[] | null {
  if (!Array.isArray(value)) return null;
  const list: CheckFinding[] = [];
  for (const item of value) {
    const { en, he, part } = (item ?? {}) as Record<string, unknown>;
    const finding = { en: readText(en), he: readText(he) };
    if (!finding.en || !finding.he) return null;
    const empty = (t: FindingText) => !t.title && !t.detail;
    if (empty(finding.en) && empty(finding.he)) continue;
    // A part the document doesn't have leaves the finding unlabelled, not lost.
    const known = parts.includes(part as Part) ? { part: part as Part } : {};
    list.push({ en: finding.en, he: finding.he, ...known });
  }
  // By part, in the form's order; the model's order within each.
  const rank = (f: CheckFinding) => (f.part ? partOrder.indexOf(f.part) : -1);
  return list.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_FINDINGS);
}

/**
 * A finding's text in one language. Checks from before titles were stored
 * hold a plain sentence per language: it's shown as the detail, untitled.
 */
export function findingText(finding: CheckFinding | { en: string; he: string }, locale: "en" | "he"): FindingText {
  const value = finding[locale];
  return typeof value === "string" ? { title: "", detail: value } : value;
}

/** The model's answer, or null when it isn't one (not JSON, or not this shape). `parts`: the document's, if it has them. */
export function parseCheck(text: string, parts: readonly Part[] = []): CheckResult | null {
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
  const parsed = { issues: findings(issues, parts), recommendations: findings(recommendations, parts) };
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
