import type { Note } from "@/domain/note/models/note";

import { DeleteNote } from "./DeleteNote";

type Props = {
  note: Note;
};

export function NoteMenu({ note }: Props) {
  return (
    <div className="flex items-center gap-2">
      <DeleteNote note={note} />
    </div>
  );
}
