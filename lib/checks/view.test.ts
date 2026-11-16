import { describe, expect, it } from "vitest";
import type { IndexedFinding } from "./dismissals";
import type { FindingHistory } from "./store";
import { checkView } from "./view";

// A reviewed finding's history, as checkView puts it on the finding: on the
// one it's about, wherever that finding is now.

const finding = (title: string, index: number): IndexedFinding => ({
  en: { title, detail: `${title} in detail` },
  he: { title, detail: `${title} בפירוט` },
  index,
});

const base = {
  runId: "run-1",
  checkedAt: new Date("2026-11-16T10:00:00Z"),
  checkedByName: null,
  fileIds: ["file-1"],
  detailsFresh: true,
  free: false,
  locked: null,
};

const brought: FindingHistory = {
  kind: "issue",
  index: 0,
  outcome: "checkerRight",
  reviewId: "d-1",
  isNew: true,
  entries: [
    { type: "dismissed", at: new Date("2026-11-16T11:00:00Z"), name: "Dana", reason: "alreadyThere", note: "Page 2" },
    { type: "reviewed", at: new Date("2026-11-16T12:00:00Z"), outcome: "checkerRight", note: "It goes on the original" },
  ],
};

describe("checkView with histories", () => {
  it("puts a finding the team brought back in the result with its history", () => {
    const view = checkView(
      {
        ...base,
        result: { rating: "needsFixing", issues: [finding("Apostille missing", 0)], recommendations: [finding("Add a translation", 0)] },
        dismissed: [],
        histories: [brought],
      },
      "en",
    )!;
    expect(view.issues[0].history).toEqual({
      outcome: "checkerRight",
      reviewId: "d-1",
      isNew: true,
      entries: [
        { type: "dismissed", at: "2026-11-16T11:00:00.000Z", name: "Dana", reason: "alreadyThere", note: "Page 2" },
        { type: "reviewed", at: "2026-11-16T12:00:00.000Z", outcome: "checkerRight", note: "It goes on the original" },
      ],
    });
    // The same index on the other list is another finding.
    expect(view.recommendations[0].history).toBeUndefined();
  });

  it("keeps the history on a finding dismissed again, and on one the team agreed was wrong", () => {
    const dismissal = (id: string, kind: "issue" | "recommendation", index: number) => ({
      id,
      kind,
      index,
      finding: finding("Apostille missing", index),
      reason: "alreadyThere" as const,
      dismissedAt: new Date("2026-11-16T13:00:00Z"),
      dismissedByName: "Dana",
    });
    const agreed: FindingHistory = {
      kind: "recommendation",
      index: 1,
      outcome: "checkerWrong",
      reviewId: "d-3",
      isNew: false,
      entries: [{ type: "reviewed", at: new Date("2026-11-16T12:00:00Z"), outcome: "checkerWrong", note: null }],
    };
    const view = checkView(
      {
        ...base,
        result: { rating: "looksGood", issues: [], recommendations: [] },
        dismissed: [dismissal("d-2", "issue", 0), dismissal("d-3", "recommendation", 1)],
        histories: [brought, agreed],
      },
      "en",
    )!;
    expect(view.dismissed.map((d) => d.history?.outcome)).toEqual(["checkerRight", "checkerWrong"]);
    expect(view.dismissed.map((d) => d.history?.isNew)).toEqual([true, false]);
  });
});
