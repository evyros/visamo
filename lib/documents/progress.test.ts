import { describe, expect, it } from "vitest";
import {
  checkedProgressByOwner,
  checkedProgressOf,
  progressByOwner,
  progressOf,
  standingOf,
  uploadedKeys,
  type Standing,
} from "./progress";

const items = [
  { key: "a", optional: false, owner: "couple" as const },
  { key: "b", optional: false, owner: "foreign" as const },
  { key: "c", optional: true, owner: "foreign" as const },
  { key: "d", optional: true, owner: "israeli" as const },
];

describe("progressOf", () => {
  it("counts required documents, and optional ones only once uploaded", () => {
    expect(progressOf(items, new Set())).toEqual({ done: 0, total: 2 });
    expect(progressOf(items, new Set(["a", "c"]))).toEqual({ done: 2, total: 3 });
  });
});

describe("progressByOwner", () => {
  it("leaves out owners with nothing to count", () => {
    const groups = progressByOwner(items, new Set(["b"]), ["couple", "israeli", "foreign"]);
    expect(groups).toEqual([
      { owner: "couple", progress: { done: 0, total: 1 } },
      { owner: "foreign", progress: { done: 1, total: 1 } },
    ]);
  });
});

describe("uploadedKeys", () => {
  it("takes each document with a file, once", () => {
    const keys = uploadedKeys([{ documentKey: "a" }, { documentKey: "b" }, { documentKey: "a" }]);
    expect([...keys]).toEqual(["a", "b"]);
  });
});

describe("standingOf", () => {
  it("is ready only once a current check passed it", () => {
    expect(standingOf(false, true, null)).toBe("notUploaded");
    expect(standingOf(true, true, null)).toBe("unchecked");
    expect(standingOf(true, true, "looksGood")).toBe("ready");
    expect(standingOf(true, true, "canImprove")).toBe("ready");
    expect(standingOf(true, true, "needsFixing")).toBe("fix");
    expect(standingOf(true, true, "unreadable")).toBe("fix");
  });

  it("counts a document with no check written as ready once uploaded", () => {
    expect(standingOf(true, false, null)).toBe("ready");
    expect(standingOf(false, false, null)).toBe("notUploaded");
  });
});

describe("checkedProgressOf", () => {
  it("counts each standing, and optional documents only once uploaded", () => {
    const standing = new Map<string, Standing>([
      ["a", "ready"],
      ["c", "fix"],
    ]);
    expect(checkedProgressOf(items, standing)).toEqual({ ready: 1, fix: 1, unchecked: 0, notUploaded: 1, total: 3 });
  });

  it("groups by owner, leaving out owners with nothing to count", () => {
    const standing = new Map<string, Standing>([["b", "unchecked"]]);
    expect(checkedProgressByOwner(items, standing, ["couple", "israeli", "foreign"])).toEqual([
      { owner: "couple", progress: { ready: 0, fix: 0, unchecked: 0, notUploaded: 1, total: 1 } },
      { owner: "foreign", progress: { ready: 0, fix: 0, unchecked: 1, notUploaded: 0, total: 1 } },
    ]);
  });
});
