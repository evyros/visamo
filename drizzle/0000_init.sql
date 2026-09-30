CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_event" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"actor_person_id" text,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_file" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"document_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"name" text NOT NULL,
	"has_thumbnail" boolean NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "case_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"email" text NOT NULL,
	"locale" text NOT NULL,
	"invited_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_invite_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "case_member" (
	"user_id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_person" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"is_israeli" boolean NOT NULL,
	"israeli_status" text,
	"previous_marriages" text NOT NULL,
	"nationality" text,
	"birth_country" text,
	"countries_lived" text[],
	"location" text,
	"name_changed" boolean,
	"has_children" boolean,
	"children_moving" boolean,
	"other_parents" text[],
	"lived_abroad" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_person_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "case" (
	"id" text PRIMARY KEY NOT NULL,
	"branch" text,
	"stage" text NOT NULL,
	"filed_on" date,
	"interview_on" date,
	"detail_edits_allowed" integer DEFAULT 3 NOT NULL,
	"relationship" text NOT NULL,
	"marriage_place" text,
	"marriage_country" text,
	"living_together" boolean,
	"together_since" integer,
	"children_together" boolean NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"file_check" boolean DEFAULT false NOT NULL,
	"messages_left" integer DEFAULT 0 NOT NULL,
	"checks_left" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"created_by" text,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" text NOT NULL,
	"user_id" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"model" text,
	"tokens_in" integer,
	"tokens_out" integer,
	"cached_tokens" integer,
	"cost_usd" double precision,
	"first_token_ms" integer,
	"answer_ms" integer,
	"finish_reason" text,
	"calls" jsonb,
	"case_context" text,
	"history_count" integer,
	"chat_rules_version" integer,
	"knowledge_version" integer,
	"catalog_version" integer
);
--> statement-breakpoint
CREATE TABLE "credit_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"kind" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" text,
	"user_id" text,
	"admin_email" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_check" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"document_key" text NOT NULL,
	"state" text NOT NULL,
	"file_ids" text[] NOT NULL,
	"context_hash" text NOT NULL,
	"model" text NOT NULL,
	"rating" text,
	"issues" jsonb,
	"recommendations" jsonb,
	"error" text,
	"checked_by" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"context" text NOT NULL,
	"guidance" jsonb NOT NULL,
	"rules_version" integer NOT NULL,
	"knowledge_version" integer NOT NULL,
	"file_count" integer,
	"pages" integer,
	"bytes_sent" integer,
	"attempts" integer,
	"rating_corrected" boolean,
	"tokens_in" integer,
	"tokens_out" integer,
	"cached_tokens" integer,
	"cost_usd" double precision,
	"model_ms" integer,
	"duration_ms" integer,
	"calls" jsonb
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"user_id" text,
	"product" text NOT NULL,
	"freemius_license_id" text NOT NULL,
	"freemius_user_id" text NOT NULL,
	"freemius_payment_id" text,
	"amount" double precision,
	"vat" double precision,
	"currency" text,
	"payment_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"refunded_at" timestamp,
	CONSTRAINT "purchase_freemius_license_id_unique" UNIQUE("freemius_license_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "support_access" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"duration_hours" integer NOT NULL,
	"reason" text,
	"admin_email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"link_expires_at" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"consented_at" timestamp,
	"access_ends_at" timestamp,
	"consented_by" text,
	"consented_by_name" text,
	"consented_by_email" text,
	"consent_locale" text,
	"consent_ip" text,
	"consent_user_agent" text,
	CONSTRAINT "support_access_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"locale" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_event" ADD CONSTRAINT "case_event_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_event" ADD CONSTRAINT "case_event_actor_person_id_case_person_id_fk" FOREIGN KEY ("actor_person_id") REFERENCES "public"."case_person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_file" ADD CONSTRAINT "case_file_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_file" ADD CONSTRAINT "case_file_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_file" ADD CONSTRAINT "case_file_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_invite" ADD CONSTRAINT "case_invite_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_invite" ADD CONSTRAINT "case_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_member" ADD CONSTRAINT "case_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_member" ADD CONSTRAINT "case_member_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_person" ADD CONSTRAINT "case_person_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_person" ADD CONSTRAINT "case_person_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_entry" ADD CONSTRAINT "credit_entry_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_entry" ADD CONSTRAINT "credit_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_check" ADD CONSTRAINT "document_check_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_check" ADD CONSTRAINT "document_check_checked_by_user_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_access" ADD CONSTRAINT "support_access_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_access" ADD CONSTRAINT "support_access_consented_by_user_id_fk" FOREIGN KEY ("consented_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "case_event_case_id_idx" ON "case_event" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "case_file_case_id_idx" ON "case_file" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_invite_email_idx" ON "case_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "case_member_case_id_idx" ON "case_member" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_person_case_id_idx" ON "case_person" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "chat_case_id_idx" ON "chat" USING btree ("case_id","updated_at");--> statement-breakpoint
CREATE INDEX "chat_message_chat_id_idx" ON "chat_message" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_entry_case_id_idx" ON "credit_entry" USING btree ("case_id","kind","created_at");--> statement-breakpoint
CREATE INDEX "document_check_item_idx" ON "document_check" USING btree ("case_id","document_key","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_check_running_idx" ON "document_check" USING btree ("case_id","document_key") WHERE "document_check"."state" = 'running';--> statement-breakpoint
CREATE INDEX "purchase_case_id_idx" ON "purchase" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_access_case_id_idx" ON "support_access" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");