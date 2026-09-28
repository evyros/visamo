import { describe, expect, it } from "vitest";
import { progressByOwner, progressOf, uploadedKeys } from "./progress";

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
  it("takes originals only: a translation alone doesn't make a document done", () => {
    const keys = uploadedKeys([
      { documentKey: "a", slot: "translation" },
      { documentKey: "b", slot: "original" },
    ]);
    expect([...keys]).toEqual(["b"]);
  });
});
