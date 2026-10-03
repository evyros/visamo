import "server-only";
import { CHECK_MODEL, completeJson, type Completion, type ModelMessage } from "@/lib/chat/openrouter";
import type { CheckShape } from "./lines";
import { checkResultSchema, isConsistent, parseCheck, settle, type CheckResult } from "./result";

// One check's model call, as the app makes it and the evals (evals/checks)
// replay it.

/**
 * The model's reasoning counts toward it, before the answer: a document of
 * several parts (form AS/6) can reason through 4000 tokens and get cut off
 * mid-answer. Only the tokens used are paid for.
 */
const MAX_ANSWER_TOKENS = 16000;

/** What a call that gave no check result returned, for the run's error and the log. */
const describe = (call: Completion) =>
  `finish ${call.finishReason}, ${call.tokensOut} tokens out (${call.reasoningTokens} reasoning), ` +
  `${call.answer.length} chars, generation ${call.generationId}`;

/** Makes one model call; the evals pass one that caches. */
export type Complete = typeof completeJson;

/**
 * The model's answer, asked for once more if it's malformed or its rating
 * doesn't fit its findings. Each call goes into `calls` as it's made, so a
 * run that fails midway still records what it cost.
 */
export async function askCheck(
  messages: ModelMessage[],
  shape: CheckShape,
  calls: Completion[],
  complete: Complete = completeJson,
): Promise<{ result: CheckResult; corrected: boolean }> {
  const call = async () => {
    const completion = await complete(messages, {
      model: CHECK_MODEL,
      maxTokens: MAX_ANSWER_TOKENS,
      name: "document_check",
      schema: checkResultSchema(shape),
    });
    calls.push(completion);
    return parseCheck(completion.answer, shape);
  };
  const settled = (answer: CheckResult) => {
    const result = settle(answer);
    return { result, corrected: result.rating !== answer.rating };
  };
  const first = await call();
  if (first && isConsistent(first)) return { result: first, corrected: false };
  if (!first) console.warn("document check: answer wasn't a check result, asking again", describe(calls.at(-1)!));
  const second = await call();
  if (second) return settled(second);
  if (first) return settled(first);
  throw new Error(`The model's answer wasn't a check result: ${calls.map(describe).join("; ")}`);
}
