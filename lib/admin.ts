import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { site } from "./site";
import { decodeBase32, verifyTotp } from "./totp";

// Sign-in for the admin panel (admin.visamo.co.il), separate from the app's
// Better Auth. Only ADMIN_EMAIL can sign in, and nothing is stored in the
// database: the login link and the session are signed tokens (HMAC-SHA256
// with ADMIN_SECRET) that carry their own expiry.
//
// 1. The login form asks for an email and an OTP: the code from an
//    authenticator app, which shares ADMIN_TOTP_SECRET with the server (see
//    lib/totp.ts). Whatever is typed, the browser gets a random nonce cookie
//    and the same "check your email" answer, so a guesser never learns
//    whether they got either one right.
// 2. When both match, a link token goes to the admin's inbox. It is
//    tied to the nonce, so it only works in the browser that asked for it: a
//    forwarded or leaked link is useless.
// 3. The link sets the session cookie, on the admin host only.
//
// Tokens can't be revoked one by one. Changing ADMIN_SECRET or ADMIN_EMAIL
// signs the admin out everywhere.

const SESSION_COOKIE = "admin_session";
const NONCE_COOKIE = "admin_nonce";
const LINK_TTL = 15 * 60;
const SESSION_TTL = 30 * 24 * 60 * 60;

/** A link token signs in; a session token is the signed-in state. The purpose keeps one from passing as the other. */
type Token = { purpose: "link"; email: string; nonce: string; exp: number } | { purpose: "session"; email: string; exp: number };

const now = () => Math.floor(Date.now() / 1000);
const sha256 = (value: string) => createHash("sha256").update(value).digest("base64url");

function secret() {
  const value = process.env.ADMIN_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SECRET must be set to at least 32 characters");
  return value;
}

/** The one email that can sign in, or null when unset (then nobody can). */
function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

/** The authenticator app's shared secret, or null when unset or not base32 (then nobody can sign in). */
function totpSecret() {
  const value = process.env.ADMIN_TOTP_SECRET;
  return value ? decodeBase32(value) : null;
}

function sign(token: Token) {
  const payload = Buffer.from(JSON.stringify(token)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/** The token's contents, when the signature matches and it hasn't expired. */
function verify(value: string | undefined): Token | null {
  const [payload, signature, ...rest] = value?.split(".") ?? [];
  if (!payload || !signature || rest.length) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const token = JSON.parse(Buffer.from(payload, "base64url").toString()) as Token;
    return token.exp > now() ? token : null;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: site.adminUrl.startsWith("https:"),
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/**
 * Step 1: gives this browser a nonce, and returns the login link when `email`
 * is the admin's and `otp` is the authenticator code, or else null. Every caller
 * gets the same cookie and answer, so a correct guess looks like a wrong one.
 */
export async function createLoginLink(email: string, otp: string) {
  const nonce = randomBytes(32).toString("base64url");
  (await cookies()).set(NONCE_COOKIE, nonce, cookieOptions(LINK_TTL));

  const admin = adminEmail();
  // The page looks the same when nothing can match, so say it in the server log.
  const totp = totpSecret();
  if (!admin || !totp || !process.env.ADMIN_SECRET) {
    console.error("Admin login is off: set ADMIN_EMAIL, ADMIN_TOTP_SECRET (base32) and ADMIN_SECRET");
  }
  // Both checks always run, so the timing doesn't say which one failed.
  const emailMatches = !!admin && email.trim().toLowerCase() === admin;
  const codeMatches = !!totp && verifyTotp(totp, otp);
  if (!admin || !emailMatches || !codeMatches) return null;
  const token = sign({ purpose: "link", email: admin, nonce: sha256(nonce), exp: now() + LINK_TTL });
  const url = new URL("/verify", site.adminUrl);
  url.searchParams.set("token", token);
  return { to: admin, url: url.toString() };
}

/** Step 3: exchanges a valid link for the session cookie. Returns whether it worked. */
export async function signInWithLink(linkToken: string | null) {
  const jar = await cookies();
  const nonce = jar.get(NONCE_COOKIE)?.value;
  const token = verify(linkToken ?? undefined);
  const admin = adminEmail();
  if (!nonce || token?.purpose !== "link" || token.email !== admin || token.nonce !== sha256(nonce)) return false;

  jar.delete(NONCE_COOKIE);
  jar.set(SESSION_COOKIE, sign({ purpose: "session", email: admin, exp: now() + SESSION_TTL }), cookieOptions(SESSION_TTL));
  return true;
}

export async function signOutAdmin() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in admin's email, or null. One check per request. */
export const getAdmin = cache(async () => {
  const token = verify((await cookies()).get(SESSION_COOKIE)?.value);
  const admin = adminEmail();
  return token?.purpose === "session" && admin && token.email === admin ? admin : null;
});

/** For every admin page, server action and route handler: sends anyone else to the login page. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}
