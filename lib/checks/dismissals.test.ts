import { describe, expect, it } from "vitest";
import { activeResult } from "./dismissals";
import type { CheckResult } from "./result";

const finding = (title: string) => ({ en: { title, detail: title }, he: { title, detail: title } });
const result = (rating: CheckResult["rating"], issues = 0, recommendations = 0): CheckResult => ({
  rating,
  issues: Array.from({ length: issues }, (_, i) => finding(`issue ${i}`)),
  recommendations: Array.from({ length: recommendations }, (_, i) => finding(`tip ${i}`)),
});

describe("activeResult", () => {
  it("keeps the model's rating, and every finding with its place, without dismissals", () => {
    const active = activeResult(result("looksGood", 0, 2), []);
    expect(active.rating).toBe("looksGood");
    expect(active.recommendations.map((f) => f.index)).toEqual([0, 1]);
  });

  it("takes the dismissed findings out, keeping the others' places", () => {
    const active = activeResult(result("needsFixing", 3, 1), [{ kind: "issue", index: 1 }]);
    expect(active.issues.map((f) => f.index)).toEqual([0, 2]);
    expect(active.recommendations.map((f) => f.index)).toEqual([0]);
    expect(active.rating).toBe("needsFixing");
  });

  it("is ready with tips once its only issue is dismissed", () => {
    expect(activeResult(result("needsFixing", 1, 2), [{ kind: "issue", index: 0 }]).rating).toBe("canImprove");
  });

  it("looks good once nothing is left", () => {
    const dismissed = [
      { kind: "issue" as const, index: 0 },
      { kind: "recommendation" as const, index: 0 },
    ];
    expect(activeResult(result("needsFixing", 1, 1), dismissed).rating).toBe("looksGood");
    expect(activeResult(result("canImprove", 0, 1), [{ kind: "recommendation", index: 0 }]).rating).toBe("looksGood");
  });

  it("keeps a \"looks good\" with minor tips as it was", () => {
    expect(activeResult(result("looksGood", 0, 2), [{ kind: "recommendation", index: 0 }]).rating).toBe("looksGood");
  });

  it("never changes a result that couldn't be read", () => {
    expect(activeResult(result("unreadable", 1), [{ kind: "issue", index: 0 }]).rating).toBe("unreadable");
  });
});
