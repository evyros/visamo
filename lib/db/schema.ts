import { boolean, date, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { FREE_MESSAGES } from "../chat/plans";
import type { CaseEvent } from "../events";

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
  /** A BranchCode from lib/case-options.ts, or null if the user doesn't know it yet. */
  branch: text("branch"),
  /** A Stage from lib/case-options.ts. */
  stage: text("stage").notNull(),
  /** When they filed, if they said. Kept when the stage moves back, to offer again. */
  filedOn: date("filed_on", { mode: "string" }),
  /** The interview's date, once one is scheduled. Kept like filedOn. */
  interviewOn: date("interview_on", { mode: "string" }),
  /** How many details edits that change the document list the case gets. Support raises it. */
  detailEditsAllowed: integer("detail_edits_allowed").notNull().default(3),
  /** A Relationship from lib/case-options.ts: married or common-law. */
  relationship: text("relationship").notNull(),
  /** A MarriagePlace from lib/case-options.ts; null for a common-law couple. */
  marriagePlace: text("marriage_place"),
  /** ISO 3166 region code of an abroad marriage; null otherwise. */
  marriageCountry: text("marriage_country"),
  /** Asked only of a common-law couple; null when married. */
  livingTogether: boolean("living_together"),
  /** The year a common-law couple moved in together; null unless they live together. */
  togetherSince: integer("together_since"),
  childrenTogether: boolean("children_together").notNull(),
  /** A Plan from lib/chat/plans.ts: the highest tier bought. It sets the chat's message length. */
  plan: text("plan").notNull().default("free"),
  /** Messages left for the chat assistant, shared by both partners. Buying more adds to it. */
  messagesLeft: integer("messages_left").notNull().default(FREE_MESSAGES),
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
    /** The Israeli side of the couple: a citizen or a permanent resident. */
    isIsraeli: boolean("is_israeli").notNull(),
    /** An IsraeliStatus from lib/case-options.ts; null for the foreign partner. */
    israeliStatus: text("israeli_status"),
    /** A PreviousMarriages from lib/case-options.ts. */
    previousMarriages: text("previous_marriages").notNull(),
    // Asked only of the foreign partner; null for the Israeli.
    /** ISO 3166 region code. */
    nationality: text("nationality"),
    /** ISO 3166 region code, as the country is called today. May be Israel. */
    birthCountry: text("birth_country"),
    /** ISO 3166 region codes of other countries lived in as an adult; empty for none. */
    countriesLived: text("countries_lived").array(),
    /** A Location from lib/case-options.ts: where they are now. */
    location: text("location"),
    nameChanged: boolean("name_changed"),
    /** Children from a previous relationship. */
    hasChildren: boolean("has_children"),
    /** Any of them under 18 and moving to Israel; null without children. */
    childrenMoving: boolean("children_moving"),
    /** OtherParent values from lib/case-options.ts; null unless children are moving. */
    otherParents: text("other_parents").array(),
    /** Asked only of the Israeli: lived outside Israel in recent years. */
    livedAbroad: boolean("lived_abroad"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("case_person_case_id_idx").on(table.caseId)],
);

/**
 * A file uploaded for a document on the case's list. The file itself is in
 * the private Blob store (lib/files/storage.ts); this row is what the app
 * reads, so a blob without a row is never shown.
 */
export const caseFile = pgTable(
  "case_file",
  {
    /** Also the file's folder in the Blob store. */
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** The list item's key from lib/documents: a document id, or `id:country`. */
    documentKey: text("document_key").notNull(),
    /** A FileSlot from lib/files/rules.ts: the document itself, or its translation. */
    slot: text("slot").notNull(),
    /** "application/pdf", "image/jpeg" or "image/png", from the file's contents. */
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    /** The name the user's file had, for display only. */
    name: text("name").notNull(),
    /** Whether a thumbnail was made; it's at the same folder in the Blob store. */
    hasThumbnail: boolean("has_thumbnail").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("case_file_case_id_idx").on(table.caseId)],
);

/**
 * A partner invite: at most one per case. It's claimed when a user with this
 * verified email first opens the app (lib/invites.ts), and deleted then.
 * There's no token: the email address is what matches.
 */
export const caseInvite = pgTable(
  "case_invite",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .unique()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** Lowercased. */
    email: text("email").notNull(),
    /** The language the invite email was sent in. */
    locale: text("locale").notNull(),
    invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** When the email was last sent; resending moves it. */
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (table) => [index("case_invite_email_idx").on(table.email)],
);

/**
 * What happened in a case, and who did it: the case's activity feed, and the
 * record the details-edit limit counts. Written in the same batch as the
 * change it describes (lib/events.ts), so the two can't disagree.
 */
export const caseEvent = pgTable(
  "case_event",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /**
     * The person in the case who did it, not their user: the person's row
     * stays when they delete their account, so the feed keeps their name.
     */
    actorPersonId: text("actor_person_id").references(() => casePerson.id, { onDelete: "set null" }),
    /** A CaseEvent type from lib/events.ts. */
    type: text("type").notNull().$type<CaseEvent["type"]>(),
    /** The event's details, shaped by its type. */
    data: jsonb("data").notNull().$type<CaseEvent["data"]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("case_event_case_id_idx").on(table.caseId, table.createdAt)],
);

// ── Chat ─────────────────────────────────────────────────────────────────────
// Conversations with the Visamo assistant. They belong to the case, so both
// partners see and continue the same chats, and spend the case's message
// balance (cases.messagesLeft). Each user message records who wrote it.

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** Who started it; the chat stays with the case if they delete their account. */
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    /** A short summary of the conversation, written by the assistant after the first message. */
    title: text("title"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** Moves with every message, so the sidebar lists the latest chat first. */
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("chat_case_id_idx").on(table.caseId, table.updatedAt)],
);

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    /** "user" or "assistant". */
    role: text("role").notNull(),
    /** Which partner asked, for a "user" message; null for answers, or once they delete their account. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("chat_message_chat_id_idx").on(table.chatId, table.createdAt)],
);
