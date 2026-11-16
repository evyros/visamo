-- Findings the admin takes out of a free check result before approving it
-- (lib/checks/free.ts): the couple never sees them. Null on every run before.
ALTER TABLE "document_check" ADD COLUMN "hidden" jsonb;
