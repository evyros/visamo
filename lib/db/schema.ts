import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ChatCall, Completion } from "../chat/openrouter";
import type { CheckFinding, CheckRating } from "../checks/result";
import type { DocumentCheck } from "../documents/checks";
import type { CreditKind, CreditReason } from "../credits";
import type { CaseEvent } from "../events";
import type { PaymentMethod, ProductId } from "../products";
import type { AccessDuration, AccessReason } from "../support-access-options";

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
  /** Live together now, or lived together before. */
  livingTogether: boolean("living_together").notNull(),
  /** The year they moved in together; null unless they live or lived together. */
  togetherSince: integer("together_since"),
  childrenTogether: boolean("children_together").notNull(),
  // What the case has bought (lib/products.ts). Only a purchase sets them
  // (grantPurchase in lib/credits.ts).
  /** Bought anything: the chat allows longer messages. */
  paid: boolean("paid").notNull().default(false),
  /** Bought Full file check: the case can check documents. */
  fileCheck: boolean("file_check").notNull().default(false),
  // The case's balances, shared by both partners. Each change is also a row
  // in credit_entry, written with it (lib/credits.ts), so the balance is the
  // sum of the case's entries, and the entries say what was granted and used.
  /** Messages left for the chat assistant. */
  messagesLeft: integer("messages_left").notNull().default(0),
  /** Document checks left. Full file check grants them; files the checker couldn't read aren't counted. */
  checksLeft: integer("checks_left").notNull().default(0),
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
    /** ISO 3166 region codes of other countries lived in (6 months in a row, from age 14) or held a citizenship of; empty for none. */
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
    /** A Residence from lib/case-options.ts, asked only of the Israeli: where they live now. */
    residence: text("residence"),
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
    /** "application/pdf", "image/jpeg" or "image/png", from the file's contents. */
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    /** The name the user's file had, for display only. */
    name: text("name").notNull(),
    /** Whether a thumbnail was made; it's at the same folder in the Blob store. */
    hasThumbnail: boolean("has_thumbnail").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /**
     * When the couple removed it. Files are never deleted, from the database
     * or the Blob store: a removed file is only hidden, and kept with the
     * checks that saw it, for reviewing how checks work. Deleting the whole
     * case still deletes everything.
     */
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [index("case_file_case_id_idx").on(table.caseId)],
);

/**
 * Every document check that ran (lib/checks): one row per run, never deleted,
 * and never changed once it ends, so the history shows what each check saw
 * and said, failures included. An item's result is its latest finished
 * check. That's fresh while the item's files and the case details it was
 * checked against are the same (lib/checks/store.ts).
 */
