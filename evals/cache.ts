import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { completeJson, type Completion } from "@/lib/chat/openrouter";

// Model calls, kept on disk by what was sent (evals/.cache, not committed),
// so running the evals again after a change only pays for the calls the
// change touched. EVAL_NO_CACHE=1 asks the model again. A call OpenRouter
// turns away for now (too many at once, or too much in flight for the key's
// credit) is made again after the wait it asks for.

const DIR = path.join(process.cwd(), "evals/.cache");

/** Tries for a call OpenRouter turns away for now, and the wait when it doesn't say. */
const MAX_TRIES = 5;
const DEFAULT_WAIT_S = 30;

/**
 * The seconds to wait before trying again, when the call was turned away for
 * now: 429 (too many requests), or 402 for the in-flight budget, not for a
 * key out of credit. Null for any other failure. lib/chat/openrouter.ts puts
 * the status and the body in the error's message.
 */
export function retryAfter(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const status = /OpenRouter answered (\d{3})/.exec(message)?.[1];
  if (status !== "429" && !(status === "402" && message.includes("in_flight"))) return null;
  const seconds = Number(/"Retry-After"\s*:\s*"?(\d+)/i.exec(message)?.[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_WAIT_S;
}

async function completeWithRetries(...args: Parameters<typeof completeJson>): Promise<Completion> {
  for (let tries = 1; ; tries++) {
    try {
      return await completeJson(...args);
    } catch (error) {
      const wait = retryAfter(error);
      if (wait === null || tries >= MAX_TRIES) throw error;
      // Spread out, so calls turned away together don't come back together.
      await new Promise((resolve) => setTimeout(resolve, (wait + Math.random() * 10) * 1000));
    }
  }
}

export type EvalCompletion = Completion & { cached: boolean };

/**
 * completeJson, cached. `run` tells apart the repeats of one case (they'd
 * send the same thing); each call within a run is counted, so a retry with
 * the same messages is a call of its own.
 */
export function cachedCompleteJson(run: string) {
  let call = 0;
  return async (...args: Parameters<typeof completeJson>): Promise<EvalCompletion> => {
    const key = createHash("sha256")
      .update(JSON.stringify([run, call++, ...args]))
      .digest("hex");
    const file = path.join(DIR, `${key}.json`);
    if (!process.env.EVAL_NO_CACHE) {
      const saved = await readFile(file, "utf8").catch(() => null);
      if (saved) return { ...(JSON.parse(saved) as Completion), cached: true };
    }
    const completion = await completeWithRetries(...args);
    await mkdir(DIR, { recursive: true });
    await writeFile(file, JSON.stringify(completion));
    return { ...completion, cached: false };
  };
}
