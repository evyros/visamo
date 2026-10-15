import "server-only";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import type { LetterInput } from "./pdf";
import type { LetterRequest } from "./requests";
import {
  ID_IMAGE_LONG_SIDE,
  ID_IMAGE_MAX_BYTES,
  ID_PDF_MAX_BYTES,
  SIGNATURE_MAX_BYTES,
  bodyProblem,
  cleanBody,
  isIsraeliId,
  isPersonName,
  isPhone,
} from "./rules";

// What the friend's page posts (components/letters/letter-writer.tsx), checked
// again on the server and turned into the PDF's input. The browser already
// shrank the ID card photo; it's decoded and re-encoded here anyway, so a
// file that isn't really an image, or one that skipped the browser, can't
// reach the PDF. A scanned ID card can also come as a PDF, which is only
// checked here: its first page goes into the letter as it is. Nothing here
// is logged or kept.

export type LetterFormResult = { ok: true; input: LetterInput } | { ok: false; error: "invalid" | "image" };

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const file = (data: FormData, key: string) => {
  const value = data.get(key);
  return value instanceof File && value.size > 0 ? value : null;
};

export async function readLetterForm(data: FormData, request: LetterRequest): Promise<LetterFormResult> {
  const body = cleanBody(text(data, "body"));
  const writer = {
    name: text(data, "name"),
    idNumber: text(data, "idNumber").replace(/[\s-]/g, ""),
    phone: text(data, "phone"),
  };
  const idCardFile = file(data, "idCard");
  const signatureFile = file(data, "signature");

  const valid =
    !bodyProblem(body) &&
    isPersonName(writer.name) &&
    isIsraeliId(writer.idNumber) &&
    isPhone(writer.phone) &&
    !!idCardFile &&
    idCardFile.size <= ID_PDF_MAX_BYTES &&
    !!signatureFile &&
    signatureFile.size <= SIGNATURE_MAX_BYTES;
  if (!valid) return { ok: false, error: "invalid" };

  let idCard: LetterInput["idCard"];
  let signature: Buffer;
  try {
    const bytes = Buffer.from(await idCardFile.arrayBuffer());
    if (isPdf(bytes)) {
      // Loading it is the check: a damaged or password-protected PDF throws.
      const scan = await PDFDocument.load(bytes, { updateMetadata: false });
      if (scan.getPageCount() === 0) return { ok: false, error: "image" };
      idCard = { kind: "pdf", bytes: new Uint8Array(bytes) };
    } else {
      if (bytes.length > ID_IMAGE_MAX_BYTES) return { ok: false, error: "invalid" };
      const jpeg = await sharp(bytes, { failOn: "error" })
        .rotate()
        .resize({ width: ID_IMAGE_LONG_SIDE, height: ID_IMAGE_LONG_SIDE, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80 })
        .toBuffer();
      idCard = { kind: "image", bytes: new Uint8Array(jpeg) };
    }
    const drawn = sharp(Buffer.from(await signatureFile.arrayBuffer()), { failOn: "error" }).ensureAlpha();
    // A signature with nothing drawn is fully transparent.
    const { channels } = await drawn.stats();
    if (channels[3].max === 0) return { ok: false, error: "invalid" };
    signature = await drawn.resize({ width: 1200, height: 600, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { ok: false, error: "image" };
  }

  return {
    ok: true,
    input: {
      names: [request.names[0], request.names[1]],
      writer,
      body,
      signature: new Uint8Array(signature),
      idCard,
      date: new Date(),
    },
  };
}

/** A PDF starts with "%PDF-", within its first kilobyte. */
function isPdf(bytes: Buffer) {
  return bytes.subarray(0, 1024).includes("%PDF-");
}
