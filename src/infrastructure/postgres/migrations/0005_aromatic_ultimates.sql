ALTER TABLE "posts" DROP CONSTRAINT "book_notepath_fkey";
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "book_notepath_fkey" FOREIGN KEY ("book_id","note_path") REFERENCES "public"."notes"("book_id","path") ON DELETE cascade ON UPDATE no action;