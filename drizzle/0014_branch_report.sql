CREATE TABLE "branch_report" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"couple_key" text NOT NULL,
	"branch" text,
	"experience" text,
	"experience_month" text,
	"reported_at" timestamp NOT NULL,
	"war_related" boolean DEFAULT false NOT NULL,
	"first_answer_days" integer,
	"first_answer_waiting" boolean DEFAULT false NOT NULL,
	"entry_permit_days" integer,
	"entry_permit_waiting" boolean DEFAULT false NOT NULL,
	"b1_visa_days" integer,
	"b1_visa_waiting" boolean DEFAULT false NOT NULL,
	"vote_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"locale" text NOT NULL,
	"branch" text NOT NULL,
	"comment" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"code_hash" text,
	"code_expires_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"codes_sent" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "branch_report" ADD CONSTRAINT "branch_report_vote_id_survey_vote_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."survey_vote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branch_report_branch_idx" ON "branch_report" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "branch_report_source_idx" ON "branch_report" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "branch_report_vote_idx" ON "branch_report" USING btree ("vote_id");--> statement-breakpoint
CREATE INDEX "survey_vote_email_idx" ON "survey_vote" USING btree ("email","created_at");