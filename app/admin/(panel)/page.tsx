import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

// Users is the only screen so far.
export default async function AdminHomePage() {
  await requireAdmin();
  redirect("/users");
}
