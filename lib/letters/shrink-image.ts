import { ID_IMAGE_LONG_SIDE, ID_IMAGE_MAX_BYTES } from "./rules";

// In the browser: the friend's ID card photo, made small enough to post
// (Vercel takes 4.5MB a request) and to email. A phone photo of 3-8MB comes
// out at a few hundred KB, still sharp enough to read every detail. Drawing it
// on a canvas also drops the photo's metadata, its location included.

/** A JPEG of the photo, at most ID_IMAGE_LONG_SIDE on its long side. Throws when the browser can't read it (HEIC on most desktops). */
export async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, ID_IMAGE_LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.8, 0.65, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Couldn't encode the photo");
    if (blob.size <= ID_IMAGE_MAX_BYTES) return blob;
  }
  throw new Error("Photo too large");
}
