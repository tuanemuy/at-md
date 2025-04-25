import type { Book } from "@/domain/note/models/book";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { format } from "date-fns";

import { ForOwner } from "@/components/domain/account/ForOwner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Suspense } from "react";
import { BookMenu } from "./BookMenu";

type Props = {
  book: Book;
  basePath: string;
};

export function BookLink({ book, basePath }: Props) {
  return (
    <div key={book.id} className="">
      <Link href={`/${basePath}/${book.owner}/${book.repo}`}>
        <h2 className="text-xl md:text-2xl font-bold">{book.details.name}</h2>

        <dl className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
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

        <div className="relative mt-2 max-h-64 md:max-h-128 overflow-hidden">
          <p>
            {book.details.description.slice(0, 200).replaceAll("#", "")}
            {book.details.description.length > 200 && " ..."}
          </p>
        </div>
      </Link>

      <Suspense>
        <ForOwner userId={book.userId}>
          <div className="mt-3">
            <BookMenu book={book} />
          </div>
        </ForOwner>
      </Suspense>
    </div>
  );
}
