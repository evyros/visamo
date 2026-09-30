import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { checkoutOptions, freemiusReady, planIds } from "@/lib/freemius";
import { BUY_COOKIE, isProductId } from "@/lib/products";
import { requireCase } from "@/lib/session";
import { AppHeader, mainSections } from "@/components/app/app-header";
import { BottomTabs } from "@/components/app/app-nav";
import { PurchaseProvider } from "@/components/app/purchase";

// Every page in here needs a signed-in user who has finished sign-up and
// onboarding (so has a case). The shell fills the window: the top bar and the
// phone tab bar stay put, and each section's layout (file/, chat/, settings/,
// support/) brings its own sidebar and scrolling page. The buy page opens the
// checkout over it (components/app/purchase.tsx).
export default async function MainLayout({ children }: { children: ReactNode }) {
  const { user, caseId } = await requireCase();
  const [t, locale] = await Promise.all([getAppDictionary(), getAppLocale()]);
  const ready = freemiusReady();

  return (
    <PurchaseProvider
      options={ready ? await checkoutOptions(user, locale) : null}
      plans={ready ? planIds() : null}
      pending={await pendingPurchase(caseId)}
      t={t.app.purchase}
    >
      <div className="flex h-dvh flex-col">
        <AppHeader />
        {children}
        <BottomTabs items={mainSections(t)} label={t.app.shell.sections} />
      </div>
    </PurchaseProvider>
  );
}

/** What the person chose on the pricing page (proxy.ts), unless the case already has it: the buy page opens. */
async function pendingPurchase(caseId: string) {
  const product = (await cookies()).get(BUY_COOKIE)?.value;
  if (!isProductId(product)) return null;
  if (product === "fileCheck") {
    const [row] = await db.select({ fileCheck: cases.fileCheck }).from(cases).where(eq(cases.id, caseId)).limit(1);
    if (row?.fileCheck) return null;
  }
  return product;
}
