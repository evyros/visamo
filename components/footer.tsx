import Link from "next/link";
import { format, getDictionary, getLocale } from "@/i18n/dictionaries";
import { branchesPath } from "@/content/branches";
import { glossaryPath } from "@/content/glossary";
import { processPath } from "@/content/process";
import { localePath, site } from "@/lib/site";
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
        { href: p("/guide"), label: f.product.guides },
        { href: p(processPath), label: f.product.process },
        { href: p(glossaryPath), label: f.product.glossary },
        { href: p(branchesPath), label: f.product.branches },
        { href: p("/tools/recommendation-letter"), label: f.product.letters },
        { href: p("/pricing"), label: f.product.pricing },
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
      {/* The footer repeats on every page and its disclaimer is the most brand-heavy
          text on the site, so Google lifted it as the snippet for a "Visamo" search.
          data-nosnippet keeps it out (Google honors it on div, span and section). */}
      <div data-nosnippet>
        <Container className="py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <Logo tone="light" />
              <p className="mt-4 max-w-xs text-sm leading-6">{f.tagline}</p>
              <a
                href={site.social.facebook}
                target="_blank"
                rel="noopener"
                aria-label={f.facebook}
                className="mt-5 inline-flex rounded-full hover:text-white"
              >
                <FacebookLogo />
              </a>
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
      </div>
    </footer>
  );
}

/** Facebook's own "f" logo, filled, since brand marks don't redraw as line icons. */
function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true" focusable="false">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
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
