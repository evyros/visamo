import type { Completion } from "@/lib/chat/openrouter";
import { formatNumber, formatCallUsd, Pill } from "./admin-ui";

// A run's model calls, for the admin: what each took (tokens, its reasoning,
// cost, time), how it ended, and the reasoning the model reported. Shared by
// the chat's answers and the document checks. Calls recorded before a field
// existed show "—" for it.

export const seconds = (ms: number | null) => (ms == null ? null : `${(ms / 1000).toFixed(1)}s`);

/** Only when a call didn't end on its own: at the token cap, or broken off. */
export function FinishPill({ reason }: { reason: string | null }) {
  if (reason === "stop") return null;
  if (reason === "length") return <Pill tone="amber">Hit the token cap</Pill>;
  if (reason === null) return <Pill tone="terracotta">Cut off</Pill>;
  return <Pill>{reason}</Pill>;
}

/** Recorded before reasoning was: unknown, not zero. */
const optional = (value: number | undefined) => (value == null ? "—" : formatNumber(value));

/** One row per call, `label` naming what it was for; then each call's reasoning, folded. */
export function CallsTable<C extends Completion>({ calls, label }: { calls: C[]; label: (call: C, index: number) => string }) {
  const reasoned = calls.map((call, i) => ({ call, i })).filter(({ call }) => call.reasoning);
  return (
    <>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line-200">
        <table className="w-full min-w-[820px] text-start">
          <thead className="text-slate-500">
            <tr>
              {["For", "Provider", "Model", "In", "Cached", "Out", "Reasoning", "Cost", "Time", "Finish", "Generation"].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-start font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-200 text-slate-700 tabular-nums">
            {calls.map((call, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{label(call, i)}</td>
                <td className="px-3 py-2">{call.provider ?? "—"}</td>
                <td className="px-3 py-2 break-all">{call.model ?? "—"}</td>
                <td className="px-3 py-2">{formatNumber(call.tokensIn)}</td>
                <td className="px-3 py-2">{formatNumber(call.cachedTokens)}</td>
                <td className="px-3 py-2">{formatNumber(call.tokensOut)}</td>
                <td className="px-3 py-2">{optional(call.reasoningTokens)}</td>
                <td className="px-3 py-2">{call.costUsd != null ? formatCallUsd(call.costUsd) : "—"}</td>
                <td className="px-3 py-2">{seconds(call.ms)}</td>
                <td className="px-3 py-2">{call.finishReason ?? "—"}</td>
                <td className="px-3 py-2 break-all">
                  <code>{call.generationId ?? "—"}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reasoned.map(({ call, i }) => (
        <details key={i} className="mt-2">
          <summary className="cursor-pointer font-semibold text-navy-900">Reasoning: {label(call, i)}</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-line-200 bg-sand-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
            {call.reasoning}
          </pre>
        </details>
      ))}
    </>
  );
}
