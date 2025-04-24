"use client";

import { searchNotes } from "@/actions/note";
import type { User } from "@/domain/account/models/user";
import type { Note } from "@/domain/note/models/note";
import { useCallback, useState, useTransition } from "react";

import { NotesView } from "@/components/domain/note/NotesView";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

const limit = Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10);

type Props = {
  initialNotes: (Note & { user: User })[];
  initialCount: number;
};

export function Timeline({ initialCount, initialNotes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const totalPages = Math.ceil(count / limit);

  const fetch = useCallback((query: string, page: number) => {
    startTransition(async () => {
      const { items, count } = await searchNotes({
        query,
        pagination: {
          order: "desc",
          orderBy: "updatedAt",
          limit,
          page,
        },
      });

      setNotes(items);
      setCount(count);
    });
  }, []);

  return (
    <>
      <section>
        <QueryInput
          onChange={(input) => {
            setQuery(input);
            fetch(input, page);
          }}
        />
      </section>

      <section className="mt-(--spacing-layout-md)">
        <NotesView
          notes={notes}
          isPending={isPending}
          totalPages={totalPages}
          page={page}
          setPage={(page) => {
            setPage(page);
            fetch(query, page);
          }}
          showUser={true}
        />

        {notes.length === 0 && (
          <Alert>
            <Info />
            <AlertTitle>There are no notes yet.</AlertTitle>
          </Alert>
        )}
      </section>
    </>
  );
}

type InputProps = {
  onChange: (query: string) => void;
};

function QueryInput({ onChange }: InputProps) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  return (
    <Input
      type="text"
      placeholder="Search notes..."
      className="w-full"
      onChange={(e) => {
        if (timer) {
          clearTimeout(timer);
          setTimer(null);
        }

        setTimer(
          setTimeout(() => {
            onChange(e.target.value || "");
          }, 500),
        );
      }}
    />
  );
}
