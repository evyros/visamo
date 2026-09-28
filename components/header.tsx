import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { LOCALE_COOKIE, liveLocales, locales } from "@/i18n/config";
import { localePath, loginUrl, signupUrl, whatsappUrl } from "@/lib/site";
import { LanguageSwitch } from "./language-switch";
import { MobileNav } from "./mobile-nav";
import { ButtonLink, Container } from "./ui";
import { Logo } from "./logo";

export async function Header() {
  const locale = await getLocale();
  const t = await getDictionary();

  const links = [
    { href: `${localePath(locale)}#why`, label: t.nav.why },
    { href: `${localePath(locale)}#how-it-works`, label: t.nav.howItWorks },
    { href: `${localePath(locale)}#features`, label: t.nav.features },
    { href: localePath(locale, "/pricing"), label: t.nav.pricing },
    { href: localePath(locale, "/contact"), label: t.nav.contact },
  ];

  const languageSwitch = (
    <LanguageSwitch
      current={locale}
      label={t.nav.language}
      cookieName={LOCALE_COOKIE}
      options={liveLocales.map((code) => ({
        code,
        nativeName: locales[code].nativeName,
        shortName: locales[code].shortName,
        dir: locales[code].dir,
      }))}
    />
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <Container className="flex h-[60px] items-center gap-8 lg:h-[72px]">
        <Link href={localePath(locale)} className="flex shrink-0 items-center" aria-label="Visamo">
          <Logo />
        </Link>

        <nav aria-label={t.nav.label} className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[15px] font-medium text-slate-700 hover:text-navy-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-3">
          <div className="hidden sm:block">{languageSwitch}</div>
          <Link
            href={loginUrl(locale)}
            className="hidden px-2 text-[15px] font-semibold text-navy-900 hover:underline lg:inline"
          >
            {t.nav.login}
          </Link>
          <div className="hidden lg:block">
            <ButtonLink href={signupUrl(locale)} size="sm">
              {t.nav.startFree}
            </ButtonLink>
          </div>
          <MobileNav
            links={links}
            cta={{ href: signupUrl(locale), label: t.common.ctaPrimary }}
            login={{ href: loginUrl(locale), label: t.nav.login }}
            whatsapp={{ href: whatsappUrl(), label: t.nav.whatsapp }}
            labels={{ open: t.nav.openMenu, close: t.nav.closeMenu, nav: t.nav.label }}
            languageSwitch={<div className="sm:hidden">{languageSwitch}</div>}
          />
        </div>
      </Container>
    </header>
  );
}
