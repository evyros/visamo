/** An uploaded file as the documents page shows it. */
export type FileView = {
  id: string;
  documentKey: string;
  contentType: string;
  name: string;
  hasThumbnail: boolean;
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
  uploaderName: string | null;
  createdAt: Date;
}): FileView {
  return {
    id: row.id,
    documentKey: row.documentKey,
    contentType: row.contentType,
    name: row.name,
    hasThumbnail: row.hasThumbnail,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt.toISOString(),
  };
}
