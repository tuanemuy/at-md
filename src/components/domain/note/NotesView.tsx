"use client";

import type { User } from "@/domain/account/models/user";
import type { Note } from "@/domain/note/models/note";
import { format } from "date-fns";

import { Pagination } from "@/components/button/Pagination";
import { UserInfo } from "@/components/domain/account/UserInfo";
import { Engagement } from "@/components/domain/post/ClientEngagement";
import Link from "next/link";
import { NotesViewSkeleton } from "./NotesViewSkeleton";

type Props = {
  notes: (Note & { fullPath?: string; user?: User })[];
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
                {showUser && note.user && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      {note.user.profile.avatarUrl && (
                        <img
                          className="size-11 md:size-12 border-2 object-cover border-border bg-muted-foreground rounded-full"
                          src={note.user.profile.avatarUrl}
                          alt="Avatar"
                          loading="lazy"
                        />
                      )}

                      <div className="flex flex-col">
                        <h3 className="text-md md:text-lg font-bold leading-[1.25]">
                          {note.user.profile.displayName}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          @{note.user.handle}
                        </p>
                      </div>
                    </div>
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
