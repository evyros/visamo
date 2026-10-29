import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../icons";

// Form pieces shared by the recommendation letter forms: the couple's
// (request-form.tsx) and the friend's (letter-writer.tsx). They match the
// contact form's fields.

/** A one-line field, as tall as the buttons, so a field and a button side by side line up. */
export const inputBase =
  "h-12 w-full rounded-[10px] border border-line-200 bg-white px-3.5 text-[16px] text-navy-900 transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 aria-invalid:border-terracotta-600";

/** A field under its label. */
export const inputClass = `mt-1.5 ${inputBase}`;

/**
 * A native select with its own chevron, inset from the edge like the text: the browser's own sits against the border.
 * `className` goes on its wrapper, for spacing.
 */
export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${inputBase} appearance-none pe-11`} {...props}>
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute end-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

export const primaryButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-teal-600 px-6 font-semibold text-white shadow-soft transition-colors hover:bg-teal-700 disabled:opacity-70";

export const secondaryButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-navy-900 px-6 font-semibold text-navy-900 transition-colors hover:bg-navy-900/5 disabled:opacity-70";

/** A label, the field, and its error or hint under it. The field's aria-describedby should point to `${id}-error` or `${id}-hint`. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracotta-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** aria props tying a field to its error, or else its hint. */
export function describe(id: string, error?: string, hasHint = false) {
  return {
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  };
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-[10px] bg-terracotta-100 px-4 py-3 text-sm text-terracotta-600">
      {children}
    </p>
  );
}
