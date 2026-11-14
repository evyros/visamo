-- When Evy's welcome email went out (lib/welcome-email.ts). Only new signups
-- are queued for it, so existing users stay null and are never emailed.
ALTER TABLE "user" ADD COLUMN "welcome_email_at" timestamp;
