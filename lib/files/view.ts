/** An uploaded file as the documents page shows it. */
export type FileView = {
  id: string;
  documentKey: string;
  contentType: string;
  name: string;
  hasThumbnail: boolean;
  /** Page count; null when unknown (a file that couldn't be opened, or one uploaded before it was kept). */
  pages: number | null;
  /** Bytes, as uploaded. */
  size: number;
  /** Null when the uploader's account is gone. */
  uploaderName: string | null;
  /** ISO date. */
  createdAt: string;
};

export function fileView(row: {
  id: string;
  documentKey: string;
  contentType: string;
  name: string;
  hasThumbnail: boolean;
  pages: number | null;
  size: number;
  uploaderName: string | null;
  createdAt: Date;
}): FileView {
  return {
    id: row.id,
    documentKey: row.documentKey,
    contentType: row.contentType,
    name: row.name,
    hasThumbnail: row.hasThumbnail,
    pages: row.pages,
    size: row.size,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt.toISOString(),
  };
}
