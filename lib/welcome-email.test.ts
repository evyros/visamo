import { describe, expect, it } from "vitest";
import { firstName, freeMessagesLeft } from "./welcome-email";

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Evyatar Cohen")).toBe("Evyatar");
    expect(firstName("  דנה   לוי ")).toBe("דנה");
  });

  it("has none for a blank name or an email address", () => {
    expect(firstName("")).toBeNull();
    expect(firstName("   ")).toBeNull();
    expect(firstName(null)).toBeNull();
    expect(firstName(undefined)).toBeNull();
    expect(firstName("someone@example.com")).toBeNull();
  });
});

describe("freeMessagesLeft", () => {
  it("shows the messages left on a free case with its check", () => {
    expect(freeMessagesLeft({ paid: false, checksLeft: 1, freeFullKey: null, messagesLeft: 5 })).toBe(5);
    expect(freeMessagesLeft({ paid: false, checksLeft: 1, freeFullKey: null, messagesLeft: 3 })).toBe(3);
  });

  it("leaves the reminder out for a paid case, a used check, or almost no messages", () => {
    expect(freeMessagesLeft({ paid: true, checksLeft: 200, freeFullKey: null, messagesLeft: 55 })).toBeNull();
    expect(freeMessagesLeft({ paid: false, checksLeft: 0, freeFullKey: null, messagesLeft: 5 })).toBeNull();
    expect(freeMessagesLeft({ paid: false, checksLeft: 1, freeFullKey: "passport", messagesLeft: 5 })).toBeNull();
    expect(freeMessagesLeft({ paid: false, checksLeft: 1, freeFullKey: null, messagesLeft: 1 })).toBeNull();
  });
});
