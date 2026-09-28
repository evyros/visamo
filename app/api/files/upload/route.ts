import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { fileIdIn } from "@/lib/files/storage";
import { ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/files/rules";
import { findUserCase } from "@/lib/session";

// Gives the browser a token to upload one file straight to the private Blob
// store (functions can't receive files over 4.5 MB). The path comes from
// startUpload (file/documents/actions.ts); the token is only for a path in
// the user's own case. finishUpload then checks the file and records it.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const current = await findUserCase();
        if (!current || !fileIdIn(pathname, current.caseId)) throw new Error("Not allowed");
        return {
          allowedContentTypes: [...ACCEPTED_TYPES],
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
