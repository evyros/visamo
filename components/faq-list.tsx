import type { Locale } from "@/i18n/config";
import { localePath, signupUrl } from "@/lib/site";
import { Icon } from "./icons";
import { TextLink } from "./ui";

// `signup`: a link to sign up under the answer, with this label.
type FaqItem = { q: string; a: string; link?: { label: string; path: string }; signup?: string };

export function FaqList({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  return (
    <div className="divide-y divide-line-200 rounded-2xl border border-line-200 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-6">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 font-semibold text-navy-900">
            {item.q}
            <Icon name="chevronDown" className="size-5 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-6 text-[16px] leading-7">
            <p>{item.a}</p>
            {item.link && (
              <TextLink href={localePath(locale, item.link.path)} className="mt-3">
                {item.link.label}
              </TextLink>
            )}
            {item.signup && (
              <TextLink href={signupUrl(locale)} className="mt-3">
                {item.signup}
              </TextLink>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
