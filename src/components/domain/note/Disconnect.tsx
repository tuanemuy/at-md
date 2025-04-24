"use client";

import { deleteBook } from "@/actions/note";
import type { Book } from "@/domain/note/models/book";
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
import { Unplug } from "lucide-react";

type Props = {
  book: Book;
  redirectPath?: string;
};

export function Disconnect({ book, redirectPath }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const disconnect = async () => {
    setIsOpen(false);
    const loading = toast.loading("Disconnecting...");
    const result = await deleteBook(book.id, redirectPath);
    toast.dismiss(loading);

    if (!result) {
      toast.error("Error", {
        description: "Failed to disconnect GitHub repository.",
      });
      return;
    }

    toast.success("Success", {
      description: "GitHub repository disconnected successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <Unplug />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect GitHub repository</DialogTitle>
          <DialogDescription>
            Are you sure you want to disconnect this GitHub repository? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={disconnect}
            className="cursor-pointer"
          >
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
