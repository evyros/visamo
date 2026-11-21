import type { Messages } from "@/i18n/dictionaries";
import type { ProductId } from "@/lib/products";
import { newPrices } from "@/lib/site";

// Under a product's price while it was just lowered: a "New price, until EOY"
// badge. Never the old price, struck through or "was".
export function NewPrice({ product, t }: { product: ProductId; t: Messages }) {
  if (!newPrices.has(product)) return null;
  return (
    <p className="mt-2">
      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
        {t.pricing.newPrice.badge}
      </span>
    </p>
  );
}
