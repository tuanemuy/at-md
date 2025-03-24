CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"session" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "auth_states" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_states_key_unique" UNIQUE("key")
);
