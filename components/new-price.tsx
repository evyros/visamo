import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import type { ProductId } from "@/lib/products";
import { afterLaunchPrices, prices } from "@/lib/site";

// Under a product's price while it sells below the price it will go up to:
// what buying now saves, then that higher price. Said as "will go up to",
// never "was" or struck through: the higher price has not been charged yet.
export function LaunchPrice({ product, t, locale }: { product: ProductId; t: Messages; locale: Locale }) {
  const later = afterLaunchPrices[product];
  if (!later) return null;
  const l = t.pricing.launch;
  const [before, after] = l.later.split("{price}");
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
        {format(l.save, { amount: formatPrice(later - prices[product], locale) })}
      </span>
      <span>
        {before}
        <bdi>{formatPrice(later, locale)}</bdi>
        {after}
      </span>
    </p>
  );
}
