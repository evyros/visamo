import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { localeFromHeaders } from "@/i18n/negotiate";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendAuthEmail } from "./email";
import { site } from "./site";

// Sign-in methods:
// - Google.
// - Email sign-up: the user enters only an email and gets a link (the magic
//   link plugin). The link verifies the email, creates the user and signs them
//   in, then /set-password adds a password to the account.
// - Email + password, once a password exists. Forgotten passwords go through
//   Better Auth's reset flow.
// Plain email + password sign-up is off, so every password belongs to an
// email that was verified first.

type RequestContext = { headers?: Headers; request?: Request } | null | undefined;

/** The UI language of the request that triggered an email or a new user. */
const localeOf = (ctx: RequestContext) =>
  localeFromHeaders(ctx?.headers ?? ctx?.request?.headers ?? new Headers());

export const auth = betterAuth({
  baseURL: site.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),

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
      await sendAuthEmail({ kind: "resetPassword", to: user.email, url, locale: localeOf({ request }) });
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
        before: async (user, ctx) => ({ data: { ...user, locale: localeOf(ctx) } }),
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
    // Must stay last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
