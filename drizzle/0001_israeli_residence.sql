-- Every couple now answers whether they live or lived together, and the Israeli side where they live now.
-- No case from before has both answers, and there are no real users yet: delete them all (their rows cascade).
DELETE FROM "case";--> statement-breakpoint
ALTER TABLE "case" ALTER COLUMN "living_together" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "case_person" ADD COLUMN "residence" text;--> statement-breakpoint
ALTER TABLE "case_person" DROP COLUMN "lived_abroad";
