ALTER TABLE "survey_vote" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "survey_vote_ip_idx" ON "survey_vote" USING btree ("ip_hash","created_at");