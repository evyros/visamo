import type { ReactNode } from "react";

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-[28px] leading-tight font-semibold text-balance text-navy-900">{title}</h1>
      {children && <p className="mt-3 text-[16px] text-slate-700">{children}</p>}
    </div>
  );
}
