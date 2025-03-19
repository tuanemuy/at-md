DROP TABLE "github_connection_scopes" CASCADE;--> statement-breakpoint
ALTER TABLE "github_connections" ADD COLUMN "scope" text DEFAULT '' NOT NULL;