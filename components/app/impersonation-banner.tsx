import { stopImpersonating } from "@/app/(app)/actions";
import { getSession } from "@/lib/session";

// Shown over the app while the admin is signed in as a user
// (lib/impersonation.ts). Only the admin sees it, so it's in English.
export async function ImpersonationBanner() {
  const session = await getSession();
  if (!session?.session.impersonationId) return null;

  return (
    <div dir="ltr" className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-amber-100 px-4 py-2 text-sm text-navy-900 sm:px-6">
      <span>
        Signed in as <strong className="font-semibold">{session.user.name}</strong> ({session.user.email}) from the
        admin panel. Everything you do here counts as theirs.
      </span>
      <form action={stopImpersonating} className="ms-auto">
        <button type="submit" className="font-semibold text-terracotta-600 hover:underline">
          Exit
        </button>
      </form>
    </div>
  );
}
