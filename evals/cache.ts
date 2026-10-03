import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { completeJson, type Completion } from "@/lib/chat/openrouter";

// Model calls, kept on disk by what was sent (evals/.cache, not committed),
// so running the evals again after a change only pays for the calls the
// change touched. EVAL_NO_CACHE=1 asks the model again.

const DIR = path.join(process.cwd(), "evals/.cache");

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
    const completion = await completeJson(...args);
    await mkdir(DIR, { recursive: true });
    await writeFile(file, JSON.stringify(completion));
    return { ...completion, cached: false };
  };
}
