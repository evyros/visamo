import { createHmac, timingSafeEqual } from "node:crypto";

// Authenticator-app codes (TOTP, RFC 6238): the 6 digits that change every 30
// seconds in Google Authenticator, 1Password, Apple Passwords and the like.
// The app and the server share a secret and each derive the code from it and
// the current time, so there's nothing to register and no service involved.
// Used by the admin login (lib/admin.ts). New secret: scripts/admin-totp.mjs.

const STEP = 30;
const DIGITS = 6;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** The secret's bytes, from the base32 authenticator apps use. Null when it isn't base32. */
export function decodeBase32(value: string) {
  const clean = value.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) return null;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) ?? [];
  return bytes.length ? Buffer.from(bytes) : null;
}

/** The code for one 30-second step (HOTP, RFC 4226). */
export function codeAt(secret: Buffer, step: number, digits = DIGITS) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const value = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(value % 10 ** digits).padStart(digits, "0");
}

/**
 * Whether `code` is the current code, or the one just before or after it, so
 * a phone clock that's a little off still works. Compared in constant time.
 */
export function verifyTotp(secret: Buffer, code: string, now = Date.now()) {
  const typed = Buffer.from(code.replace(/\s/g, ""));
  if (typed.length !== DIGITS) return false;
  const step = Math.floor(now / 1000 / STEP);
  let ok = false;
  // Every window is checked, so the timing doesn't say which one matched.
  for (const drift of [-1, 0, 1]) {
    if (timingSafeEqual(typed, Buffer.from(codeAt(secret, step + drift)))) ok = true;
  }
  return ok;
}
