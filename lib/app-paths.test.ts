import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { shareDays } from "./chat/share-options";
import { sharedChatPathPattern, withoutShareTokens } from "./app-paths";

// The token shape lib/chat/shares.ts makes.
const token = () => randomBytes(32).toString("base64url");

describe("sharedChatPathPattern", () => {
  it("matches a shared chat's link, and nothing more", () => {
    expect(sharedChatPathPattern.test(`/shared/${token()}`)).toBe(true);
    for (const path of ["/shared/", "/shared/abc", `/shared/${token()}/x`, `/chat/${token()}`]) {
      expect(sharedChatPathPattern.test(path)).toBe(false);
    }
  });
});

describe("withoutShareTokens", () => {
  it("takes the token out of a URL", () => {
    expect(withoutShareTokens(`https://app.visamo.co.il/shared/${token()}?x=1`)).toBe(
      "https://app.visamo.co.il/shared/:token?x=1",
    );
  });

  it("leaves other URLs as they are", () => {
    expect(withoutShareTokens("https://app.visamo.co.il/chat/abc")).toBe("https://app.visamo.co.il/chat/abc");
  });
});

describe("shareDays", () => {
  it("offers a day, a week and a month", () => {
    expect(shareDays).toEqual({ "1d": 1, "1w": 7, "1m": 30 });
  });
});
