import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import Link from "next/link";
import { Icon, isIconName } from "../icons";
import { Container, IconTile, mobileCenter } from "../ui";

export function SecurityBand({ t, locale }: { t: Messages; locale: Locale }) {
  const s = t.home.security;
  return (
    <section className="bg-navy-900 py-16 text-slate-300 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        <div className={mobileCenter}>
          <p className="text-sm font-semibold tracking-wide text-sage-200">{s.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-balance text-white sm:text-[40px]">
            {s.title}
          </h2>
          <p className="mt-4 text-lg">{s.intro}</p>
          <Link
            href={localePath(locale, "/security")}
            className="mt-6 inline-flex items-center gap-1.5 font-semibold text-sage-200 underline-offset-4 hover:underline"
          >
            {s.link}
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {s.promises.map((promise) => (
            <div key={promise.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              {isIconName(promise.icon) && <IconTile name={promise.icon} tone="dark" />}
              <p className="mt-4 font-semibold text-white">{promise.title}</p>
              <p className="mt-1 text-[15px] leading-7">{promise.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
