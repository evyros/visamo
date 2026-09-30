// Links to the buy page (app/(app)/(main)/buy), with the page to go back to
// after buying. Every buy button in the app goes there,
// and only its buttons open the checkout.

/** Where to go back to: a path in the app, never another site or the buy pages themselves. */
export function returnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value === "/buy" || value.startsWith("/buy?") || value.startsWith("/buy/") ? null : value;
}

/** The buy page, coming back to `from` after buying. */
export function buyUrl(from?: string) {
  return from && returnPath(from) ? `/buy?${new URLSearchParams({ from })}` : "/buy";
}

/** The page after paying: what the purchase added, and the way back to `from`. */
export function successUrl(licenseId: string, from?: string | null) {
  const params = new URLSearchParams({ license: licenseId });
  if (from && returnPath(from)) params.set("from", from);
  return `/buy/success?${params}`;
}
