import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { twoFactor } from "better-auth/plugins/two-factor";
import { localeFromHeaders } from "@/i18n/negotiate";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendAuthEmail, sendLoginCode } from "./email";
import { loginUrl, site } from "./site";

// Sign-in methods:
// - Google.
// - Email sign-up: the user enters only an email and gets a link (the magic
//   link plugin). The link verifies the email, creates the user and signs them
//   in, then /set-password adds a password to the account.
// - Email + password, once a password exists. Forgotten passwords go through
//   Better Auth's reset flow.
// Plain email + password sign-up is off, so every password belongs to an
// email that was verified first.
//
// Two-step login: logging in with a password also asks for a 6-digit code
// sent to the email (the two-factor plugin). It's on for every user and can't
// be turned off. Google logins skip it: Google has its own security, and the
// code would go to the same Google account. So does the sign-up link, since
// opening it already proves the email. Sessions last 30 days, so users rarely
// see the code.

type RequestContext = { headers?: Headers; request?: Request } | null | undefined;

/** The UI language of the request that triggered an email or a new user. */
const localeOf = (ctx: RequestContext) =>
  localeFromHeaders(ctx?.headers ?? ctx?.request?.headers ?? new Headers());

export const auth = betterAuth({
  baseURL: site.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  // In the database, so every server instance counts the same attempts. The
  // two-factor plugin allows 3 requests per 10 seconds on its routes.
  rateLimit: { storage: "database" },

  // Two-step login is always on: no route turns it off, and the plugin's
  // authenticator-app and backup-code routes aren't used.
  disabledPaths: [
    "/two-factor/enable",
    "/two-factor/disable",
    "/two-factor/get-totp-uri",
    "/two-factor/verify-totp",
    "/two-factor/generate-backup-codes",
    "/two-factor/verify-backup-code",
  ],

  user: {
    additionalFields: {
      locale: { type: "string", required: false, input: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }, request) => {
      const locale = localeOf({ request });
      // Someone who logs in with Google and has no password most likely
      // forgot that. Remind them, rather than quietly adding a password.
      // The screen says the same either way.
      const providers = await db
        .select({ id: schema.account.providerId })
        .from(schema.account)
        .where(eq(schema.account.userId, user.id));
      const googleOnly = providers.some((p) => p.id === "google") && !providers.some((p) => p.id === "credential");
      if (googleOnly) {
        await sendAuthEmail({ kind: "googleSignIn", to: user.email, url: loginUrl(locale), locale });
        return;
      }
      await sendAuthEmail({ kind: "resetPassword", to: user.email, url, locale });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
  },

  account: {
    // Someone who signed up by email and later picks Google with the same
    // address gets one account with both ways in, not two accounts.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => ({ data: { ...user, locale: localeOf(ctx), twoFactorEnabled: true } }),
      },
    },
  },

  plugins: [
    magicLink({
      expiresIn: 60 * 30,
      sendMagicLink: async ({ email, url }, ctx) => {
        await sendAuthEmail({ kind: "signup", to: email, url, locale: localeOf(ctx) });
      },
    }),
    twoFactor({
      totpOptions: { disable: true },
      // Both last 10 minutes: the code, and the login waiting for it.
      twoFactorCookieMaxAge: 60 * 10,
      otpOptions: {
        period: 10,
        storeOTP: "hashed",
        allowedAttempts: 5,
        sendOTP: async ({ user, otp }, ctx) => {
          await sendLoginCode({ to: user.email, code: otp, locale: localeOf(ctx) });
        },
      },
    }),
    // Must stay last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
