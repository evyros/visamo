import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import type { ProductId } from "@/lib/products";
import { afterLaunchPrices, prices } from "@/lib/site";

// Under a product's price while it sells at a launch price: the price it goes
// up to after launch, struck through, and what that saves. Said as "after
// launch", never "was": the higher price has not been charged yet.
export function LaunchPrice({ product, t, locale }: { product: ProductId; t: Messages; locale: Locale }) {
  const later = afterLaunchPrices[product];
  if (!later) return null;
  const l = t.pricing.launch;
  const [before, after] = l.after.split("{price}");
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{l.badge}</span>
      <span>
        {before}
        <s>
          <bdi>{formatPrice(later, locale)}</bdi>
        </s>
        {after}
      </span>
      <span aria-hidden="true">·</span>
      <span className="font-semibold text-teal-700">
        {format(l.save, { amount: formatPrice(later - prices[product], locale) })}
      </span>
    </p>
  );
}
