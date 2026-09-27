import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { formatPrice } from "@/i18n/format";
import { prices, signupUrl, type TierId } from "@/lib/site";
import { Icon } from "./icons";
import { ButtonLink } from "./ui";

const order: TierId[] = ["free", "assistant", "filePrep"];
const highlighted: TierId = "filePrep";

export function PricingCards({
  t,
  locale,
  compact = false,
  headingLevel: Heading = "h3",
}: {
  t: Messages;
  locale: Locale;
  compact?: boolean;
  /** h2 where the cards aren't under a section heading, so levels aren't skipped. */
  headingLevel?: "h2" | "h3";
}) {
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-3">
      {order.map((id) => {
        const tier = t.pricing.tiers[id];
        const featured = id === highlighted;
        return (
          <article
            key={id}
            // The featured card's 2px border is offset by 1px less padding, so text lines up.
            className={`relative flex flex-col rounded-2xl bg-white ${
              featured
                ? "order-first border-2 border-navy-900 p-[31px] shadow-soft lg:order-none"
                : "border border-line-200 p-8"
            }`}
          >
            {featured && (
              <span className="absolute -top-3 start-8 rounded-full bg-sage-200 px-3 py-1 text-xs font-semibold text-navy-900">
                {t.pricing.mostComplete}
              </span>
            )}
            <Heading className="text-lg font-semibold text-navy-900">{tier.name}</Heading>
            <p className="mt-1 text-[15px] text-slate-500">{tier.tagline}</p>
            <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-4xl font-semibold text-navy-900">
                <bdi>{formatPrice(prices[id], locale)}</bdi>
              </span>
              {tier.priceNote && <span className="text-sm text-slate-500">{tier.priceNote}</span>}
            </p>

            {!compact && (
              <ul className="mt-6 space-y-3 text-[15px]">
                {tier.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Icon name="check" className="mt-1 size-4 text-teal-600" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-8">
              <ButtonLink href={signupUrl(locale, id)} variant={featured ? "primary" : "secondary"} className="w-full">
                {tier.cta}
              </ButtonLink>
              <p className="mt-3 text-center text-xs text-slate-500">{tier.footnote}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
