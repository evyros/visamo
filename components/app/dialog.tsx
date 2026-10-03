"use client";

import type { ReactNode, RefObject } from "react";
import { Icon } from "@/components/icons";

/** A native modal dialog, closed by its button, Escape or a click outside. */
export function Dialog({
  ref,
  title,
  closeLabel,
  children,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
      className="m-auto w-[min(92vw,480px)] rounded-card bg-white p-0 shadow-soft backdrop:bg-navy-900/50"
    >
      <div className="flex items-center gap-3 border-b border-line-200 px-5 py-3">
        <h3 className="min-w-0 flex-1 text-lg font-semibold text-navy-900">{title}</h3>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => ref.current?.close()}
          className="inline-flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
        >
          <Icon name="x" className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-auto px-5 py-5">{children}</div>
    </dialog>
  );
}
