import "server-only";
import { headers } from "next/headers";

// Cloudflare Turnstile's server-side check of the widget's token
// (components/turnstile.tsx), for the website's forms that send email: the
// contact form and the recommendation letters. Each token works once.

export async function passedTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Turnstile: TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  if (!token) return false;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile:", error);
    return false;
  }
}
