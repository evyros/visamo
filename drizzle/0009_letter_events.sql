CREATE TABLE "letter_event" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"visitor" text,
	"via" text,
	"key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "letter_request" ADD COLUMN "source" text DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "letter_event" ADD CONSTRAINT "letter_event_request_id_letter_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."letter_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "letter_event_request_id_idx" ON "letter_event" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "letter_event_key_idx" ON "letter_event" USING btree ("request_id","key");