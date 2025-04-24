"use client";

import type { Note } from "@/domain/note/models/note";
import { format } from "date-fns";

import { Pagination } from "@/components/button/Pagination";
import { User } from "@/components/domain/account/ClientUser";
import { Engagement } from "@/components/domain/post/ClientEngagement";
import Link from "next/link";
import { NotesViewSkeleton } from "./NotesViewSkeleton";

type Props = {
  notes: (Note & { fullPath?: string })[];
  isPending: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  basePath?: string;
  showUser?: boolean;
};

export function NotesView({
  notes,
  isPending,
  page,
  totalPages,
  setPage,
  basePath,
  showUser,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-12">
        {isPending && <NotesViewSkeleton items={5} showUser={showUser} />}

        {notes.map((note) => {
          return (
            <div key={note.id} className="">
              <Link href={note.fullPath || `${basePath}/${note.path}`}>
                {showUser && (
                  <div className="mb-4">
                    <User id={note.userId} />
                  </div>
                )}

                <h2 className="text-xl md:text-2xl font-bold">{note.title}</h2>

                {note.createdAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(note.createdAt, "yyyy-MM-dd HH:mm")}
                  </p>
                )}

                <div className="relative mt-2">
                  <p>
                    {note.body.slice(0, 160).replaceAll("#", "")}
                    {note.body.length > 160 && " ..."}
                  </p>
                </div>

                <div className="mt-3">
                  <Engagement note={note} />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-(--spacing-layout-md)">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(page) => setPage(page)}
          />
        </div>
      )}
    </>
  );
}
