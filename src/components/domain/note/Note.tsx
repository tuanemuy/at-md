import type { Note as NoteModel } from "@/domain/note/models/note";
import { format } from "date-fns";

import {
  Engagement,
  EngagementSkeleton,
} from "@/components/domain/post/Engagement";
import Link from "next/link";
import { Suspense } from "react";
import { NoteUser, NoteUserSkeleton } from "./NoteUser";

type Props = {
  basePath?: string;
  note: NoteModel & { fullPath?: string };
  showUser?: boolean;
};

export function Note({ note, basePath, showUser }: Props) {
  return (
    <div key={note.id} className="">
      <Link href={note.fullPath || `${basePath}/${note.path}`}>
        {showUser && (
          <div className="mb-4">
            <Suspense fallback={<NoteUserSkeleton />}>
              <NoteUser userId={note.userId} />
            </Suspense>
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
          <Suspense fallback={<EngagementSkeleton />}>
            <Engagement note={note} fullPath={`/${basePath}/${note.path}`} />
          </Suspense>
        </div>
      </Link>
    </div>
  );
}
