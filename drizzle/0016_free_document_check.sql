-- Every case gets one free document check when it's created (onboarding).
-- Cases from before that, which didn't buy Full file check and have no checks
-- left (support may have given some), get theirs now: the balance and its
-- ledger entry, as grantQueries writes them, with a note telling it from a
-- new case's. A case that already has a free check entry is skipped, so
-- running this again gives none twice.
WITH "free_case" AS (
	SELECT "id" FROM "case"
	WHERE "file_check" = false
		AND "checks_left" = 0
		AND NOT EXISTS (
			SELECT 1 FROM "credit_entry"
			WHERE "credit_entry"."case_id" = "case"."id" AND "credit_entry"."kind" = 'checks' AND "credit_entry"."reason" = 'free'
		)
), "granted" AS (
	UPDATE "case" SET "checks_left" = "checks_left" + 1
	WHERE "id" IN (SELECT "id" FROM "free_case")
	RETURNING "id"
)
INSERT INTO "credit_entry" ("id", "case_id", "kind", "delta", "reason", "note")
SELECT gen_random_uuid()::text, "id", 'checks', 1, 'free', 'Free check for existing cases' FROM "granted";
