import type { Fact } from "./facts";

// When a document is needed, as data built from fact names. Evaluating one
// also says which facts made it match, for the "why is this here" line.

export type Condition =
  | Fact
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition };

export type Evaluation = {
  match: boolean;
  /** The true facts that made it match, in the condition's order. Empty when it doesn't match, and for `not`. */
  because: Fact[];
};

/** No condition means always needed. */
export function evaluate(condition: Condition | undefined, facts: Record<Fact, boolean>): Evaluation {
  if (condition === undefined) return { match: true, because: [] };
  if (typeof condition === "string") {
    return facts[condition] ? { match: true, because: [condition] } : { match: false, because: [] };
  }
  if ("not" in condition) return { match: !evaluate(condition.not, facts).match, because: [] };
  const parts = ("all" in condition ? condition.all : condition.any).map((c) => evaluate(c, facts));
  const match = "all" in condition ? parts.every((p) => p.match) : parts.some((p) => p.match);
  if (!match) return { match, because: [] };
  return { match, because: [...new Set(parts.flatMap((p) => p.because))] };
}

/** Every fact a condition reads. */
export function factsIn(condition: Condition | undefined): Fact[] {
  if (condition === undefined) return [];
  if (typeof condition === "string") return [condition];
  if ("not" in condition) return factsIn(condition.not);
  return ("all" in condition ? condition.all : condition.any).flatMap(factsIn);
}
