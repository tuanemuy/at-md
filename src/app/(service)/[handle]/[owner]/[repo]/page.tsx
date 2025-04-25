import { getUserByHandle } from "@/actions/account";
import { getBook } from "@/actions/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { type RawSearchParams, SearchParams } from "@/lib/router";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { mdToHtml } from "@/lib/markdown";

import { ForOwner } from "@/components/domain/account/ForOwner";
import {
  UserBanner,
  UserBannerSkeleton,
} from "@/components/domain/account/UserBanner";
import {
  UserInfo,
  UserInfoSkeleton,
} from "@/components/domain/account/UserInfo";
import { Article } from "@/components/domain/note/Article";
import { BookMenu } from "@/components/domain/note/BookMenu";
import { Highlight } from "@/components/domain/note/Highlight";
import { Notes, NotesSkeleton } from "@/components/domain/note/Notes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

type Props = {
  params: Promise<{
    handle: string;
    owner: string;
    repo: string;
  }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { handle, owner, repo } = await params;
  const book = await getBook(owner, repo);
  const user = await getUserByHandle(handle);

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

export default async function Page({ params, searchParams }: Props) {
  const sp = SearchParams.fromRaw(await searchParams);
  const page = sp.getOne("page") || "1";
  const { handle, owner, repo } = await params;
  const book = await getBook(owner, repo);

  if (!book) {
    notFound();
  }

  const description = await mdToHtml(book.details.description);

  return (
    <main>
      <Suspense fallback={<UserBannerSkeleton />}>
        <UserBanner userId={book.userId} />
      </Suspense>

      <div className="content py-(--spacing-layout-lg)">
        <h1 className="text-3xl md:text-4xl font-bold">{book.details.name}</h1>
        <Suspense fallback={<Skeleton className="w-32 h-8 mt-2" />}>
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
        </Suspense>

        <section className="mt-6">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo userId={book.userId} />
          </Suspense>
        </section>

        <section className="py-(--spacing-layout-md)">
          <Article text={description} />
          <Highlight />
        </section>

        <section className="pt-(--spacing-layout-md) border-t">
          <Suspense fallback={<NotesSkeleton items={5} />}>
            <Notes
              bookId={book.id}
              basePath={`/${handle}/${owner}/${repo}`}
              page={Number.parseInt(page, 10)}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
