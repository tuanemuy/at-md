DROP INDEX "auth_sessions_key_unique";--> statement-breakpoint
DROP INDEX "auth_states_key_unique";--> statement-breakpoint
DROP INDEX "github_connections_user_id_unique";--> statement-breakpoint
DROP INDEX "users_did_unique";--> statement-breakpoint
DROP INDEX "users_handle_unique";--> statement-breakpoint
DROP INDEX "owner_repo_idx";--> statement-breakpoint
DROP INDEX "book_path_idx";--> statement-breakpoint
DROP INDEX "book_name_idx";--> statement-breakpoint
DROP INDEX "book_notepath_idx";--> statement-breakpoint
ALTER TABLE `auth_sessions` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_key_unique` ON `auth_sessions` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_states_key_unique` ON `auth_states` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_connections_user_id_unique` ON `github_connections` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_did_unique` ON `users` (`did`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `owner_repo_idx` ON `books` (`owner`,`repo`);--> statement-breakpoint
CREATE UNIQUE INDEX `book_path_idx` ON `notes` (`book_id`,`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `book_name_idx` ON `tags` (`book_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `book_notepath_idx` ON `posts` (`book_id`,`note_path`);--> statement-breakpoint
ALTER TABLE `auth_sessions` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `auth_states` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `auth_states` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `github_connections` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `github_connections` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `profiles` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `profiles` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `book_details` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `book_details` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `books` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `books` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `notes` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `notes` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `sync_statuses` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `sync_statuses` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `tags` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `tags` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `posts` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `posts` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());