import { getEngagementByNotePath } from "@/actions/post";
import type { Note } from "@/domain/note/models/note";

import { ForOwner } from "@/components/domain/account/ForOwner";
import { Heart, MessageCircle } from "lucide-react";
import { Post } from "./Post";

type Props = {
  note: Note;
  fullPath: string;
};

export async function Engagement({ note, fullPath }: Props) {
  const engagement = await getEngagementByNotePath(note.bookId, note.path);

  if (!engagement) {
    return (
      <ForOwner userId={note.userId}>
        <Post note={note} fullPath={fullPath} />
      </ForOwner>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Heart size={20} />
        {engagement.likes}
      </div>

      <div className="flex items-center gap-1">
        <MessageCircle size={20} />
        {engagement.replies}
      </div>
    </div>
  );
}
