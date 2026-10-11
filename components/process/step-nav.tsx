"use client";

import { useEffect, useState } from "react";

// The list of steps beside the process guide, from lg up. The step being read
// is the one crossing a thin band near the top of the screen; between steps,
// the last one stays highlighted.

export function StepNav({ label, items }: { label: string; items: { id: string; number?: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.map((item) => document.getElementById(item.id)).filter((el) => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const crossing = entries.find((entry) => entry.isIntersecting);
        if (crossing) setActive(crossing.target.id);
      },
      { rootMargin: "-25% 0px -70% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-28">
      <p className="text-sm font-semibold text-navy-900">{label}</p>
      <ol className="mt-4 border-s border-line-200">
        {items.map((item) => {
          const current = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "true" : undefined}
                className={`-ms-px flex gap-3 border-s-2 py-1.5 ps-4 text-[15px] leading-6 transition-colors ${
                  current
                    ? "border-teal-600 font-semibold text-navy-900"
                    : "border-transparent text-slate-500 hover:text-navy-900"
                }`}
              >
                {item.number && <span className={`w-4 shrink-0 tabular-nums ${current ? "text-teal-700" : ""}`}>{item.number}</span>}
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
