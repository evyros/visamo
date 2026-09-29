import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import { AuthHeading } from "@/components/app/auth-heading";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/");
  const { error } = await searchParams;

  return (
    <main id="main" className="flex flex-1 flex-col items-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-[440px] rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10">
        <AuthHeading title="Visamo admin" />
        <AdminLoginForm linkFailed={error === "link"} />
      </div>
    </main>
  );
}
