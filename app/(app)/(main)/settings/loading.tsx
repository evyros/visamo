import { SettingsSkeleton } from "@/components/app/page-skeleton";

// Account: login, password, two-step, language, delete.
export default function AccountLoading() {
  return <SettingsSkeleton cards={[2, 3, 1, 2]} />;
}
