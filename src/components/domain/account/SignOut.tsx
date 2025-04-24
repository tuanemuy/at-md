"use client";

import { signOut } from "@/actions/account";
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
import { LogOut } from "lucide-react";

export function SignOut() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    setIsOpen(false);
    await signOut();

    toast.error("Error", {
      description: "Failed to sign out.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <LogOut />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleClick}
            className="cursor-pointer"
          >
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
