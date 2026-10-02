-- A purchase can be given from the admin panel: no Freemius license or user, and who gave it and why.
ALTER TABLE "purchase" ALTER COLUMN "freemius_license_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "freemius_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "admin_email" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "note" text;