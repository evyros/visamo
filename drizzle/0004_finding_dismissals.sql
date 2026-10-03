CREATE TABLE "finding_dismissal" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"check_id" text NOT NULL,
	"document_key" text NOT NULL,
	"kind" text NOT NULL,
	"index" integer NOT NULL,
	"finding" jsonb NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"dismissed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"undone_at" timestamp,
	"undone_by" text,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"review_outcome" text,
	"review_note" text
);
--> statement-breakpoint
ALTER TABLE "finding_dismissal" ADD CONSTRAINT "finding_dismissal_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_dismissal" ADD CONSTRAINT "finding_dismissal_check_id_document_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."document_check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_dismissal" ADD CONSTRAINT "finding_dismissal_dismissed_by_user_id_fk" FOREIGN KEY ("dismissed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finding_dismissal" ADD CONSTRAINT "finding_dismissal_undone_by_user_id_fk" FOREIGN KEY ("undone_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finding_dismissal_check_idx" ON "finding_dismissal" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "finding_dismissal_created_idx" ON "finding_dismissal" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "finding_dismissal_active_idx" ON "finding_dismissal" USING btree ("check_id","kind","index") WHERE "finding_dismissal"."undone_at" is null;