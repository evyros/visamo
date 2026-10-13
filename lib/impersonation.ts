import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, createAuthMiddleware, getIP, getSessionFromCtx } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import * as z from "zod";
import { db } from "./db";
import { impersonation, session } from "./db/schema";
import { site } from "./site";

// Signing in to the app as a user, from the admin panel. The admin panel and
// the app are separate hosts with separate logins (lib/admin.ts, lib/auth.ts),
// so the panel can't set the app's cookie itself. It hands over a link
// instead:
//
// 1. The panel stores a one-time token's hash and sends the admin's browser to
//    app.visamo.co.il/api/auth/impersonate?token=…
// 2. That endpoint (the plugin below) uses the token up and starts a Better
//    Auth session for the user, marked with the impersonation's id.
// 3. The app shows a banner on every page while the session is marked;
//    its button signs out and goes back to the panel. Signing out either way
//    marks the impersonation ended.
//
// The user's own sessions aren't touched, and the login sends them no email.
// Everything done in the app counts as done by the user.

/** How long the link works: just the redirect from the panel. */
const LINK_TTL_MS = 60 * 1000;
/** How long the session lasts. It's never extended, and ends when the browser closes. */
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

export type Impersonation = typeof impersonation.$inferSelect;

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/** A new impersonation of the user. Returns the link that starts it. */
export async function createImpersonation(userId: string, adminEmail: string) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(impersonation).values({ id: crypto.randomUUID(), userId, adminEmail, tokenHash: hashToken(token) });
  const url = new URL("/api/auth/impersonate", site.appUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Uses the link up, if it's unused and fresh. One conditional update, so a
 * link opened twice starts one session. Returns the impersonation, or null.
 */
async function claimImpersonation(token: string, browser: { ipAddress: string | null; userAgent: string | null }) {
  const [row] = await db
    .update(impersonation)
    .set({ usedAt: new Date(), ...browser })
    .where(
      and(
        eq(impersonation.tokenHash, hashToken(token)),
        isNull(impersonation.usedAt),
        gt(impersonation.createdAt, new Date(Date.now() - LINK_TTL_MS)),
      ),
    )
    .returning();
  return row ?? null;
}

/** Marks the impersonation ended, as its session signs out. */
async function endImpersonation(id: string) {
  await db
    .update(impersonation)
    .set({ endedAt: new Date() })
    .where(and(eq(impersonation.id, id), isNull(impersonation.endedAt)));
}

/** The user's impersonations, newest first, each with whether its session is still on. */
export async function listImpersonations(userId: string) {
  const live = sql<boolean>`exists (select 1 from ${session} where ${session.impersonationId} = ${impersonation.id} and ${session.expiresAt} > now())`;
  return db
    .select({ impersonation, live })
    .from(impersonation)
    .where(eq(impersonation.userId, userId))
    .orderBy(desc(impersonation.createdAt));
}

/**
 * The endpoint the panel's link opens (GET /api/auth/impersonate?token=…),
 * and the sign-out hook that ends an impersonation.
 */
export const impersonationPlugin = () =>
  ({
    id: "impersonation",
    init: () => ({
      options: {
        databaseHooks: {
          session: {
            update: {
              // The session's hour is enforced here, not by the browser.
              // Better Auth extends a session when it's read without its
              // "don't remember" cookie, and a browser can drop that cookie.
              // Its refresh is the only update that moves expiresAt, and it
              // puts the session it's refreshing on the context.
              before: async (data, ctx) => {
                const current = ctx?.context.session?.session;
                if (!current?.impersonationId || !("expiresAt" in data)) return;
                return { data: { ...data, expiresAt: current.expiresAt } };
              },
            },
          },
        },
      },
    }),
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.path === "/sign-out",
          handler: createAuthMiddleware(async (ctx) => {
            const id = (await getSessionFromCtx(ctx, { disableRefresh: true }))?.session.impersonationId;
            if (typeof id === "string") await endImpersonation(id);
          }),
        },
      ],
    },
    endpoints: {
      impersonate: createAuthEndpoint(
        "/impersonate",
        { method: "GET", query: z.object({ token: z.string() }), requireHeaders: true },
        async (ctx) => {
          const headers = ctx.request?.headers ?? ctx.headers!;
          const row = await claimImpersonation(ctx.query.token, {
            ipAddress: getIP(headers, ctx.context.options) || null,
            userAgent: headers.get("user-agent"),
          });
          if (!row) throw ctx.redirect("/login");

          const user = await ctx.context.internalAdapter.findUserById(row.userId);
          if (!user) throw ctx.redirect("/login");
          // Like Better Auth's own admin plugin: a session that isn't
          // remembered is never refreshed, so it can't outlive its hour.
          const created = await ctx.context.internalAdapter.createSession(
            user.id,
            true,
            { impersonationId: row.id, expiresAt: new Date(Date.now() + IMPERSONATION_TTL_MS) },
            true,
          );
          await setSessionCookie(ctx, { session: created, user }, true);
          throw ctx.redirect("/");
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
