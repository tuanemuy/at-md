"use client";

import { deleteNote } from "@/actions/note";
import type { Note } from "@/domain/note/models/note";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

type Props = {
  note: Note;
  redirectPath?: string;
};

export function DeleteNote({ note, redirectPath }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = async () => {
    setIsOpen(false);
    const result = await deleteNote(note.id, redirectPath);

    if (!result) {
      toast.error("Error", {
        description: "Failed to delete the note.",
      });
      return;
    }

    toast.success("Success", {
      description: "Note deleted successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleClick}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
