import { describe, expect, it } from "vitest";
import { checkLines } from "@/lib/checks/lines";
import type { CheckResult } from "@/lib/checks/result";
import { resolveLine } from "./cases";
import { gradeRun, passes, toReview } from "./grade";

const lines = checkLines({ required: ["It is a photo.", "It is in color."], recommended: ["It is recent."] });
const [photo, color, recent] = lines;
const finding = (line?: string) => ({ en: { title: "t", detail: "d" }, he: { title: "t", detail: "d" }, ...(line && { line }) });
const result = (rating: CheckResult["rating"], issues: (string | undefined)[], recommendations: (string | undefined)[] = []): CheckResult => ({
  rating,
  issues: issues.map(finding),
  recommendations: recommendations.map(finding),
});
const expectation = (over: Partial<Parameters<typeof gradeRun>[1]> = {}) => ({
  ratings: null,
  flagged: [],
  mayFlag: [],
  allowedExtra: [],
  ...over,
});

describe("resolveLine", () => {
  it("finds a line by a unique piece of its text", () => {
    expect(resolveLine("IN COLOR", lines)).toBe(color);
    expect(resolveLine("It is", lines)).toMatch(/matches 3 checks/);
    expect(resolveLine("signed", lines)).toMatch(/matches 0 checks/);
  });
});

describe("gradeRun", () => {
  it("passes a run that reports what's expected, as the right kind", () => {
    const grade = gradeRun(result("needsFixing", ["R2"]), expectation({ flagged: [color] }), lines);
    expect(grade).toMatchObject({ ratingOk: true, missed: [], wrongKind: [], unexpected: [] });
    expect(passes(grade)).toBe(true);
  });

  it("fails a missed line, a line in the wrong list, and a wrong rating", () => {
    expect(gradeRun(result("looksGood", []), expectation({ flagged: [color] }), lines)).toMatchObject({
      ratingOk: false,
      missed: [color],
    });
    const wrongKind = gradeRun(result("canImprove", [], ["R2"]), expectation({ mayFlag: [color] }), lines);
    expect(wrongKind.wrongKind).toHaveLength(1);
    expect(passes(wrongKind)).toBe(false);
  });

  it("sends findings nobody expected to the judge, and passes once it approves them", () => {
    const grade = gradeRun(result("canImprove", [], ["S1", undefined]), expectation(), lines);
    expect(grade.unexpected.map((u) => u.line)).toEqual([recent, null]);
    expect(passes(grade)).toBe(false);
    grade.unexpected[0].verdict = { verdict: "allowed", allowed: "x", reason: "r" };
    grade.unexpected[1].verdict = { verdict: "valid", reason: "r" };
    expect(passes(grade)).toBe(true);
    expect(toReview(grade)).toHaveLength(1);
  });

  it("points its lists to its own findings, so a report can tell each one's status", () => {
    const grade = gradeRun(result("canImprove", [], ["S1"]), expectation(), lines);
    expect(grade.findings).toContain(grade.unexpected[0].finding);
  });

  it("accepts a line that may or may not be reported", () => {
    expect(passes(gradeRun(result("needsFixing", ["R1"]), expectation({ mayFlag: [photo] }), lines))).toBe(true);
  });

  it("doesn't grade an unreadable result's findings", () => {
    const grade = gradeRun(result("unreadable", [undefined]), expectation({ ratings: ["unreadable"] }), lines);
    expect(passes(grade)).toBe(true);
    expect(gradeRun(result("unreadable", []), expectation(), lines).ratingOk).toBe(false);
  });
});
