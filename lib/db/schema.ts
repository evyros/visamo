import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Better Auth's core tables (user, session, account, verification), plus the
// user's app language. Field names match what Better Auth expects; change them
// only together with the auth config in lib/auth.ts.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** The app language, so it follows the user to a new device. */
  locale: text("locale"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

/** One row per way to sign in: "google", or "credential" for a password. */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

/** Short-lived tokens: sign-up links and password reset links. */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ── Cases ────────────────────────────────────────────────────────────────────
// A case (תיק) is one couple's immigration file. Users are logins that can
// open a case; each user belongs to at most one. The people in the case are
// data (case_person), so a partner's details can be filled in before, or
// without, the partner having a user. A user with no case goes through
// onboarding, which creates the case on its last step.

/** Exported as `cases` because `case` is a reserved word in JavaScript. */
export const cases = pgTable("case", {
  id: text("id").primaryKey(),
  /** A BranchCode from lib/case-options.ts, or null if the user skipped it. */
  branch: text("branch"),
  /** A Stage from lib/case-options.ts. */
  stage: text("stage").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Which user can open which case. The primary key keeps it to one case per user. */
export const caseMember = pgTable(
  "case_member",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** "owner" created the case in onboarding; "partner" joined by invite. */
    role: text("role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("case_member_case_id_idx").on(table.caseId)],
);

/** A person in the case. `userId` links the person to their own login, if they have one. */
export const casePerson = pgTable(
  "case_person",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** "male" | "female" */
    gender: text("gender").notNull(),
    isIsraeli: boolean("is_israeli").notNull(),
    /** ISO 3166 region code; null for Israeli citizens. */
    nationality: text("nationality"),
    /** A MaritalStatus from lib/case-options.ts. */
    maritalStatus: text("marital_status").notNull(),
    /** Asked only of non-Israeli citizens; null for Israelis. */
    hasChildren: boolean("has_children"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("case_person_case_id_idx").on(table.caseId)],
);
