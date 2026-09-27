import { saveLocale } from "@/app/(app)/actions";
import { LOCALE_COOKIE, liveLocales, locales } from "@/i18n/config";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { LanguageSwitch } from "@/components/language-switch";

export async function AppLanguageSwitch() {
  const locale = await getAppLocale();
  const t = await getAppDictionary();
  return (
    <LanguageSwitch
      current={locale}
      label={t.nav.language}
      cookieName={LOCALE_COOKIE}
      saveLocale={saveLocale}
      options={liveLocales.map((code) => ({
        code,
        nativeName: locales[code].nativeName,
        dir: locales[code].dir,
      }))}
    />
  );
}
