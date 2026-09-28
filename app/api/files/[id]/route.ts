import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { caseFile } from "@/lib/db/schema";
import { filePath, thumbnailPath } from "@/lib/files/storage";
import { findUserCase } from "@/lib/session";

// Serves an uploaded file, or with ?thumbnail its thumbnail, to a member of
// its case. Private blobs have no public URL: everything goes through here.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await findUserCase();
  if (!current) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const [file] = await db
    .select()
    .from(caseFile)
    .where(and(eq(caseFile.id, id), eq(caseFile.caseId, current.caseId)))
    .limit(1);
  // Another case's file looks the same as a missing one.
  if (!file) return new NextResponse(null, { status: 404 });

  const thumbnail = request.nextUrl.searchParams.has("thumbnail");
  if (thumbnail && !file.hasThumbnail) return new NextResponse(null, { status: 404 });
  const result = await get(thumbnail ? thumbnailPath(file.caseId, file.id) : filePath(file.caseId, file.id), {
    access: "private",
  });
  if (result?.statusCode !== 200) return new NextResponse(null, { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": thumbnail ? "image/jpeg" : file.contentType,
      "Content-Length": String(result.blob.size),
      "X-Content-Type-Options": "nosniff",
      // Identity documents: never kept on disk or in a shared cache.
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
  });
}
