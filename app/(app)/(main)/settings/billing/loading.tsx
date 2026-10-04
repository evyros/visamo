import { SettingsSkeleton } from "@/components/app/page-skeleton";

// The file's balances, then purchase history.
export default function BillingLoading() {
  return <SettingsSkeleton cards={[4, 3]} />;
}
