// Contact form rules, checked in the browser for quick feedback and again on
// the server (app/[lang]/contact/actions.ts). Files travel through our server,
// and Vercel caps a request at 4.5MB, so attachments stay under 4MB in total.

export const CONTACT_MAX_FILES = 3;
export const CONTACT_MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** Photos and screenshots. Not SVG: it can carry scripts. */
export const CONTACT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** For the file picker. HEIC files often come without a MIME type, hence the extensions. */
export const CONTACT_ACCEPT = [...CONTACT_IMAGE_TYPES, ".heic", ".heif"].join(",");

/** By type, or by extension when the browser reports no type (common for iPhone photos). */
export function isContactAttachment(file: File) {
  return CONTACT_IMAGE_TYPES.includes(file.type) || (!file.type && /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name));
}

/** Optional. Digits with the usual separators, 7 to 15 digits (the international maximum). */
export function isPhone(value: string) {
  const digits = value.replace(/\D/g, "").length;
  return /^\+?[\d\s\-().]+$/.test(value) && digits >= 7 && digits <= 15;
}
