"use client";

import { listNotes } from "@/actions/note";
import type { Note } from "@/domain/note/models/note";
import { useCallback, useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { NotesView } from "./NotesView";

type Props = {
  initialNotes: Note[];
  initialCount: number;
  bookId: string;
  basePath: string;
};

const limit = Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10);

export function Notes({ initialNotes, initialCount, bookId, basePath }: Props) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(count / limit);

  const fetch = useCallback(
    (page: number) => {
      startTransition(async () => {
        const { items, count } = await listNotes(bookId, {
          order: "desc",
          orderBy: "updatedAt",
          limit,
          page,
        });

        setNotes(items);
        setCount(count);
      });
    },
    [bookId],
  );

  return (
    <>
      <NotesView
        notes={notes}
        isPending={isPending}
        totalPages={totalPages}
        page={page}
        setPage={(page) => {
          setPage(page);
          fetch(page);
        }}
        basePath={basePath}
      />

      {!isPending && notes.length === 0 && (
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
