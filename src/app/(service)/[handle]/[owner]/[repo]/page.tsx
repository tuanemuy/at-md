import { getBook } from "@/actions/note";
import { listNotes } from "@/actions/note";
import type { Note } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { format } from "date-fns";
import { marked } from "marked";
import { notFound } from "next/navigation";

import { ForOwner } from "@/components/domain/account/AsyncForOwner";
import { UserBanner } from "@/components/domain/account/UserBanner";
import { UserInfo } from "@/components/domain/account/UserInfo";
import { Article } from "@/components/domain/note/Article";
import { BookMenu } from "@/components/domain/note/BookMenu";
import { Highlight } from "@/components/domain/note/Highlight";
import { Notes } from "@/components/domain/note/Notes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  params: Promise<{
    handle: string;
    owner: string;
    repo: string;
  }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { handle, owner, repo } = await params;
  const book = await getBook(owner, repo);

  const bookName = book?.details.name || `${owner}/${repo}`;
  const userName = book?.user.profile.displayName || handle;
  const title = `${bookName} | ${userName}`;
  const description = book?.details.description || bookName;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { handle, owner, repo } = await params;
  const book = await getBook(owner, repo);
  let notes: Note[] = [];
  let count = 0;
  if (book) {
    const result = await listNotes(book.id, {
      order: "desc",
      orderBy: "updatedAt",
      limit: Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10),
      page: 1,
    });
    notes = result.items;
    count = result.count;
  }

  if (!book) {
    notFound();
  }

  const description = await marked.parse(book.details.description);

  return (
    <main>
      <UserBanner user={book.user} />

      <div className="content py-(--spacing-layout-lg)">
        <h1 className="text-3xl md:text-4xl font-bold">{book.details.name}</h1>
        <ForOwner
          userId={book.userId}
          fallback={<Skeleton className="w-64 h-8 mt-2" />}
        >
          <div className="flex items-center gap-4 mt-2">
            <dl className="flex items-center gap-2 text-muted-foreground">
              <dt>Synced at</dt>
              <dd className="flex items-center gap-2">
                {book.syncStatus.lastSyncedAt &&
                  format(book.syncStatus.lastSyncedAt, "yyyy-MM-dd HH:mm")}
                {!book.syncStatus.lastSyncedAt && "-"}
                {book.syncStatus.status === SyncStatusCode.ERROR && (
                  <Badge variant="destructive">Error</Badge>
                )}
              </dd>
            </dl>

            <BookMenu book={book} redirectPath={`/${handle}`} />
          </div>
        </ForOwner>

        <section className="mt-6">
          <UserInfo user={book.user} />
        </section>

        <section className="py-(--spacing-layout-md)">
          <Article text={description} />
          <Highlight />
        </section>

        <section className="pt-(--spacing-layout-md) border-t">
          <Notes
            initialNotes={notes}
            initialCount={count}
            bookId={book.id}
            basePath={`/${handle}/${owner}/${repo}`}
          />
        </section>
      </div>
    </main>
  );
}
