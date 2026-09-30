"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { Checkout } from "@freemius/checkout";
import { clearBuyIntent } from "@/app/(app)/actions";
import type { Messages } from "@/i18n/messages";
import { buyUrl, successUrl } from "@/lib/buy-paths";
import type { CheckoutOptions } from "@/lib/freemius";
import type { ProductId } from "@/lib/products";
import { Icon } from "@/components/icons";

// Buying: the buy page (app/(app)/(main)/buy) shows what there is to buy, and
// its buttons open Freemius Checkout in an overlay over the page, so the user
// never leaves the app. Once they've paid, the overlay closes and the success
// page (buy/success) records the purchase and shows what it added, with the
// way back to where they came from. The checkout script loads on the first
// purchase, not with the page.

type Purchase = {
  /** `from` is the page to go back to after paying. */
  buy: (product: ProductId, from?: string) => void;
  /** The product whose checkout is loading, so its button can show it. */
  opening: ProductId | null;
};

const PurchaseContext = createContext<Purchase | null>(null);

export function usePurchase() {
  const purchase = use(PurchaseContext);
  if (!purchase) throw new Error("usePurchase is used outside PurchaseProvider.");
  return purchase;
}

export function PurchaseProvider({
  options,
  plans,
  pending,
  t,
  children,
}: {
  /** From lib/freemius.ts, or null when Freemius isn't set up (a local run without its keys). */
  options: CheckoutOptions | null;
  plans: Record<ProductId, string> | null;
  /** What the person chose on the pricing page before signing up: the buy page opens. */
  pending: ProductId | null;
  t: Messages["app"]["purchase"];
  children: ReactNode;
}) {
  const router = useRouter();
  const checkout = useRef<Checkout | null>(null);
  const [opening, setOpening] = useState<ProductId | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  // Paid, on the way to the success page: covers the page from the moment the
  // overlay closes, so there's no wait with nothing on screen while the server
  // records the purchase. The success page (or its loading screen) takes over.
  const [confirming, setConfirming] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (pathname.startsWith("/buy/success")) setConfirming(false);
  }

  async function buy(product: ProductId, from?: string) {
    if (opening) return;
    if (!options || !plans) {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    setOpening(product);
    try {
      if (!checkout.current) {
        const { Checkout } = await import("@freemius/checkout");
        checkout.current = new Checkout(options);
      }
      await checkout.current.open({
        plan_id: plans[product],
        afterOpen: () => setOpening(null),
        // Right after the payment: our own page thanks them, not the overlay's.
        purchaseCompleted: (data) => {
          const licenseId = data?.purchase?.license_id;
          if (!licenseId) return;
          setConfirming(true);
          checkout.current?.close();
          router.push(successUrl(String(licenseId), from));
        },
      });
    } catch (error) {
      console.error("Checkout failed to open", error);
      setOpening(null);
      setUnavailable(true);
    }
  }

  // A purchase chosen on the pricing page, once: the buy page, so they see
  // what they get before paying. Forgotten as it opens.
  const opened = useRef(false);
  useEffect(() => {
    if (!pending || opened.current) return;
    opened.current = true;
    void clearBuyIntent();
    router.replace(buyUrl());
  }, [pending, router]);

  return (
    <PurchaseContext value={{ buy, opening }}>
      {children}
      {unavailable && <Unavailable t={t} onClose={() => setUnavailable(false)} />}
      {confirming && (
        // Between the app's top bar (h-16 and its border) and, on a phone, its tab
        // bar, like the loading screen the success page shows there.
        <div className="fixed inset-x-0 top-[65px] bottom-0 z-[70] bg-sand-50 max-sm:bottom-[calc(4rem+1px+env(safe-area-inset-bottom))]">
          <ConfirmingPayment label={t.confirming} />
        </div>
      )}
    </PurchaseContext>
  );
}

/** "Confirming your payment…": over the page right after paying, and the success page's loading screen. */
export function ConfirmingPayment({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center px-4 py-24 text-center">
      <span className="size-10 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
      <p className="mt-5 text-lg text-slate-700">{label}</p>
    </div>
  );
}

/** The checkout couldn't open: at the top of the window, clear of the page's buttons. */
function Unavailable({ t, onClose }: { t: Messages["app"]["purchase"]; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        role="alert"
        className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-terracotta-600/30 bg-terracotta-100 px-4 py-3 text-[15px] text-terracotta-600 shadow-soft"
      >
        <Icon name="info" className="mt-0.5 size-5 shrink-0" />
        <p className="flex-1">{t.unavailable}</p>
        <button type="button" onClick={onClose} aria-label={t.close} className="-m-1 rounded-full p-1 hover:bg-navy-900/5">
          <Icon name="x" className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** A link to the buy page, coming back to this page after buying. */
export function BuyLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  return <Link href={buyUrl(usePathname())} {...props} />;
}

/** A button that opens the checkout for `product`: only on the buy page, after what it includes. */
export function BuyButton({
  product,
  from,
  className = "",
  children,
  ...props
}: Omit<ComponentProps<"button">, "onClick" | "type"> & { product: ProductId; from?: string }) {
  const { buy, opening } = usePurchase();
  const loading = opening === product;
  return (
    <button
      type="button"
      onClick={() => buy(product, from)}
      aria-busy={loading || undefined}
      disabled={!!opening}
      className={`${className} disabled:cursor-wait`}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
