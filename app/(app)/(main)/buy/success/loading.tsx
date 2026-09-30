import { getAppDictionary } from "@/i18n/app-locale";
import { ConfirmingPayment } from "@/components/app/purchase";

// While the success page records the purchase with Freemius.
export default async function PurchasedLoading() {
  const t = (await getAppDictionary()).app.purchase;
  return <ConfirmingPayment label={t.confirming} />;
}
