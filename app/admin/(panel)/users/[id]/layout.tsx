import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
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
          </div>
          <SidebarNav
            label="User"
            items={[{ href: `${base}/documents`, label: "Documents", icon: "file", includeSubpages: true }]}
          />
        </>
      }
    >
      {children}
    </SectionShell>
  );
}
