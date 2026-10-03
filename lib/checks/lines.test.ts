import { describe, expect, it } from "vitest";
import { checkFor } from "@/lib/documents/checks";
import { checkLines, checkShape } from "./lines";

describe("checkLines", () => {
  it("numbers required and recommended lines apart, in order", () => {
    const lines = checkLines({ required: ["a", "b"], recommended: ["c"] });
    expect(lines.map((l) => [l.id, l.kind, l.text])).toEqual([
      ["R1", "required", "a"],
      ["R2", "required", "b"],
      ["S1", "recommended", "c"],
    ]);
  });

  it("numbers across a document's parts, so an id names one line", () => {
    const check = checkFor("statusApplicationMarried", ["as6Application", "as6IsraeliDeclaration", "as6ForeignDeclaration"])!;
    const lines = checkLines(check);
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
    expect(lines[0]).toMatchObject({ id: "R1", part: "application" });
    expect(lines.find((l) => l.part === "israeliDeclaration")?.id).not.toBe("R1");
    expect(checkShape(check).parts).toEqual(["application", "israeliDeclaration", "foreignDeclaration"]);
  });
});
