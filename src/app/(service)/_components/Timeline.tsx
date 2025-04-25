import { searchNotes } from "@/actions/note";

import { Note } from "@/components/domain/note/Note";
import { Pagination } from "@/components/navigation/Pagination";
import { QueryInput } from "@/components/navigation/QueryInput";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

const limit = Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10);

type Props = {
  page: number;
  query: string;
};

export async function Timeline({ page, query }: Props) {
  const { items, count } = await searchNotes({
    query,
    pagination: {
      order: "desc",
      orderBy: "updatedAt",
      limit,
      page,
    },
  });

  const totalPages = Math.ceil(count / limit);

  return (
    <>
      <section>
        <QueryInput />
      </section>

      <section className="mt-(--spacing-layout-md)">
        {items.length > 0 && (
          <div className="flex flex-col gap-12">
            {items.map((note) => (
              <Note key={note.path} note={note} showUser={true} />
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
          </Alert>
        )}
      </section>
    </>
  );
}

type TimelineSkeletonProps = {
  items: number;
};

export function TimelineSkeleton({ items }: TimelineSkeletonProps) {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: items }, (_, i) => i).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full mb-4" />
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
