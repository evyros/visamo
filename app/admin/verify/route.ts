import { NextResponse, type NextRequest } from "next/server";
import { signInWithLink } from "@/lib/admin";
import { site } from "@/lib/site";

// The login link from the email. Redirects are absolute on the admin host:
// request.url here is the rewritten /admin/verify.
export async function GET(request: NextRequest) {
  const ok = await signInWithLink(request.nextUrl.searchParams.get("token"));
  return NextResponse.redirect(new URL(ok ? "/" : "/login?error=link", site.adminUrl));
}
