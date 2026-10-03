-- Stages follow each case's track (lib/stages.ts), and their dates are kept by stage. The old stage names are gone, so every case starts over at its track's first stage.
ALTER TABLE "case" ADD COLUMN "stage_dates" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "case" DROP COLUMN "filed_on";--> statement-breakpoint
ALTER TABLE "case" DROP COLUMN "interview_on";--> statement-breakpoint
UPDATE "case" SET "stage" = CASE
  WHEN (SELECT count(*) FROM "case_person" p WHERE p."case_id" = "case"."id"
        AND (p."location" = 'abroad' OR p."residence" = 'abroad')) = 2
  THEN 'consulate' ELSE 'preparing' END;
