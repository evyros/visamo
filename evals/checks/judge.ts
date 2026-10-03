import type { ContentPart, ModelMessage } from "@/lib/chat/openrouter";
import type { Complete } from "@/lib/checks/ask";
import type { CheckLine } from "@/lib/checks/lines";
import type { EvalCase } from "./cases";
import type { Unexpected, Verdict } from "./grade";

// The judge: a stronger model than the checker, shown the same files, for
// the findings a case didn't expect. It decides whether each one is a
// finding a person already approved (allowedExtra), right but not reviewed
// yet, or wrong. It doesn't decide what passes: a person approves what it
// calls right.

export const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || "anthropic/claude-opus-5.5";

const RULES = `You review the findings of Visamo's document checker. Visamo helps couples where one partner is Israeli and the other is a foreign national prepare their file for the Israeli partner-visa process (the graduated procedure at Misrad Hapnim, the Israeli Population and Immigration Authority). The checker is a model that reads one document of a couple's file, every file uploaded for it, and reports what doesn't meet a list of lines: "required" lines (an unmet one is an issue) and "recommended" lines (an unmet one is a recommendation).

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
