// Creates the admin panel's authenticator secret (lib/totp.ts). Run once:
//   node scripts/admin-totp.mjs [email]
// Put the ADMIN_TOTP_SECRET line in .env.local and in Vercel (Production),
// and add the setup key to your authenticator app. Running it again makes a
// new secret, and the old one stops working once the env var changes.
import { randomBytes } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bits = [...randomBytes(20)].map((byte) => byte.toString(2).padStart(8, "0")).join("");
const secret = bits.match(/.{5}/g).map((chunk) => BASE32[parseInt(chunk, 2)]).join("");

const account = process.argv[2] ?? "admin";
const uri = `otpauth://totp/${encodeURIComponent(`Visamo admin:${account}`)}?secret=${secret}&issuer=${encodeURIComponent("Visamo admin")}&algorithm=SHA1&digits=6&period=30`;

console.log(`
Env var (.env.local and Vercel, Production):
  ADMIN_TOTP_SECRET=${secret}

Setup key, for "Enter a setup key" in your authenticator app
(account: Visamo admin, type: time based):
  ${secret.match(/.{4}/g).join(" ")}

Or open this link on a device with an authenticator app:
  ${uri}
`);
