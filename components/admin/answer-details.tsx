import { Fragment } from "react";
import type { AdminChatMessage } from "@/lib/admin-chats";
import { Icon } from "@/components/icons";
import { formatNumber, formatCallUsd } from "./admin-ui";
import { CallsTable, FinishPill, seconds } from "./model-calls";

// Under an answer on the admin's chat page: its cost and time, and behind a
// "more" button the rest of what it took (the model calls and their tokens)
// and what it was given (the couple's file, the earlier messages, and the
// rules, knowledge and catalog versions).

export function AnswerDetails({ message: m }: { message: AdminChatMessage }) {
  // Every answer records its calls; the column is only empty on questions.
  const calls = m.calls!;
  const answerCall = calls.find((c) => c.purpose === "answer");
  const details: [string, string][] = [
    ["Model", [m.model, answerCall?.provider].filter(Boolean).join(" via ") || "—"],
    [
      "Tokens",
      `${formatNumber(m.tokensIn!)} in${m.cachedTokens ? ` (${formatNumber(m.cachedTokens)} cached)` : ""} · ${formatNumber(m.tokensOut!)} out`,
    ],
    ["First text", seconds(m.firstTokenMs) ?? "—"],
    ["History sent", `${m.historyCount} earlier ${m.historyCount === 1 ? "message" : "messages"}`],
    ["Versions", `rules v${m.chatRulesVersion} · knowledge v${m.knowledgeVersion} · catalog v${m.catalogVersion}`],
  ];

  return (
    // The cost and time at a glance; everything else behind the "more" button.
    <details className="group mt-2 text-[13px] text-slate-500">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 tabular-nums [&::-webkit-details-marker]:hidden">
        <span>{m.costUsd != null ? formatCallUsd(m.costUsd) : "Cost unknown"}</span>
        {m.answerMs != null && <span>· {seconds(m.answerMs)}</span>}
        <FinishPill reason={m.finishReason} />
        <span
          className="ms-0.5 inline-flex size-6 items-center justify-center rounded-md text-slate-500 group-open:bg-navy-900/5 hover:bg-navy-900/5 hover:text-navy-900"
          aria-label="More details"
        >
          <Icon name="more" className="size-4" />
        </span>
      </summary>
      <div className="mt-2 space-y-3 rounded-lg border border-line-200 bg-white p-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {details.map(([label, value]) => (
            <Fragment key={label}>
              <dt className="font-semibold text-navy-900">{label}</dt>
              <dd className="tabular-nums">{value}</dd>
            </Fragment>
          ))}
        </dl>
        <div>
          <div className="font-semibold text-navy-900">Model calls</div>
          <CallsTable calls={calls} label={(call) => (call.purpose === "answer" ? "Answer" : "Title")} />
        </div>
        {m.caseContext && (
          <details>
            <summary className="cursor-pointer font-semibold text-navy-900">The couple’s file as sent</summary>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-line-200 bg-sand-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
              {m.caseContext}
            </pre>
          </details>
        )}
      </div>
    </details>
  );
}
