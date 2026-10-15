CREATE TABLE "letter_request" (
	"id" text PRIMARY KEY NOT NULL,
	"names" text[] NOT NULL,
	"email" text NOT NULL,
	"locale" text NOT NULL,
	"invites_sent" integer DEFAULT 0 NOT NULL,
	"letters_sent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
