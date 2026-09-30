import { describe, expect, it } from "vitest";
import { buyUrl, returnPath, successUrl } from "./buy-paths";

describe("returnPath", () => {
  it("keeps paths in the app", () => {
    expect(returnPath("/chat/abc")).toBe("/chat/abc");
    expect(returnPath("/file/documents")).toBe("/file/documents");
  });

  it("refuses other sites, the buy page, and anything that isn't a path", () => {
    for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "chat", "", "/buy", "/buy?for=fileCheck", "/buy/success?license=1", undefined, ["/chat"]]) {
      expect(returnPath(value)).toBeNull();
    }
  });
});

describe("buyUrl", () => {
  it("comes back to the page", () => {
    expect(buyUrl("/chat/abc")).toBe("/buy?from=%2Fchat%2Fabc");
  });

  it("drops a return path that isn't the app's", () => {
    expect(buyUrl("https://evil.example")).toBe("/buy");
    expect(buyUrl()).toBe("/buy");
  });
});

describe("successUrl", () => {
  it("carries the license and the way back", () => {
    expect(successUrl("2056453", "/chat")).toBe("/buy/success?license=2056453&from=%2Fchat");
    expect(successUrl("2056453", null)).toBe("/buy/success?license=2056453");
  });
});
