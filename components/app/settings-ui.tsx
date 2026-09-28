import type { ReactNode } from "react";

// Layout pieces for the settings pages: a page of titled cards.

export function SettingsPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{title}</h1>
      {intro && <p className="mt-3 text-slate-700">{intro}</p>}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function SettingsCard({
  title,
  tone = "default",
  children,
}: {
  title: string;
  /** `danger` for actions that can't be undone. */
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  const border = tone === "danger" ? "border-terracotta-600/30" : "border-line-200";
  const heading = tone === "danger" ? "text-terracotta-600" : "text-navy-900";
  return (
    <section className={`rounded-card border bg-white p-5 sm:p-6 ${border}`}>
      <h2 className={`text-lg font-semibold ${heading}`}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70";

export const secondaryButton = `${buttonBase} border-[1.5px] border-navy-900 text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-900`;

export const dangerButton = `${buttonBase} bg-terracotta-600 text-white hover:bg-terracotta-600/90 focus-visible:outline-terracotta-600`;

export const dangerOutlineButton = `${buttonBase} border-[1.5px] border-terracotta-600 text-terracotta-600 hover:bg-terracotta-100 focus-visible:outline-terracotta-600`;
