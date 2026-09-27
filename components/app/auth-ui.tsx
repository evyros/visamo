import type { ComponentProps, ReactNode } from "react";

// Building blocks shared by the sign-in forms.

export const inputClass =
  "mt-1.5 w-full rounded-[10px] border border-line-200 bg-white px-3.5 py-2.5 text-[16px] text-navy-900 transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 aria-invalid:border-terracotta-600";

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
      <label htmlFor={id} className="block text-[15px] font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-terracotta-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-600">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** aria props tying an input to its error, or else its hint. */
export function describe(id: string, error?: string, hasHint = false) {
  return {
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  };
}

export function SubmitButton({ pending, pendingLabel, children, ...props }: ComponentProps<"button"> & {
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-teal-600 px-6 text-base font-semibold text-white shadow-soft transition-colors hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-70"
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** A form-level message: an error, or a success notice. */
export function Notice({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-terracotta-600/30 bg-terracotta-100 text-terracotta-600"
      : "border-teal-600/30 bg-teal-100/50 text-navy-900";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-[10px] border px-4 py-3 text-[15px] ${styles}`}>
      {children}
    </p>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600" role="separator">
      <span className="h-px flex-1 bg-line-200" />
      {label}
      <span className="h-px flex-1 bg-line-200" />
    </div>
  );
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
