import { describe, expect, it } from "vitest";
import {
  BODY_MAX,
  ID_IMAGE_MAX_BYTES,
  ID_PDF_MAX_BYTES,
  SIGNATURE_MAX_BYTES,
  bodyProblem,
  cleanBody,
  isIsraeliId,
  isPersonName,
  maskEmail,
} from "./rules";
import { coupleNames } from "./text";

describe("the recommendation letter's rules", () => {
  it("accepts an ID number only with its check digit, padding short ones", () => {
    expect(isIsraeliId("123456782")).toBe(true);
    expect(isIsraeliId("123456789")).toBe(false);
    expect(isIsraeliId("23456782")).toBe(false);
    expect(isIsraeliId("000000018")).toBe(true);
    expect(isIsraeliId("18")).toBe(false);
    expect(isIsraeliId("000000000")).toBe(false);
    expect(isIsraeliId("12345678a")).toBe(false);
  });

  it("takes names in any script, but nothing that could carry a link or a number", () => {
    expect(isPersonName("דנה כהן")).toBe(true);
    expect(isPersonName("Marco D'Angelo-Rossi")).toBe(true);
    expect(isPersonName("O'Brien Jr.")).toBe(true);
    expect(isPersonName("visit evil.com/x")).toBe(false);
    expect(isPersonName("Dana 050")).toBe(false);
    expect(isPersonName("D")).toBe(false);
  });

  it("asks for a letter of a reasonable length", () => {
    expect(bodyProblem("   ")).toBe("required");
    expect(bodyProblem("אני חבר של דנה.")).toBe("tooShort");
    expect(bodyProblem("א".repeat(200))).toBeNull();
    expect(bodyProblem("א".repeat(2501))).toBe("tooLong");
  });

  it("tidies the letter without changing its words", () => {
    expect(cleanBody("  שורה אחת  \r\n\r\n\r\n\r\nשורה שתיים \n")).toBe("שורה אחת\n\nשורה שתיים");
  });

  it("masks the couple's email for the friend's page", () => {
    expect(maskEmail("dana.cohen@gmail.com")).toBe("d***@gmail.com");
  });

  it("names the couple in each language", () => {
    expect(coupleNames(["דנה", "מרקו"])).toBe("דנה ומרקו");
    expect(coupleNames(["Dana", "Marco"], "en")).toBe("Dana and Marco");
  });

  it("keeps the friend's whole form under Vercel's 4.5MB a request", () => {
    // The ID card (a PDF, the larger of the two), the signature, the letter at
    // the text box's limit with every character 3 bytes, and room for the
    // details and the form's own bytes.
    const vercelLimit = 4.5 * 1000 * 1000;
    const textBox = (BODY_MAX + 500) * 3;
    const worst = Math.max(ID_PDF_MAX_BYTES, ID_IMAGE_MAX_BYTES) + SIGNATURE_MAX_BYTES + textBox + 20_000;
    expect(worst).toBeLessThan(vercelLimit);
  });
});
