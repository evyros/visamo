import type { ContentPart, ModelMessage } from "@/lib/chat/openrouter";
import type { Complete } from "@/lib/checks/ask";
import type { CheckLine } from "@/lib/checks/lines";
import type { EvalCase } from "./cases";
import type { Finding, Said, Unexpected, Unsaid, Verdict } from "./grade";

// The judge: a stronger model than the checker, shown the same files, for
// the findings a case didn't expect. It decides whether each one is a
// finding a person already approved (allowedExtra), right but not reviewed
// yet, or wrong. It doesn't decide what passes: a person approves what it
// calls right.

export const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || "anthropic/claude-opus-5.5";

const RULES = `You review the findings of Visamo's document checker. Visamo helps couples where one partner is Israeli and the other is a foreign national prepare their file for the Israeli partner-visa process (the gradual process at Misrad Hapnim, the Israeli Population and Immigration Authority). The checker is a model that reads one document of a couple's file, every file uploaded for it, and reports what doesn't meet a list of lines: "required" lines (an unmet one is an issue) and "recommended" lines (an unmet one is a recommendation).

The findings you get are ones the test didn't expect. For each one, decide:
- "allowed": it says the same thing as one of the approved findings listed, in other words. Give that finding's number in "allowed".
- "valid": what it says about the files is true, and it's a real problem with this document, or a real way to make it stronger, worth telling the couple. A finding for a line it's not on, or for no line, can still be valid.
- "invalid": it misreads the files, says something is missing that's there, asks for something this document doesn't need for this couple, calls a recommendation required, or is too vague or trivial to help.

Read the files yourself, closely, before you decide: don't trust the finding's account of them. Judge each finding on its own. Give "allowed" as 0 unless the verdict is "allowed". The reason is one short sentence, with what you read in the files that it rests on.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["finding", "verdict", "allowed", "reason"],
        properties: {
          finding: { type: "integer" },
          verdict: { type: "string", enum: ["allowed", "valid", "invalid"] },
          allowed: { type: "integer" },
          reason: { type: "string" },
        },
      },
    },
  },
};

const lineText = (l: CheckLine) => `${l.id} (${l.kind}${l.part ? `, part "${l.part}"` : ""}): ${l.text}`;

/** The verdicts on a run's unexpected findings, in their order. */
export async function judge(
  evalCase: EvalCase,
  context: string,
  files: ContentPart[],
  unexpected: Unexpected[],
  complete: Complete,
): Promise<Verdict[]> {
  const approved = evalCase.expect.allowedExtra;
  const findings = unexpected.map(({ finding, line }, i) =>
    [
      `${i + 1}. ${finding.kind === "issue" ? "Issue" : "Recommendation"}, ${line ? `for line ${line.id}` : "for no line"}${finding.part ? `, part "${finding.part}"` : ""}`,
      `   Title: ${finding.en.title}`,
      `   Detail: ${finding.en.detail}`,
    ].join("\n"),
  );
  const text = [
    `Today's date: ${evalCase.today}`,
    context,
    `The checker's lines for this document\n${evalCase.lines.map(lineText).join("\n")}`,
    `Approved findings\n${approved.length ? approved.map((a, i) => `${i + 1}. ${a}`).join("\n") : "(none)"}`,
    `The findings to judge\n${findings.join("\n")}`,
    "The files:",
  ].join("\n\n");
  const messages: ModelMessage[] = [
    { role: "system", content: RULES },
    { role: "user", content: [{ type: "text", text }, ...files] },
  ];

  const call = await complete(messages, { model: JUDGE_MODEL, maxTokens: 8000, name: "finding_verdicts", schema });
  const answer = JSON.parse(call.answer) as {
    verdicts: { finding: number; verdict: Verdict["verdict"]; allowed: number; reason: string }[];
  };
  return unexpected.map((_, i): Verdict => {
    const v = answer.verdicts.find((v) => v.finding === i + 1);
    if (!v) return { verdict: "invalid", reason: "The judge gave no verdict on it." };
    const allowed = v.verdict === "allowed" ? approved[v.allowed - 1] : undefined;
    // "Allowed" without a real match is only the judge's guess that it's right.
    if (v.verdict === "allowed" && !allowed) return { verdict: "valid", reason: v.reason };
    return { verdict: v.verdict, ...(allowed && { allowed }), reason: v.reason };
  });
}

