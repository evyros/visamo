import { describe, expect, it } from "vitest";
import {
  MAX_DETAIL_LENGTH,
  MAX_FINDINGS,
  MAX_TITLE_LENGTH,
  findingText,
  isConsistent,
  parseCheck,
  settle,
  type CheckResult,
} from "./result";

const finding = (title: string, detail = `${title}, in detail`) => ({
  en: { title, detail },
  he: { title, detail },
});
const result = (rating: CheckResult["rating"], issues = 0, recommendations = 0): CheckResult => ({
  rating,
  issues: Array.from({ length: issues }, (_, i) => finding(`issue ${i}`)),
  recommendations: Array.from({ length: recommendations }, (_, i) => finding(`tip ${i}`)),
});

describe("parseCheck", () => {
  it("reads a valid answer", () => {
    const answer = { rating: "needsFixing", issues: [finding("Expired")], recommendations: [] };
    expect(parseCheck(JSON.stringify(answer))).toEqual(answer);
  });

  it("reads an answer in a code fence", () => {
    expect(parseCheck('```json\n{"rating":"looksGood","issues":[],"recommendations":[]}\n```')).toEqual(
      result("looksGood"),
    );
  });

  it("rejects what isn't an answer", () => {
    expect(parseCheck("Looks fine to me")).toBeNull();
    expect(parseCheck('{"rating":"fine","issues":[],"recommendations":[]}')).toBeNull();
    expect(parseCheck('{"rating":"looksGood","issues":"none","recommendations":[]}')).toBeNull();
    expect(parseCheck('{"rating":"looksGood","issues":[{"en":"x","he":"x"}],"recommendations":[]}')).toBeNull();
    expect(
      parseCheck('{"rating":"looksGood","issues":[{"en":{"title":"x"},"he":{"title":"x"}}],"recommendations":[]}'),
    ).toBeNull();
  });

  it("caps findings, and drops empty ones", () => {
    const long = "x".repeat(MAX_DETAIL_LENGTH + 50);
    const answer = {
      rating: "canImprove",
      issues: [],
      recommendations: [finding(" ", " "), ...Array.from({ length: MAX_FINDINGS + 3 }, () => finding(long, long))],
    };
    const parsed = parseCheck(JSON.stringify(answer))!;
    expect(parsed.recommendations).toHaveLength(MAX_FINDINGS);
    expect(parsed.recommendations[0].en.title).toHaveLength(MAX_TITLE_LENGTH);
    expect(parsed.recommendations[0].en.detail).toHaveLength(MAX_DETAIL_LENGTH);
  });
});

describe("findingText", () => {
  it("reads a finding in one language", () => {
    expect(findingText(finding("Missing signature", "Sign it"), "he")).toEqual({
      title: "Missing signature",
      detail: "Sign it",
    });
  });

  it("shows an untitled finding from before titles as its detail", () => {
    expect(findingText({ en: "Not signed.", he: "לא חתום." }, "he")).toEqual({ title: "", detail: "לא חתום." });
  });
});

describe("the rating guard", () => {
  it("accepts ratings that agree with the findings", () => {
    expect(isConsistent(result("needsFixing", 1, 2))).toBe(true);
    expect(isConsistent(result("canImprove", 0, 1))).toBe(true);
    expect(isConsistent(result("looksGood"))).toBe(true);
    expect(isConsistent(result("looksGood", 0, 1))).toBe(true);
    expect(isConsistent(result("unreadable", 1))).toBe(true);
  });

  it("rejects ratings that don't", () => {
    expect(isConsistent(result("needsFixing", 0, 1))).toBe(false);
    expect(isConsistent(result("canImprove"))).toBe(false);
    expect(isConsistent(result("canImprove", 1, 1))).toBe(false);
    expect(isConsistent(result("looksGood", 1))).toBe(false);
  });

  it("settles on the rating the findings call for", () => {
    expect(settle(result("looksGood", 1)).rating).toBe("needsFixing");
    expect(settle(result("canImprove", 2, 1)).rating).toBe("needsFixing");
    expect(settle(result("needsFixing", 0, 1)).rating).toBe("canImprove");
    expect(settle(result("needsFixing")).rating).toBe("looksGood");
    expect(settle(result("canImprove")).rating).toBe("looksGood");
    expect(settle(result("canImprove", 0, 1)).rating).toBe("canImprove");
  });
});
