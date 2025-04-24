"use client";

import { deleteAccount } from "@/actions/account";
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
import { UserX } from "lucide-react";

export function DeleteAccount() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    setIsOpen(false);
    const loading = toast.loading("Deleting account...");
    const result = await deleteAccount();
    toast.dismiss(loading);

    if (!result) {
      toast.error("Error", {
        description: "Failed to delete account",
      });
      return;
    }

    toast.success("Success", {
      description: "Your account has been deleted",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="cursor-pointer">
          <UserX />
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your account? This action cannot be
            undone. All of your content will be permanently removed.
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
