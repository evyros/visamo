import { describe, expect, it } from "vitest";
import { retryAfter } from "./cache";

const answered = (status: number, body: object) => new Error(`OpenRouter answered ${status}: ${JSON.stringify(body)}`);

describe("retryAfter", () => {
  it("waits as asked when the key has too much in flight", () => {
    const error = answered(402, {
      error: { code: 402, metadata: { reason: "in_flight_budget_exhausted", headers: { "Retry-After": "120" } } },
    });
    expect(retryAfter(error)).toBe(120);
  });

  it("waits on too many requests, a default when it doesn't say how long", () => {
    expect(retryAfter(answered(429, { error: { code: 429 } }))).toBe(30);
  });

  it("doesn't try again when the key is out of credit, or for any other failure", () => {
    expect(retryAfter(answered(402, { error: { code: 402, message: "Insufficient credits" } }))).toBeNull();
    expect(retryAfter(answered(500, { error: { code: 500 } }))).toBeNull();
    expect(retryAfter(new Error("network down"))).toBeNull();
  });
});
