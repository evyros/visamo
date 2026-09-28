import type { FileSlot } from "./rules";

/** An uploaded file as the documents page shows it. */
export type FileView = {
  id: string;
  documentKey: string;
  slot: FileSlot;
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
  slot: string;
  contentType: string;
  name: string;
  hasThumbnail: boolean;
  uploaderName: string | null;
  createdAt: Date;
}): FileView {
  return { ...row, slot: row.slot as FileSlot, createdAt: row.createdAt.toISOString() };
}
