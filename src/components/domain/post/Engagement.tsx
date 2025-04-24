"use client";

import { getEngagementByNotePath } from "@/actions/post";
import type { Note } from "@/domain/note/models/note";
import type { Engagement as EngagementModel } from "@/domain/post/models/engagement";
import { useTransition } from "react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle } from "lucide-react";

type Props = {
  note: Note;
};

export function Engagement({ note }: Props) {
  const [isPending, startTransition] = useTransition();
  const [engagement, setEngagement] = useState<EngagementModel | null>(null);
  useEffect(() => {
    startTransition(async () => {
      const engagement = await getEngagementByNotePath(note.bookId, note.path);
      setEngagement(engagement);
    });
  }, [note.bookId, note.path]);

  if (engagement) {
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

  if (!isPending) {
    return null;
  }

  if (isPending) {
    <Skeleton className="h-8 w-24" />;
  }
}
