CREATE TYPE "public"."sync_status" AS ENUM('waiting', 'synced', 'error');--> statement-breakpoint
ALTER TABLE "sync_statuses" ALTER COLUMN "status" SET DEFAULT 'waiting'::"public"."sync_status";--> statement-breakpoint
ALTER TABLE "sync_statuses" ALTER COLUMN "status" SET DATA TYPE "public"."sync_status" USING "status"::"public"."sync_status";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "post_uri" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "post_cid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "error_message";