import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { format, type Messages } from "@/i18n/messages";
import { returnPath } from "@/lib/buy-paths";
import { chatBalance } from "@/lib/chat/store";
import { checkBalance } from "@/lib/checks/store";
import type { ProductId } from "@/lib/products";
import { purchaseOfLicense, recordPurchase } from "@/lib/purchases";
import { requireCase } from "@/lib/session";
import { primaryButton } from "@/components/app/settings-ui";
import { Icon } from "@/components/icons";
import { TextLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.purchased };
}

/** Where each product is used. */
const destinations: Record<ProductId, string> = {
  messagePack: "/chat",
  fileCheck: "/file/documents",
};

// Where the checkout sends the user once they've paid (components/app/purchase.tsx):
// ?license= is the Freemius license, ?from= the page they came to buy from.
// The page records the purchase if the webhook hasn't yet (lib/purchases.ts
// reads it from Freemius, and it must be this user's), then shows what it
// added. The main action goes back to where they were.
export default async function PurchasedPage({ searchParams }: PageProps<"/buy/success">) {
  const { user, caseId } = await requireCase();
  const params = await searchParams;
  const license = typeof params.license === "string" && /^\d+$/.test(params.license) ? params.license : null;
  if (!license) redirect("/settings/billing");

  const [messages, locale, product] = await Promise.all([
    getAppDictionary(),
    getAppLocale(),
    (async () =>
      (await purchaseOfLicense(caseId, license)) ??
      (await recordPurchase(license, { id: user.id, email: user.email, caseId })))(),
  ]);
  // After the purchase is recorded, so they include it.
  const [chat, checks] = await Promise.all([chatBalance(caseId), checkBalance(caseId)]);
  const t = messages.app.purchased;
  const count = (n: number) => new Intl.NumberFormat(locales[locale].intlLocale).format(n);

  // Not the billing page: from there, the purchase is better used than looked at.
  const from = returnPath(params.from);
  const back = from && !from.startsWith("/settings/billing") ? from : null;
  const destination = product ? destinations[product] : null;
  // Back to where they were; without that, to where the purchase is used.
  const main = back
    ? { href: back, label: backLabel(back, t) }
    : destination
      ? { href: destination, label: t.use[product!] }
      : { href: "/file", label: t.back.other };
  // Where the purchase is used, when that's not where they're going back to.
  const use = product && destination && !main.href.startsWith(destination) ? { href: destination, label: t.use[product] } : null;
  const copy = product ? t[product] : t.unknown;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-12 text-center sm:px-6 lg:py-16">
      <span className="animate-pop inline-flex size-20 items-center justify-center rounded-full bg-teal-600 text-white shadow-soft">
        <Icon name="check" className="size-11" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-wide text-teal-700 uppercase">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{copy.title}</h1>
      <p className="mt-4 text-lg text-slate-700">{copy.body}</p>
      {product === "fileCheck" && <p className="mt-3 text-slate-700">{t.fileCheck.messages}</p>}

      {product && (
        <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-teal-100 px-4 py-2 text-[15px] text-navy-900">
          <Icon name="checkCircle" className="size-5 text-teal-700" />
          {checks.fileCheck
            ? format(t.hasFileCheck, { messages: count(chat.messagesLeft), checks: count(checks.left) })
            : format(t.hasMessages, { messages: count(chat.messagesLeft) })}
        </p>
      )}

      <div className="mt-8 flex w-full flex-col items-center gap-4">
        <Link href={main.href} className={`${primaryButton} w-full sm:w-auto sm:min-w-64`}>
          {main.label}
        </Link>
        {use && (
          <TextLink href={use.href}>{use.label}</TextLink>
        )}
      </div>

      <p className="mt-12 text-sm text-slate-500">
        {t.support}{" "}
        <Link href="/support" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          {t.supportLink}
        </Link>
      </p>
    </div>
  );
}

/** "Back to your chat" and the like, for the page the user came from. */
function backLabel(path: string, t: Messages["app"]["purchased"]) {
  if (path.startsWith("/chat")) return t.back.chat;
  if (path.startsWith("/file/documents")) return t.back.documents;
  return t.back.other;
}
