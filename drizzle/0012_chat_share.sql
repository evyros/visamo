CREATE TABLE "chat_share" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"case_id" text NOT NULL,
	"token" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "chat_share_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "chat_share" ADD CONSTRAINT "chat_share_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_share" ADD CONSTRAINT "chat_share_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_share" ADD CONSTRAINT "chat_share_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_share_chat_id_idx" ON "chat_share" USING btree ("chat_id");