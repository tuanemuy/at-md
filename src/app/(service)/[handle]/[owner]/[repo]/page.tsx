import { getUserByHandle } from "@/actions/account";
import { getBook } from "@/actions/note";
import { listNotes } from "@/actions/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { format } from "date-fns";
import { marked } from "marked";
import { notFound } from "next/navigation";

import { ForOwner } from "@/components/domain/account/ForOwner";
import { User } from "@/components/domain/account/User";
import { UserBanner } from "@/components/domain/account/UserBanner";
import { Article } from "@/components/domain/note/Article";
import { BookMenu } from "@/components/domain/note/BookMenu";
import { Highlight } from "@/components/domain/note/Highlight";
import { Notes as ClientNotes } from "@/components/domain/note/Notes";
import { NotesViewSkeleton } from "@/components/domain/note/NotesViewSkeleton";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";

type Props = {
  params: Promise<{
    handle: string;
    owner: string;
    repo: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { handle, owner, repo } = await params;
  const user = await getUserByHandle(handle);
  const book = await getBook(owner, repo);

  const bookName = book?.details.name || `${owner}/${repo}`;
  const userName = user?.profile.displayName || handle;
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

  if (!book) {
    notFound();
  }

  const description = await marked.parse(book.details.description);

  return (
    <main>
      <UserBanner handle={handle} />

      <div className="content py-(--spacing-layout-lg)">
        <h1 className="text-3xl md:text-4xl font-bold">{book.details.name}</h1>

        <ForOwner userId={book.userId}>
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
          <User handle={handle} />
        </section>

        <section className="py-(--spacing-layout-md)">
          <Article text={description} />
          <Highlight />
        </section>

        <section className="pt-(--spacing-layout-md) border-t">
          <Suspense fallback={<NotesViewSkeleton items={5} />}>
            <Notes bookId={book.id} basePath={`/${handle}/${owner}/${repo}`} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

type NotesProps = {
  bookId: string;
  basePath: string;
};

async function Notes({ bookId, basePath }: NotesProps) {
  const { items, count } = await listNotes(bookId, {
    order: "desc",
    orderBy: "updatedAt",
    limit: Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10),
    page: 1,
  });

  return (
    <ClientNotes
      initialNotes={items}
      initialCount={count}
      bookId={bookId}
      basePath={basePath}
    />
  );
}
