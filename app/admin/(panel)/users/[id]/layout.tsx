import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { currentConsent } from "@/lib/support-access";
import { formatDateTime, Pill } from "@/components/admin/admin-ui";
import { SidebarNav } from "@/components/app/app-nav";
import { SectionShell } from "@/components/app/section-shell";
import { Icon } from "@/components/icons";

// One user's screen: who they are at the top of the sidebar, and their pages under it.
export default async function AdminUserLayout({ children, params }: LayoutProps<"/admin/users/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const user = await findUser(id);
  if (!user) notFound();
  const base = `/users/${user.id}`;
  const consentUntil = user.caseId ? await currentConsent(user.caseId) : null;

  return (
    <SectionShell
      title={user.name}
      labels={{ open: "Open user menu", close: "Close user menu" }}
      sidebar={
        <>
          <Link
            href="/users"
            className="mb-4 inline-flex items-center gap-1.5 self-start px-3 text-sm font-semibold text-teal-700 hover:underline"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            All users
          </Link>
          <div className="mb-4 border-b border-line-200 px-3 pb-4">
            <div className="font-semibold break-words text-navy-900">{user.name}</div>
            <div className="text-sm break-all text-slate-500">{user.email}</div>
            {consentUntil && (
              <div className="mt-2">
                <Pill tone="teal">Consent until {formatDateTime(consentUntil)}</Pill>
              </div>
            )}
          </div>
          <SidebarNav
            label="User"
            items={[
              { href: `${base}/documents`, label: "Documents", icon: "file", includeSubpages: true },
              { href: `${base}/chats`, label: "Chats", icon: "chat", includeSubpages: true },
              { href: `${base}/balance`, label: "Balance", icon: "receipt" },
              { href: `${base}/access`, label: "Access", icon: "shield" },
            ]}
          />
        </>
      }
    >
      {children}
    </SectionShell>
  );
}
