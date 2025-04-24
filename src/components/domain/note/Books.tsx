import { listBooks } from "@/actions/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { format } from "date-fns";

import { ForOwner } from "@/components/domain/account/ClientForOwner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import Link from "next/link";
import { BookMenu } from "./BookMenu";

type Props = {
  userId: string;
  handle: string;
};

export async function Books({ userId, handle }: Props) {
  const books = await listBooks(userId);

  return (
    <div className="flex flex-col gap-10">
      {books.map(async (book) => {
        return (
          <div key={book.id} className="">
            <Link href={`/${handle}/${book.owner}/${book.repo}`}>
              <h2 className="text-xl md:text-2xl font-bold">
                {book.details.name}
              </h2>

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

            <ForOwner userId={userId}>
              <div className="mt-3">
                <BookMenu book={book} />
              </div>
            </ForOwner>
          </div>
        );
      })}

      {books.length === 0 && (
        <div>
          <p>There are no books yet.</p>
          <ForOwner userId={userId}>
            <div className="mt-(--spacing-layout-sm)">
              <Alert>
                <Info />
                <AlertTitle>Welcome to @md!</AlertTitle>
                <AlertDescription>
                  You can create a book by connecting your GitHub repository.
                </AlertDescription>
              </Alert>
            </div>
          </ForOwner>
        </div>
      )}
    </div>
  );
}
