CREATE TABLE "impersonation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"admin_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	"ended_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "impersonation_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonation_id" text;--> statement-breakpoint
ALTER TABLE "impersonation" ADD CONSTRAINT "impersonation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "impersonation_user_id_idx" ON "impersonation" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonation_id_impersonation_id_fk" FOREIGN KEY ("impersonation_id") REFERENCES "public"."impersonation"("id") ON DELETE cascade ON UPDATE no action;