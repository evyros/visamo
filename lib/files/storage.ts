import "server-only";
import { del, list } from "@vercel/blob";

// Where a case's files live in the private Blob store:
//
//   cases/{caseId}/files/{fileId}/original
//   cases/{caseId}/files/{fileId}/thumbnail
//
// One folder per file, so a file and its thumbnail go together, and one
// prefix per case, so a case's files can be deleted in one sweep. Nothing
// personal or changeable in the path (no names, no document ids): paths show
// up in logs, and can't be renamed. A path is never written twice; a
// replaced file gets a new id.

export const caseFolder = (caseId: string) => `cases/${caseId}/`;
export const filePath = (caseId: string, fileId: string) => `cases/${caseId}/files/${fileId}/original`;
export const thumbnailPath = (caseId: string, fileId: string) => `cases/${caseId}/files/${fileId}/thumbnail`;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** The file id in a case's original-file path, or null for any other path. */
export function fileIdIn(pathname: string, caseId: string): string | null {
  const match = new RegExp(`^cases/${caseId}/files/(${UUID})/original$`).exec(pathname);
  return match ? match[1] : null;
}

/** Deletes every blob of a case. For when the case itself is deleted. */
export async function deleteCaseBlobs(caseId: string) {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: caseFolder(caseId), cursor });
    if (page.blobs.length) await del(page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
