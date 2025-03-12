ALTER TABLE "github_repos" ADD COLUMN "installation_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "github_repos" ADD COLUMN "webhook_secret" varchar(255);