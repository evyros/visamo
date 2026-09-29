import { describe, expect, it } from "vitest";
import { codeAt, decodeBase32, verifyTotp } from "./totp";

// RFC 6238, appendix B: the SHA-1 secret "12345678901234567890", 8 digits.
const rfcSecret = Buffer.from("12345678901234567890");
const vectors: [number, string][] = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

describe("totp", () => {
  it("matches the RFC 6238 test vectors", () => {
    for (const [seconds, code] of vectors) expect(codeAt(rfcSecret, Math.floor(seconds / 30), 8)).toBe(code);
  });

  it("decodes base32 the way authenticator apps write it", () => {
    expect(decodeBase32("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")).toEqual(rfcSecret);
    expect(decodeBase32("gezd gnbv-gy3t qojq gezd gnbv gy3t qojq")).toEqual(rfcSecret);
    expect(decodeBase32("not base32!")).toBeNull();
    expect(decodeBase32("")).toBeNull();
  });

  it("accepts the current code and one step either side, nothing further", () => {
    const now = 1234567890 * 1000;
    const step = Math.floor(1234567890 / 30);
    expect(verifyTotp(rfcSecret, codeAt(rfcSecret, step), now)).toBe(true);
    expect(verifyTotp(rfcSecret, codeAt(rfcSecret, step - 1), now)).toBe(true);
    expect(verifyTotp(rfcSecret, codeAt(rfcSecret, step + 1), now)).toBe(true);
    expect(verifyTotp(rfcSecret, codeAt(rfcSecret, step - 2), now)).toBe(false);
    expect(verifyTotp(rfcSecret, codeAt(rfcSecret, step + 2), now)).toBe(false);
  });

  it("rejects malformed codes", () => {
    const now = 1234567890 * 1000;
    const code = codeAt(rfcSecret, Math.floor(1234567890 / 30));
    expect(verifyTotp(rfcSecret, ` ${code.slice(0, 3)} ${code.slice(3)} `, now)).toBe(true);
    expect(verifyTotp(rfcSecret, "", now)).toBe(false);
    expect(verifyTotp(rfcSecret, code.slice(0, 5), now)).toBe(false);
    expect(verifyTotp(rfcSecret, code + "0", now)).toBe(false);
  });
});
