import type { ReactNode } from "react";

/**
 * Renders `**emphasis**` inside a message as <strong>. Keeping the markup in
 * the message lets each language place the emphasis in its own word order.
 */
export function rich(message: string, strongClassName = "font-semibold text-navy-900"): ReactNode[] {
  return message.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={strongClassName}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
