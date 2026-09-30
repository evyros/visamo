import { NextResponse } from "next/server";
import { invoiceOfPurchase } from "@/lib/purchases";
import { findUserCase } from "@/lib/session";

// Serves a purchase's invoice to a member of its case. Freemius has it, and
// its API needs the secret key, so it goes through here.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await findUserCase();
  if (!current) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  // Another case's purchase looks the same as a missing one.
  const invoice = await invoiceOfPurchase(current.caseId, id);
  if (!invoice) return new NextResponse(null, { status: 404 });

  return new NextResponse(invoice, {
    headers: {
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="visamo-invoice-${id.slice(0, 8)}.pdf"`,
    },
  });
}