const ADVICE_RULES = `You review the findings of Visamo's document checker, a model that checks one document of a couple's file for the Israeli partner-visa process and tells the couple what to fix or improve.

You get the findings of one check, and up to two lists of advice: advice the checker must never give for this document, and advice it must give. A finding gives a piece of advice when it tells the couple to do it, or offers it as a way to fix something, in any words, including as one of several options. A finding that only says something is wrong, without suggesting that advice, doesn't give it.

- "forbidden": one entry for every finding. "gives" is true only if it gives advice from the list it must never give, with that advice's number in "advice"; otherwise "gives" is false and "advice" is 0.
- "required": one entry for every piece of advice it must give. "given" is true if at least one finding gives it, with that finding's number in "finding"; otherwise "given" is false and "finding" is 0.

Each reason is one short sentence, quoting the words of the finding it rests on, or saying what the findings say instead.`;

const verdictsOf = (properties: Record<string, object>) => ({
  type: "array",
  items: { type: "object", additionalProperties: false, required: [...Object.keys(properties), "reason"], properties: { ...properties, reason: { type: "string" } } },
});

const adviceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["forbidden", "required"],
  properties: {
    forbidden: verdictsOf({ finding: { type: "integer" }, gives: { type: "boolean" }, advice: { type: "integer" } }),
    required: verdictsOf({ advice: { type: "integer" }, given: { type: "boolean" }, finding: { type: "integer" } }),
  },
};

/**
 * What a run's findings tell the couple, which grading by line can't see: the
 * findings that give advice the case says they mustn't (mustNotSay), expected
 * ones too, and the advice the case says some finding must give (mustSay) that
 * none does. Text only, no files.
 */
export async function judgeAdvice(
  evalCase: EvalCase,
  findings: Finding[],
  complete: Complete,
): Promise<{ said: Said[]; unsaid: Unsaid[] }> {
  const { mustNotSay, mustSay } = evalCase.expect;
  if (!findings.length) return { said: [], unsaid: mustSay.map((advice) => ({ advice, reason: "There are no findings." })) };
  const numbered = (list: string[]) => list.map((a, i) => `${i + 1}. ${a}`).join("\n");
  const listed = findings.map((f, i) => `${i + 1}. ${f.kind === "issue" ? "Issue" : "Recommendation"}\n   Title: ${f.en.title}\n   Detail: ${f.en.detail}`);
  const text = [
    `The document: ${evalCase.title}`,
    `Advice the checker must never give\n${mustNotSay.length ? numbered(mustNotSay) : "(none)"}`,
    `Advice the checker must give\n${mustSay.length ? numbered(mustSay) : "(none)"}`,
    `The findings\n${listed.join("\n")}`,
  ].join("\n\n");
  const messages: ModelMessage[] = [
    { role: "system", content: ADVICE_RULES },
    { role: "user", content: text },
  ];
  const call = await complete(messages, { model: JUDGE_MODEL, maxTokens: 4000, name: "finding_advice", schema: adviceSchema });
  const answer = JSON.parse(call.answer) as {
    forbidden: { finding: number; gives: boolean; advice: number; reason: string }[];
    required: { advice: number; given: boolean; finding: number; reason: string }[];
  };
  const said = answer.forbidden.flatMap((v) => {
    const finding = findings[v.finding - 1];
    const advice = mustNotSay[v.advice - 1];
    return v.gives && finding && advice ? [{ finding, advice, reason: v.reason }] : [];
  });
  // Advice the judge gave no verdict on counts as not given.
  const unsaid = mustSay.flatMap((advice, i) => {
    const v = answer.required.find((r) => r.advice === i + 1);
    return v?.given ? [] : [{ advice, reason: v?.reason ?? "The judge gave no verdict on it." }];
  });
  return { said, unsaid };
}
