import { listBooks } from "@/actions/note";

import { ForOwner } from "@/components/domain/account/ForOwner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Suspense } from "react";
import { BookLink } from "./BookLink";

type Props = {
  userId: string;
  handle: string;
};

export async function Books({ userId, handle }: Props) {
  const books = await listBooks(userId);

  return (
    <div className="flex flex-col gap-10">
      {books.map(async (book) => {
        return <BookLink key={book.id} book={book} basePath={`/${handle}`} />;
      })}

      {books.length === 0 && (
        <div>
          <p>There are no books yet.</p>
          <Suspense>
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
          </Suspense>
        </div>
      )}
    </div>
  );
}

export function BooksSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {Array.from({ length: 5 }, (_, i) => i).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
