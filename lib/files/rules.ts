// What can be uploaded, shared by the browser (to fail early) and the server
// (which checks the file's contents, not what the browser says).

export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type AcceptedType = (typeof ACCEPTED_TYPES)[number];

/** Per file. Scanned PDFs and phone photos are rarely bigger. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Per document, everything that goes with it: a passport's pages, a certificate and its apostille and translation. */
export const MAX_FILES_PER_DOCUMENT = 10;

export const isAcceptedType = (type: string): type is AcceptedType =>
  (ACCEPTED_TYPES as readonly string[]).includes(type);

/** The type from the file's first bytes, or null if it's none of the accepted ones. */
export function sniffType(bytes: Uint8Array): AcceptedType | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf"; // %PDF-
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  return null;
}
