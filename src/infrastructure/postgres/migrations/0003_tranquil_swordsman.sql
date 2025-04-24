ALTER TABLE "posts" DROP CONSTRAINT "posts_note_id_notes_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "book_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "note_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "book_notepath_fkey" FOREIGN KEY ("book_id","note_path") REFERENCES "public"."notes"("book_id","path") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_notepath_idx" ON "posts" USING btree ("book_id","note_path");--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "note_id";