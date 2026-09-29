import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <main id="main" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] font-semibold text-navy-900">Visamo admin</h1>
        <form action={signOut} className="flex items-center gap-4 text-sm text-slate-600">
          <span>{admin}</span>
          <button type="submit" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
