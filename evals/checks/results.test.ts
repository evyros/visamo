import { describe, expect, it } from "vitest";
import { changes, documents, runFolder, type CaseRecord, type RunRecord, type RunResults } from "./results";

const run = (passed: boolean, lines: string[], cost = 0.01): RunRecord => ({
  run: 0,
  passed,
  missed: [],
  findings: lines.map((id) => ({
    kind: "issue",
    line: { id, kind: "required", text: id },
    en: { title: "t", detail: "d" },
    he: { title: "t", detail: "d" },
    status: "expected",
  })),
  cost,
  spent: 0,
  checkCost: cost,
  judgeCost: 0,
  judgeCalls: 0,
  calls: 1,
  fresh: 0,
});

const record = (id: string, runs: RunRecord[]): CaseRecord => {
  const passRate = runs.filter((r) => r.passed).length / runs.length;
  return {
    id,
    folder: id.split("/")[0],
    title: "Title",
    name: id.split("/")[1],
    documentKey: id.split("/")[0],
    model: "m",
    scenario: "marriedInCyprus",
    today: "2026-10-01",
    files: [],
    expect: { ratings: null, flagged: [], mayFlag: [], allowedExtra: [] },
    lines: [],
    missing: [],
    passRate,
    passing: passRate === 1,
    runs,
  };
};

const results = (cases: CaseRecord[], filter: string | null = null): RunResults => ({
  meta: {
    startedAt: "",
    folder: "2026-10-03/10-00-00",
    filter,
    checkModels: { standard: "m", strong: "s" },
    judgeModel: "j",
    runs: 2,
    rulesVersion: 1,
    knowledgeVersion: 1,
    commit: null,
    dirty: false,
  },
  cases,
});

describe("runFolder", () => {
  it("files a run under its day, then its time and filter", () => {
    expect(runFolder(new Date(2026, 9, 3, 9, 5, 7), null)).toBe("2026-10-03/09-05-07");
    expect(runFolder(new Date(2026, 9, 3, 9, 5, 7), "relationshipStory/ours")).toBe("2026-10-03/09-05-07_relationshipStory-ours");
  });
});

describe("changes", () => {
  it("lists the cases that flipped, and what they report now and didn't", () => {
    const before = results([record("a/x", [run(true, ["R1"]), run(true, ["R1"])]), record("a/y", [run(true, [])])]);
    const now = results([record("a/x", [run(false, ["R2"]), run(false, ["R2"])]), record("a/y", [run(true, [])])]);
    const changed = changes(now, [before])!;
    expect(changed.cases).toEqual([
      {
        id: "a/x",
        before: { passRate: 1, passing: true },
        after: { passRate: 0, passing: false },
        added: ["R2 issue"],
        removed: ["R1 issue"],
      },
    ]);
  });

  it("doesn't call a case gone when only some cases ran", () => {
    const before = results([record("a/x", [run(true, [])]), record("b/z", [run(true, [])])]);
    const now = results([record("a/x", [run(true, [])])], "a/");
    expect(changes(now, [before])!.cases).toEqual([]);
  });

  it("compares each case with the last run that ran it, past a run of only some cases", () => {
    const full = results([record("a/x", [run(true, [])]), record("b/z", [run(true, [])])]);
    const some = results([record("a/x", [run(true, [])])], "a/");
    const now = results([record("a/x", [run(true, [])]), record("b/z", [run(true, [])])]);
    expect(changes(now, [some, full])!.cases).toEqual([]);
  });
});

describe("documents", () => {
  it("adds up each document's cost, and a check's on average", () => {
    const [doc] = documents(results([record("a/x", [run(true, [], 0.02), run(true, [], 0.04)])]));
    expect(doc.cost).toBeCloseTo(0.06);
    expect(doc.perRun).toBeCloseTo(0.03);
  });
});
