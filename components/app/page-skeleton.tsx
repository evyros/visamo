import { getAppDictionary } from "@/i18n/app-locale";

/** A page's title over a placeholder, until the page itself is built. */
export async function PageSkeleton({ title }: { title: string }) {
  const t = await getAppDictionary();
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{title}</h1>
      <p className="mt-3 text-slate-500">{t.app.shell.placeholder}</p>
    </div>
  );
}
