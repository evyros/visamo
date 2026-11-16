-- The admin can check a free case's documents too (lib/checks/free.ts): the
-- couple sees each result once it's approved. A case's first result, the
-- couple's own free check or the first one approved, shows in full; every
-- other approved one, its rating only.
ALTER TABLE "case" ADD COLUMN "free_full_key" text;--> statement-breakpoint
ALTER TABLE "case" ADD COLUMN "first_upload_at" timestamp;--> statement-breakpoint
ALTER TABLE "case" ADD COLUMN "results_email_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "document_check" ADD COLUMN "approval" text;--> statement-breakpoint
ALTER TABLE "document_check" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "document_check" ADD COLUMN "emailed_at" timestamp;--> statement-breakpoint

-- Cases that uploaded before: their first upload already happened, so the
-- admin isn't emailed about it on their next one.
UPDATE "case" SET "first_upload_at" = "first"."at"
FROM (SELECT "case_id", min("created_at") AS "at" FROM "case_file" GROUP BY "case_id") AS "first"
WHERE "case"."id" = "first"."case_id" AND "case"."first_upload_at" IS NULL;--> statement-breakpoint

-- Free cases that used their free check: the document it checked counts as
-- the one shown in full, so whatever the admin approves for them is locked.
-- The run a spend was for is its ref_id; a spend given back (refund) and a
-- run that couldn't read the files don't count. The earliest one is taken.
UPDATE "case" SET "free_full_key" = "used"."document_key"
FROM (
	SELECT DISTINCT ON ("credit_entry"."case_id") "credit_entry"."case_id", "document_check"."document_key"
	FROM "credit_entry"
	JOIN "document_check" ON "document_check"."id" = "credit_entry"."ref_id"
	WHERE "credit_entry"."kind" = 'checks'
		AND "credit_entry"."reason" = 'spend'
		AND "document_check"."state" = 'done'
		AND "document_check"."rating" IS DISTINCT FROM 'unreadable'
		AND NOT EXISTS (
			SELECT 1 FROM "credit_entry" AS "refund"
			WHERE "refund"."case_id" = "credit_entry"."case_id"
				AND "refund"."kind" = 'checks'
				AND "refund"."reason" = 'refund'
				AND "refund"."ref_id" = "credit_entry"."ref_id"
		)
	ORDER BY "credit_entry"."case_id", "credit_entry"."created_at"
) AS "used"
WHERE "case"."id" = "used"."case_id" AND "case"."file_check" = false AND "case"."free_full_key" IS NULL;
