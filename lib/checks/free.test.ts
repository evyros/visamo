import { describe, expect, it } from "vitest";
import type { IndexedFinding } from "./dismissals";
import { resultsEmail } from "./results-email";
import { isLocked } from "./store";
import { checkView } from "./view";

// The free check (lib/checks/free.ts): which results the couple sees locked,
// that a locked result never carries its findings, and the email's lines.

const finding = (title: string, index: number): IndexedFinding => ({
  en: { title, detail: `${title} in detail` },
  he: { title, detail: `${title} בפירוט` },
  index,
});

describe("isLocked", () => {
  const free = { fileCheck: false, freeFullKey: "foreignBirthCertificate" };

  it("shows the document approved first in full, and every other approved one locked", () => {
    expect(isLocked("approved", "foreignBirthCertificate", free)).toBe(false);
    expect(isLocked("approved", "foreignPoliceCertificate:US", free)).toBe(true);
  });

  it("never locks the couple's own checks", () => {
    expect(isLocked(null, "foreignPoliceCertificate:US", free)).toBe(false);
  });

  it("unlocks everything once the case buys Full file check", () => {
    expect(isLocked("approved", "foreignPoliceCertificate:US", { ...free, fileCheck: true })).toBe(false);
  });
});

describe("checkView of a locked result", () => {
  const check = {
    runId: "run-1",
    result: { rating: "needsFixing" as const, issues: [finding("Apostille missing", 0)], recommendations: [finding("Add a translation", 1)] },
    dismissed: [],
    checkedAt: new Date("2026-11-16T10:00:00Z"),
    checkedByName: null,
    fileIds: ["file-1"],
    detailsFresh: true,
    free: true,
  };

  it("has the rating and the counts, never the findings' text", () => {
    const view = checkView({ ...check, locked: { issues: 1, recommendations: 1 } }, "en")!;
    expect(view.rating).toBe("needsFixing");
    expect(view.locked).toEqual({ issues: 1, recommendations: 1 });
    expect(view.issues).toEqual([]);
    expect(view.recommendations).toEqual([]);
    expect(JSON.stringify(view)).not.toContain("Apostille");
  });

  it("shows the findings of the one shown in full", () => {
    const view = checkView({ ...check, locked: null }, "en")!;
    expect(view.issues.map((f) => f.title)).toEqual(["Apostille missing"]);
    expect(view.free).toBe(true);
  });
});

describe("resultsEmail", () => {
  const names = { israeli: "Dana", foreign: "John" };
  const f = (title: string, he = `${title} (he)`) => ({
    en: { title, detail: `${title}, in detail` },
    he: { title: he, detail: `${he}, בפירוט` },
  });
  const caseRow = { fileCheck: false, freeFullKey: "foreignBirthCertificate" };
  const runs = [
    {
      documentKey: "foreignPoliceCertificate:US",
      rating: "needsFixing" as const,
      issues: [f("SECRET locked issue")],
      recommendations: [f("SECRET locked tip")],
      hidden: null,
    },
    {
      documentKey: "foreignBirthCertificate",
      rating: "needsFixing" as const,
      issues: [f("Apostille missing", "חסר אפוסטיל"), f("Hidden by the admin")],
      recommendations: [f("Add a certified translation", "כדאי להוסיף תרגום נוטריוני")],
      hidden: [{ kind: "issue" as const, index: 1 }],
    },
  ];

  it("names the full result's findings, and only counts the locked one's", async () => {
    const email = await resultsEmail(runs, "en", names, caseRow);
    expect(email.subject).toBe("Your document check: something needs fixing");
    expect(email.html).toContain("Apostille missing");
    expect(email.html).toContain("Add a certified translation");
    expect(email.html).toContain("1 to fix, 1 tip");
    for (const out of ["SECRET", "Hidden by the admin"]) {
      expect(email.html).not.toContain(out);
      expect(email.text).not.toContain(out);
    }
    // The one shown in full comes first.
    expect(email.text.indexOf("Apostille")).toBeLessThan(email.text.indexOf("See what to fix"));
  });

  it("titles the email by the worst result, in the couple's language", async () => {
    const good = [{ ...runs[1], rating: "looksGood" as const, issues: [], recommendations: [], hidden: null }];
    expect((await resultsEmail(good, "en", names, caseRow)).subject).toBe("Your document check: looks good");
    const he = await resultsEmail(runs, "he", names, caseRow);
    expect(he.html).toContain('dir="rtl"');
    expect(he.subject).toBe("בדיקת המסמכים שלכם: יש משהו לתקן");
    // Each finding's own Hebrew title, as stored with it.
    expect(he.html).toContain("חסר אפוסטיל");
    expect(he.html).toContain("כדאי להוסיף תרגום נוטריוני");
    expect(he.html).not.toContain("Apostille missing");
  });

  it("writes previews of the email for a look in a browser", async () => {
    const dir = process.env.EMAIL_PREVIEW_DIR;
    if (!dir) return;
    const { writeFileSync } = await import("node:fs");
    for (const locale of ["en", "he"] as const) {
      writeFileSync(`${dir}/check-results-${locale}.html`, (await resultsEmail(runs, locale, names, caseRow)).html);
    }
  });
});
