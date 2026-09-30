import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

// Documents is the user's only page so far.
export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  await requireAdmin();
  const { id } = await params;
  redirect(`/users/${id}/documents`);
}
