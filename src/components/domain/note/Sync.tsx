"use client";

import { syncNotes } from "@/actions/note";
import type { Book } from "@/domain/note/models/book";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { sub } from "date-fns";
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
import { FolderSync } from "lucide-react";

type Props = {
  book: Book;
};

export function Sync({ book }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const sync = async () => {
    setIsOpen(false);
    let result = false;
    // const limit = sub(new Date(), { hours: 1 });
    const limit = new Date();
    if (
      book.syncStatus.status === SyncStatusCode.ERROR ||
      !book.syncStatus.lastSyncedAt ||
      book.syncStatus.lastSyncedAt < limit
    ) {
      result = await syncNotes(book.owner, book.repo);
    }

    if (!result) {
      toast.error("Error", {
        description: "Failed to sync notes.",
      });
      return;
    }

    toast.success("Success", {
      description: "Syncing notes...",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <FolderSync />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync Notes</DialogTitle>
          <DialogDescription>
            Sync notes with GitHub repository. Existing notes with the same path
            will be overwritten.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={sync} className="cursor-pointer">
            Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
