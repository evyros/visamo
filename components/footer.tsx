import Link from "next/link";
import { format, getDictionary, getLocale } from "@/i18n/dictionaries";
import { localePath, loginUrl, site } from "@/lib/site";
import { Icon } from "./icons";
import { Logo } from "./logo";
import { Container } from "./ui";

export async function Footer() {
  const locale = await getLocale();
  const t = await getDictionary();
  const f = t.footer;
  const p = (path: string) => localePath(locale, path);

  const columns = [
    {
      title: f.product.title,
      links: [
        { href: `${p("/")}#how-it-works`, label: f.product.howItWorks },
        { href: `${p("/")}#features`, label: f.product.features },
        { href: p("/pricing"), label: f.product.pricing },
        { href: loginUrl(locale), label: f.product.login },
      ],
    },
    {
      title: f.trust.title,
      links: [
        { href: p("/security"), label: f.trust.security },
        { href: p("/data-privacy"), label: f.trust.dataPrivacy },
        { href: p("/legal/privacy"), label: f.trust.privacy },
        { href: p("/legal/terms"), label: f.trust.terms },
        { href: p("/legal/accessibility"), label: f.trust.accessibility },
      ],
    },
    {
      title: f.company.title,
      links: [
        { href: p("/about"), label: f.company.about },
        { href: p("/how-we-built"), label: f.company.howBuilt },
        { href: p("/contact"), label: f.company.contact },
      ],
    },
  ];

  return (
    <footer className="bg-navy-900 text-slate-300">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-6">{f.tagline}</p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div id="contact">
            <h2 className="text-sm font-semibold text-white">{f.support.title}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={`mailto:${site.supportEmail}`} className="hover:text-white hover:underline">
                  <bdi>{site.supportEmail}</bdi>
                </a>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-300/80">{f.support.hours}</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex gap-3 rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-6">
          <Icon name="info" className="mt-0.5 size-5 text-sage-200" />
          <p>
            <strong className="font-semibold text-white">{f.disclaimerTitle}</strong> {f.disclaimer}
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-300/80 lg:text-start">
          {format(f.copyright, { year: new Date().getFullYear() })}
          <span aria-hidden="true"> · </span>
          <MadeWith text={f.madeWith} label={f.heartLabel} />
        </p>
      </Container>
    </footer>
  );
}

/**
 * Renders the message with a small drawn heart in place of `{heart}`. An empty
 * label hides the heart from screen readers, for languages whose sentence
 * already says "love".
 */
function MadeWith({ text, label }: { text: string; label: string }) {
  const [before, after] = text.split("{heart}");
  return (
    <span>
      {before}
      <svg
        viewBox="0 0 24 24"
        className="inline size-3.5 -translate-y-px fill-terracotta-600 align-middle"
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      >
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
      </svg>
      {after}
    </span>
  );
}