export const documentCheck = pgTable(
  "document_check",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** The list item's key, as on caseFile. */
    documentKey: text("document_key").notNull(),
    /** "running", then "done" (it has a result) or "failed" (see `error`). At most one runs per item. */
    state: text("state").notNull().$type<"running" | "done" | "failed">(),
    /** The files it checked, sorted. Files never change (a replacement gets a new id), so this is what was checked. */
    fileIds: text("file_ids").array().notNull(),
    /** A hash of what it was checked against: the case details and the document's check guidance. */
    contextHash: text("context_hash").notNull(),
    model: text("model").notNull(),
    /** The result, once done. */
    rating: text("rating").$type<CheckRating>(),
    issues: jsonb("issues").$type<CheckFinding[]>(),
    recommendations: jsonb("recommendations").$type<CheckFinding[]>(),
    /** Why it failed: an error code, or the error's message. */
    error: text("error"),
    /** Who ran it. */
    checkedBy: text("checked_by").references(() => user.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),

    // What it was checked against, as sent, so an old check can be reviewed
    // after the guidance or the rules change. The knowledge base is too big
    // to keep per check: only its version (lib/knowledge-base.ts).
    /** The document and the couple's details (lib/checks/prompt.ts checkContext). */
    context: text("context").notNull(),
    /** The document's check guidance (lib/documents/checks.ts), as it was. */
    guidance: jsonb("guidance").$type<DocumentCheck>().notNull(),
    rulesVersion: integer("rules_version").notNull(),
    knowledgeVersion: integer("knowledge_version").notNull(),

    // What it took. Null for what a failed run didn't get to.
    fileCount: integer("file_count"),
    /** Pages and bytes sent, after images were downscaled. */
    pages: integer("pages"),
    bytesSent: integer("bytes_sent"),
    /** Model calls: 2 when the first answer was malformed or its rating didn't fit its findings. */
    attempts: integer("attempts"),
    /** The rating guard changed the model's rating (lib/checks/result.ts settle). */
    ratingCorrected: boolean("rating_corrected"),
    /** Summed over the calls. */
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    cachedTokens: integer("cached_tokens"),
    costUsd: doublePrecision("cost_usd"),
    /** Time in model calls, and the whole run's. */
    modelMs: integer("model_ms"),
    durationMs: integer("duration_ms"),
    /** Each model call: its raw answer, before parsing and the guard, and what it cost. */
    calls: jsonb("calls").$type<Completion[]>(),
  },
  (table) => [
    index("document_check_item_idx").on(table.caseId, table.documentKey, table.startedAt),
    // One running check per item: the button can be pressed by both partners, or again after a reload.
    uniqueIndex("document_check_running_idx")
      .on(table.caseId, table.documentKey)
      .where(sql`${table.state} = 'running'`),
  ],
);

/**
 * Every change to a case's balances (cases.messagesLeft, cases.checksLeft):
 * a grant, a spend or a refund. Written in the same statement or batch as
 * the change (lib/credits.ts), and never changed or deleted, so a balance is
 * always the sum of its entries, and they're its audit trail.
 */
export const creditEntry = pgTable(
  "credit_entry",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().$type<CreditKind>(),
    /** What it added to the balance: +50 for a purchase's messages, -1 for a spend, +1 for its refund. */
    delta: integer("delta").notNull(),
    reason: text("reason").notNull().$type<CreditReason>(),
    /** What it's for: the chat message or document check spent on, or the purchase. Not a foreign key: a failed chat message is deleted. */
    refId: text("ref_id"),
    /** The partner who spent it, or bought it. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** Who gave a support top-up: the admin panel's signed-in email, since the admin isn't a user. */
    adminEmail: text("admin_email"),
    /** Why, for a support top-up. */
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("credit_entry_case_id_idx").on(table.caseId, table.kind, table.createdAt)],
);

/**
 * A purchase made in Freemius Checkout (lib/purchases.ts), or given from the
 * admin panel (grantSupportPurchase in lib/credits.ts), which has no Freemius
 * license or payment. Written in the same batch as what it grants
 * (grantPurchase in lib/credits.ts), and the Freemius license is unique, so
 * the success page and the webhook, which both report the same purchase,
 * can't grant it twice. A refunded or revoked purchase stays, marked.
 */
export const purchase = pgTable(
  "purchase",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** The partner who bought it. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** A ProductId from lib/products.ts. */
    product: text("product").notNull().$type<ProductId>(),
    /** Each one-off purchase is its own license in Freemius. Null for one given from the admin panel. */
    freemiusLicenseId: text("freemius_license_id").unique(),
    freemiusUserId: text("freemius_user_id"),
    /** The license's payment in Freemius: its invoice is served from there (app/api/purchases). */
    freemiusPaymentId: text("freemius_payment_id"),
    // The payment, as Freemius reports it. Null when Freemius didn't have it
    // yet, or for a free (100% coupon) purchase.
    /** What was charged, with VAT. */
    amount: doublePrecision("amount"),
    /** The VAT in `amount`. */
    vat: doublePrecision("vat"),
    currency: text("currency"),
    /** How it was paid. Freemius doesn't give out the card's digits. */
    paymentMethod: text("payment_method").$type<PaymentMethod>(),
    /** Who gave it from the admin panel; null for one bought in Freemius. */
    adminEmail: text("admin_email"),
    /** Why it was given. */
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /**
     * When it was refunded in full, lost a chargeback, or was revoked from the
     * admin panel: what it granted and wasn't used yet was taken back
     * (lib/credits.ts).
     */
    refundedAt: timestamp("refunded_at"),
  },
  (table) => [index("purchase_case_id_idx").on(table.caseId, table.createdAt)],
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
 * A support-access request (lib/support-access.ts): the admin sends a case a
 * link asking its OK to look at the file, and either partner can agree. It
 * only records the consent: nothing in the app or the admin panel depends on
 * it. The link works once, for 72 hours; issuing a new one cancels it.
 */
