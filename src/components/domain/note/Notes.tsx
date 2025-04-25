import { listNotes } from "@/actions/note";

import { Pagination } from "@/components/navigation/Pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Note } from "./Note";

type Props = {
  bookId: string;
  basePath: string;
  page: number;
};

const limit = Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10);

export async function Notes({ bookId, basePath, page }: Props) {
  const { items, count } = await listNotes(bookId, {
    order: "desc",
    orderBy: "updatedAt",
    limit,
    page,
  });
  const totalPages = Math.ceil(count / limit);

  return (
    <>
      {items.length > 0 && (
        <div className="flex flex-col gap-12">
          {items.map((note) => (
            <Note key={note.path} note={note} basePath={basePath} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-(--spacing-layout-md)">
          <Pagination totalPages={totalPages} />
        </div>
      )}

      {items.length === 0 && (
        <Alert>
          <Info />
          <AlertTitle>There are no notes yet.</AlertTitle>
          <AlertDescription>
            <div className="w-full article">
              <p>
                You can sync notes from your GitHub repository by adding the
                following front matter to your markdown files and pushing.
              </p>
              <pre className="!my-2">
                <code>
                  {`---
access: public
---`}
                </code>
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

type NotesSkeletonProps = {
  items: number;
  showUser?: boolean;
};

export function NotesSkeleton({ items, showUser }: NotesSkeletonProps) {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: items }, (_, i) => i).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          {showUser && <Skeleton className="h-10 w-full mb-4" />}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}
