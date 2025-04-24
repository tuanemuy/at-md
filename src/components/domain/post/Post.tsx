"use client";

import { postNote } from "@/actions/post";
import type { Note } from "@/domain/note/models/note";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

type Props = {
  note: Note;
  fullPath: string;
};

export function Post({ note, fullPath }: Props) {
  const defaultText = `${note.title}

Posted on @md!
${process.env.NEXT_PUBLIC_URL}${fullPath}`;

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(defaultText);

  const handleClick = async () => {
    if (!text) {
      return;
    }

    setIsOpen(false);
    const loading = toast.loading("Posting to Bluesky...");

    const result = await postNote(note.bookId, note.path, text);

    if (!result) {
      toast.error("Error", {
        description: "Failed to post to Bluesky.",
      });
      return;
    }

    toast.success("Success", {
      description: "Posted to Bluesky successfully.",
    });

    toast.dismiss(loading);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setText(defaultText);
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Send />
          Post to Bluesky
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post to Bluesky</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value || "")}
          rows={5}
        />
        <DialogFooter>
          <Button
            type="button"
            onClick={handleClick}
            disabled={!text}
            className="cursor-pointer"
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