export const supportAccess = pgTable(
  "support_access",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    /** sha256 of the link's token. The token itself is only in the link. */
    tokenHash: text("token_hash").notNull().unique(),
    /** How long the team may look, from when they agree. */
    durationHours: integer("duration_hours").notNull().$type<AccessDuration>(),
    /** Why the team asks, if the admin said; the page names it in the couple's language. */
    reason: text("reason").$type<AccessReason>(),
    /** The admin panel's signed-in email, since the admin isn't a user. */
    adminEmail: text("admin_email").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** 72 hours after createdAt. */
    linkExpiresAt: timestamp("link_expires_at").notNull(),
    /** When a newer link replaced it, or the admin cancelled it. */
    cancelledAt: timestamp("cancelled_at"),
    // The consent, once a partner agrees. Their name and email are copied, so
    // the record stays whole if they delete their account.
    consentedAt: timestamp("consented_at"),
    /** consentedAt plus durationHours. */
    accessEndsAt: timestamp("access_ends_at"),
    consentedBy: text("consented_by").references(() => user.id, { onDelete: "set null" }),
    consentedByName: text("consented_by_name"),
    consentedByEmail: text("consented_by_email"),
    /** The language the page was shown in. */
    consentLocale: text("consent_locale"),
    consentIp: text("consent_ip"),
    consentUserAgent: text("consent_user_agent"),
  },
  (table) => [index("support_access_case_id_idx").on(table.caseId, table.createdAt)],
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
// A deleted chat is only hidden (chat.deletedAt).

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
    /**
     * When a partner deleted it. Chats are never deleted from the database,
     * only hidden from both partners, and kept for the admin panel. Deleting
     * the whole case still deletes everything.
     */
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => user.id, { onDelete: "set null" }),
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

    // On an answer: what it took and what it was given, for the admin panel,
    // like a document check's. Null on the user's messages. A failed answer
    // isn't kept (its question is deleted and refunded), so it has none.
    /** The model that answered, as OpenRouter reported it. */
    model: text("model"),
    /** Summed over the calls: the answer, and for a new chat's first answer its title. */
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    cachedTokens: integer("cached_tokens"),
    /** Null when OpenRouter didn't report any call's cost, like on a check. */
    costUsd: doublePrecision("cost_usd"),
    /** From asking the model to the answer's first text: how long the couple waited. */
    firstTokenMs: integer("first_token_ms"),
    /** The answer's whole time. */
    answerMs: integer("answer_ms"),
    /** "stop" when the answer ended on its own; "length" when it hit the token cap; null when it was cut off. */
    finishReason: text("finish_reason"),
    /** Each model call, as OpenRouter reported it. */
    calls: jsonb("calls").$type<ChatCall[]>(),
    /** The couple's file as it was sent (lib/chat/prompt.ts casePrompt). */
    caseContext: text("case_context"),
    /** How many earlier messages were sent with the question. */
    historyCount: integer("history_count"),
    /** The assistant's rules, the knowledge base and the document catalog it was given. */
    chatRulesVersion: integer("chat_rules_version"),
    knowledgeVersion: integer("knowledge_version"),
    catalogVersion: integer("catalog_version"),
  },
  (table) => [index("chat_message_chat_id_idx").on(table.chatId, table.createdAt)],
);
